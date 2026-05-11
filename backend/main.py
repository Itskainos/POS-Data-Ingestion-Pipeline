"""
FastAPI entry point for the POS Data Ingestion service.

Responsibilities:
- Accept raw XML uploads from POS systems.
- Parse XML → Python dict (JSON-serialisable).
- (Mock) persist the record via the Prisma Python client.
- Expose a lightweight sales-data endpoint for downstream apps.
"""

import json
import logging
import uuid
from datetime import datetime
from contextlib import asynccontextmanager

import xmltodict
from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
)
logger = logging.getLogger("pos_ingestion")

# ---------------------------------------------------------------------------
# Prisma client lifecycle
# ---------------------------------------------------------------------------
from prisma import Prisma
db = Prisma()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    logger.info("Prisma connected to Neon PostgreSQL")
    yield
    await db.disconnect()
    logger.info("Prisma disconnected")


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="POS Data Ingestion API",
    description="Accepts raw XML from POS systems, parses it to JSON, and stores it for downstream consumption.",
    version="0.1.0",
    lifespan=lifespan,
)

# Allow requests from the Next.js dev server and any production origins.
# Tighten `allow_origins` before going to production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Next.js dev server
        "http://127.0.0.1:3000",
        # Add your Vercel / production URL here, e.g.:
        # "https://your-app.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
async def root() -> dict:
    """Basic health-check endpoint."""
    return {"status": "ok", "service": "POS Data Ingestion API"}


# ---------------------------------------------------------------------------
# POST /api/upload-xml
# ---------------------------------------------------------------------------
@app.post(
    "/api/upload-xml",
    status_code=status.HTTP_201_CREATED,
    tags=["Ingestion"],
    summary="Upload multiple POS XML files",
)
async def upload_xml(files: list[UploadFile] = File(...)) -> dict:
    """
    Accept POS XML files, parse them into JSON, and persist them.

    - **files**: The raw XML files from the POS system.

    Returns the parsed JSON representation along with the generated record IDs.
    """
    results = []
    
    for file in files:
        # ── 1. Validate MIME type ────────────────────────────────────────────────
        if file.content_type not in ("text/xml", "application/xml", "application/octet-stream"):
            logger.warning("Rejected file with content-type: %s", file.content_type)
            # We warn but don't hard-reject — some clients send generic MIME types.

        # ── 2. Read raw bytes ────────────────────────────────────────────────────
        raw_bytes: bytes = await file.read()
        if not raw_bytes:
            results.append({"filename": file.filename, "status": "error", "message": "Uploaded file is empty."})
            continue

        raw_xml: str = raw_bytes.decode("utf-8")
        logger.info("Received XML file '%s' (%d bytes)", file.filename, len(raw_bytes))

        # ── 3. Parse XML → dict ──────────────────────────────────────────────────
        try:
            parsed_data: dict = xmltodict.parse(raw_xml)
        except Exception as exc:
            logger.error("XML parse error for %s: %s", file.filename, exc)
            results.append({"filename": file.filename, "status": "error", "message": f"Invalid XML: {exc}"})
            continue

        # Extract the message type from the root tag
        message_type = None
        if parsed_data and isinstance(parsed_data, dict):
            # xmltodict usually returns a dict with one root key
            root_keys = list(parsed_data.keys())
            if root_keys:
                message_type = root_keys[0]

        logger.info("Successfully parsed XML into dict (Type: %s) with %d top-level key(s)", message_type, len(parsed_data))

        # ── 4. Persist to database via Prisma ────────────────────────────────────
        try:
            # We store the parsed_data as a JSON string for Prisma Json field compatibility
            record = await db.posdatarecord.create(
                data={
                    "source": "POS",
                    "raw_xml": raw_xml,
                    "parsed_data": json.dumps(parsed_data),
                    "message_type": message_type,
                }
            )
            record_id = record.id
            logger.info("Inserted POSDataRecord with id=%s", record_id)
        except Exception as exc:
            logger.error("Database insertion error for %s: %s", file.filename, exc)
            results.append({"filename": file.filename, "status": "error", "message": f"Failed to save record to database: {exc}"})
            continue

        # ── 5. Background Processing ─────────────────────────────────────────────
        # If it's an Item Maintenance Request, process it to update the catalog.
        if message_type == "NAXML-ItemMaintenanceRequest":
            try:
                await process_item_maintenance(parsed_data)
                logger.info("Processed item maintenance for record %s", record_id)
            except Exception as exc:
                logger.error("Item maintenance processing error: %s", exc)

        # If it's a POS Export (Sales), process it to update the sales tables.
        elif message_type == "POSExport":
            try:
                await process_sales_export(parsed_data)
                logger.info("Processed sales export for record %s", record_id)
            except Exception as exc:
                logger.error("Sales export processing error: %s", exc)

        # ── 6. Add to results ───────────────────────────────────────────────────
        results.append({
            "status": "success",
            "message": "XML uploaded and parsed successfully.",
            "record_id": record_id,
            "filename": file.filename,
            "message_type": message_type,
            "parsed_data": parsed_data,
        })

    return {"results": results}


async def process_item_maintenance(data: dict):
    """
    Parses the ItemRecord(s) from a NAXML-ItemMaintenanceRequest and 
    upserts them into the Item table.
    """
    root = data.get("NAXML-ItemMaintenanceRequest", {})
    records = root.get("ItemRecord", [])

    # xmltodict returns a list if there are multiple, otherwise a single dict
    if isinstance(records, dict):
        records = [records]
    
    for record in records:
        item_code = record.get("ItemCode")
        description = record.get("ItemDescription")
        
        # Handle price conversion safely
        price_val = record.get("Price", 0)
        try:
            price = float(price_val)
        except (TypeError, ValueError):
            price = 0.0

        dept_id = record.get("DepartmentID")

        if item_code:
            await db.item.upsert(
                where={"item_code": item_code},
                data={
                    "create": {
                        "item_code": item_code,
                        "description": description or "No description",
                        "price": price,
                        "department_id": dept_id,
                    },
                    "update": {
                        "description": description or "No description",
                        "price": price,
                        "department_id": dept_id,
                    }
                }
            )


async def process_sales_export(data: dict):
    """
    Parses the Transaction(s) from a POSExport and 
    stores them in the Sale and SaleItem tables.
    """
    root = data.get("POSExport", {})
    transactions = root.get("Transactions", {}).get("Transaction", [])

    if isinstance(transactions, dict):
        transactions = [transactions]
    
    for txn in transactions:
        txn_id = txn.get("@ID")
        timestamp_str = txn.get("Timestamp")
        
        try:
            total = float(txn.get("Total", 0))
            tax = float(txn.get("Tax", 0))
            grand_total = float(txn.get("GrandTotal", 0))
        except (TypeError, ValueError):
            total = tax = grand_total = 0.0

        payment_type = txn.get("PaymentType", "Unknown")

        try:
            timestamp = datetime.fromisoformat(timestamp_str) if timestamp_str else datetime.now()
        except (TypeError, ValueError):
            timestamp = datetime.now()

        if txn_id:
            # Upsert the Sale
            sale = await db.sale.upsert(
                where={"transaction_id": txn_id},
                data={
                    "create": {
                        "transaction_id": txn_id,
                        "timestamp": timestamp,
                        "total": total,
                        "tax": tax,
                        "grand_total": grand_total,
                        "payment_type": payment_type,
                    },
                    "update": {
                        "timestamp": timestamp,
                        "total": total,
                        "tax": tax,
                        "grand_total": grand_total,
                        "payment_type": payment_type,
                    }
                }
            )

            # Process items
            items_data = txn.get("Items", {}).get("Item", [])
            if isinstance(items_data, dict):
                items_data = [items_data]
            
            # For simplicity, clear and recreate items on update
            await db.saleitem.delete_many(where={"sale_id": sale.id})
            
            for item in items_data:
                try:
                    qty = int(item.get("Quantity", 1))
                    price = float(item.get("Price", 0))
                except (TypeError, ValueError):
                    qty = 1
                    price = 0.0

                await db.saleitem.create(
                    data={
                        "sale_id": sale.id,
                        "sku": item.get("SKU") or "UNKNOWN",
                        "name": item.get("Name") or "Unknown Item",
                        "quantity": qty,
                        "price": price,
                    }
                )


# ---------------------------------------------------------------------------
# GET /api/items
# ---------------------------------------------------------------------------
@app.get(
    "/api/items",
    tags=["Catalog"],
    summary="Retrieve the current item catalog",
)
async def get_items() -> dict:
    """
    List all items currently in the system.
    """
    try:
        items = await db.item.find_many(order={"item_code": "asc"})
        return {
            "count": len(items),
            "items": [i.__dict__ for i in items]
        }
    except Exception as exc:
        logger.error("Catalog retrieval error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve item catalog.",
        )
@app.get(
    "/api/dashboard/sales",
    tags=["Sales"],
    summary="Retrieve structured sales data for dashboard",
)
async def get_dashboard_sales() -> dict:
    """
    Returns aggregated sales metrics and a list of structured sale records.
    """
    try:
        sales = await db.sale.find_many(
            include={"items": True},
            order={"timestamp": "desc"},
            take=50
        )
        
        total_revenue = sum(s.grand_total for s in sales)
        total_tax = sum(s.tax for s in sales)
        
        return {
            "summary": {
                "total_revenue": round(total_revenue, 2),
                "total_tax": round(total_tax, 2),
                "transaction_count": len(sales),
            },
            "sales": [
                {
                    "id": s.id,
                    "transaction_id": s.transaction_id,
                    "timestamp": s.timestamp,
                    "grand_total": s.grand_total,
                    "payment_type": s.payment_type,
                    "item_count": len(s.items),
                } for s in sales
            ]
        }
    except Exception as exc:
        logger.error("Dashboard sales retrieval error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve dashboard sales data.",
        )


@app.get(
    "/api/sales-data",
    tags=["Sales"],
    summary="Retrieve aggregated sales data",
)
async def get_sales_data() -> dict:
    """
    Retrieve live POS records from the database.
    """
    try:
        records = await db.posdatarecord.find_many(
            order={"created_at": "desc"}, 
            take=50
        )
        
        # Format records for response
        sales_list = []
        for r in records:
            # Parse the stored JSON string back into a dict if it was stringified
            data = json.loads(r.parsed_data) if isinstance(r.parsed_data, str) else r.parsed_data
            sales_list.append({
                "id": r.id,
                "source": r.source,
                "message_type": r.message_type,
                "created_at": r.created_at,
                "data": data
            })

        return {
            "meta": {
                "generated_at": datetime.now().isoformat(),
                "record_count": len(sales_list),
            },
            "sales": sales_list,
        }
    except Exception as exc:
        logger.error("Database retrieval error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve sales data from database.",
        )
