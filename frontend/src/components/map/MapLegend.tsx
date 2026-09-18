import React from 'react';
import { Layers, Activity, Users, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface MapLegendProps {
  activeLayer: 'availability' | 'crowd' | 'events_issues';
  onSelectLayer: (layer: 'availability' | 'crowd' | 'events_issues') => void;
  mapMode: 'aerial' | 'blueprint';
  onToggleMapMode: (mode: 'aerial' | 'blueprint') => void;
  isRadarActive: boolean;
  onToggleRadar: () => void;
}

export const MapLegend: React.FC<MapLegendProps> = ({ 
  activeLayer, 
  onSelectLayer,
  mapMode,
  onToggleMapMode,
  isRadarActive,
  onToggleRadar
}) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto max-w-[calc(100vw-4rem)]">
      {/* Top Controls Row: View Mode + Radar Scan Switch */}
      <div className="flex flex-wrap items-center gap-2">
        {/* View Mode Toggle: Aerial Masterplan vs Blueprint */}
        <div className={`backdrop-blur-md border rounded-xl p-1 shadow-xl flex items-center gap-1 transition-colors duration-200 ${
          isDarkMode ? 'bg-[#0E1628]/95 border-[#232E4A]' : 'bg-white/95 border-slate-300 shadow-md'
        }`}>
          <button
            onClick={() => onToggleMapMode('aerial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mapMode === 'aerial'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/40'
                : isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Switch to 3D Photorealistic Aerial Masterplan view"
          >
            <span>🛰️ 3D Aerial Masterplan</span>
          </button>

          <button
            onClick={() => onToggleMapMode('blueprint')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mapMode === 'blueprint'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/40'
                : isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Switch to Vector CAD Blueprint view"
          >
            <span>📐 Blueprint CAD</span>
          </button>
        </div>

        {/* Radar Holographic Scan Sweep Toggle (active in aerial mode) */}
        {mapMode === 'aerial' && (
          <button
            onClick={onToggleRadar}
            className={`backdrop-blur-md border px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xl flex items-center gap-2 transition-all btn-tactile ${
              isRadarActive
                ? isDarkMode
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-cyan-500/20'
                  : 'bg-cyan-50 text-cyan-700 border-cyan-300 shadow-cyan-500/10'
                : isDarkMode
                  ? 'bg-[#131B2E]/90 text-slate-400 border-[#232E4A] hover:text-slate-200'
                  : 'bg-white/95 text-slate-600 border-slate-300 hover:text-slate-900'
            }`}
            title="Toggle Live IoT Sonar Radar Sweep Scanner"
          >
            <span className={`w-2 h-2 rounded-full ${isRadarActive ? 'bg-cyan-400 animate-ping' : 'bg-slate-400'}`}></span>
            <span>{isRadarActive ? 'Radar Sweep: ON' : 'Radar: OFF'}</span>
          </button>
        )}
      </div>

      {/* Layer Toggle Switch */}
      <div className={`backdrop-blur-md border rounded-xl p-1.5 shadow-xl flex items-center gap-1 transition-colors duration-200 ${
        isDarkMode ? 'bg-[#131B2E]/90 border-[#232E4A]' : 'bg-white/95 border-slate-300 shadow-md'
      }`}>
        <button
          onClick={() => onSelectLayer('availability')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeLayer === 'availability'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Availability</span>
        </button>

        <button
          onClick={() => onSelectLayer('crowd')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeLayer === 'crowd'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Crowd Heatmap</span>
        </button>

        <button
          onClick={() => onSelectLayer('events_issues')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeLayer === 'events_issues'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Events & Issues</span>
        </button>
      </div>

      {/* Dynamic Key / Legend */}
      <div className={`backdrop-blur-md border rounded-xl px-3 py-2 text-xs shadow-lg flex items-center gap-4 transition-colors duration-200 ${
        isDarkMode ? 'bg-[#131B2E]/80 border-[#232E4A] text-slate-300' : 'bg-white/90 border-slate-300 text-slate-700 shadow-md'
      }`}>
        {activeLayer === 'availability' && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>&lt;60% Normal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>60-80% Busy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>&gt;80% Congested</span>
            </div>
          </>
        )}

        {activeLayer === 'crowd' && (
          <>
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Crowd Density:</span>
            <div className="flex items-center gap-1">
              <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Low</span>
              <div className="w-24 h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600"></div>
              <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Critical</span>
            </div>
          </>
        )}

        {activeLayer === 'events_issues' && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>Active Event</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>Open Issue</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

