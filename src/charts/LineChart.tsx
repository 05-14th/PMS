// components/LineChart.tsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import './line-chart-config'; // Ensure Chart.js components are registered

interface LineChartProps {
  labels: string[];
  dataPoints: number[];
}

const LineChart: React.FC<LineChartProps> = ({ labels, dataPoints }) => {
  const data = {
    labels,
    datasets: [
      {
        label: 'Broiler Chicken',
        data: dataPoints,
        borderColor: 'rgba(75,192,192,1)',
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: true,
        text: 'Sales',
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default LineChart;
