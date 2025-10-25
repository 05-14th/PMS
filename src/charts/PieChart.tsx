// components/PieChart.tsx
import React from 'react';
import { Pie } from 'react-chartjs-2';
import './pie-chart-config'; // Ensure chart.js components are registered

interface PieChartProps {
  labels: string[];
  dataPoints: number[];
  backgroundColors?: string[];
}

const PieChart: React.FC<PieChartProps> = ({ labels, dataPoints, backgroundColors }) => {
  const data = {
    labels,
    datasets: [
      {
        label: 'Pie Dataset',
        data: dataPoints,
        backgroundColor: backgroundColors ?? [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Pie Chart Example',
      },
    },
  };

  return <Pie data={data} options={options} />;
};

export default PieChart;
