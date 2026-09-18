import React from 'react';
import { 
  Play, 
  Pause, 
  FastForward, 
  Sliders, 
  Radio, 
  Sparkles, 
  Flame, 
  Footprints, 
  AlertOctagon, 
  Moon
} from 'lucide-react';
import { useCampus } from '../../context/CampusContext';

export const SimulationControls: React.FC = () => {
  const { simulationStatus, togglePause, setSpeed, triggerScenario } = useCampus();

  const scenarios = [
    { id: 'normal', label: 'Normal Flow', icon: Radio },
    { id: 'lunch_rush', label: 'Lunch Rush', icon: Flame },
    { id: 'class_change', label: 'Class Change', icon: Footprints },
    { id: 'evacuation', label: 'Evacuation Drill', icon: AlertOctagon },
    { id: 'night_study', label: 'Late Night Study', icon: Moon }
  ];

  return (
    <div className="bg-[#0A0F1D]/90 backdrop-blur-sm border-b border-[#1E293B] py-2 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Engine Status & Play/Pause & Speed */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-slate-300">IoT Engine:</span>
            <span className="font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded text-[10px]">
              Tick #{simulationStatus.tickCount}
            </span>
          </div>

          <button
            onClick={togglePause}
            className={`btn-tactile flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold shadow-sm transition-all ${
              simulationStatus.isPaused
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600/30'
                : 'bg-amber-600/20 text-amber-400 border border-amber-500/40 hover:bg-amber-600/30'
            }`}
          >
            {simulationStatus.isPaused ? (
              <>
                <Play className="w-3 h-3 text-emerald-400" />
                <span>Resume Ticker</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 text-amber-400" />
                <span>Pause Ticker</span>
              </>
            )}
          </button>

          {/* Speed Selector with Smooth Highlight */}
          <div className="flex items-center bg-[#131B2E] rounded-xl p-1 border border-[#232E4A] shadow-inner">
            {[1, 2, 5].map((speed) => {
              const isSelected = 
                (speed === 1 && simulationStatus.intervalMs >= 2500) ||
                (speed === 2 && simulationStatus.intervalMs >= 1000 && simulationStatus.intervalMs < 2500) ||
                (speed === 5 && simulationStatus.intervalMs < 1000);

              return (
                <button
                  key={speed}
                  onClick={() => setSpeed(speed)}
                  className={`btn-tactile px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Quick Scenario Injections */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-medium text-[11px] hidden sm:flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Scenario Injection:</span>
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            {scenarios.map((sc) => {
              const Icon = sc.icon;
              const isActive = simulationStatus.scenario === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => triggerScenario(sc.id)}
                  className={`btn-tactile flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105 border border-blue-400/50'
                      : 'bg-[#131B2E] hover:bg-[#1A253E] text-slate-300 border border-[#232E4A]'
                  }`}
                >
                  <Icon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-blue-400'}`} />
                  <span>{sc.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
