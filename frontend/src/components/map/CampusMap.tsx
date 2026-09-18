import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  Navigation, 
  Calendar, 
  AlertTriangle, 
  Car, 
  Layers, 
  Sparkles,
  Zap,
  DoorOpen,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useCampus } from '../../context/CampusContext';
import { MapLegend } from './MapLegend';
import { FusedBuilding } from '../../types/campus';
import { useTheme } from '../../context/ThemeContext';

const getBuildingShortTitle = (bldg: FusedBuilding) => {
  if (bldg.code === 'BLK-34') return 'Block 34 (CSE)';
  if (bldg.code === 'BLK-32') return 'Block 32 (Mech)';
  if (bldg.code === 'BLK-25') return 'Block 25 (Pharma)';
  if (bldg.code === 'BLK-37') return 'Block 37 (Library)';
  if (bldg.code === 'UNIMALL') return 'Uni-Mall Hub';
  if (bldg.code === 'BLK-01') return 'Block 1 (Admin)';
  if (bldg.code === 'BLK-13') return 'Block 13 (DSW)';
  if (bldg.code === 'UNIPOLIS') return 'UniPolis Arena';
  if (bldg.code === 'BH-04') return 'Boys Hostel 4';
  if (bldg.code === 'GH-02') return 'Girls Hostel 2';
  if (bldg.code === 'SDM-IND') return 'SDM Stadium';
  if (bldg.code === 'UNI-HOSP') return 'Uni-Hospital';
  return bldg.name.length > 18 ? bldg.name.slice(0, 16) + '...' : bldg.name;
};

const getParkingShortTitle = (lotId: string, fallback: string) => {
  if (lotId === 'park-gate1') return 'Gate 1 (GT Rd)';
  if (lotId === 'park-block34') return 'Block 34 Deck';
  if (lotId === 'park-unipolis') return 'UniPolis Event';
  if (lotId === 'park-unimall') return 'Uni-Mall Multi';
  return fallback.split(' ')[0] + ' Lot';
};

const AERIAL_BUILDING_COORDS: Record<string, { x: number; y: number; label: string; zone: string }> = {
  'bldg-admin': { x: 500, y: 220, label: 'Senate House (Admin)', zone: 'Academic Core' },
  'bldg-block-37': { x: 450, y: 355, label: 'Central Library Rotunda', zone: 'Academic Core' },
  'bldg-block-34': { x: 335, y: 250, label: 'Block 34 (CSE & AI)', zone: 'Academic Core' },
  'bldg-block-32': { x: 355, y: 155, label: 'Block 32 (Mechanical)', zone: 'Academic Core' },
  'bldg-block-25': { x: 625, y: 200, label: 'Block 25 (Pharmacy)', zone: 'Academic Core' },
  'bldg-block-13': { x: 585, y: 325, label: 'Block 13 (DSW)', zone: 'Academic Core' },
  'bldg-unimall': { x: 645, y: 520, label: 'Uni-Mall Food Court', zone: 'Commercial Hub' },
  'bldg-unipolis': { x: 690, y: 370, label: 'UniPolis Mega Arena', zone: 'Events Precinct' },
  'bldg-sports': { x: 805, y: 265, label: 'SDM Sports & Aquatics', zone: 'Athletics Precinct' },
  'bldg-med': { x: 765, y: 515, label: 'Uni-Hospital (24/7)', zone: 'Medical Enclave' },
  'bldg-bh-4': { x: 185, y: 265, label: 'Boys Hostel 4 (BH-4)', zone: 'Residential Township' },
  'bldg-gh-2': { x: 195, y: 440, label: 'Girls Hostel 2 (GH-2)', zone: 'Residential Township' }
};

const AERIAL_PARKING_COORDS: Record<string, { x: number; y: number; label: string }> = {
  'park-gate1': { x: 495, y: 645, label: 'Gate 1 GT Road' },
  'park-block34': { x: 285, y: 315, label: 'Block 34 Deck' },
  'park-unimall': { x: 595, y: 575, label: 'Uni-Mall Multi' },
  'park-unipolis': { x: 835, y: 375, label: 'UniPolis Arena' }
};

const AERIAL_CROWD_COORDS: Record<string, { x: number; y: number; radius: number }> = {
  'zone-unimall': { x: 645, y: 520, radius: 65 },
  'zone-library': { x: 450, y: 355, radius: 60 },
  'zone-block34': { x: 335, y: 250, radius: 50 },
  'zone-unipolis': { x: 690, y: 370, radius: 70 }
};

export const CampusMap: React.FC = () => {
  const { 
    campusState, 
    activeLayer, 
    setActiveLayer, 
    selectedBuilding, 
    selectBuilding 
  } = useCampus();
  const { isDarkMode } = useTheme();

  const [mapMode, setMapMode] = useState<'aerial' | 'blueprint'>('aerial');
  const [isRadarActive, setIsRadarActive] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredBuilding, setHoveredBuilding] = useState<FusedBuilding | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  if (!campusState) {
    return (
      <div className={`w-full h-full flex items-center justify-center transition-colors duration-200 ${
        isDarkMode ? 'bg-[#0B0F19] text-slate-400' : 'bg-slate-100 text-slate-600'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Campus Digital Twin Topology...</span>
        </div>
      </div>
    );
  }

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof SVGElement && e.target.closest('.building-node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Track cursor position for floating tooltip
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }

    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, +(z + 0.2).toFixed(1)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.7, +(z - 0.2).toFixed(1)));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-[620px] lg:h-[680px] overflow-hidden rounded-2xl border shadow-2xl select-none transition-colors duration-300 ${
        isDarkMode ? 'bg-[#090D16] border-[#1E293B]' : 'bg-[#EAF0F8] border-slate-300'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsDragging(false);
        setHoveredBuilding(null);
      }}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Top Legend, Mode & Layer Switcher */}
      <MapLegend 
        activeLayer={activeLayer} 
        onSelectLayer={setActiveLayer} 
        mapMode={mapMode}
        onToggleMapMode={setMapMode}
        isRadarActive={isRadarActive}
        onToggleRadar={() => setIsRadarActive((prev) => !prev)}
      />

      {/* Floating Zoom & Control Toolbars */}
      <div className={`absolute top-4 right-4 z-20 flex flex-col gap-1.5 backdrop-blur-md border p-1.5 rounded-2xl shadow-xl transition-colors duration-200 ${
        isDarkMode ? 'bg-[#131B2E]/90 border-[#232E4A]' : 'bg-white/95 border-slate-300'
      }`}>
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className={`btn-tactile p-2 rounded-xl transition-colors ${
            isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800/80' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className={`btn-tactile p-2 rounded-xl transition-colors ${
            isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800/80' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className={`w-full h-px ${isDarkMode ? 'bg-[#232E4A]' : 'bg-slate-200'}`}></div>
        <button
          onClick={handleReset}
          title="Reset View"
          className={`btn-tactile p-2 rounded-xl transition-colors ${
            isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800/80' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Live Campus Telemetry Badge */}
      <div className={`absolute bottom-4 left-4 z-20 backdrop-blur-md border px-4 py-2 rounded-2xl text-xs shadow-xl flex items-center gap-3 transition-colors duration-200 ${
        isDarkMode ? 'bg-[#131B2E]/90 border-[#232E4A] text-slate-300' : 'bg-white/95 border-slate-300 text-slate-700'
      }`}>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>Twin Simulation Stream</span>
        </div>
        <span className={isDarkMode ? 'text-slate-600' : 'text-slate-300'}>|</span>
        <div>
          <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Campus Load: </span>
          <span className={`font-bold font-mono ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {campusState.total_campus_occupancy} / {campusState.total_campus_capacity}
          </span>
          <span className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'} text-[11px] ml-1 font-semibold`}>({campusState.overall_occupancy_percentage}%)</span>
        </div>
      </div>

      {/* INTERACTIVE HOVER PREVIEW CARD TOOLTIP (Requirement 1) */}
      {hoveredBuilding && (
        <div
          className={`modal-pop pointer-events-none absolute z-30 w-64 backdrop-blur-md border rounded-2xl p-3.5 shadow-2xl text-xs transition-colors duration-200 ${
            isDarkMode ? 'bg-[#111827]/95 border-blue-500/40 text-slate-200' : 'bg-white/95 border-blue-400 text-slate-800 shadow-blue-500/10'
          }`}
          style={{
            left: `${Math.min(mousePos.x + 16, (containerRef.current?.clientWidth || 800) - 275)}px`,
            top: `${Math.min(mousePos.y - 40, (containerRef.current?.clientHeight || 600) - 180)}px`,
            transition: 'left 80ms ease-out, top 80ms ease-out'
          }}
        >
          <div className="flex items-start justify-between mb-1.5">
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              isDarkMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}>
              {hoveredBuilding.code}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              hoveredBuilding.status === 'congested'
                ? isDarkMode ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' : 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse'
                : hoveredBuilding.status === 'busy'
                ? isDarkMode ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-600 border border-amber-200'
                : isDarkMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            }`}>
              {hoveredBuilding.status}
            </span>
          </div>

          <h4 className={`font-bold text-sm leading-snug ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{hoveredBuilding.name}</h4>
          <p className={`text-[11px] mt-1 line-clamp-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{hoveredBuilding.description}</p>

          <div className={`mt-3 pt-2.5 border-t space-y-1.5 ${isDarkMode ? 'border-[#232E4A]' : 'border-slate-200'}`}>
            <div className="flex justify-between text-[11px]">
              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Live Load:</span>
              <span className={`font-mono font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {hoveredBuilding.current_occupancy} / {hoveredBuilding.total_capacity} ({Math.round((hoveredBuilding.current_occupancy / hoveredBuilding.total_capacity) * 100)}%)
              </span>
            </div>

            <div className="flex justify-between text-[11px]">
              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Free Spaces:</span>
              <span className={`font-mono font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {hoveredBuilding.rooms.filter((r) => r.status === 'free').length} / {hoveredBuilding.rooms.length} Available
              </span>
            </div>

            {hoveredBuilding.active_issues.length > 0 && (
              <div className={`flex items-center gap-1 text-[11px] font-semibold mt-1 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{hoveredBuilding.active_issues.length} active ticket(s)</span>
              </div>
            )}
          </div>

          <div className={`mt-2 text-[10px] font-semibold flex items-center gap-1 justify-end ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            <span>Click to inspect details</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* Campus Map SVG Canvas */}
      <svg
        viewBox="0 0 1000 720"
        className="w-full h-full transition-transform duration-100 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '50% 50%'
        }}
      >
        <defs>
          {/* Subtle Grid Pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isDarkMode ? '#141E34' : '#CBD5E1'} strokeWidth="0.8" strokeDasharray="3,3" />
          </pattern>

          {/* Glowing Gradients for Crowd Density */}
          <radialGradient id="heat-critical" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FB923C" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="heat-high" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.75" />
            <stop offset="60%" stopColor="#FBBF24" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="heat-medium" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.65" />
            <stop offset="70%" stopColor="#3B82F6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="heat-low" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.5" />
            <stop offset="80%" stopColor="#10B981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>

          {/* Building Shadow Filter */}
          <filter id="bldg-shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor={isDarkMode ? '#000000' : '#64748B'} floodOpacity={isDarkMode ? 0.65 : 0.2} />
          </filter>

          {/* Holographic Radar Scanner Gradient */}
          <radialGradient id="radar-cone" cx="500" cy="360" r="390" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* VIEW MODE 1: AERIAL PHOTOREALISTIC MASTERPLAN */}
        {mapMode === 'aerial' && (
          <g className="aerial-mode-canvas">
            {/* 1. Base Aerial Campus Masterplan Image */}
            <image
              href="/campus-aerial-map.jpg"
              x="0"
              y="0"
              width="1000"
              height="720"
              preserveAspectRatio="none"
              className="select-none"
            />

            {/* Subtle cyber tint in dark mode */}
            {isDarkMode && (
              <rect width="1000" height="720" fill="#090D16" opacity="0.18" pointerEvents="none" />
            )}

            {/* Tactical Grid Overlay */}
            <rect width="1000" height="720" fill="url(#grid)" opacity="0.22" pointerEvents="none" />

            {/* Perimeter Sector Callouts */}
            <g opacity="0.85" pointerEvents="none">
              <text x="500" y="28" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="800" letterSpacing="3" filter="url(#bldg-shadow)">
                ▲ NORTH LOGISTICS & NH-1 GT ROAD CORRIDOR ▲
              </text>
              <text x="500" y="708" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="800" letterSpacing="3" filter="url(#bldg-shadow)">
                ▼ MAIN CEREMONIAL GATEWAY & TRANSIT SPUR ▼
              </text>
              <text x="35" y="360" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="800" letterSpacing="2" transform="rotate(-90 35 360)" filter="url(#bldg-shadow)">
                WEST RESIDENTIAL TOWNSHIP
              </text>
              <text x="975" y="360" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="800" letterSpacing="2" transform="rotate(90 975 360)" filter="url(#bldg-shadow)">
                EAST ATHLETICS PRECINCT
              </text>
            </g>

            {/* Radar Scan Sweep Beam */}
            {isRadarActive && (
              <g pointerEvents="none">
                <circle cx="500" cy="360" r="140" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="5,6" opacity="0.4" />
                <circle cx="500" cy="360" r="270" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="5,6" opacity="0.3" />
                <circle cx="500" cy="360" r="400" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="5,6" opacity="0.2" />

                <g className="radar-sweep-beam">
                  <path d="M 500 360 L 500 0 A 400 400 0 0 1 782 85 Z" fill="url(#radar-cone)" opacity="0.7" />
                </g>
              </g>
            )}

            {/* Crowd Heatmap in Aerial Mode */}
            {activeLayer === 'crowd' && (
              <g className="transition-opacity duration-500 pointer-events-none">
                {campusState.crowd_zones.map((zone) => {
                  const coords = AERIAL_CROWD_COORDS[zone.id] || { x: zone.x, y: zone.y, radius: zone.radius };
                  let gradId = 'heat-low';
                  if (zone.density_score >= 80) gradId = 'heat-critical';
                  else if (zone.density_score >= 60) gradId = 'heat-high';
                  else if (zone.density_score >= 35) gradId = 'heat-medium';

                  return (
                    <g key={zone.id}>
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r={coords.radius * 1.35}
                        fill={`url(#${gradId})`}
                        opacity="0.8"
                        className="animate-pulse"
                      />
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r="14"
                        fill="#0B0F19"
                        stroke={zone.density_score >= 80 ? '#F43F5E' : '#F59E0B'}
                        strokeWidth="1.8"
                      />
                      <text
                        x={coords.x}
                        y={coords.y + 4}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="9.5"
                        fontWeight="900"
                        fontFamily="monospace"
                      >
                        {zone.density_score}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Parking Lots in Aerial Mode */}
            {campusState.parking_lots.map((lot) => {
              const coords = AERIAL_PARKING_COORDS[lot.id] || { x: lot.x, y: lot.y, label: lot.name };
              const occPct = Math.round((lot.current_occupied / lot.total_capacity) * 100);
              const isWarning = occPct >= 90;

              return (
                <g
                  key={lot.id}
                  transform={`translate(${coords.x}, ${coords.y})`}
                  className="cursor-pointer group"
                  onClick={() => selectBuilding(null)}
                >
                  <rect
                    x="-46"
                    y="-13"
                    width="92"
                    height="26"
                    rx="9"
                    fill={isDarkMode ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)'}
                    stroke={isWarning ? '#F43F5E' : '#3B82F6'}
                    strokeWidth="1.5"
                    filter="url(#bldg-shadow)"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill={isDarkMode ? '#F1F5F9' : '#0F172A'}
                    fontSize="9"
                    fontWeight="800"
                  >
                    🅿️ {coords.label.split(' ')[0]}: {occPct}%
                  </text>
                </g>
              );
            })}

            {/* Interactive Holographic Building Nodes in Aerial View */}
            {campusState.buildings.map((bldg) => {
              const coords = AERIAL_BUILDING_COORDS[bldg.id] || { x: bldg.x + bldg.width / 2, y: bldg.y + bldg.height / 2, label: bldg.code, zone: 'Campus' };
              const isSelected = selectedBuilding?.id === bldg.id;
              const isHovered = hoveredBuilding?.id === bldg.id;
              const occPct = Math.round((bldg.current_occupancy / bldg.total_capacity) * 100);

              let statusColor = '#10B981';
              if (bldg.status === 'congested' || occPct >= 80) statusColor = '#F43F5E';
              else if (bldg.status === 'busy' || occPct >= 60) statusColor = '#F59E0B';

              return (
                <g
                  key={bldg.id}
                  className="building-node cursor-pointer transition-all duration-200"
                  transform={`translate(${coords.x}, ${coords.y})`}
                  onClick={() => selectBuilding(bldg.id)}
                  onMouseEnter={() => setHoveredBuilding(bldg)}
                  onMouseLeave={() => setHoveredBuilding(null)}
                >
                  {/* Radar Ripple */}
                  <circle
                    r={isHovered || isSelected ? "24" : "18"}
                    fill={statusColor}
                    opacity="0.25"
                    className="animate-ping"
                  />

                  {/* Core Base Pin */}
                  <circle
                    r={isHovered || isSelected ? "16" : "13"}
                    fill={isDarkMode ? '#0E1628' : '#FFFFFF'}
                    stroke={statusColor}
                    strokeWidth={isSelected ? '3' : '2'}
                    filter="url(#bldg-shadow)"
                  />
                  <circle
                    r={isHovered || isSelected ? "6" : "4.5"}
                    fill={statusColor}
                  />

                  {/* Holographic Floating Code Badge */}
                  <g transform={`translate(0, ${isHovered || isSelected ? "-24" : "-20"})`}>
                    <rect
                      x={-(bldg.code.length * 4.5 + 24)}
                      y="-11"
                      width={bldg.code.length * 9 + 48}
                      height="22"
                      rx="11"
                      fill={isSelected ? '#2563EB' : isHovered ? (isDarkMode ? '#1E293B' : '#FFFFFF') : (isDarkMode ? 'rgba(14, 22, 40, 0.92)' : 'rgba(255, 255, 255, 0.95)')}
                      stroke={isSelected ? '#60A5FA' : statusColor}
                      strokeWidth="1.5"
                      filter="url(#bldg-shadow)"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill={isSelected ? '#FFFFFF' : isDarkMode ? '#F8FAFC' : '#0F172A'}
                      fontSize="9.5"
                      fontWeight="800"
                      fontFamily="monospace"
                    >
                      {bldg.code} • {occPct}%
                    </text>
                  </g>

                  {/* Critical Issue Ping */}
                  {bldg.critical_alert_count > 0 && (
                    <g transform="translate(14, -14)">
                      <circle r="6" fill="#F43F5E" className="animate-ping" />
                      <circle r="6" fill="#F43F5E" />
                      <text textAnchor="middle" y="2.5" fill="#FFFFFF" fontSize="7" fontWeight="900">!</text>
                    </g>
                  )}

                  {/* Event Star */}
                  {bldg.active_events.length > 0 && bldg.critical_alert_count === 0 && (
                    <g transform="translate(14, -14)">
                      <circle r="6" fill="#8B5CF6" />
                      <text textAnchor="middle" y="2.5" fill="#FFFFFF" fontSize="6.5" fontWeight="700">★</text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* VIEW MODE 2: VECTOR BLUEPRINT CAD */}
        {mapMode === 'blueprint' && (
          <g className="blueprint-mode-canvas">
            {/* 1. Background Grid */}
            <rect width="1000" height="720" fill={isDarkMode ? '#090D16' : '#EEF2F6'} />
            <rect width="1000" height="720" fill="url(#grid)" opacity={isDarkMode ? 0.85 : 0.6} />

        {/* Highway & Perimeter Corridor Markers */}
        <text x="500" y="38" textAnchor="middle" fill="#64748B" fontSize="9" fontWeight="700" letterSpacing="2">
          ▲ NH-1 JALANDHAR - DELHI G.T. ROAD GATEWAY ▲
        </text>
        <text x="500" y="695" textAnchor="middle" fill="#64748B" fontSize="9" fontWeight="700" letterSpacing="2">
          ▼ CHIHERU CORRIDOR & RESIDENTIAL ATHLETIC PRECINCT ▼
        </text>

        {/* 2. Campus Green Lawns & Plazas */}
        <rect x="350" y="210" width="180" height="50" rx="16" fill={isDarkMode ? '#0B241C' : '#DCFCE7'} stroke={isDarkMode ? '#144133' : '#86EFAC'} strokeWidth="1.5" />
        <text x="440" y="240" textAnchor="middle" fill={isDarkMode ? '#34D399' : '#059669'} fontSize="9" opacity="0.8" fontWeight="600" letterSpacing="1">
          CENTRAL LAWN & AMPHITHEATRE
        </text>

        <rect x="540" y="210" width="160" height="50" rx="14" fill={isDarkMode ? '#0B241C' : '#DCFCE7'} stroke={isDarkMode ? '#144133' : '#86EFAC'} strokeWidth="1.5" />
        <text x="620" y="240" textAnchor="middle" fill={isDarkMode ? '#34D399' : '#059669'} fontSize="9" opacity="0.8" fontWeight="600" letterSpacing="1">
          PHARMA & BIO GREENS
        </text>

        {/* 3. Campus Pedestrian Spine and Arterials */}
        {/* Main West-East Spine */}
        <path d="M 80 240 L 920 240" stroke={isDarkMode ? '#19243C' : '#CBD5E1'} strokeWidth="22" strokeLinecap="round" />
        <path d="M 80 240 L 920 240" stroke={isDarkMode ? '#253659' : '#94A3B8'} strokeWidth="2" strokeDasharray="6,8" />

        {/* North-South Corridors */}
        <path d="M 250 100 L 250 640" stroke={isDarkMode ? '#19243C' : '#CBD5E1'} strokeWidth="16" strokeLinecap="round" />
        <path d="M 440 100 L 440 640" stroke={isDarkMode ? '#19243C' : '#CBD5E1'} strokeWidth="18" strokeLinecap="round" />
        <path d="M 625 100 L 625 640" stroke={isDarkMode ? '#19243C' : '#CBD5E1'} strokeWidth="16" strokeLinecap="round" />
        <path d="M 800 150 L 800 620" stroke={isDarkMode ? '#19243C' : '#CBD5E1'} strokeWidth="14" strokeLinecap="round" />

        {/* Connecting Curves */}
        <path d="M 250 400 Q 350 420 440 400" stroke={isDarkMode ? '#19243C' : '#CBD5E1'} strokeWidth="12" fill="none" />
        <path d="M 440 400 Q 530 420 625 400" stroke={isDarkMode ? '#19243C' : '#CBD5E1'} strokeWidth="12" fill="none" />

        {/* 4. Parking Lots */}
        {campusState.parking_lots.map((lot) => {
          const occPct = Math.round((lot.current_occupied / lot.total_capacity) * 100);
          const isWarning = occPct >= 90;

          return (
            <g
              key={lot.id}
              className="cursor-pointer transition-all duration-200 group"
              onClick={() => selectBuilding(null)}
            >
              {/* Parking Boundary */}
              <rect
                x={lot.x}
                y={lot.y}
                width="140"
                height="65"
                rx="10"
                fill={isDarkMode ? '#121A2C' : '#FFFFFF'}
                stroke={isWarning ? '#F43F5E' : isDarkMode ? '#2C3D66' : '#CBD5E1'}
                strokeWidth={isWarning ? '2' : '1.5'}
                strokeDasharray={isWarning ? '4,2' : undefined}
                className="transition-colors duration-200"
              />

              {/* Parking Header */}
              <Car className={`w-3.5 h-3.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} x={lot.x + 8} y={lot.y + 8} />
              <text x={lot.x + 26} y={lot.y + 19} fill={isDarkMode ? '#F1F5F9' : '#0F172A'} fontSize="9.5" fontWeight="700">
                {getParkingShortTitle(lot.id, lot.name)}
              </text>

              {/* Occupancy Indicator */}
              <text x={lot.x + 8} y={lot.y + 38} fill={isDarkMode ? '#94A3B8' : '#64748B'} fontSize="9">
                Bays: <tspan fill={isWarning ? '#F43F5E' : isDarkMode ? '#F1F5F9' : '#0F172A'} fontWeight="700">{lot.current_occupied}</tspan> / {lot.total_capacity}
              </text>

              {/* EV Charging Info */}
              <g transform={`translate(${lot.x + 8}, ${lot.y + 45})`}>
                <text x="0" y="10" fill={isDarkMode ? '#38BDF8' : '#0284C7'} fontSize="8.5" fontWeight="600">
                  ⚡ EV: {lot.ev_occupied}/{lot.ev_charging_spots}
                </text>
                <text x="75" y="10" fill={isWarning ? '#F43F5E' : isDarkMode ? '#10B981' : '#059669'} fontSize="9.5" fontWeight="800">
                  {occPct}%
                </text>
              </g>

              {/* Saturation badge if >90% */}
              {isWarning && (
                <circle cx={lot.x + 130} cy={lot.y + 12} r="5" fill="#F43F5E" className="animate-ping" />
              )}
            </g>
          );
        })}

        {/* 5. CROWD HEATMAP OVERLAY (Rendered when 'crowd' layer is active) */}
        {activeLayer === 'crowd' && (
          <g className="transition-opacity duration-500">
            {campusState.crowd_zones.map((zone) => {
              let gradId = 'heat-low';
              if (zone.density_score >= 80) gradId = 'heat-critical';
              else if (zone.density_score >= 60) gradId = 'heat-high';
              else if (zone.density_score >= 35) gradId = 'heat-medium';

              const dynamicRadius = zone.radius * (0.85 + (zone.density_score / 100) * 0.4);

              return (
                <g key={zone.id} className="pointer-events-none">
                  {/* Heat Blob */}
                  <circle
                    cx={zone.x}
                    cy={zone.y}
                    r={dynamicRadius}
                    fill={`url(#${gradId})`}
                    className="animate-pulse"
                  />
                  {/* Density Score Pin */}
                  <circle
                    cx={zone.x}
                    cy={zone.y}
                    r="14"
                    fill={isDarkMode ? '#0B0F19' : '#1E293B'}
                    stroke={zone.density_score >= 80 ? '#F43F5E' : '#F59E0B'}
                    strokeWidth="1.5"
                  />
                  <text
                    x={zone.x}
                    y={zone.y + 4}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="9.5"
                    fontWeight="800"
                    fontFamily="monospace"
                  >
                    {zone.density_score}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* 6. BUILDINGS (12 Nodes) */}
        {campusState.buildings.map((bldg) => {
          const isSelected = selectedBuilding?.id === bldg.id;
          const isHovered = hoveredBuilding?.id === bldg.id;
          const occPct = Math.round((bldg.current_occupancy / bldg.total_capacity) * 100);

          // Status colors (refined emerald, amber, rose)
          let statusColor = '#10B981'; // emerald
          if (bldg.status === 'congested' || occPct >= 80) {
            statusColor = '#F43F5E'; // rose
          } else if (bldg.status === 'busy' || occPct >= 60) {
            statusColor = '#F59E0B'; // amber
          }

          const freeRoomsCount = bldg.rooms.filter((r) => r.status === 'free').length;

          return (
            <g
              key={bldg.id}
              className="building-node cursor-pointer transition-all duration-200"
              onClick={() => selectBuilding(bldg.id)}
              onMouseEnter={() => setHoveredBuilding(bldg)}
              onMouseLeave={() => setHoveredBuilding(null)}
              filter="url(#bldg-shadow)"
            >
              {/* Building Base Card with Smooth Hover Glow */}
              <rect
                x={bldg.x}
                y={bldg.y}
                width={bldg.width}
                height={bldg.height}
                rx="12"
                fill={isSelected ? (isDarkMode ? '#1B2745' : '#DBEAFE') : isHovered ? (isDarkMode ? '#16233E' : '#EFF6FF') : (isDarkMode ? '#11192C' : '#FFFFFF')}
                stroke={isSelected ? '#3B82F6' : isHovered ? '#60A5FA' : isDarkMode ? '#232E4A' : '#CBD5E1'}
                strokeWidth={isSelected ? '2.5' : isHovered ? '2' : '1.5'}
                className="transition-all duration-200"
              />

              {/* Status Header Glow Bar */}
              <rect
                x={bldg.x + 2}
                y={bldg.y + 2}
                width={bldg.width - 4}
                height="4"
                rx="2"
                fill={statusColor}
                className="transition-colors duration-300"
              />

              {/* Code Pill Badge */}
              <rect
                x={bldg.x + 8}
                y={bldg.y + 12}
                width={bldg.code.length * 7 + 10}
                height="16"
                rx="4"
                fill={isDarkMode ? '#1E293B' : '#F1F5F9'}
                stroke={isDarkMode ? '#334155' : '#E2E8F0'}
                strokeWidth="1"
              />
              <text
                x={bldg.x + 13}
                y={bldg.y + 24}
                fill={isDarkMode ? '#60A5FA' : '#2563EB'}
                fontSize="9"
                fontWeight="700"
                fontFamily="monospace"
              >
                {bldg.code}
              </text>

              {/* Building Name */}
              <text
                x={bldg.x + 8}
                y={bldg.y + 44}
                fill={isDarkMode ? '#F8FAFC' : '#0F172A'}
                fontSize="11"
                fontWeight="700"
                className="select-none"
              >
                {getBuildingShortTitle(bldg)}
              </text>

              {/* Occupancy Rate Bar */}
              <g transform={`translate(${bldg.x + 8}, ${bldg.y + 54})`}>
                <rect width={bldg.width - 16} height="4" rx="2" fill={isDarkMode ? '#1E293B' : '#E2E8F0'} />
                <rect
                  width={Math.min(bldg.width - 16, ((bldg.width - 16) * occPct) / 100)}
                  height="4"
                  rx="2"
                  fill={statusColor}
                  className="transition-all duration-500"
                />
              </g>

              {/* Dynamic Bottom Info depending on Active Layer */}
              {activeLayer === 'availability' && (
                <g transform={`translate(${bldg.x + 8}, ${bldg.y + 74})`}>
                  <text fill={isDarkMode ? '#94A3B8' : '#64748B'} fontSize="9">
                    Occ: <tspan fill={isDarkMode ? '#F1F5F9' : '#0F172A'} fontWeight="700">{bldg.current_occupancy}</tspan> / {bldg.total_capacity}
                  </text>
                  <text x={bldg.width - 24} textAnchor="end" fill={isDarkMode ? '#10B981' : '#059669'} fontSize="9" fontWeight="700">
                    {freeRoomsCount} Free
                  </text>
                </g>
              )}

              {activeLayer === 'crowd' && (
                <g transform={`translate(${bldg.x + 8}, ${bldg.y + 74})`}>
                  <text fill={isDarkMode ? '#CBD5E1' : '#64748B'} fontSize="9">
                    Traffic: <tspan fill={statusColor} fontWeight="700" className="capitalize">{bldg.status}</tspan>
                  </text>
                  <text x={bldg.width - 24} textAnchor="end" fill={isDarkMode ? '#94A3B8' : '#64748B'} fontSize="9" fontWeight="600">
                    {occPct}% Cap
                  </text>
                </g>
              )}

              {activeLayer === 'events_issues' && (
                <g transform={`translate(${bldg.x + 8}, ${bldg.y + 74})`}>
                  <text fill={isDarkMode ? '#CBD5E1' : '#64748B'} fontSize="9">
                    {bldg.active_events.length > 0 ? (
                      <tspan fill={isDarkMode ? '#A855F7' : '#7C3AED'} fontWeight="600">📅 {bldg.active_events.length} Event{bldg.active_events.length > 1 ? 's' : ''}</tspan>
                    ) : (
                      <tspan fill={isDarkMode ? '#64748B' : '#94A3B8'}>No Events</tspan>
                    )}
                  </text>
                  <text x={bldg.width - 24} textAnchor="end" fontSize="9">
                    {bldg.active_issues.length > 0 ? (
                      <tspan fill="#F43F5E" fontWeight="700">⚠️ {bldg.active_issues.length}</tspan>
                    ) : (
                      <tspan fill={isDarkMode ? '#10B981' : '#059669'} fontWeight="600">✓ Clear</tspan>
                    )}
                  </text>
                </g>
              )}

              {/* Incident/Critical Issue Beacon Indicator */}
              {bldg.critical_alert_count > 0 && (
                <g transform={`translate(${bldg.x + bldg.width - 12}, ${bldg.y + 12})`}>
                  <circle r="7" fill="#F43F5E" className="animate-ping opacity-75" />
                  <circle r="7" fill="#F43F5E" />
                  <text textAnchor="middle" y="3" fill="#FFFFFF" fontSize="8" fontWeight="800">!</text>
                </g>
              )}

              {/* Event Star/Marker Indicator */}
              {bldg.active_events.length > 0 && bldg.critical_alert_count === 0 && (
                <g transform={`translate(${bldg.x + bldg.width - 12}, ${bldg.y + 12})`}>
                  <circle r="6" fill="#8B5CF6" />
                  <text textAnchor="middle" y="2.5" fill="#FFFFFF" fontSize="7" fontWeight="700">★</text>
                </g>
              )}
            </g>
          );
        })}
          </g>
        )}
      </svg>
    </div>
  );
};
