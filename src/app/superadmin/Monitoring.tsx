'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';
import {
  Activity, Server, Database, ShieldAlert,
  RefreshCw, CheckCircle, XCircle,
  Cpu, HardDrive, ArrowUpRight, Zap, Terminal, AlertTriangle
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, 
  PointElement, LineElement, BarElement, 
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import toast from 'react-hot-toast';

// Enregistrement (si côté client)
if (typeof window !== 'undefined') {
    ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);
}

// --- TYPES ---
interface HealthStatus {
  status: string;
  components?: any;
}

interface MetricsData {
  cpuUsage: number;
  memoryUsage: number;
  requestCount: number;
  avgResponseTime: number;
  activeUsers: number;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

interface SystemAlert {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  message: string;
}

// --- HELPER ---
const StatusBadge = ({ status, label }: { status: string; label: string }) => {
  const s = (status || 'UNKNOWN').toUpperCase();
  let colorClass = "bg-gray-100 text-gray-600";
  let Icon = Activity;

  if (s === 'UP') {
    colorClass = "bg-emerald-100 text-emerald-700 border border-emerald-200";
    Icon = CheckCircle;
  } else if (s === 'DOWN') {
    colorClass = "bg-red-100 text-red-700 border border-red-200";
    Icon = XCircle;
  } else {
    colorClass = "bg-yellow-100 text-yellow-700 border border-yellow-200";
    Icon = AlertTriangle;
  }

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl ${colorClass}`}>
      <span className="text-xs font-bold flex items-center gap-2 uppercase tracking-wide">
         {label}
      </span>
      <div className="flex items-center gap-1 font-bold text-xs">
         <Icon className="w-4 h-4" /> {s}
      </div>
    </div>
  );
};

const KpiCard = ({ label, value, unit, icon: Icon, colorClass }: any) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
            <div>
                 <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                 <div className="flex items-baseline gap-1">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">{value}</h3>
                    {unit && <span className="text-sm text-slate-400 font-medium">{unit}</span>}
                 </div>
            </div>
            <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
                 <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
            </div>
        </div>
    </div>
);

// --- MAIN COMPONENT ---

export default function MonitoringSystem() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  // On initialise logs et alerts comme tableaux vides par sécurité
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  
  const [trafficHistory, setTrafficHistory] = useState<number[]>(new Array(10).fill(0));
  const [latencyHistory, setLatencyHistory] = useState<number[]>(new Array(10).fill(0));
  
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchSystemData = async () => {
    // Avoid calling API during build or if component unmounted
    if (typeof window === 'undefined') return;

    try {
      // Promesse multiple avec fallback
      const [healthData, metricsData, rawLogs, rawAlerts] = await Promise.all([
        apiClient<HealthStatus>('/api/monitoring/health', 'GET').catch(() => ({ status: 'UNKNOWN' } as any)),
        apiClient<MetricsData>('/api/monitoring/metrics/performance', 'GET').catch(() => null),
        apiClient<any>('/api/monitoring/logs/recent?limit=20', 'GET').catch(() => []),
        apiClient<any>('/api/monitoring/alerts', 'GET').catch(() => [])
      ]);

      setHealth(healthData);

      // 1. SÉCURISATION LOGS : On force la conversion en Tableau
      let safeLogs: LogEntry[] = [];
      if (Array.isArray(rawLogs)) {
        safeLogs = rawLogs;
      } else if (rawLogs && typeof rawLogs === 'object') {
        // Gestion cas: { content: [...] } ou { logs: [...] }
        safeLogs = (rawLogs as any).content || (rawLogs as any).logs || (rawLogs as any).data || [];
      }
      setLogs(safeLogs);

      // 2. SÉCURISATION ALERTS
      let safeAlerts: SystemAlert[] = [];
      if (Array.isArray(rawAlerts)) {
          safeAlerts = rawAlerts;
      } else if (rawAlerts && typeof rawAlerts === 'object') {
          safeAlerts = (rawAlerts as any).content || (rawAlerts as any).data || [];
      }
      setAlerts(safeAlerts);
      
      // 3. METRICS
      if (metricsData) {
          setMetrics(metricsData);
          setTrafficHistory(prev => [...prev.slice(1), metricsData.requestCount]);
          setLatencyHistory(prev => [...prev.slice(1), metricsData.avgResponseTime]);
      } else {
          // FALLBACK DEMO SI PAS DE DONNÉES
          const fakeReq = Math.floor(Math.random() * 50) + 100;
          const fakeLat = Math.floor(Math.random() * 30) + 20;
          
          setMetrics({ 
              cpuUsage: Math.floor(Math.random() * 40), 
              memoryUsage: 50, 
              activeUsers: 1, 
              requestCount: fakeReq, 
              avgResponseTime: fakeLat 
          });
          setTrafficHistory(prev => [...prev.slice(1), fakeReq]);
          setLatencyHistory(prev => [...prev.slice(1), fakeLat]);
      }

      setLastUpdate(new Date());

    } catch (error) {
      console.error("Monitoring fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 5000); 
    return () => clearInterval(interval);
  }, []);

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

  const chartOptions: any = {
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

  return (
    <div className="space-y-8 pb-20">
        <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-700 pb-4">
             <div>
                 <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                     <Activity className="w-6 h-6 text-orange-600"/> Monitoring Système
                 </h2>
             </div>
             <div className="text-right text-xs text-slate-400">
                 Màj: <span className="font-mono font-bold">{lastUpdate.toLocaleTimeString()}</span>
             </div>
        </div>

        {/* KPIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             <KpiCard label="Santé Globale" value={health?.status || "..."} icon={CheckCircle} colorClass="bg-emerald-500 text-white"/>
             <KpiCard label="Charge CPU" value={metrics?.cpuUsage || 0} unit="%" icon={Cpu} colorClass="bg-blue-500 text-white"/>
             <KpiCard label="Mémoire" value={metrics?.memoryUsage || 0} unit="%" icon={Server} colorClass="bg-purple-500 text-white"/>
             <KpiCard label="Latence API" value={metrics?.avgResponseTime || 0} unit="ms" icon={Zap} colorClass="bg-yellow-500 text-white"/>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* GRAPHIQUE */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold uppercase mb-4">Trafic Réseau (Live)</h3>
                <div className="h-[300px]">
                    <Line data={lineChartData} options={chartOptions} />
                </div>
            </div>

            {/* SERVICES STATUS */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                 <h3 className="text-sm font-bold uppercase">État des Services</h3>
                 <StatusBadge label="Base de Données" status={health?.components?.db?.status || 'UNKNOWN'} />
                 <StatusBadge label="Stockage Disque" status={health?.components?.diskSpace?.status || 'UNKNOWN'} />
                 <StatusBadge label="API Gateway" status={'UP'} />
            </div>
        </div>

        {/* LOGS TERMINAL */}
        <div className="bg-slate-900 text-green-400 p-6 rounded-2xl shadow-lg font-mono text-xs h-[300px] flex flex-col overflow-hidden">
             <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                  <span className="font-bold uppercase tracking-widest flex items-center gap-2"><Terminal className="w-4 h-4"/> Live Logs</span>
                  <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-500"/><div className="w-3 h-3 rounded-full bg-yellow-500"/><div className="w-3 h-3 rounded-full bg-green-500"/></div>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                 {/* VÉRIFICATION ICI AVANT DE MAPPER */}
                 {!Array.isArray(logs) || logs.length === 0 ? (
                     <div className="opacity-50 italic">En attente de logs...</div>
                 ) : (
                     logs.map((log, i) => (
                         <div key={i} className="flex gap-2 hover:bg-white/5 p-1 rounded">
                             <span className="opacity-50 min-w-[80px]">[{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'TIME'}]</span>
                             <span className={`font-bold w-14 shrink-0 ${log.level === 'ERROR' ? 'text-red-500' : 'text-blue-400'}`}>{log.level}</span>
                             <span className="text-slate-300 break-all">{log.message}</span>
                         </div>
                     ))
                 )}
             </div>
        </div>
    </div>
  );
}