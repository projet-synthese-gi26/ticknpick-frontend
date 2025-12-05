'use client';

import React, { useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';

// Enregistrement uniquement dans ce composant client-only
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface ChartProps {
  trafficHistory: number[];
  latencyHistory: number[];
}

const SystemCharts = ({ trafficHistory, latencyHistory }: ChartProps) => {
  
  const lineChartData = {
    labels: Array(10).fill(''),
    datasets: [
      {
        label: 'Requêtes / min',
        data: trafficHistory,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y'
      },
      {
        label: 'Latence (ms)',
        data: latencyHistory,
        borderColor: '#3b82f6',
        borderDash: [5, 5],
        backgroundColor: 'transparent',
        tension: 0.4,
        pointRadius: 0,
        yAxisID: 'y1'
      }
    ]
  };

  const chartOptions: any = { // Use 'any' to bypass strict chart.js typings for now
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: { legend: { display: true } },
    scales: {
      x: { grid: { display: false } },
      y: { position: 'left', grid: { color: 'rgba(200,200,200,0.1)' }, min: 0 },
      y1: { position: 'right', grid: { display: false }, min: 0 }
    }
  };

  return <Line data={lineChartData} options={chartOptions} />;
};

export default SystemCharts;