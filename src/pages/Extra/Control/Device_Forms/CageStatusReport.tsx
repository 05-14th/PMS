// CageStatusReport.tsx

import React, { useEffect, useState } from "react";

type ActiveBatch = {
  batchID: number;
  batchName: string;
  cageNum: number;
};

type TelemetryData = {
  relay1: number;
  relay2: number;
  relay3: number;
  sensor1: number;
  sensor2: number;
  sensor3: number;
};

type TelemetryApiResponse = {
  last_sensors?: TelemetryData | null;
};

const CageStatusReport: React.FC = () => {
  const [activeBatches, setActiveBatches] = useState<ActiveBatch[]>([]);
  const [selectedBatchID, setSelectedBatchID] = useState<number | undefined>();
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);

  const serverHost = import.meta.env.VITE_APP_SERVERHOST as string;
  const [currentCage, setCurrentCage] = useState(1);

  const [feedingTelemetry, setFeedingTelemetry] = useState<TelemetryData | null>(null);
  const [wateringTelemetry, setWateringTelemetry] = useState<TelemetryData | null>(null);
  const [medicineTelemetry, setMedicineTelemetry] = useState<TelemetryData | null>(null);

  const FEEDER_DEVICE_ID = "esp-A97A47";
  const WATER_DEVICE_ID = "esp-8A3850";
  const MED_DEVICE_ID = "esp-11F549";

  const sensorKey = `sensor${currentCage}`;
  const feederSensorKey = `sensor${currentCage - 1}`;

  // Load batches
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoadingBatches(true);
        const res = await fetch(`${serverHost}batches/active`);
        const data: ActiveBatch[] = await res.json();

        setActiveBatches(data);
        if (data.length > 0) {
          setSelectedBatchID(data[0].batchID);
          setCurrentCage(data[0].cageNum);
        }
      } catch (err: any) {
        setBatchError(err.message);
      } finally {
        setIsLoadingBatches(false);
      }
    };

    load();
  }, [serverHost]);

  // Fetch telemetry
  const fetchTelemetry = async () => {
    try {
      const feedRes = await fetch(`${serverHost}telemetry/${FEEDER_DEVICE_ID}`);
      const feedJson = (await feedRes.json()) as TelemetryApiResponse;
      setFeedingTelemetry(feedJson.last_sensors ?? null);

      const waterRes = await fetch(`${serverHost}telemetry/${WATER_DEVICE_ID}`);
      const waterJson = (await waterRes.json()) as TelemetryApiResponse;
      setWateringTelemetry(waterJson.last_sensors ?? null);

      const medRes = await fetch(`${serverHost}telemetry/${MED_DEVICE_ID}`);
      const medJson = (await medRes.json()) as TelemetryApiResponse;
      setMedicineTelemetry(medJson.last_sensors ?? null);
    } catch (err) {
      console.error("Telemetry fetch error", err);
    }
  };

  // Real-time polling
  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, [selectedBatchID, currentCage]);

  // Utility to convert raw values into percentages
  const getPercent = (value: any): number => {
    if (value == null) return 0;
    return Math.min(100, Math.max(0, Number(value) * 10)); // scale sensor value
  };

  const feedPercent = getPercent(feedingTelemetry?.[feederSensorKey]);
  const waterPercent = getPercent(wateringTelemetry?.[sensorKey]);
  const medPercent = getPercent(medicineTelemetry?.[sensorKey]);

  return (
    <div className="p-6 bg-white rounded-xl shadow space-y-6">

      <h1 className="text-xl font-semibold">Cage Status Report</h1>

      {/* Batch selector */}
      <div>
        <label className="block mb-2 font-medium">Batch No</label>
        <select
          value={selectedBatchID ?? ""}
          onChange={(e) => {
            const id = Number(e.target.value);
            const batch = activeBatches.find((b) => b.batchID === id);
            setSelectedBatchID(id);
            setCurrentCage(batch?.cageNum ?? 1);
          }}
          className="w-full p-2 border rounded"
        >
          <option value="">Select batch</option>
          {activeBatches.map((b) => (
            <option key={b.batchID} value={b.batchID}>
              {b.batchName}
            </option>
          ))}
        </select>

        {batchError && (
          <p className="text-red-600 mt-1 text-sm">{batchError}</p>
        )}
      </div>

      <p className="text-gray-600">
        Showing cage <span className="font-semibold">{currentCage}</span>
      </p>

      {/* ------------------ FEED CARD ------------------ */}
      <div className="p-4 bg-green-50 rounded-xl shadow-sm">
        <h2 className="font-semibold text-green-800 mb-1">Feed Level</h2>

        <div className="w-full h-4 bg-green-200 rounded overflow-hidden">
          <div
            className="h-full bg-green-600 transition-all duration-700"
            style={{ width: `${feedPercent}%` }}
          />
        </div>

        <p className="mt-1 text-sm text-green-700">
          {feedingTelemetry?.[feederSensorKey] ?? "No data"} (raw)
        </p>
      </div>

      {/* ------------------ WATER CARD ------------------ */}
      <div className="p-4 bg-blue-50 rounded-xl shadow-sm">
        <h2 className="font-semibold text-blue-800 mb-1">Water Level</h2>

        <div className="w-full h-4 bg-blue-200 rounded overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-700"
            style={{ width: `${waterPercent}%` }}
          />
        </div>

        <p className="mt-1 text-sm text-blue-700">
          {wateringTelemetry?.[sensorKey] ?? "No data"} (raw)
        </p>
      </div>

      {/* ------------------ MEDICINE CARD ------------------ */}
      <div className="p-4 bg-purple-50 rounded-xl shadow-sm">
        <h2 className="font-semibold text-purple-800 mb-1">Medicine Level</h2>

        <div className="w-full h-4 bg-purple-200 rounded overflow-hidden">
          <div
            className="h-full bg-purple-600 transition-all duration-700"
            style={{ width: `${medPercent}%` }}
          />
        </div>

        <p className="mt-1 text-sm text-purple-700">
          {medicineTelemetry?.[sensorKey] ?? "No data"} (raw)
        </p>
      </div>
    </div>
  );
};

export default CageStatusReport;
