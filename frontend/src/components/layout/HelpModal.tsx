import React, { useEffect } from 'react';
import { 
  X, 
  HelpCircle, 
  Map, 
  DoorOpen, 
  Car, 
  Flame, 
  AlertTriangle, 
  BrainCircuit, 
  Keyboard, 
  ShieldCheck,
  CheckCircle2,
  Sliders
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="modal-pop w-full max-w-2xl max-h-[88vh] bg-[#0E1628] border border-[#2A3756] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#141F36] to-[#0E1628] border-b border-[#232E4A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">LPU Campus Digital Twin — User & Demo Guide</h2>
              <p className="text-xs text-slate-400">Lovely Professional University (Phagwara, Punjab) 600-Acre Smart Campus Twin.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-tactile p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Section 1: Intro */}
          <div className="p-4 rounded-xl bg-[#131C30] border border-[#232E4A]">
            <h3 className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold mb-1">
              What is LPU Campus Digital Twin?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              The LPU Campus Digital Twin models the 600-acre township campus of Lovely Professional University in Phagwara, 
              Punjab. It replicates academic Blocks (Block 34 CSE, Block 32 Mechanical, Block 25 Pharmacy, Block 37 Central Library, 
              Block 13 DSW), Uni-Mall, Baldev Raj Mittal UniPolis, Shanti Devi Mittal Indoor Stadium, and Boys/Girls Hostels (BH-4 & GH-2) 
              with real-time simulated IoT telemetry, automated space reallocation, and predictive bottleneck prevention.
            </p>
          </div>

          {/* Section 2: Core Feature Guide */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Feature Tour & Navigation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Map */}
              <div className="p-3.5 rounded-xl bg-[#131C30]/70 border border-[#232E4A] hover:border-blue-500/40 transition-colors">
                <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
                  <Map className="w-4 h-4 text-blue-400" />
                  <span>Interactive LPU Campus Map</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Click any block or hostel on the map to open the slide-over inspector showing live classrooms, laboratories, and active maintenance tickets. Toggle Availability, Heatmap, and Incident layers.
                </p>
              </div>

              {/* Rooms */}
              <div className="p-3.5 rounded-xl bg-[#131C30]/70 border border-[#232E4A] hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
                  <DoorOpen className="w-4 h-4 text-emerald-400" />
                  <span>Classrooms & Labs</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Live occupancy across 40+ specialized labs and lecture halls in Blocks 34, 32, 25, 37, and 13. Click <strong>"Find Free Room Near Me"</strong> for an instant nearest-available study pod filter.
                </p>
              </div>

              {/* Parking */}
              <div className="p-3.5 rounded-xl bg-[#131C30]/70 border border-[#232E4A] hover:border-cyan-500/40 transition-colors">
                <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
                  <Car className="w-4 h-4 text-cyan-400" />
                  <span>Parking & Facilities</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Monitors Gate 1 (GT Road), Block 34 Engineering Bay, Uni-Mall Multi-Deck, and UniPolis lots with EV charging and automated &gt;90% diversion alerts.
                </p>
              </div>

              {/* Crowd */}
              <div className="p-3.5 rounded-xl bg-[#131C30]/70 border border-[#232E4A] hover:border-amber-500/40 transition-colors">
                <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Crowd Temporal Heatmap</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Use the time scrubber to replay pedestrian rush hours (morning rush, 12:30 PM lunch peak, evening sports) or click <strong>Auto Play Time</strong>.
                </p>
              </div>

              {/* Issues */}
              <div className="p-3.5 rounded-xl bg-[#131C30]/70 border border-[#232E4A] hover:border-rose-500/40 transition-colors">
                <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Incidents & Events</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Report issues via the modal. Drag or click status buttons on the Kanban board (Open $\rightarrow$ In-Progress $\rightarrow$ Resolved) to update the map live.
                </p>
              </div>

              {/* Predictive */}
              <div className="p-3.5 rounded-xl bg-[#131C30]/70 border border-[#232E4A] hover:border-purple-500/40 transition-colors">
                <div className="flex items-center gap-2 text-white font-semibold text-xs mb-1">
                  <BrainCircuit className="w-4 h-4 text-purple-400" />
                  <span>Predictive Analytics</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Calculates 1–2 hour forward facility saturation, projected peak arrival times, and parking time-to-full countdowns using statistical trend modeling.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Status Colors Legend */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Status Color Meaning
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#131C30] border border-emerald-500/30 flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
                <div>
                  <span className="text-xs font-bold text-emerald-400 block">Available / Optimal</span>
                  <span className="text-[10px] text-slate-400">&lt;60% load, free spaces available</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#131C30] border border-amber-500/30 flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></span>
                <div>
                  <span className="text-xs font-bold text-amber-400 block">Busy / Moderate</span>
                  <span className="text-[10px] text-slate-400">60%–80% load, filling up</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#131C30] border border-rose-500/30 flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50 animate-pulse"></span>
                <div>
                  <span className="text-xs font-bold text-rose-400 block">Congested / Alert</span>
                  <span className="text-[10px] text-slate-400">&gt;80% capacity or critical hazard</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Tips & Simulation Scenarios */}
          <div className="p-4 rounded-xl bg-[#131C30] border border-[#232E4A] flex items-start gap-3">
            <Sliders className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">Simulation Scenario Controls</h4>
              <p className="text-[11px] text-slate-300 mt-1">
                In the simulation toolbar at the top, click <strong>"Lunch Rush"</strong>, <strong>"Class Change"</strong>, or <strong>"Evacuation Drill"</strong> 
                to inject simulated anomalies and watch the digital twin react live in real time.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#0B101D] border-t border-[#232E4A] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-mono">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">Esc</kbd>
            <span>to close</span>
          </span>
          <button
            onClick={onClose}
            className="btn-tactile px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/20"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

