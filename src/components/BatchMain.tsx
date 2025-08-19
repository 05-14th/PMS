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
    <div className="rounded-2xl shadow-sm border bg-white">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">{title}</h3>
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
  return <span className="px-2 py-1 rounded-full text-xs bg-gray-100">{children}</span>;
}

function Divider() {
  return <div className="h-px bg-gray-200" />;
}

function ChartShell({ title }: { title: string }) {
  return (
    <div className="h-56 md:h-64 lg:h-72 rounded-xl border bg-gradient-to-br from-gray-50 to-white grid place-items-center text-gray-400 text-sm">
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

  const units: Unit[] = ["kg", "g", "lb", "pcs", "ml", "l"];

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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Content */}
      <main className="max-w-6xl mx-auto w-full px-4 py-6 space-y-6 flex-1">
        {/* Batch header */}
        <Card title="Batch" right={<Pill>{selectedBatch ? `Start ${formatDate(selectedBatch.startDate)}` : "Select a batch"}</Pill>}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Batch">
              <select
                value={batchId}
                onChange={e => setBatchId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Population">
              <input readOnly value={selectedBatch?.population ?? ""} className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-50" />
            </Field>
            <Field label="Age">
              <input readOnly value={selectedBatch ? `${todayAge} days` : ""} className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-50" />
            </Field>
          </div>
        </Card>

        {/* Feed and Medicine consumption */}
        <Card title="Feed and Medicine consumption">
          <div className="lg:grid lg:grid-cols-3 gap-6">
            {/* Left side: form and table */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid sm:grid-cols-4 gap-3">
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
                  <Field label="Qty">
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
                  className="rounded-xl bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-black"
                >
                  Add entry
                </button>
              </div>

              <div className="overflow-auto max-h-72 rounded-lg border">
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
          <div className="lg:grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
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
                  <Field label="Qty">
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
                  className="rounded-xl bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-black"
                >
                  Add entry
                </button>
              </div>

              <div className="overflow-auto max-h-72 rounded-lg border">
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
          <div className="lg:grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
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
                  className="rounded-xl bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-black"
                >
                  Add entry
                </button>
              </div>

              <div className="overflow-auto max-h-72 rounded-lg border">
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
        <div className="text-xs text-gray-500">
          <p>UI scaffold with chart slots integrated beside each section.</p>
        </div>
      </main>

      {/* Bottom action bar */}
      <div className="sticky bottom-0 bg-white border-t">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-end">
          <button
            onClick={() => alert("Wire this to your API later")}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
