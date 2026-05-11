"use client";

import { useEffect, useState } from "react";

interface Item {
  item_code: string;
  description: string;
  price: number;
  department_id?: string;
  updated_at: string;
}

export default function ItemCatalog() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/items");
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div className="glass p-6 sm:p-8 shadow-2xl shadow-black/40 w-full max-w-5xl mx-auto mt-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Product Catalog</h2>
          <p className="text-xs text-slate-500 mt-1">
            Live items synced from Item Maintenance Requests
          </p>
        </div>
        <button
          onClick={fetchItems}
          className="text-xs bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-rose-400 text-sm font-medium">{error}</p>
          <button onClick={fetchItems} className="text-sky-400 text-xs mt-2 underline">Try again</button>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
          <p className="text-slate-500 text-sm">No items found in the catalog.</p>
          <p className="text-xs text-slate-600 mt-1">Upload an ItemMaintenanceRequest XML to populate this list.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-white/5">
                <th className="pb-3 font-semibold">Item Code</th>
                <th className="pb-3 font-semibold">Description</th>
                <th className="pb-3 font-semibold">Price</th>
                <th className="pb-3 font-semibold text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((item) => (
                <tr key={item.item_code} className="group hover:bg-white/5 transition-colors">
                  <td className="py-4 font-mono text-sky-400">{item.item_code}</td>
                  <td className="py-4 text-slate-200">{item.description}</td>
                  <td className="py-4 text-emerald-400 font-semibold">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="py-4 text-right text-slate-500 text-xs">
                    {new Date(item.updated_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
