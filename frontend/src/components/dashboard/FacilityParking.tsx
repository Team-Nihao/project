import React from 'react';
import { 
  Car, 
  Sparkles, 
  Zap, 
  AlertTriangle, 
  Clock, 
  Users, 
  CheckCircle2,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { useCampus } from '../../context/CampusContext';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';

export const FacilityParking: React.FC = () => {
  const { campusState, predictions } = useCampus();

  const rawAvail = campusState?.parking_available_spots || 0;
  const animatedAvail = useAnimatedNumber(rawAvail);

  if (!campusState) return null;

  return (
    <div className="fade-in-up space-y-6">
      {/* 1. PARKING LOTS SECTION */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-400" />
              <span>Campus Parking Management</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated sensor barrier counts, EV charging stations, and smart saturation alerts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs bg-[#131B2E] border border-[#232E4A] px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-sm">
              <span className="text-slate-400">Total Open Bays:</span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                {animatedAvail} / {campusState.parking_total_spots}
              </span>
            </div>
          </div>
        </div>

        {/* Parking Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {campusState.parking_lots.map((lot) => {
            const occPct = Math.round((lot.current_occupied / lot.total_capacity) * 100);
            const isWarning = occPct >= 90;
            const availableSpots = Math.max(0, lot.total_capacity - lot.current_occupied);

            const pred = predictions?.parking_forecasts.find((p) => p.lot_id === lot.id);

            return (
              <div
                key={lot.id}
                className={`card-interactive p-4 rounded-2xl bg-[#131B2E] border flex flex-col justify-between ${
                  isWarning
                    ? 'border-rose-500/60 shadow-lg shadow-rose-500/10'
                    : 'border-[#232E4A]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base">{lot.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{lot.location}</p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize flex items-center gap-1.5 ${
                        isWarning
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 badge-pulse'
                          : occPct >= 75
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {isWarning ? 'Near Full' : lot.status}
                    </span>
                  </div>

                  {/* 90% Alert Banner with Pulse */}
                  {isWarning && (
                    <div className="mt-3 p-2 rounded-xl bg-rose-950/50 border border-rose-800/50 flex items-center gap-2 text-xs text-rose-300 badge-pulse">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>&gt;90% Capacity! Diverting new arrivals to UniPolis Event Deck (P4).</span>
                    </div>
                  )}

                  {/* Occupancy Gauge */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>
                        Occupied: <strong className="text-slate-100 font-mono">{lot.current_occupied}</strong> / {lot.total_capacity}
                      </span>
                      <span className={`font-mono font-bold ${isWarning ? 'text-rose-400' : 'text-slate-300'}`}>
                        {occPct}%
                      </span>
                    </div>
                    <div className="w-full bg-[#0B0F19] h-2.5 rounded-full overflow-hidden border border-[#1E293B]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          occPct >= 90 ? 'bg-rose-500' : occPct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, occPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics Breakdown */}
                  <div className="mt-4 pt-3 border-t border-[#1E293B] grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#0B0F19] p-2.5 rounded-xl border border-[#1C253B]">
                      <span className="text-[10px] text-slate-500 block">Available Bays</span>
                      <span className="text-base font-bold text-emerald-400 font-mono">{availableSpots}</span>
                    </div>

                    <div className="bg-[#0B0F19] p-2.5 rounded-xl border border-[#1C253B]">
                      <span className="text-[10px] text-slate-500 block flex items-center gap-1">
                        <Zap className="w-3 h-3 text-cyan-400" /> EV Stations
                      </span>
                      <span className="text-xs font-bold text-cyan-400 font-mono">
                        {lot.ev_occupied} / {lot.ev_charging_spots} busy
                      </span>
                    </div>
                  </div>
                </div>

                {/* Predictive Callout */}
                {pred && pred.time_to_full_minutes !== null && (
                  <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      <span>Est. Full in:</span>
                    </span>
                    <span className="font-bold text-amber-300 font-mono">
                      {pred.time_to_full_minutes === 0 ? 'Full now' : `~${pred.time_to_full_minutes} mins`}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. FACILITIES SECTION */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Campus Key Facilities & Amenities</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live capacity monitoring for libraries, dining halls, athletic arenas, and fabrication labs.
            </p>
          </div>
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campusState.facilities.map((fac) => {
            const occPct = Math.round((fac.current_occupancy / fac.capacity) * 100);
            const isCrowded = occPct >= 80;

            const pred = predictions?.facility_forecasts.find((f) => f.facility_id === fac.id);

            return (
              <div
                key={fac.id}
                className="card-interactive p-5 rounded-2xl bg-[#131B2E] border border-[#232E4A] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-md border border-blue-500/20 font-bold">
                        {fac.type}
                      </span>
                      <h3 className="font-bold text-white text-lg mt-1.5">{fac.name}</h3>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                        isCrowded
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {fac.status}
                    </span>
                  </div>

                  {/* Hours */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{fac.operating_hours}</span>
                    </div>
                    <div className="text-amber-400/90 text-[11px] font-medium">
                      Peak: {fac.peak_hours}
                    </div>
                  </div>

                  {/* Occupancy Progress */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Live Usage: <strong className="text-white font-mono">{fac.current_occupancy}</strong> / {fac.capacity}</span>
                      <span className="font-mono font-bold text-slate-200">{occPct}%</span>
                    </div>
                    <div className="w-full bg-[#0B0F19] h-2.5 rounded-full overflow-hidden border border-[#1E293B]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          occPct > 80 ? 'bg-rose-500' : occPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${(fac.current_occupancy / fac.capacity) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* AI Demand Forecast Footer */}
                {pred && (
                  <div className="mt-4 pt-3 border-t border-[#1E293B] bg-slate-900/40 -mx-5 -mb-5 p-4 rounded-b-2xl">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400 font-semibold">1-Hour Forward Forecast:</span>
                      <span className="font-mono font-bold text-blue-400">
                        ~{pred.forecast_1h} ({Math.round((pred.forecast_1h / pred.capacity) * 100)}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 italic">
                      "{pred.recommendation}"
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
