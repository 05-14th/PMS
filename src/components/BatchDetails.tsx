import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

type DailyEvent = {
  id: string;
  date: string;
  event: "Consumption" | "Medication" | "Mortality" | "Other";
  details: string;
  qty: number;
};

type DirectCost = {
  id: string;
  date: string;
  type: string;
  description: string;
  amount: number;
};

type BatchVitals = {
  id: string;
  name: string;
  startDate: string;
  ageDays: number;
  currentPopulation: number;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST, // replace with your real API
  timeout: 10000,
});

export default function BatchDetails({ batchId }: { batchId: string }) {
  const [vitals, setVitals] = useState<BatchVitals | null>(null);
  const [events, setEvents] = useState<DailyEvent[]>([]);
  const [costs, setCosts] = useState<DirectCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [newEvent, setNewEvent] = useState<Partial<DailyEvent>>({
    event: "Consumption",
    date: new Date().toISOString().slice(0, 10),
    details: "",
    qty: 0,
  });

  const totalCost = useMemo(
    () => costs.reduce((sum, c) => sum + c.amount, 0),
    [costs]
  );

  useEffect(() => {
    let ok = true;
    setLoading(true);
    Promise.all([
      api.get<{ data: BatchVitals }>(`/batches/${batchId}/vitals`),
      api.get<{ data: DailyEvent[] }>(`/batches/${batchId}/events`),
      api.get<{ data: DirectCost[] }>(`/batches/${batchId}/costs`),
    ])
      .then(([v, e, c]) => {
        if (!ok) return;
        setVitals(v.data.data);
        setEvents(e.data.data);
        setCosts(c.data.data);
      })
      .catch(e => {
        if (!ok) return;
        setErr(e?.message || "Failed to load");
      })
      .finally(() => ok && setLoading(false));
    return () => {
      ok = false;
    };
  }, [batchId]);

  const submitEvent = async () => {
    try {
      const payload = {
        date: newEvent.date,
        event: newEvent.event,
        details: newEvent.details,
        qty: Number(newEvent.qty || 0),
      };
      const res = await api.post<{ data: DailyEvent }>(
        `/batches/${batchId}/events`,
        payload
      );
      setEvents(prev => [res.data.data, ...prev]);
      setNewEvent({
        event: "Consumption",
        date: new Date().toISOString().slice(0, 10),
        details: "",
        qty: 0,
      });
    } catch (e: any) {
      alert(e?.message || "Failed to add event");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          className="text-sm text-gray-600 hover:text-gray-900"
          onClick={() => history.back()}
        >
          Back to All Batches
        </button>

        <header className="mt-2 mb-6">
          <h1 className="text-2xl font-semibold">
            Managing: {vitals?.name || "Batch"}
          </h1>
          <nav className="mt-2 flex gap-3 text-sm text-gray-600">
            <a className="hover:text-gray-900" href="#">Monitoring</a>
            <span>•</span>
            <a className="hover:text-gray-900" href="#">Harvesting</a>
          </nav>
        </header>

        {loading && <p className="text-gray-600">Loading...</p>}
        {!loading && err && <p className="text-red-600">{err}</p>}

        {!loading && !err && vitals && (
          <>
            <section className="mb-6 rounded-2xl border border-gray-200 p-4">
              <h2 className="text-lg font-medium mb-2">Batch Vitals</h2>
              <div className="text-gray-800">
                <div>Start Date: {vitals.startDate}</div>
                <div>Age: {vitals.ageDays} days</div>
                <div>Current Population: {vitals.currentPopulation}</div>
              </div>
            </section>

            <section className="mb-6 rounded-2xl border border-gray-200 p-4">
              <h3 className="text-base font-medium mb-3">Record a Daily Event</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <select
                  className="border rounded-xl px-3 py-2"
                  value={newEvent.event}
                  onChange={e =>
                    setNewEvent(prev => ({ ...prev, event: e.target.value as DailyEvent["event"] }))
                  }
                >
                  <option value="Consumption">Record Consumption</option>
                  <option value="Medication">Medication</option>
                  <option value="Mortality">Mortality</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="date"
                  className="border rounded-xl px-3 py-2"
                  value={newEvent.date}
                  onChange={e =>
                    setNewEvent(prev => ({ ...prev, date: e.target.value }))
                  }
                />
                <input
                  placeholder="Details"
                  className="border rounded-xl px-3 py-2 md:col-span-2"
                  value={newEvent.details}
                  onChange={e =>
                    setNewEvent(prev => ({ ...prev, details: e.target.value }))
                  }
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Qty or count"
                  className="border rounded-xl px-3 py-2"
                  value={newEvent.qty ?? ""}
                  onChange={e =>
                    setNewEvent(prev => ({ ...prev, qty: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="mt-3">
                <button
                  onClick={submitEvent}
                  className="px-3 py-2 rounded-xl bg-gray-900 text-white text-sm hover:opacity-90"
                >
                  Add Entry
                </button>
              </div>
            </section>

            <section className="mb-6 rounded-2xl border border-gray-200 p-4">
              <h3 className="text-base font-medium mb-3">Daily Events Log</h3>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty or Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {events.map((ev, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="px-4 py-2">{ev.date}</td>
                        <td className="px-4 py-2">{ev.event}</td>
                        <td className="px-4 py-2">{ev.details}</td>
                        <td className="px-4 py-2">{ev.qty}</td>
                      </tr>
                    ))}
                    {events.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                          No events recorded
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-6 rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium">Direct Costs Log</h3>
                <span className="text-sm text-gray-600">Total: ₱{totalCost.toLocaleString()}</span>
              </div>
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {costs.map(c => (
                      <tr key={c.id} className="bg-white">
                        <td className="px-4 py-2">{c.date}</td>
                        <td className="px-4 py-2">{c.type}</td>
                        <td className="px-4 py-2">{c.description}</td>
                        <td className="px-4 py-2">₱{c.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    {costs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                          No costs recorded
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
