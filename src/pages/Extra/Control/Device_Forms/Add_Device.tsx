import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

interface AddDeviceProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDevice: (idOrIp: string, deviceType: string) => void;
}

type GatewayStatus = "online" | "offline" | "unknown";

interface Gateway {
  id: string;
  name?: string;
  ip?: string;
  status?: GatewayStatus;
  lastSeenAt?: string;   // NEW
  claimed?: boolean;     // NEW
}

const AddDevice: React.FC<AddDeviceProps> = ({ isOpen, onClose, onAddDevice }) => {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const serverHost = import.meta.env.VITE_APP_SERVERHOST?.replace(/\/+$/, "") || "";

  // Simple polling. If you already expose an SSE stream, you can swap this to EventSource.
  // Guide mentions: Poll GET /api/gateways or subscribe via SSE.
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    const fetchOnce = async () => {
      try {
        const { data } = await axios.get<Gateway[]>(`${serverHost}/api/iot/gateways`);
        if (!cancelled) {
          setGateways(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e?.response?.data?.message ||
            e?.message ||
            "Failed to load gateways"
          );
          setLoading(false);
        }
      }
    };

    // First fetch right away
    fetchOnce();

    // Poll every 2 seconds
    const t = setInterval(fetchOnce, 2000);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [isOpen, serverHost]);

  const handleClaim = async (gateway: Gateway) => {
    if (claimingId || gateway.claimed) return;  // Prevent multiple claims
    setClaimingId(gateway.id);
    setError("");
    try {
      await axios.post(`${serverHost}/api/iot/gateways/${gateway.id}/claim`);
      onAddDevice(gateway.id, "gateway");
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
        e?.message ||
        "Failed to claim gateway"
      );
    }
    setClaimingId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/90 p-6 rounded-lg w-full max-w-md shadow-xl border border-gray-100">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Add Device</h2>
          <p className="text-sm text-gray-600 mt-1">
            Tap a gateway to claim and add it.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-transparent" />
            <span className="ml-3 text-gray-600 text-sm">Loading gateways...</span>
          </div>
        ) : gateways.length === 0 ? (
          <div className="text-sm text-gray-600 py-10 text-center">
            No gateways discovered yet. Power your device and wait a moment.
          </div>
        ) : (
          <ul className="space-y-3 mb-6 max-h-72 overflow-auto pr-1">
            {gateways.map((gw) => {
              const status = gw.status || "unknown";
              const statusColor =
                status === "online" ? "bg-green-500" :
                status === "offline" ? "bg-gray-400" :
                "bg-yellow-500";

              const isBusy = claimingId === gw.id;
              const isClaimed = !!gw.claimed;

              return (
                <li key={gw.id}>
                  <button
                    onClick={() => handleClaim(gw)}
                    disabled={isBusy || isClaimed}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    <div className="min-w-0 text-left">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${statusColor}`} />
                        <span className="font-medium text-gray-800 truncate">
                          {gw.name || gw.id}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">
                        {(gw.ip ? `IP ${gw.ip}` : "IP unknown")}
                        {" • "}
                        {status}
                        {gw.lastSeenAt ? ` • seen ${new Date(gw.lastSeenAt).toLocaleString()}` : ""}
                      </div>
                    </div>
                    <div className="ml-3">
                      <span className="text-sm font-medium text-green-700">
                        {isBusy ? "Claiming..." : isClaimed ? "Added" : "Add"}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDevice;
