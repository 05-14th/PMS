import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface RevenueDataPoint {
  date: string;
  revenue: number;
}

const formatYAxis = (tickItem: number) => {
  if (tickItem >= 1000) {
    return `₱${(tickItem / 1000).toFixed(0)}k`;
  }
  return `₱${tickItem}`;
};

const RevenueChart = ({ data }: { data: RevenueDataPoint[] }) => {
  // Format date for display on the X-axis
  const formattedData = data.map((d) => ({
    ...d,
    // Extracts month and day, e.g., "Sep 10"
    formattedDate: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-100 h-80">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Revenue (Last 30 Days)
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formattedData}
          margin={{ top: 5, right: 20, left: -10, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="formattedDate"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxis}
          />
          <Tooltip
            formatter={(value: number) => [
              new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: "PHP",
              }).format(value),
              "Revenue",
            ]}
            labelStyle={{ color: "#333" }}
            itemStyle={{ color: "#3b82f6" }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
            name="Revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
