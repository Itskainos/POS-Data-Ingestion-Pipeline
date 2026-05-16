"use client";

import { useEffect, useState } from "react";

interface Transaction {
  id: string;
  itemName: string;
  rawName: string;
  amount: number;
  quantity: number;
  storeCode: string;
  businessDate: string;
  mapped: boolean;
}

interface Summary {
  total_revenue: number;
  total_tax: number;
  transaction_count: number;
  average_ticket: number;
}

interface VelocityItem {
  name: string;
  quantity_sold: number;
  revenue: number;
  mapped: boolean;
}

export default function SalesDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [velocityItems, setVelocityItems] = useState<VelocityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch Normalized Overview
      const summaryRes = await fetch("/api/analytics/overview");
      if (!summaryRes.ok) throw new Error("Failed to fetch analytics summary");
      const summaryData = await summaryRes.json();
      setSummary(summaryData.summary);

      // 2. Fetch Normalized Top Products
      const velocityRes = await fetch("/api/analytics/top-products?limit=5");
      if (!velocityRes.ok) throw new Error("Failed to fetch top products");
      const velocityData = await velocityRes.json();
      setVelocityItems(velocityData.data || []);

      // 3. Fetch Recent Transactions (Synthesized from Line Items)
      const transRes = await fetch("/api/analytics/recent-transactions?limit=10");
      if (!transRes.ok) throw new Error("Failed to fetch recent transactions");
      const transData = await transRes.json();
      setTransactions(transData.transactions || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
          <div className="absolute inset-0 rounded-full border-4 border-sky-400 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-400 mt-4 text-sm font-medium tracking-wide">Syncing data pipeline...</p>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="glass p-8 text-center max-w-lg mx-auto mt-20 border border-rose-500/20">
        <p className="text-rose-400 font-medium">Dashboard Error: {error}</p>
        <button onClick={fetchData} className="px-4 py-2 mt-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-sky-400 transition-colors">Retry Connection</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto mt-12 mb-20 px-4 sm:px-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500 tracking-tight">
            Intelligence Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Real-time insights powered by the POS Data Pipeline API.
          </p>
        </div>
        <button 
          onClick={fetchData}
          disabled={isLoading}
          className="mt-4 sm:mt-0 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
        >
          {isLoading ? (
            <span className="animate-spin h-4 w-4 border-2 border-sky-400 border-t-transparent rounded-full" />
          ) : (
            <span className="group-hover:rotate-180 transition-transform duration-500">🔄</span>
          )}
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Card */}
        <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all duration-700"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest relative z-10">Total Revenue</p>
          <p className="text-4xl font-black text-white mt-3 flex items-baseline gap-1 relative z-10">
            <span className="text-emerald-500 text-2xl">$</span>
            {summary?.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}
          </p>
          <div className="flex items-center gap-2 mt-5 text-xs text-emerald-400 font-medium bg-emerald-500/10 w-fit px-3 py-1.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Live from POS
          </div>
        </div>
        
        {/* Transactions Card */}
        <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-sky-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-sky-500/20 transition-all duration-700"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest relative z-10">Transactions</p>
          <p className="text-4xl font-black text-white mt-3 relative z-10">
            {summary?.transaction_count || 0}
          </p>
          <div className="flex items-center gap-2 mt-5 text-xs text-sky-400 font-medium bg-sky-500/10 w-fit px-3 py-1.5 rounded-full border border-sky-500/20">
            <span>⚡</span>
            Real-time updates
          </div>
        </div>

        {/* Avg Ticket Card */}
        <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-all duration-700"></div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest relative z-10">Avg. Ticket</p>
          <p className="text-4xl font-black text-white mt-3 flex items-baseline gap-1 relative z-10">
            <span className="text-amber-500 text-2xl">$</span>
            {summary?.average_ticket.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}
          </p>
          <div className="flex items-center gap-2 mt-5 text-xs text-amber-400 font-medium bg-amber-500/10 w-fit px-3 py-1.5 rounded-full border border-amber-500/20">
            <span>📊</span>
            Normalized Data
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inventory Velocity (New Feature) */}
        <div className="lg:col-span-1 glass p-6 sm:p-8 rounded-3xl border border-white/5 flex flex-col h-full relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-rose-500/5 blur-[80px] pointer-events-none"></div>
          <div className="mb-6 relative z-10">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="text-rose-500">🔥</span> Top Selling Items
            </h2>
            <p className="text-xs text-slate-500 mt-1">30-day velocity from secure Data API</p>
          </div>
          
          <div className="flex-1 space-y-3 relative z-10">
            {velocityItems.length === 0 ? (
               <div className="text-center py-10 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                 <p className="text-slate-500 text-sm">No sales data found.</p>
               </div>
            ) : (
              velocityItems.map((item, idx) => (
                <div key={item.name} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-colors group flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/20 shadow-inner group-hover:bg-indigo-500/20 transition-colors">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{item.name}</p>
                        {item.mapped && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 py-0.5 rounded font-bold uppercase">Mapped</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">${item.revenue.toFixed(2)} total revenue</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white bg-white/5 px-2 py-0.5 rounded-md inline-block">
                      {Math.round(item.quantity_sold)} <span className="text-[10px] font-normal text-slate-400">units</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="lg:col-span-2 glass p-6 sm:p-8 rounded-3xl border border-white/5 shadow-2xl shadow-black/40 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500/50 via-indigo-500/50 to-purple-500/50"></div>
          
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white tracking-tight">Recent Transactions</h2>
            <p className="text-xs text-slate-500 mt-1">Detailed log powered by secure paginated API</p>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-2xl flex-1 flex flex-col items-center justify-center">
              <div className="text-4xl mb-4 opacity-50">🧾</div>
              <p className="text-slate-400 text-sm font-medium">No sales records found.</p>
              <p className="text-xs text-slate-500 mt-2 max-w-xs">Upload a POSExport XML to populate the dashboard with normalized data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0A0F1C]/50 flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white/[0.02]">
                  <tr className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="px-6 py-4 rounded-tl-2xl">Item / Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Store</th>
                    <th className="px-6 py-4 text-right rounded-tr-2xl">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {transactions.map((t) => (
                    <tr key={t.id} className="group hover:bg-white/[0.03] transition-colors cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm text-slate-200 mb-0.5 flex items-center gap-2">
                          {t.itemName}
                          {!t.mapped && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Unmapped product" />}
                        </div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-1.5 font-mono">
                          {t.businessDate}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide inline-flex items-center gap-1.5 ${
                          t.mapped 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${t.mapped ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                          {t.mapped ? 'Normalized' : 'Raw'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">
                        {t.storeCode}
                      </td>
                      <td className="px-6 py-4 text-right font-bold">
                        <div className="text-white text-base">${t.amount.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{t.quantity} unit(s)</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
