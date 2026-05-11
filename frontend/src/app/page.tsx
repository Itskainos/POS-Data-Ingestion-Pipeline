"use client";

import { useState } from "react";
import XmlUploader from "@/components/XmlUploader";
import ItemCatalog from "@/components/ItemCatalog";
import SalesDashboard from "@/components/SalesDashboard";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"catalog" | "sales">("sales");

  return (
    <main className="min-h-screen flex flex-col bg-slate-950">
      {/* ── Top nav ── */}
      <header className="border-b border-white/5 px-6 py-4 backdrop-blur-md sticky top-0 z-50 bg-slate-950/50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl" aria-hidden>🗂️</span>
            <span className="font-semibold text-white tracking-tight">
              Quicktrack <span className="text-sky-400">POS Pipeline</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
             <nav className="hidden sm:flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
                <button 
                  onClick={() => setActiveTab("sales")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "sales" ? "bg-sky-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                >
                  Sales Dashboard
                </button>
                <button 
                  onClick={() => setActiveTab("catalog")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "catalog" ? "bg-sky-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                >
                  Product Catalog
                </button>
             </nav>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Service online
            </span>
          </div>
        </div>
      </header>

      {/* ── Hero & Uploader ── */}
      <section className="px-6 pt-16 pb-8">
        <div className="max-w-xl w-full mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight gradient-text">
              POS Data Ingestion
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Upload raw XML exports from your POS system. We'll parse them into
              structured JSON and synchronize your dashboard instantly.
            </p>
          </div>

          <div className="glass p-6 sm:p-8 shadow-2xl shadow-black/40">
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">
                Upload XML File
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Supports <code className="text-sky-400">POSExport</code> and <code className="text-sky-400">ItemMaintenance</code> formats.
              </p>
            </div>

            <XmlUploader />
          </div>
        </div>
      </section>

      {/* ── Dynamic Content ── */}
      <section className="px-6 pb-20">
        <div className="sm:hidden flex justify-center mb-8">
           <nav className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
                <button 
                  onClick={() => setActiveTab("sales")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "sales" ? "bg-sky-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                >
                  Sales
                </button>
                <button 
                  onClick={() => setActiveTab("catalog")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "catalog" ? "bg-sky-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
                >
                  Catalog
                </button>
             </nav>
        </div>

        {activeTab === "sales" ? <SalesDashboard /> : <ItemCatalog />}
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-white/5 px-6 py-8 text-center text-[10px] text-slate-600 uppercase tracking-[0.2em]">
        Quicktrack Inc · POS Data Ingestion Pipeline · v0.2.0
      </footer>
    </main>
  );
}
