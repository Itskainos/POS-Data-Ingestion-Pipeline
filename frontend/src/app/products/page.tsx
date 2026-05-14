"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UnknownProduct {
  id: string;
  rawName: string;
  storeCode: string | null;
  businessDate: string | null;
  occurrences: number;
  suggestedMatch: string | null;
  createdAt: string;
}

interface ProductMaster {
  id: string;
  canonicalName: string;
}

export default function ProductNormalizationPage() {
  const [unknowns, setUnknowns] = useState<UnknownProduct[]>([]);
  const [masters, setMasters] = useState<ProductMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<UnknownProduct | null>(null);
  const [canonicalName, setCanonicalName] = useState("");
  const [upc, setUpc] = useState("");
  const [department, setDepartment] = useState("");
  const [msg, setMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [unkRes, mstRes] = await Promise.all([
        fetch("/api/products/unknown"),
        fetch("/api/products/master")
      ]);
      const unkData = await unkRes.json();
      const mstData = await mstRes.json();
      setUnknowns(unkData.products || []);
      setMasters(mstData.masters || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setResolving(selectedProduct.id);
    setMsg("");
    try {
      const res = await fetch("/api/products/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unknown_product_id: selectedProduct.id,
          canonical_name: canonicalName,
          upc: upc || null,
          department: department || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to resolve");
      setMsg(`✅ Resolved to ${data.master.canonicalName}`);
      setSelectedProduct(null);
      setCanonicalName("");
      setUpc("");
      setDepartment("");
      fetchData(); // Refresh lists
    } catch (err) {
      setMsg(`❌ ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setResolving(null);
      setTimeout(() => setMsg(""), 4000);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="border-b border-white/5 px-6 py-4 sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm">← Back</Link>
            <div className="h-4 w-px bg-white/10" />
            <span className="font-bold text-white">Product Normalization</span>
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-2 py-0.5 rounded-full">
              {unknowns.length} Unmapped
            </span>
          </div>
          <button onClick={fetchData} className="text-xs text-slate-400 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
            ↻ Refresh
          </button>
        </div>
      </header>

      <div className="max-w-6xl w-full mx-auto px-6 py-8 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Unknown Products */}
        <div className="lg:col-span-2 flex flex-col h-[calc(100vh-8rem)]">
          <div className="mb-4">
            <h2 className="text-lg font-bold">Unknown Products</h2>
            <p className="text-xs text-slate-400">Map these raw names to canonical products to improve analytics.</p>
          </div>
          
          <div className="bg-white/2 border border-white/5 rounded-2xl flex-1 overflow-hidden flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
              </div>
            ) : unknowns.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <span className="text-4xl mb-3">🎉</span>
                <p>All products are mapped!</p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {unknowns.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelectedProduct(u);
                      setCanonicalName(u.suggestedMatch || u.rawName);
                      setMsg("");
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${selectedProduct?.id === u.id ? "bg-sky-500/10 border-sky-500/30 ring-1 ring-sky-500/50" : "bg-transparent border-transparent hover:bg-white/5"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-slate-200">{u.rawName}</span>
                      <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{u.occurrences}x</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                      <span>Store: <span className="text-slate-400">{u.storeCode || "—"}</span></span>
                      <span>Last Seen: <span className="text-slate-400">{u.businessDate || "—"}</span></span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Mapping Form */}
        <div className="flex flex-col h-full">
          <div className="mb-4">
            <h2 className="text-lg font-bold">Map Product</h2>
            <p className="text-xs text-slate-400">Assign a canonical name to the selected item.</p>
          </div>
          
          <div className="bg-gradient-to-b from-sky-500/5 to-transparent border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
            
            {!selectedProduct ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-20">
                <span className="text-3xl mb-3 opacity-50">👈</span>
                <p className="text-sm">Select an unknown product<br/>from the list to begin.</p>
              </div>
            ) : (
              <form onSubmit={handleResolve} className="space-y-5">
                <div className="p-3 bg-slate-900/50 border border-white/5 rounded-xl">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Mapping From Raw Name</p>
                  <p className="font-mono text-sm text-amber-400 break-words">{selectedProduct.rawName}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5">Canonical Name <span className="text-rose-400">*</span></label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={canonicalName}
                        onChange={e => setCanonicalName(e.target.value)}
                        placeholder="e.g. Coca-Cola 20oz"
                        className="w-full bg-slate-900 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all"
                        list="master-list"
                      />
                      <datalist id="master-list">
                        {masters.map(m => (
                          <option key={m.id} value={m.canonicalName} />
                        ))}
                      </datalist>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1.5">Type an existing canonical name or create a new one.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5">UPC (Optional)</label>
                      <input
                        type="text"
                        value={upc}
                        onChange={e => setUpc(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1.5">Department (Optional)</label>
                      <input
                        type="text"
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    type="submit"
                    disabled={resolving === selectedProduct.id}
                    className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {resolving === selectedProduct.id ? (
                      <><div className="h-4 w-4 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" /> Saving...</>
                    ) : (
                      <>🔗 Map Product</>
                    )}
                  </button>
                  {msg && (
                    <p className={`text-xs text-center ${msg.startsWith("✅") ? "text-emerald-400" : "text-rose-400"}`}>
                      {msg}
                    </p>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
