import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
import Automation_Form from './Automation/Automation_Form';
import Add_Device from './Device_Forms/Add_Device';
import axios from 'axios';

interface ToggleManualAutoModeProps {
  label?: string;
  className?: string;
  disabled?: boolean;
  initialIsAutoAll?: boolean;
  enforceManualOnMount?: boolean;
}

type DeviceView = {
  id: string;
  ip?: string;
  last_hello?: string;
  queue_len?: number;
  mode?: 'automatic' | 'manual';
};

// Known devices to always render rows for
export const FEEDER_DEVICE_ID = 'esp-0F6088';
export const WATER_DEVICE_ID  = 'esp-8A3850';
export const MED_DEVICE_ID    = 'esp-11F549';
export const ENV_DEVICE_ID    = 'gw-16ebb';

const KNOWN_DEVICE_ORDER = [
  FEEDER_DEVICE_ID,
  WATER_DEVICE_ID,
  MED_DEVICE_ID,
  ENV_DEVICE_ID,
] as const;

const KNOWN_LABELS: Record<string, string> = {
  [FEEDER_DEVICE_ID]: 'Feeder',
  [WATER_DEVICE_ID]: 'Water',
  [MED_DEVICE_ID]: 'Medication',
  [ENV_DEVICE_ID]: 'Env Gateway',
};

const ToggleManualAutoMode: React.FC<ToggleManualAutoModeProps> = ({
  label = 'Control Mode',
  className = '',
  disabled = false,
  initialIsAutoAll,
  enforceManualOnMount = true,
}) => {
  const [devices, setDevices] = useState<DeviceView[]>([]);
  const [loadingDevices, setLoadingDevices] = useState<boolean>(true);
  

  // Per device mode state: true = auto
  const [deviceModes, setDeviceModes] = useState<Record<string, boolean>>({});

  // helper
  const isFeeder = (id: string) => id === FEEDER_DEVICE_ID;

  // UI modals
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [scheduleForId, setScheduleForId] = useState<string | null>(null);

  // Base API host
  const serverHost =
    ((import.meta as any).env?.VITE_APP_SERVERHOST as string)?.replace(/\/+$/, '') || '';

  // Devices map for quick lookup
  const deviceMap = useMemo(() => {
    const m: Record<string, DeviceView> = {};
    for (const d of devices) m[d.id] = d;
    return m;
  }, [devices]);

  // Build rows: all known devices first (even if offline), then any extra discovered
  const rows = useMemo(() => {
    const knownRows = KNOWN_DEVICE_ORDER.map((id) => {
      const d = deviceMap[id];
      return { id, view: d, label: KNOWN_LABELS[id] || id, known: true };
    });

    const extras = devices
      .filter((d) => !KNOWN_DEVICE_ORDER.includes(d.id as any))
      .map((d) => ({ id: d.id, view: d, label: d.id, known: false }));

    return [...knownRows, ...extras];
  }, [deviceMap, devices]);

  const discoveredCount = devices.length;
  const totalCount = rows.length;

  // Fetch devices
  useEffect(() => {
    if (!serverHost) return;
    let cancelled = false;

    const fetchDevices = async () => {
      try {
        setLoadingDevices(true);
        const { data } = await axios.get<{ devices: DeviceView[] }>(`${serverHost}/`);
        if (cancelled) return;

        const list = Array.isArray(data?.devices) ? data.devices.filter((d) => !!d.id) : [];
        setDevices(list);

        // Seed per-device mode if first time
        setDeviceModes((prev) => {
          const next = { ...prev };
          for (const d of list) {
            if (next[d.id] === undefined) {
              if (typeof d.mode === 'string') next[d.id] = d.mode === 'automatic';
              else if (typeof initialIsAutoAll === 'boolean') next[d.id] = initialIsAutoAll;
              else next[d.id] = false; // default manual
            }
          }
          // Also seed known devices that are not yet discovered
          for (const id of KNOWN_DEVICE_ORDER) {
            if (next[id] === undefined) {
              next[id] =
                typeof initialIsAutoAll === 'boolean' ? initialIsAutoAll : false;
            }
          }
          return next;
        });
      } catch {
        if (!cancelled) setDevices([]);
      } finally {
        if (!cancelled) setLoadingDevices(false);
      }
    };

    fetchDevices();
    const t = setInterval(fetchDevices, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [serverHost, initialIsAutoAll]);

  // Optionally force newly seen devices into manual once
  useEffect(() => {
    if (!serverHost || !enforceManualOnMount) return;
    const idsNeedingManual = devices.map((d) => d.id).filter((id) => deviceModes[id] === true);

    const setManual = async () => {
      await Promise.allSettled(
        idsNeedingManual.map((id) =>
          axios.post(
            `${serverHost}/mode/${encodeURIComponent(id)}`,
            { mode: 'manual' },
            { headers: { 'Content-Type': 'application/json' } }
          )
        )
      );
      if (idsNeedingManual.length > 0) {
        setDeviceModes((prev) => {
          const next = { ...prev };
          for (const id of idsNeedingManual) next[id] = false;
          return next;
        });
      }
    };

    if (idsNeedingManual.length > 0) void setManual();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverHost, devices.map((d) => d.id).join('|')]);

  // Toggle a single device
  const setMode = async (id: string, toAuto: boolean) => {
    if (!serverHost) return;
    const targetMode: 'automatic' | 'manual' = toAuto ? 'automatic' : 'manual';

    setDeviceModes((prev) => ({ ...prev, [id]: toAuto }));
    try {
      await axios.post(
        `${serverHost}/mode/${encodeURIComponent(id)}`,
        { mode: targetMode },
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch {
      setDeviceModes((prev) => ({ ...prev, [id]: !toAuto }));
    }
  };

  const handleToggleOne = (id: string, isDiscovered: boolean) => {
    if (disabled || !isDiscovered) return;
    const next = !deviceModes[id];
    void setMode(id, next);
  };

  const handleAddDevice = (ipAddress: string, deviceType: string) => {
    console.log('Adding device:', { ipAddress, deviceType });
    // Integrate with backend if needed
  };

  return (
    <>
      <div
        className={`fixed right-4 z-50 bg-white p-3 rounded-lg shadow-lg border border-gray-200 ${className}
        top-20 sm:top-4 transition-all duration-300 w-auto`}
      >
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="mr-3 text-sm font-medium text-gray-700">{label}</span>
            <div className="text-xs text-gray-500">
              {loadingDevices
                ? 'Loading devices...'
                : `${discoveredCount}/${totalCount} online`}
            </div>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
            {rows.map(({ id, view, label }) => {
              const isDiscovered = !!view;
              const isAuto = !!deviceModes[id];
              return (
                <div
                  key={id}
                  className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-800 truncate">
                        {label}
                      </span>
                      <span className={`text-xs ${isDiscovered ? 'text-green-600' : 'text-gray-400'}`}>
                        {isDiscovered ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {isDiscovered && view.ip ? `IP ${view.ip}` : 'IP n/a'}
                      {isDiscovered && typeof view.queue_len === 'number'
                        ? ` · Queue ${view.queue_len}`
                        : ' · Queue n/a'}
                      {isDiscovered && view.last_hello ? ` · Last hello ${view.last_hello}` : ''}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
  {/* status text */}
  <span className={`text-sm font-semibold ${isAuto ? 'text-green-600' : 'text-gray-700'}`}>
    {isAuto ? 'Auto' : 'Manual'}
  </span>

  {/* per-device toggle (all devices have it, disabled if offline) */}
  <button
    type="button"
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
      ${isAuto ? 'bg-green-500' : 'bg-gray-300'}
      ${disabled || !isDiscovered ? 'opacity-50 cursor-not-allowed' : ''}`}
    onClick={() => handleToggleOne(id, isDiscovered)}
    aria-pressed={isAuto}
    aria-label={`Toggle automatic mode for ${id}`}
    disabled={disabled || !isDiscovered}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform
        ${isAuto ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>

  {/* Schedule button only for Feeder */}
  {isFeeder(id) && (
    <button
      onClick={() => isDiscovered && isAuto && setScheduleForId(id)}
      disabled={!isDiscovered || !isAuto || disabled}
      className={`flex items-center justify-center px-2.5 py-1.5 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors whitespace-nowrap
        ${isDiscovered && isAuto && !disabled
          ? 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500'
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
    >
      <Calendar className="w-4 h-4 mr-1" />
      <span className="hidden sm:inline">Schedule</span>
      <span className="sm:hidden">Sched</span>
    </button>
  )}
</div>
                </div>
              );
            })}
          </div>

          {/*<div className="flex justify-end">
            <button
              onClick={() => setShowAddDevice(true)}
              className="flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
                       bg-green-500 text-white hover:bg-green-600 focus:ring-green-500 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Add Device</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>*/}
        </div>
      </div>

      {showAddDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white/90 rounded-lg p-6 w-full max-w-2xl mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Device</h2>
              <button
                onClick={() => setShowAddDevice(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <Add_Device
              isOpen={showAddDevice}
              onClose={() => setShowAddDevice(false)}
              onAddDevice={handleAddDevice}
            />
          </div>
        </div>
      )}

      {scheduleForId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white/90 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4 w-full">
              <div className="text-sm text-gray-600">
                {`Schedule for ${KNOWN_LABELS[scheduleForId] || scheduleForId}`}
              </div>
              <button
                onClick={() => setScheduleForId(null)}
                className="text-gray-500 hover:text-gray-700 ml-auto"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <Automation_Form onClose={() => setScheduleForId(null)} deviceId={scheduleForId} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ToggleManualAutoMode;
