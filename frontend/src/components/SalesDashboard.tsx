"use client";

import { useEffect, useState } from "react";

interface Sale {
  id: string;
  transaction_id: string;
  timestamp: string;
  grand_total: number;
  payment_type: string;
  item_count: number;
}

interface Summary {
  total_revenue: number;
  total_tax: number;
  transaction_count: number;
}

export default function SalesDashboard() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dashboard/sales");
      if (!response.ok) throw new Error("Failed to fetch sales data");
      const data = await response.json();
      setSales(data.sales || []);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass p-8 text-center mt-12">
        <p className="text-rose-400 font-medium">Dashboard Error: {error}</p>
        <button onClick={fetchData} className="text-sky-400 text-sm mt-4 underline">Retry Connection</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto mt-12 mb-20">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass p-6 border-l-4 border-emerald-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</p>
          <p className="text-3xl font-bold text-white mt-2">
            ${summary?.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
            <span>↑</span> Live from POS
          </p>
        </div>
        
        <div className="glass p-6 border-l-4 border-sky-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transactions</p>
          <p className="text-3xl font-bold text-white mt-2">{summary?.transaction_count}</p>
          <p className="text-xs text-sky-400 mt-2 flex items-center gap-1">
            <span>⚡</span> Real-time updates
          </p>
        </div>

        <div className="glass p-6 border-l-4 border-amber-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg. Ticket</p>
          <p className="text-3xl font-bold text-white mt-2">
            ${summary && summary.transaction_count > 0 
              ? (summary.total_revenue / summary.transaction_count).toFixed(2) 
              : "0.00"}
          </p>
          <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
            <span>📊</span> Calculated field
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass p-6 sm:p-8 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Recent Transactions</h2>
            <p className="text-xs text-slate-500 mt-1">Detailed log of individual sales exports</p>
          </div>
          <button 
            onClick={fetchData}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
            title="Refresh Data"
          >
            🔄
          </button>
        </div>

        {sales.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
            <p className="text-slate-500 text-sm">No sales records found.</p>
            <p className="text-xs text-slate-600 mt-1">Upload a POSExport XML to populate the dashboard.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-white/5">
                  <th className="pb-4 font-semibold">Transaction ID</th>
                  <th className="pb-4 font-semibold">Timestamp</th>
                  <th className="pb-4 font-semibold">Items</th>
                  <th className="pb-4 font-semibold">Payment</th>
                  <th className="pb-4 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sales.map((sale) => (
                  <tr key={sale.id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4 font-mono text-slate-400">{sale.transaction_id}</td>
                    <td className="py-4 text-slate-300">
                      {new Date(sale.timestamp).toLocaleString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                    <td className="py-4">
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-bold uppercase">
                        {sale.item_count} {sale.item_count === 1 ? 'Item' : 'Items'}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-slate-400 text-xs">{sale.payment_type}</span>
                    </td>
                    <td className="py-4 text-right text-emerald-400 font-bold">
                      ${sale.grand_total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
