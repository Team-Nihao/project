import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Clock, History, Radio } from 'lucide-react';

export interface TimeStep {
  label: string;
  tag: string;
  canteen?: number | null;
  lib?: number | null;
  tech?: number | null;
  quad?: number | null;
  sports?: number | null;
}

interface TimeScrubSliderProps {
  steps: TimeStep[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export const TimeScrubSlider: React.FC<TimeScrubSliderProps> = ({
  steps,
  selectedIndex,
  onSelectIndex
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPct, setDragPct] = useState<number>(0);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);

  const stepCount = steps.length;
  const currentStep = steps[selectedIndex] || steps[0];
  const isLive = selectedIndex === stepCount - 1;

  // Resting percentage based on selected step index
  const restingPct = (selectedIndex / (stepCount - 1)) * 100;
  const currentPct = isDragging ? dragPct : restingPct;

  // Determine severity style for context label
  const getSeverityStyle = (tag: string, isLiveStep: boolean) => {
    if (isLiveStep) {
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/15 border-emerald-500/30'
      };
    }
    const lower = tag.toLowerCase();
    if (lower.includes('peak') || lower.includes('rush')) {
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500/15 border-amber-500/30'
      };
    }
    if (lower.includes('labs') || lower.includes('lecture')) {
      return {
        text: 'text-cyan-400',
        bg: 'bg-cyan-500/15 border-cyan-500/30'
      };
    }
    return {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/15 border-emerald-500/30'
    };
  };

  const severity = getSeverityStyle(currentStep.tag, isLive);

  // Compute percentage from mouse/touch event
  const getPercentageFromEvent = useCallback((clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const rawPct = (x / rect.width) * 100;
    return Math.max(0, Math.min(100, rawPct));
  }, []);

  // Compute nearest step index from percentage
  const getNearestIndexFromPct = useCallback((pct: number) => {
    const rawIndex = (pct / 100) * (stepCount - 1);
    return Math.max(0, Math.min(stepCount - 1, Math.round(rawIndex)));
  }, [stepCount]);

  // Track click handler (with ripple effect & smooth glide)
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Spawn ripple
    const rippleId = Date.now() + Math.random();
    setRipples((prev) => [...prev, { id: rippleId, x: clickX, y: clickY }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== rippleId));
    }, 550);

    const pct = getPercentageFromEvent(e.clientX);
    const nearest = getNearestIndexFromPct(pct);
    onSelectIndex(nearest);
  };

  // Pointer drag start
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const pct = getPercentageFromEvent(e.clientX);
    setDragPct(pct);

    const nearest = getNearestIndexFromPct(pct);
    if (nearest !== selectedIndex) {
      onSelectIndex(nearest);
    }
  };

  // Global move & up listeners during dragging
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const pct = getPercentageFromEvent(e.clientX);
      setDragPct(pct);
      const nearest = getNearestIndexFromPct(pct);
      if (nearest !== selectedIndex) {
        onSelectIndex(nearest);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const pct = getPercentageFromEvent(e.clientX);
      const nearest = getNearestIndexFromPct(pct);
      setIsDragging(false);
      onSelectIndex(nearest);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, getPercentageFromEvent, getNearestIndexFromPct, selectedIndex, onSelectIndex]);

  return (
    <div className="bg-[#11182B] p-6 rounded-2xl border border-[#232E4A] shadow-xl select-none transition-colors duration-200">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Left: Time Scrub Badge, Animated Time Readout, Animated Context Label */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-xs">
            <Clock className="w-4 h-4 text-blue-400 shrink-0" />
            <span>TIME SCRUB:</span>
          </div>

          {/* Animated Time Readout Box with Digit Flip & Border Flash */}
          <div
            key={`box-${currentStep.label}`}
            className="time-box-glow px-3 py-1 rounded-xl bg-blue-600/20 border border-blue-500/40 text-white font-mono font-bold text-sm shadow-md overflow-hidden"
          >
            <span key={currentStep.label} className="digit-slide-in inline-block">
              {currentStep.label}
            </span>
          </div>

          {/* Cross-fading Context Tag with Severity Colors */}
          <div
            className={`px-3 py-0.5 rounded-xl border text-xs font-semibold flex items-center transition-all duration-300 ${severity.bg} ${severity.text}`}
          >
            <span key={currentStep.tag} className="digit-slide-in inline-block">
              ({currentStep.tag})
            </span>
          </div>
        </div>

        {/* Right: Mode Readout (Historical Playback vs. Live IoT Stream) */}
        <div className="flex items-center gap-2 text-xs font-mono transition-opacity duration-300">
          {isLive ? (
            <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30 animate-in fade-in zoom-in-95 duration-200">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Streaming Live IoT</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400 bg-slate-900/60 px-3 py-1 rounded-xl border border-slate-800 transition-all">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Historical Simulation Playback</span>
            </div>
          )}
        </div>
      </div>

      {/* Horizontal Interactive Slider Track Container */}
      <div className="relative pt-3 pb-2">
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          className="relative h-2.5 bg-[#0B0F19] rounded-full cursor-pointer overflow-visible border border-[#1E293B] shadow-inner group"
        >
          {/* Click Ripple Effects */}
          {ripples.map((ripple) => (
            <span
              key={ripple.id}
              className="ripple-circle pointer-events-none absolute w-8 h-8 rounded-full bg-blue-400/40"
              style={{ left: `${ripple.x}px`, top: `${ripple.y}px` }}
            />
          ))}

          {/* Filled Progress Bar (Syncs with Handle) */}
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 pointer-events-none"
            style={{
              width: `${currentPct}%`,
              transition: isDragging
                ? 'none'
                : 'width 400ms cubic-bezier(0.22, 1, 0.36, 1)'
            }}
          >
            {/* Shimmer / Glow at leading edge */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_12px_#38BDF8] opacity-80"></div>
          </div>

          {/* Draggable Handle (Dot) */}
          <div
            onPointerDown={handlePointerDown}
            onMouseEnter={() => setIsHoveringHandle(true)}
            onMouseLeave={() => setIsHoveringHandle(false)}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing z-20 flex items-center justify-center select-none"
            style={{
              left: `${currentPct}%`,
              transition: isDragging
                ? 'none'
                : 'left 400ms cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Pulsing Outer Halo / Radar Ping on Hover */}
            {(isHoveringHandle || isDragging) && (
              <span className="absolute w-8 h-8 rounded-full bg-blue-500/25 animate-ping pointer-events-none" />
            )}

            {/* Glowing Accent Ring */}
            <div
              className={`w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg transition-transform duration-200 ${
                isDragging
                  ? 'scale-125 shadow-blue-500/60 ring-4 ring-blue-500/30'
                  : isHoveringHandle
                  ? 'scale-115 shadow-blue-500/50 ring-4 ring-blue-500/20'
                  : 'shadow-blue-500/40'
              }`}
            />
          </div>
        </div>

        {/* Step Markers Below Slider Track */}
        <div className="flex justify-between items-center text-[11px] font-mono mt-4 select-none px-1">
          {steps.map((step, idx) => {
            const isSelected = idx === selectedIndex;
            const isLiveMarker = idx === stepCount - 1;

            return (
              <button
                key={step.label}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectIndex(idx);
                }}
                className={`btn-tactile px-2.5 py-1 rounded-xl transition-all ${
                  isSelected
                    ? isLiveMarker
                      ? 'marker-active-pop font-extrabold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 shadow-md shadow-emerald-500/20 scale-105'
                      : 'marker-active-pop font-bold text-blue-400 bg-blue-600/20 border border-blue-500/40 shadow-md shadow-blue-500/20 scale-105'
                    : isLiveMarker
                    ? 'text-slate-400 hover:text-emerald-300 font-semibold opacity-75'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {step.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

