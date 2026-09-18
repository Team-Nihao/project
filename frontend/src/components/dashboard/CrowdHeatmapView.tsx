import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Play, 
  Pause, 
  RotateCcw, 
  TrendingUp, 
  Flame, 
  Navigation,
  Info
} from 'lucide-react';
import { useCampus } from '../../context/CampusContext';
import { CrowdZone, CrowdLevel } from '../../types/campus';
import { TimeScrubSlider } from './TimeScrubSlider';

const TIME_STEPS = [
  { label: '08:00 AM', tag: 'Morning Arrivals', canteen: 35, lib: 25, tech: 60, quad: 40, sports: 10 },
  { label: '10:00 AM', tag: 'Morning Lecture Peak', canteen: 45, lib: 60, tech: 85, quad: 50, sports: 15 },
  { label: '12:30 PM', tag: 'Lunch Rush Peak', canteen: 96, lib: 55, tech: 70, quad: 85, sports: 20 },
  { label: '02:30 PM', tag: 'Afternoon Labs', canteen: 50, lib: 82, tech: 88, quad: 55, sports: 30 },
  { label: '05:00 PM', tag: 'Sports & Evening Shift', canteen: 65, lib: 75, tech: 45, quad: 70, sports: 92 },
  { label: '08:00 PM', tag: 'Late Study & Dining', canteen: 40, lib: 88, tech: 30, quad: 60, sports: 45 },
  { label: 'LIVE', tag: 'Real-Time Telemetry Stream', canteen: null, lib: null, tech: null, quad: null, sports: null }
];

export const CrowdHeatmapView: React.FC = () => {
  const { campusState } = useCampus();
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(6);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Auto-playback loop for time-scrubber demo
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setSelectedStepIndex((prev) => (prev + 1) % TIME_STEPS.length);
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  if (!campusState) return null;

  const currentStep = TIME_STEPS[selectedStepIndex];
  const isLive = selectedStepIndex === 6;

  // Calculate density for each zone based on scrubber or live
  const displayZones = campusState.crowd_zones.map((zone) => {
    if (isLive) {
      return zone;
    }

    let simulatedScore = zone.density_score;
    if (zone.id.includes('canteen') && currentStep.canteen !== null) {
      simulatedScore = currentStep.canteen;
    } else if (zone.id.includes('lib') && currentStep.lib !== null) {
      simulatedScore = currentStep.lib;
    } else if (zone.id.includes('tech') && currentStep.tech !== null) {
      simulatedScore = currentStep.tech;
    } else if (zone.id.includes('sports') && currentStep.sports !== null) {
      simulatedScore = currentStep.sports;
    } else if (zone.id.includes('quad') && currentStep.quad !== null) {
      simulatedScore = currentStep.quad;
    }

    let level: CrowdLevel = 'low';
    if (simulatedScore >= 80) level = 'critical';
    else if (simulatedScore >= 60) level = 'high';
    else if (simulatedScore >= 40) level = 'medium';

    return {
      ...zone,
      density_score: simulatedScore,
      density_level: level
    };
  });

  return (
    <div className="fade-in-up space-y-5">
      {/* Header and Controls */}
      <div className="bg-[#131B2E] p-5 rounded-2xl border border-[#232E4A] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <span>Crowd Density & Temporal Heatmap</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Zone-based density sensors tracking movement bottlenecks, dining surges, and study shifts over time.
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`btn-tactile flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all ${
              isPlaying
                ? 'bg-amber-600 text-white shadow-amber-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause Scrubber' : 'Auto Play Time'}</span>
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setSelectedStepIndex(6); // Reset to Live
            }}
            className="btn-tactile flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600/20 text-blue-300 border border-blue-500/40 hover:bg-blue-600/40 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Snap to LIVE</span>
          </button>
        </div>
      </div>

      {/* Time-Slider Scrubber Component with Tactile Animations */}
      <TimeScrubSlider
        steps={TIME_STEPS}
        selectedIndex={selectedStepIndex}
        onSelectIndex={(idx) => {
          setIsPlaying(false);
          setSelectedStepIndex(idx);
        }}
      />

      {/* Campus Zones Density Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayZones.map((zone) => {
          const score = zone.density_score;
          let levelColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
          let progressBg = 'bg-emerald-500';
          let isCritical = false;

          if (score >= 80) {
            levelColor = 'text-rose-400 border-rose-500/30 bg-rose-500/10';
            progressBg = 'bg-rose-500';
            isCritical = true;
          } else if (score >= 60) {
            levelColor = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
            progressBg = 'bg-amber-500';
          } else if (score >= 40) {
            levelColor = 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
            progressBg = 'bg-cyan-500';
          }

          return (
            <div
              key={zone.id}
              className={`card-interactive p-4 rounded-2xl bg-[#131B2E] border flex flex-col justify-between ${
                isCritical ? 'border-rose-500/40 shadow-lg shadow-rose-500/10' : 'border-[#232E4A]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
                      {zone.zone_type}
                    </span>
                    <h3 className="font-bold text-white text-base mt-0.5">{zone.name}</h3>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${levelColor} ${isCritical ? 'badge-pulse' : ''}`}>
                    {zone.density_level}
                  </span>
                </div>

                {/* Gauge Meter */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Density Index</span>
                    <span className="font-mono font-bold text-white">{score} / 100</span>
                  </div>
                  <div className="w-full bg-[#0B0F19] h-2.5 rounded-full overflow-hidden border border-[#1E293B]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${progressBg}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Actionable Advice */}
              <div className="mt-4 pt-3 border-t border-[#1E293B] text-[11px] text-slate-400">
                {score >= 80 && (
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 shrink-0" />
                    <span>Bottleneck: recommend perimeter detour.</span>
                  </span>
                )}
                {score >= 60 && score < 80 && (
                  <span className="text-amber-400 font-medium">Moderate flow: expect brief wait times.</span>
                )}
                {score < 60 && (
                  <span className="text-emerald-400">Optimal flow: clear walkway.</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
