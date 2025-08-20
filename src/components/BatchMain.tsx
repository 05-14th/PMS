import React, { useMemo, useState } from "react";

/**
 * Poultry Farm Monitoring UI - UI only
 * React + TypeScript + TailwindCSS
 * No API wiring. Sample in-memory data.
 */

type Batch = {
  id: string;
  name: string;
  startDate: string; // ISO date
  population: number;
};

type InventoryItem = {
  id: string;
  name: string;
  category: "feed" | "medicine" | "general";
  defaultUnit?: string;
};

type Unit = "kg" | "g" | "lb" | "pcs" | "ml" | "l";

type FeedMedicineEntry = {
  id: string;
  itemId: string;
  itemName: string;
  qty: number;
  unit: Unit;
  timestamp: string;
};

type InventoryUsageEntry = {
  id: string;
  itemId: string;
  itemName: string;
  qty: number;
  timestamp: string;
};

type MortalityEntry = {
  id: string;
  count: number;
  cause?: string;
  timestamp: string;
};

function Card({ title, children, right }: { title: string; children?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="rounded-lg shadow border border-gray-200 bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
      <span className="w-28 shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </label>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="px-2 py-1 rounded text-xs bg-gray-50 border border-gray-200 text-gray-700">{children}</span>;
}

function Divider() {
  return <div className="h-px bg-gray-100" />;
}

function ChartShell({ title }: { title: string }) {
  return (
    <div className="h-56 md:h-64 lg:h-72 rounded-lg border border-gray-100 bg-white grid place-items-center text-gray-300 text-sm">
      {title} placeholder
    </div>
  );
}

function formatDate(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString();
}

function daysBetween(a: string | Date, b: string | Date) {
  const start = typeof a === "string" ? new Date(a) : a;
  const end = typeof b === "string" ? new Date(b) : b;
  const ms = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export default function BatchMain() {
  // Sample data
  const [batches] = useState<Batch[]>([
    { id: "b1", name: "Batch 1", startDate: new Date(Date.now() - 14 * 86400000).toISOString(), population: 200 },
    { id: "b2", name: "Batch 2", startDate: new Date(Date.now() - 5 * 86400000).toISOString(), population: 120 },
  ]);

  const [items] = useState<InventoryItem[]>([
    { id: "i1", name: "Starter Feed", category: "feed", defaultUnit: "kg" },
    { id: "i2", name: "Grower Feed", category: "feed", defaultUnit: "kg" },
    { id: "i3", name: "Vitamin Mix", category: "medicine", defaultUnit: "ml" },
    { id: "i4", name: "Bedding", category: "general", defaultUnit: "pcs" },
  ]);

  // Selection
  const [batchId, setBatchId] = useState<string>("b1");

  // Entries
  const [feedMedEntries, setFeedMedEntries] = useState<FeedMedicineEntry[]>([]);
  const [usageEntries, setUsageEntries] = useState<InventoryUsageEntry[]>([]);
  const [mortalityEntries, setMortalityEntries] = useState<MortalityEntry[]>([]);


  const selectedBatch = useMemo(() => batches.find(b => b.id === batchId) || null, [batches, batchId]);
  const todayAge = useMemo(() => (selectedBatch ? daysBetween(selectedBatch.startDate, new Date()) : 0), [selectedBatch]);

  // Local forms
  const [fmItemId, setFmItemId] = useState("i1");
  const [fmQty, setFmQty] = useState<number | undefined>(undefined);
  const [fmUnit, setFmUnit] = useState<Unit>("kg");

  const [useItemId, setUseItemId] = useState("i4");
  const [useQty, setUseQty] = useState<number | undefined>(undefined);

  const [mortCount, setMortCount] = useState<number | undefined>(undefined);
  const [mortCause, setMortCause] = useState<string>("");

  // Derived lists
  const feedMedItems = items.filter(i => i.category === "feed" || i.category === "medicine");
  const generalItems = items.filter(i => i.category === "general");

  function NumberInput({ value, onChange, min = 0, step = 1, placeholder }: { value?: number; onChange: (v: number) => void; min?: number; step?: number; placeholder?: string }) {
    return (
      <input
        type="number"
        value={value === undefined || value === null ? "" : value}
        onChange={e => onChange(Number(e.target.value))}
        min={min}
        step={step}
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    );
  }

  function addFeedMedEntry(p: { itemId: string; qty: number; unit: Unit }) {
    const item = items.find(i => i.id === p.itemId);
    if (!item) return;
    const entry: FeedMedicineEntry = {
      id: crypto.randomUUID(),
      itemId: item.id,
      itemName: item.name,
      qty: p.qty,
      unit: p.unit,
      timestamp: new Date().toISOString(),
    };
    setFeedMedEntries(prev => [entry, ...prev]);
  }

  function addUsageEntry(p: { itemId: string; qty: number }) {
    const item = items.find(i => i.id === p.itemId);
    if (!item) return;
    const entry: InventoryUsageEntry = {
      id: crypto.randomUUID(),
      itemId: item.id,
      itemName: item.name,
      qty: p.qty,
      timestamp: new Date().toISOString(),
    };
    setUsageEntries(prev => [entry, ...prev]);
  }

  function addMortalityEntry(p: { count: number; cause?: string }) {
    const entry: MortalityEntry = {
      id: crypto.randomUUID(),
      count: p.count,
      cause: p.cause?.trim() ? p.cause.trim() : undefined,
      timestamp: new Date().toISOString(),
    };
    setMortalityEntries(prev => [entry, ...prev]);
  }

  const [tab, setTab] = useState<'monitoring' | 'harvesting'>('monitoring');

  return (
    <div className="min-h-[200vh] sm:min-h-[120vh] bg-gray-50 text-gray-900 flex flex-col">
      <main className="max-w-full mx-auto w-full px-2 sm:px-6 md:px-10 lg:px-20 py-6 sm:py-10 md:py-16 lg:py-20 space-y-10 sm:space-y-12 md:space-y-16 flex-1 pb-32">
        {/* Sub-tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold text-sm border-b-2 transition-colors duration-150 ${tab === 'monitoring' ? 'border-orange-500 text-orange-600 bg-white' : 'border-transparent text-gray-500 bg-gray-100 hover:border-orange-500 hover:text-orange-600'}`}
            onClick={() => setTab('monitoring')}
          >
            Monitoring
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold text-sm border-b-2 transition-colors duration-150 ${tab === 'harvesting' ? 'border-orange-500 text-orange-600 bg-white' : 'border-transparent text-gray-500 bg-gray-100 hover:border-orange-500 hover:text-orange-600'}`}
            onClick={() => setTab('harvesting')}
          >
            Harvesting
          </button>
        </div>

        {tab === 'harvesting' && (
          <>
            <Card title="Batch" right={<Pill>{selectedBatch ? `Start ${formatDate(selectedBatch.startDate)}` : "Select a batch"}</Pill>}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 lg:gap-12">
                <Field label="Batch">
                  <select
                    value={batchId}
                    onChange={e => setBatchId(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Population">
                  <input readOnly value={selectedBatch?.population ?? ""} className="w-full rounded-lg border px-4 py-2 text-sm bg-gray-50" />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 lg:gap-12 mt-4">
                <Field label="Age">
                  <input readOnly value={selectedBatch ? `${todayAge} days` : ""} className="w-full rounded-lg border px-4 py-2 text-sm bg-gray-50" />
                </Field>
                <Field label="Mortality">
                  <input readOnly value={mortalityEntries.filter(m => selectedBatch && batches.find(b => b.id === batchId)?.id === batchId).reduce((sum, m) => sum + m.count, 0)} className="w-full rounded-lg border px-4 py-2 text-sm bg-gray-50" />
                </Field>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-4 mt-4">
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl flex items-center gap-4 text-center justify-center sm:justify-start w-full sm:w-auto text-lg font-bold" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add
                </button>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl flex items-center gap-4 text-center justify-center sm:justify-start w-full sm:w-auto text-lg font-bold" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z" /></svg>
                  Edit
                </button>
                <button className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl flex items-center gap-4 text-center justify-center sm:justify-start w-full sm:w-auto text-lg font-bold" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m5 0H4" /></svg>
                  Delete
                </button>
              </div>
            </Card>
            {/* Harvesting Table OUTSIDE the Card */}
            <div className="overflow-x-auto max-h-72 rounded-lg border mt-8">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="px-4 py-2 border">Date</th>
                    <th className="px-4 py-2 border">Bird Quantity</th>
            
                    <th className="px-4 py-2 border">Weight Total</th>
                    <th className="px-4 py-2 border">Unit</th>
                    <th className="px-4 py-2 border">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Replace with dynamic DB data when available */}
                  {/* Example: harvestingEntries.map(row => ( ... )) */}
                  <tr>
                    <td colSpan={7} className="text-center text-gray-500 py-8">No entries yet</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Bird Quality, Type, Weight Total, Add to Inventory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-8 items-end">
              <div>
                <Field label="Bird Quantity">
                  <input type="text" className="w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter quantity" />
                </Field>
              </div>
              <div>
                <Field label="Type">
                  <select className="w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select type</option>
                    <option value="Harvest">Harvest</option>
                    <option value="Cull">Cull</option>
                  </select>
                </Field>
              </div>
              <div>
                <Field label="Weight Total">
                  <div className="flex items-center gap-2">
                    <input type="number" className="w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" min="0" step="0.01" />
                    <span className="text-sm text-gray-700">Kg</span>
                  </div>
                </Field>
              </div>
              <div>
                <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold w-full" type="button">
                  Add to Inventory
                </button>
              </div>
            </div>
          </>
                  
        )}

        {tab === 'monitoring' && (
          <React.Fragment>
            <Card 
              title="Batch" 
              right={
                <div className="flex items-center gap-4">
                  <Pill>{selectedBatch ? `Start ${formatDate(selectedBatch.startDate)}` : "Select a batch"}</Pill>
                </div>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 lg:gap-12 items-end">
                <Field label="Batch">
                  <select
                    value={batchId}
                    onChange={e => setBatchId(e.target.value)}
                        className="w-full rounded-lg border px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Population">
                <input readOnly value={selectedBatch?.population ?? ""} className="w-full rounded-lg border px-4 py-2 text-sm bg-gray-50" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 lg:gap-12 mt-4">
              <Field label="Age">
                <input readOnly value={selectedBatch ? `${todayAge} days` : ""} className="w-full rounded-lg border px-4 py-2 text-sm bg-gray-50" />
              </Field>
              <Field label="Mortality">
                <input readOnly value={mortalityEntries.filter(m => selectedBatch && batches.find(b => b.id === batchId)?.id === batchId).reduce((sum, m) => sum + m.count, 0)} className="w-full rounded-lg border px-4 py-2 text-sm bg-gray-50" />
              </Field>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-4 mt-4">
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl flex items-center gap-4 text-center justify-center sm:justify-start w-full sm:w-auto text-lg font-bold" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add
              </button>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl flex items-center gap-4 text-center justify-center sm:justify-start w-full sm:w-auto text-lg font-bold" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H7v-3a2 2 0 01.586-1.414z" /></svg>
                Edit
              </button>
              <button className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl flex items-center gap-4 text-center justify-center sm:justify-start w-full sm:w-auto text-lg font-bold" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m5 0H4" /></svg>
                Delete
              </button>
            </div>
            </Card>
           

            <Card title="Feed and Medicine Consumption">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
                {/* Left side: form and table */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="sm:col-span-2">
                      <Field label="Item">
                        <select
                          value={fmItemId}
                          onChange={e => {
                            setFmItemId(e.target.value);
                            const def = items.find(i => i.id === e.target.value)?.defaultUnit as Unit | undefined;
                            if (def) setFmUnit(def);
                          }}
                          className="w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {feedMedItems.map(it => (
                            <option key={it.id} value={it.id}>{it.name}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <div>
                      <Field label="Quantity">
                        <NumberInput value={fmQty} onChange={setFmQty} min={0} step={0.01} placeholder="0" />
                      </Field>
                    </div>
                    <div>
                      <Field label="Unit">
                        <select
                          value={fmUnit}
                          onChange={e => setFmUnit(e.target.value as Unit)}
                          className="w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {(["kg","g","lb","pcs","ml","l"] as Unit[]).map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!fmItemId || !fmQty) return alert("Pick item and qty");
                        addFeedMedEntry({ itemId: fmItemId, qty: fmQty, unit: fmUnit });
                        setFmQty(undefined);
                      }}
                      className="rounded-xl bg-orange-500 text-white px-4 py-2 text-sm font-semibold hover:bg-orange-600 transition-colors"
                    >
                      Add entry
                    </button>
                  </div>

                  <div className="overflow-x-auto max-h-72 rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600 border-b bg-gray-50">
                          <th className="py-2 pr-3">Time</th>
                          <th className="py-2 pr-3">Item</th>
                          <th className="py-2 pr-3">Qty</th>
                          <th className="py-2">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feedMedEntries.map(row => (
                          <tr key={row.id} className="border-b last:border-0">
                            <td className="py-2 pr-3 whitespace-nowrap">{new Date(row.timestamp).toLocaleString()}</td>
                            <td className="py-2 pr-3">{row.itemName}</td>
                            <td className="py-2 pr-3">{row.qty}</td>
                            <td className="py-2">{row.unit}</td>
                          </tr>
                        ))}
                        {feedMedEntries.length === 0 && (
                          <tr>
                            <td className="py-3 text-gray-500" colSpan={4}>No entries yet</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right side: chart */}
                <div className="lg:col-span-1">
                  <ChartShell title="Feed chart" />
                </div>
              </div>
            </Card>

            {/* Inventory usage */}
            <Card title="Inventory usage">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="sm:col-span-2">
                      <Field label="Item">
                        <select
                          value={useItemId}
                          onChange={e => setUseItemId(e.target.value)}
                          className="w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {generalItems.map(it => (
                            <option key={it.id} value={it.id}>{it.name}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <div>
                      <Field label="Quantity">
                        <NumberInput value={useQty} onChange={setUseQty} min={0} step={1} placeholder="0" />
                      </Field>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!useItemId || !useQty) return alert("Pick item and qty");
                        addUsageEntry({ itemId: useItemId, qty: useQty });
                        setUseQty(undefined);
                      }}
                      className="rounded-xl bg-orange-500 text-white px-4 py-2 text-sm font-semibold hover:bg-black"
                    >
                      Add entry
                    </button>
                  </div>

                  <div className="overflow-x-auto max-h-72 rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600 border-b bg-gray-50">
                          <th className="py-2 pr-3">Time</th>
                          <th className="py-2 pr-3">Item</th>
                          <th className="py-2">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usageEntries.map(row => (
                          <tr key={row.id} className="border-b last:border-0">
                            <td className="py-2 pr-3 whitespace-nowrap">{new Date(row.timestamp).toLocaleString()}</td>
                            <td className="py-2 pr-3">{row.itemName}</td>
                            <td className="py-2">{row.qty}</td>
                          </tr>
                        ))}
                        {usageEntries.length === 0 && (
                          <tr>
                            <td className="py-3 text-gray-500" colSpan={3}>No entries yet</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <ChartShell title="Inventory usage chart" />
                </div>
              </div>
            </Card>

            {/* Mortality */}
            <Card title="Mortality">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div>
                      <Field label="Count">
                        <NumberInput value={mortCount} onChange={setMortCount} min={0} step={1} placeholder="0" />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                        <span className="w-28 shrink-0">Cause</span>
                        <input
                          value={mortCause}
                          onChange={e => setMortCause(e.target.value)}
                          placeholder="Optional"
                          className="w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!mortCount) return alert("Enter a count");
                        addMortalityEntry({ count: mortCount, cause: mortCause });
                        setMortCount(undefined);
                        setMortCause("");
                      }}
                      className="rounded-xl bg-orange-500 text-white px-4 py-2 text-sm font-semibold hover:bg-black"
                    >
                      Add entry
                    </button>
                  </div>

                  <div className="overflow-x-auto max-h-72 rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600 border-b bg-gray-50">
                          <th className="py-2 pr-3">Time</th>
                          <th className="py-2 pr-3">Count</th>
                          <th className="py-2">Cause</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mortalityEntries.map(row => (
                          <tr key={row.id} className="border-b last:border-0">
                            <td className="py-2 pr-3 whitespace-nowrap">{new Date(row.timestamp).toLocaleString()}</td>
                            <td className="py-2 pr-3">{row.count}</td>
                            <td className="py-2">{row.cause ?? ""}</td>
                          </tr>
                        ))}
                        {mortalityEntries.length === 0 && (
                          <tr>
                            <td className="py-3 text-gray-500" colSpan={3}>No entries yet</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <ChartShell title="Mortality chart" />
                </div>
              </div>
            </Card>

            <Divider />
      
          </React.Fragment>
        )}
      </main>
      {/* Save Button as normal block below content, only in monitoring */}
{tab === 'monitoring' && (
        <div className="w-full flex justify-end m-0 mb-20 px-2 sm:pr-6 md:pr-10 lg:pr-20">
          <button className="w-full sm:max-w-xs bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl shadow-lg font-bold text-lg flex items-center justify-center gap-2" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Save
          </button>
        </div>
      )}

   
        </div>
      
   
  );
}
