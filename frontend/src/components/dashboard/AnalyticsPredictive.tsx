import React, { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Sparkles, 
  BrainCircuit, 
  AlertCircle, 
  Clock, 
  Building2, 
  Car, 
  ShieldCheck,
  CheckCircle,
  Lightbulb
} from 'lucide-react';
import { useCampus } from '../../context/CampusContext';

interface TrendData {
  hourlyTrends: {
    time: string;
    campus: number;
    library: number;
    canteen: number;
    sports: number;
    parking: number;
  }[];
  issueBreakdown: { category: string; count: number }[];
  buildingDistribution: {
    name: string;
    code: string;
    current_occupancy: number;
    total_capacity: number;
    occupancy_rate: number;
  }[];
}

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6'];

export const AnalyticsPredictive: React.FC = () => {
  const { predictions, campusState } = useCampus();
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:4000/api/analytics/trends')
      .then((res) => res.json())
      .then((data) => {
        setTrends(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching trends:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="fade-in-up space-y-6">
      {/* 1. PREDICTIVE DEMAND FORECAST HERO WIDGET */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#141D35] via-[#172545] to-[#121B31] border border-blue-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <BrainCircuit className="w-4 h-4" />
              </span>
              <span className="text-xs font-mono font-bold tracking-wider text-blue-400 uppercase">
                Machine-Assisted Decision Support
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1.5">
              Predictive Demand & Bottleneck Forecasting
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Time-series statistical models projecting facility saturation, parking fill rates, and crowd vectors for the next 1–2 hours.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Model Confidence: 89%</span>
            </span>
          </div>
        </div>

        {/* Forecast Cards Grid with Hover Lift */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {predictions?.facility_forecasts.slice(0, 3).map((f) => {
            const currentPct = Math.round((f.current_occupancy / f.capacity) * 100);
            const predPct = Math.round((f.forecast_1h / f.capacity) * 100);

            return (
              <div
                key={f.facility_id}
                className="card-interactive p-4 rounded-2xl bg-[#0E1526]/85 border border-[#232E4A] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-white text-sm">{f.facility_name}</h4>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        f.risk_level === 'high'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 badge-pulse'
                          : f.risk_level === 'moderate'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {f.risk_level} Risk
                    </span>
                  </div>

                  <div className="mt-3.5 flex items-baseline justify-between text-xs">
                    <span className="text-slate-400">Current Occupancy:</span>
                    <span className="font-mono font-bold text-white">{currentPct}% ({f.current_occupancy})</span>
                  </div>

                  <div className="mt-1.5 flex items-baseline justify-between text-xs">
                    <span className="text-blue-300 font-semibold">Predicted in +60m:</span>
                    <span className="font-mono font-bold text-blue-400 text-sm">~{predPct}% ({f.forecast_1h})</span>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Projected Peak: <strong className="text-slate-200">{f.predicted_peak_time}</strong></span>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-[#1C263D] text-[11px] text-slate-300 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="italic leading-snug">{f.recommendation}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Parking Time-To-Full Callouts */}
        {predictions && (
          <div className="mt-5 pt-4 border-t border-[#232E4A] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {predictions.parking_forecasts.map((p) => (
              <div
                key={p.lot_id}
                className="card-interactive p-3 rounded-xl bg-[#0B0F19]/60 border border-[#1E293B] text-xs flex items-center justify-between shadow-inner"
              >
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold">{p.lot_name.split(' ')[0]} Lot</span>
                  <span className="text-white font-bold">{p.current_occupied} / {p.total_capacity} spots</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Time to Full</span>
                  <span className={`font-mono font-bold ${p.time_to_full_minutes !== null && p.time_to_full_minutes < 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {p.time_to_full_minutes === null ? '> 2 hours' : p.time_to_full_minutes === 0 ? 'Full Now' : `~${p.time_to_full_minutes} min`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. HISTORICAL DIURNAL CHARTS (Animated On Load) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Occupancy Trends Over Day */}
        <div className="p-5 rounded-2xl bg-[#131B2E] border border-[#232E4A] flex flex-col justify-between shadow-md">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>Campus Occupancy Curves (24-Hour Diurnal Profile)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Hourly occupancy rates across the entire campus, library, food court, and parking infrastructure.
            </p>
          </div>

          <div className="h-64 w-full">
            {trends && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends.hourlyTrends}>
                  <defs>
                    <linearGradient id="colorCampus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLib" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCanteen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#232E4A', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area isAnimationActive={true} animationDuration={800} type="monotone" dataKey="campus" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorCampus)" name="Overall Campus %" />
                  <Area isAnimationActive={true} animationDuration={900} type="monotone" dataKey="library" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorLib)" name="Library %" />
                  <Area isAnimationActive={true} animationDuration={1000} type="monotone" dataKey="canteen" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorCanteen)" name="Canteen %" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Busiest Buildings */}
        <div className="p-5 rounded-2xl bg-[#131B2E] border border-[#232E4A] flex flex-col justify-between shadow-md">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Building Utilization Ranking</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live capacity utilization percentages ranked across academic and research blocks.
            </p>
          </div>

          <div className="h-64 w-full">
            {trends && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends.buildingDistribution.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis type="number" stroke="#64748B" fontSize={11} domain={[0, 100]} unit="%" />
                  <YAxis dataKey="code" type="category" stroke="#94A3B8" fontSize={11} width={50} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#232E4A', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(value: any, name: any, item: any) => [`${value}% (${item.payload.current_occupancy}/${item.payload.total_capacity})`, 'Utilization']}
                  />
                  <Bar isAnimationActive={true} animationDuration={800} dataKey="occupancy_rate" fill="#3B82F6" radius={[0, 6, 6, 0]} name="Occupancy Rate %">
                    {trends.buildingDistribution.slice(0, 6).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.occupancy_rate >= 80 ? '#F43F5E' : entry.occupancy_rate >= 60 ? '#F59E0B' : '#10B981'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 3. ISSUE CATEGORY BREAKDOWN & LIVE TELEMETRY LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Issue Breakdown Chart */}
        <div className="p-5 rounded-2xl bg-[#131B2E] border border-[#232E4A] flex flex-col justify-between shadow-md">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>Reported Issues by Category</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Distribution of maintenance, IT, safety, and plumbing tickets.
            </p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {trends && trends.issueBreakdown.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    isAnimationActive={true}
                    animationDuration={800}
                    data={trends.issueBreakdown}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={40}
                    paddingAngle={4}
                  >
                    {trends.issueBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#232E4A', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Live Multi-Source Data Fusion Summary */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#131B2E] border border-[#232E4A] flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Multi-Source Unified Data Fusion Layer</span>
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                Data Layer: 100% Synced
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Architecture pipeline unifying real-time IoT readings, timetable scheduling databases, facility access control, and crowd telemetry.
            </p>
          </div>

          {/* Fusion Pipeline Steps */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="card-interactive p-3.5 rounded-xl bg-[#0B0F19] border border-[#1E293B]">
              <span className="text-blue-400 font-bold block mb-1">1. IoT Telemetry</span>
              <p className="text-slate-400 text-[11px]">
                72 active sensors broadcasting occupancy, parking flux, and crowd density every 3 seconds.
              </p>
            </div>

            <div className="card-interactive p-3.5 rounded-xl bg-[#0B0F19] border border-[#1E293B]">
              <span className="text-emerald-400 font-bold block mb-1">2. Timetable System</span>
              <p className="text-slate-400 text-[11px]">
                Cross-referenced scheduled classes & lab reservations to identify true availability.
              </p>
            </div>

            <div className="card-interactive p-3.5 rounded-xl bg-[#0B0F19] border border-[#1E293B]">
              <span className="text-amber-400 font-bold block mb-1">3. Incident Tracker</span>
              <p className="text-slate-400 text-[11px]">
                Community and staff issue reports geo-pinned to venues to adjust operational readiness.
              </p>
            </div>

            <div className="card-interactive p-3.5 rounded-xl bg-[#0B0F19] border border-[#1E293B]">
              <span className="text-purple-400 font-bold block mb-1">4. Real-Time Decisions</span>
              <p className="text-slate-400 text-[11px]">
                Instant WebSocket broadcast to digital twin clients, signage, and facility dispatchers.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between text-xs text-slate-400">
            <span>Overall Campus Operational Vitality:</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">
              {campusState?.campus_vitality_score || 95} / 100 (Optimal Operations)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
