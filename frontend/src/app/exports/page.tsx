"use client";

import { useState } from "react";
import Link from "next/link";

interface ExportOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  endpoint: string;
  params?: { label: string; key: string; type: string; placeholder: string }[];
  color: string;
}

const EXPORTS: ExportOption[] = [
  {
    id: "daily-sales",
    title: "Daily Sales",
    description: "Store totals: gross, net, tax, transactions, cash/credit/debit/EBT, fuel.",
    icon: "📊",
    endpoint: "/api/export/daily-sales",
    params: [
      { label: "Store Code", key: "store_code", type: "text", placeholder: "e.g. QT118" },
      { label: "Date (YYYY-MM-DD)", key: "date", type: "date", placeholder: "2026-05-12" },
    ],
    color: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
  },
  {
    id: "department-sales",
    title: "Department Sales",
    description: "Category breakdown: quantity sold, gross, net, tax, discounts.",
    icon: "🏷️",
    endpoint: "/api/export/department-sales",
    params: [
      { label: "Store Code", key: "store_code", type: "text", placeholder: "e.g. QT118" },
      { label: "Date (YYYY-MM-DD)", key: "date", type: "date", placeholder: "2026-05-12" },
    ],
    color: "from-sky-500/10 to-sky-500/5 border-sky-500/20",
  },
  {
    id: "item-sales",
    title: "Item / Product Sales",
    description: "Line item detail: name, UPC, department, quantity, price, sales amount.",
    icon: "🛒",
    endpoint: "/api/export/item-sales",
    params: [
      { label: "Store Code", key: "store_code", type: "text", placeholder: "e.g. QT118" },
      { label: "Date (YYYY-MM-DD)", key: "date", type: "date", placeholder: "2026-05-12" },
    ],
    color: "from-violet-500/10 to-violet-500/5 border-violet-500/20",
  },
  {
    id: "fuel-sales",
    title: "Fuel Sales",
    description: "Fuel reconciliation: grade, gallons, sales, price/gallon, pump.",
    icon: "⛽",
    endpoint: "/api/export/fuel-sales",
    params: [
      { label: "Store Code", key: "store_code", type: "text", placeholder: "e.g. QT118" },
      { label: "Date (YYYY-MM-DD)", key: "date", type: "date", placeholder: "2026-05-12" },
    ],
    color: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
  },
  {
    id: "import-audit",
    title: "Import Audit",
    description: "All imports: file name, store, date, status, error count, records extracted.",
    icon: "📋",
    endpoint: "/api/export/import-audit",
    params: [
      { label: "Store Code", key: "store_code", type: "text", placeholder: "e.g. QT118" },
      { label: "Since (YYYY-MM-DD)", key: "start_date", type: "date", placeholder: "2026-05-01" },
    ],
    color: "from-slate-500/10 to-slate-500/5 border-slate-500/20",
  },
  {
    id: "unknown-products",
    title: "Unknown Products",
    description: "Unmatched product names for normalization review. Includes occurrence counts.",
    icon: "❓",
    endpoint: "/api/export/unknown-products",
    params: [
      { label: "Store Code", key: "store_code", type: "text", placeholder: "e.g. QT118" },
    ],
    color: "from-rose-500/10 to-rose-500/5 border-rose-500/20",
  },
];

function ExportCard({ opt }: { opt: ExportOption }) {
  const [params, setParams] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleExport = async (format: "csv" | "xlsx") => {
    setLoading(true);
    setMsg("");
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
      query.set("format", format);
      const res = await fetch(`${opt.endpoint}?${query}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Export failed" }));
        throw new Error(err.detail || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("content-disposition") || "";
      const fnMatch = cd.match(/filename="(.+)"/);
      a.download = fnMatch ? fnMatch[1] : `${opt.id}_export.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg("✅ Downloaded successfully");
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setMsg(`❌ ${e instanceof Error ? e.message : "Failed"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${opt.color} p-5 space-y-4`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{opt.icon}</span>
        <div>
          <h3 className="font-bold text-white text-sm">{opt.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{opt.description}</p>
        </div>
      </div>

      {opt.params && opt.params.length > 0 && (
        <div className="space-y-2">
          {opt.params.map(p => (
            <div key={p.key}>
              <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">{p.label}</label>
              <input
                type={p.type}
                placeholder={p.placeholder}
                value={params[p.key] || ""}
                onChange={e => setParams(prev => ({ ...prev, [p.key]: e.target.value }))}
                className="w-full bg-slate-900/60 border border-white/10 text-sm text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500/50 placeholder-slate-600"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => handleExport("csv")}
          disabled={loading}
          className="flex-1 py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-sm font-semibold text-white rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? "..." : "↓ CSV"}
        </button>
        <button
          onClick={() => handleExport("xlsx")}
          disabled={loading}
          className="flex-1 py-2 px-4 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/30 text-sm font-semibold text-sky-400 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? "..." : "↓ Excel (.xlsx)"}
        </button>
      </div>

      {msg && (
        <p className={`text-xs text-center ${msg.startsWith("✅") ? "text-emerald-400" : "text-rose-400"}`}>
          {msg}
        </p>
      )}
    </div>
  );
}

export default function ExportsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/5 px-6 py-4 sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm">← Back</Link>
            <div className="h-4 w-px bg-white/10" />
            <span className="font-bold text-white">Export Center</span>
            <span className="text-xs text-slate-500 border border-white/10 px-2 py-0.5 rounded-full">CSV</span>
          </div>
          <Link href="/imports" className="text-xs text-sky-400 hover:text-sky-300 transition-colors bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-lg">
            ← Import History
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">Export Pipelines</h1>
          <p className="text-slate-400 text-sm">All exports reflect normalized database data — not raw XML. Every download includes an export timestamp.</p>
        </div>

        <div className="bg-sky-500/5 border border-sky-500/15 rounded-xl p-4 text-xs text-sky-300 flex items-start gap-3">
          <span className="text-base">💡</span>
          <div>
            <p className="font-semibold mb-0.5">Correct data flow</p>
            <p className="text-slate-400">XML uploaded → validated + normalized → stored in database → exported here. Never raw XML → Excel directly.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXPORTS.map(opt => (
            <ExportCard key={opt.id} opt={opt} />
          ))}
        </div>
      </div>
    </main>
  );
}
