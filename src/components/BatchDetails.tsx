import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

type DailyEvent = {
  id: string;
  date: string;
  event: "Consumption" | "Medication" | "Mortality" | "Other";
  details: string;
  qty: number;
};

type DailyEventForm = {
  event: DailyEvent["event"];
  date: string;
  details: string;
  qty: string;
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
  mortalityTotal: number;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_SERVERHOST, // replace with your real API
  timeout: 10000,
});

// Helper to format date to 'YYYY-MM-DD HH:mm:ss'
function formatDateTime(dt: string | Date) {
  const d = typeof dt === "string" ? new Date(dt) : dt;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function BatchDetails({ batchId }: { batchId: string }) {
  const [unit, setUnit] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [vitals, setVitals] = useState<BatchVitals | null>(null);
  const [events, setEvents] = useState<DailyEvent[]>([]);
  const [costs, setCosts] = useState<DirectCost[]>([]);
  const [items, setItems] = useState<[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [newEvent, setNewEvent] = useState<DailyEventForm>({
    event: "Consumption",
    date: formatDateTime(new Date()),
    details: "",
    qty: "",
  });

  const [eventSort, setEventSort] = useState<{ key: keyof DailyEvent; asc: boolean }>({
    key: "date",
    asc: false,
  });
  const [costSort, setCostSort] = useState<{ key: keyof DirectCost; asc: boolean }>({
    key: "date",
    asc: false,
  });
  const [eventPage, setEventPage] = useState(1);
  const [costPage, setCostPage] = useState(1);
  const pageSize = 10;

  const totalCost = useMemo(
    () => costs.reduce((sum, c) => sum + c.amount, 0),
    [costs]
  );

  const fetchData = async () => {
    try {
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
        .catch((e) => {
          if (!ok) return;
          setErr(e?.message || "Failed to load");
        })
        .finally(() => ok && setLoading(false));
      return () => {
        ok = false;
      };
    } catch (e) {
      setErr("Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
    fetchItemById(newEvent.event);
  }, [batchId]);

  const fetchItemById = async (itemType: string) => {
    try {
      if (itemType === "Consumption") {
        itemType = "Feed";
      } else if (itemType === "Medication") {
        itemType = "Medicine";
      } else {
        return;
      }
      const res = await api.post(`/getItemByType`, { item_type: itemType });
      setItems(res.data);
    } catch (e) {
      console.error("Failed to fetch item details", e);
    }
  };

  const handleClear = () => {
    setSelectedIdx(null);
    setIsEditing(false);
    setNewEvent({
      event: "Consumption",
      date: formatDateTime(new Date()),
      details: "",
      qty: "",
    });
  };

  const submitEvent = async () => {
    try {
      // Ensure date is formatted as 'YYYY-MM-DD HH:mm:ss'
      const payload = {
        Event: newEvent.event,
        Date: formatDateTime(newEvent.date),
        Details: newEvent.details,
        Qty: newEvent.qty === "" ? 0 : Number(newEvent.qty),
      };
      // If editing existing event
      if (selectedIdx !== null) {
        // Send PUT request to update event in backend
        const eventToUpdate = events[selectedIdx];
        console.log(payload);
        await api.put(`/batches/${batchId}/events`, {
          Date: payload.Date,
          Details: payload.Details,
          Qty: payload.Qty,
        });
        fetchData();
        setSelectedIdx(null);
      } else {
        console.log(payload);
        const res = await api.post<{ data: DailyEvent }>(
          `/batches/${batchId}/events`,
          payload
        );
        fetchData();
      }
      setNewEvent({
        event: "Consumption",
        date: formatDateTime(new Date()),
        details: "",
        qty: "",
      });
    } catch (e: any) {
      alert(e?.message || "Failed to add event");
    }
  };

  const handleDelete = async (idx: string) => {
    try {
      console.log(idx);
      await api.delete(`/batches/${batchId}/events`, { data: { id: batchId, date: idx } });
      fetchData();
    } catch (e) {
      alert("Failed to delete event");
    }
  }

  // Sorting helpers
  const sortedEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      const valA = a[eventSort.key];
      const valB = b[eventSort.key];
      if (typeof valA === "number" && typeof valB === "number")
        return eventSort.asc ? valA - valB : valB - valA;
      return eventSort.asc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    return sorted;
  }, [events, eventSort]);

  const pagedEvents = useMemo(() => {
    const start = (eventPage - 1) * pageSize;
    return sortedEvents.slice(start, start + pageSize);
  }, [sortedEvents, eventPage]);

  const sortedCosts = useMemo(() => {
    const sorted = [...costs].sort((a, b) => {
      const valA = a[costSort.key];
      const valB = b[costSort.key];
      if (typeof valA === "number" && typeof valB === "number")
        return costSort.asc ? valA - valB : valB - valA;
      return costSort.asc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    return sorted;
  }, [costs, costSort]);

  const pagedCosts = useMemo(() => {
    const start = (costPage - 1) * pageSize;
    return sortedCosts.slice(start, start + pageSize);
  }, [sortedCosts, costPage]);

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
            <a className="hover:text-gray-900" href="#">
              Monitoring
            </a>
            <span>•</span>
            <a className="hover:text-gray-900" href="#">
              Harvesting
            </a>
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
                <div>Total Mortality: {vitals.mortalityTotal}</div>
              </div>
            </section>

            <section className="mb-6 rounded-2xl border border-gray-200 p-4">
              <h3 className="text-base font-medium mb-3">Record a Daily Event</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <select
                  className="border rounded-xl px-3 py-2"
                  value={newEvent.event}
                  onChange={(e) => {
                    setNewEvent((prev) => ({
                      ...prev,
                      event: e.target.value as DailyEvent["event"],
                    }));
                    fetchItemById(e.target.value);
                  }}
                >
                  <option value="Consumption">Record Consumption</option>
                  <option value="Medication">Medication</option>
                  <option value="Mortality">Mortality</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="datetime-local"
                  className="border rounded-xl px-3 py-2"
                  value={(() => {
                    // Convert 'YYYY-MM-DD HH:mm:ss' to 'YYYY-MM-DDTHH:mm' for input
                    const dt = newEvent.date.replace(" ", "T").slice(0, 16);
                    return dt;
                  })()}
                  onChange={(e) => {
                    // Convert input value 'YYYY-MM-DDTHH:mm' to 'YYYY-MM-DD HH:mm:ss'
                    const val = e.target.value.replace("T", " ") + ":00";
                    setNewEvent((prev) => ({ ...prev, date: val }));
                  }}
                  readOnly={isEditing}
                />
                {newEvent.event === "Mortality" ? (
                  <input
                    type="text"
                    placeholder="Details"
                    className="border rounded-xl px-3 py-2 md:col-span-2"
                    value={newEvent.details}
                    onChange={(e) =>
                      setNewEvent((prev) => ({ ...prev, details: e.target.value }))
                    }
                  />
                ) : (
                  <select
                    className="border rounded-xl px-3 py-2 md:col-span-2"
                    value={newEvent.details}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, details: e.target.value }))}
                  >
                    <option value="">Select Details</option>
                    {items.map((item, idx) => (
                      <option key={idx} value={item.ItemName}>
                        {item.ItemName}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  placeholder="Qty or count"
                  className="border rounded-xl px-3 py-2"
                  value={newEvent.qty}
                  onChange={(e) => {
                    // Only allow numbers and dot
                    const val = e.target.value.replace(/[^0-9.]/g, "");
                    setNewEvent((prev) => ({ ...prev, qty: val }));
                  }}
                />
              </div>
              <div className="mt-3 flex gap-3">
                <button
                  onClick={submitEvent}
                  className="px-3 py-2 rounded-xl bg-gray-900 text-white text-sm hover:opacity-90"
                >
                  {isEditing ? "Save" : "Add Entry"}
                </button>
                <button
                  onClick={handleClear}
                  className="px-3 py-2 rounded-xl bg-gray-900 text-white text-sm hover:opacity-90"
                >
                  Clear
                </button>
              </div>
            </section>

            <section className="mb-6 rounded-2xl border border-gray-200 p-4">
              <h3 className="text-base font-medium mb-3">Daily Events Log</h3>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                        onClick={() =>
                          setEventSort((s) => ({ key: "date", asc: s.key === "date" ? !s.asc : true }))
                        }
                      >
                        Date {eventSort.key === "date" ? (eventSort.asc ? "▲" : "▼") : ""}
                      </th>
                      <th
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                        onClick={() =>
                          setEventSort((s) => ({ key: "event", asc: s.key === "event" ? !s.asc : true }))
                        }
                      >
                        Event {eventSort.key === "event" ? (eventSort.asc ? "▲" : "▼") : ""}
                      </th>
                      <th
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                        onClick={() =>
                          setEventSort((s) => ({ key: "details", asc: s.key === "details" ? !s.asc : true }))
                        }
                      >
                        Details {eventSort.key === "details" ? (eventSort.asc ? "▲" : "▼") : ""}
                      </th>
                      <th
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                        onClick={() =>
                          setEventSort((s) => ({ key: "qty", asc: s.key === "qty" ? !s.asc : true }))
                        }
                      >
                        Qty or Count {eventSort.key === "qty" ? (eventSort.asc ? "▲" : "▼") : ""}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagedEvents.map((ev, idx) => (
                      <tr
                        key={ev.id || idx}
                        className={`bg-white cursor-pointer ${selectedIdx === idx ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          setSelectedIdx(idx);
                          setIsEditing(true);
                          // Extract only numbers from qty
                          const qtyNum = ev.qty !== undefined ? ev.qty.toString().replace(/[^0-9.]/g, "") : "";
                          setNewEvent({
                            event: ev.event,
                            date: ev.date,
                            details: ev.details,
                            qty: qtyNum,
                          });
                        }}
                      >
                        <td className="px-4 py-2">{ev.date}</td>
                        <td className="px-4 py-2">{ev.event}</td>
                        <td className="px-4 py-2">{ev.details}</td>
                        <td className="px-4 py-2">{ev.qty}</td>
                        <td className="px-4 py-2 text-center">
                          <span
                            style={{ cursor: "pointer" }}
                            title="Delete"
                            onClick={e => {
                              e.stopPropagation();
                              if (window.confirm("Delete this event?")) {
                                setEvents(prev => prev.filter((_, i) => i !== idx));
                                if (selectedIdx === idx) {
                                setNewEvent({
                                    event: "Consumption",
                                    date: formatDateTime(new Date()),
                                    details: "",
                                    qty: "",
                                    });
                                    setSelectedIdx(null);
                                }
                                handleDelete(ev.date)
                                // TODO: Optionally send delete request to backend here
                              }
                            }}
                          >
                            x
                          </span>
                        </td>
                      </tr>
                    ))}
                    {pagedEvents.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                          No events recorded
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {/* Pagination for events */}
                <div className="flex justify-end items-center mt-2 gap-2">
                  <button
                    disabled={eventPage === 1}
                    onClick={() => setEventPage((p) => p - 1)}
                    className="px-2 py-1 border rounded disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span>
                    Page {eventPage} /{" "}
                    {Math.max(1, Math.ceil(sortedEvents.length / pageSize))}
                  </span>
                  <button
                    disabled={eventPage >= Math.ceil(sortedEvents.length / pageSize)}
                    onClick={() => setEventPage((p) => p + 1)}
                    className="px-2 py-1 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
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
                      <th
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                        onClick={() =>
                          setCostSort((s) => ({ key: "date", asc: s.key === "date" ? !s.asc : true }))
                        }
                      >
                        Date {costSort.key === "date" ? (costSort.asc ? "▲" : "▼") : ""}
                      </th>
                      <th
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                        onClick={() =>
                          setCostSort((s) => ({ key: "type", asc: s.key === "type" ? !s.asc : true }))
                        }
                      >
                        Cost Type {costSort.key === "type" ? (costSort.asc ? "▲" : "▼") : ""}
                      </th>
                      <th
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                        onClick={() =>
                          setCostSort((s) => ({ key: "description", asc: s.key === "description" ? !s.asc : true }))
                        }
                      >
                        Description {costSort.key === "description" ? (costSort.asc ? "▲" : "▼") : ""}
                      </th>
                      <th
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                        onClick={() =>
                          setCostSort((s) => ({ key: "amount", asc: s.key === "amount" ? !s.asc : true }))
                        }
                      >
                        Amount {costSort.key === "amount" ? (costSort.asc ? "▲" : "▼") : ""}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagedCosts.map((c, idx) => (
                      <tr key={c.id} className="bg-white">
                        <td className="px-4 py-2">{c.date}</td>
                        <td className="px-4 py-2">{c.type}</td>
                        <td className="px-4 py-2">{c.description}</td>
                        <td className="px-4 py-2">₱{c.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    {pagedCosts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                          No costs recorded
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {/* Pagination for costs */}
                <div className="flex justify-end items-center mt-2 gap-2">
                  <button
                    disabled={costPage === 1}
                    onClick={() => setCostPage((p) => p - 1)}
                    className="px-2 py-1 border rounded disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span>
                    Page {costPage} /{" "}
                    {Math.max(1, Math.ceil(sortedCosts.length / pageSize))}
                  </span>
                  <button
                    disabled={costPage >= Math.ceil(sortedCosts.length / pageSize)}
                    onClick={() => setCostPage((p) => p + 1)}
                    className="px-2 py-1 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
