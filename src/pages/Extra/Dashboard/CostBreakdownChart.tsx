import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface CostBreakdownPoint {
  name: string;
  value: number;
}

const COLORS = ["#3b82f6", "#10b981", "#f97316"]; // Blue, Green, Orange

const CostBreakdownChart = ({ data }: { data: CostBreakdownPoint[] }) => {
  const filteredData = data.filter((item) => item.value > 0);

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-100 h-148 flex flex-col items-center">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Cost Breakdown (Active Batches)
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            formatter={(value: number) => [
              new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: "PHP",
              }).format(value),
              "Cost",
            ]}
          />
          <Legend />
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
          >
            {filteredData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>


    </div>
  );
};

export default CostBreakdownChart;
