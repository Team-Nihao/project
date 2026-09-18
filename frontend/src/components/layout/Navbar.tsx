import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Wifi, 
  WifiOff, 
  Bell, 
  Activity, 
  Clock, 
  Map, 
  DoorOpen, 
  Car, 
  Flame, 
  AlertTriangle, 
  BrainCircuit,
  X,
  MoreVertical,
  HelpCircle,
  Sun,
  Moon,
  Info,
  RotateCcw
} from 'lucide-react';
import { useCampus } from '../../context/CampusContext';
import { HelpModal } from './HelpModal';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  currentView: string;
  onSelectView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onSelectView }) => {
  const { campusState, isConnected, alerts, dismissAlert, refreshState } = useCampus();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);

  // Animated vitality score
  const targetVitality = campusState?.campus_vitality_score || 94;
  const animatedVitality = useAnimatedNumber(targetVitality, 400);

  // Digital clock update
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  // Click outside & Escape listeners for three-dot menu and alerts
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setIsAlertsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsAlertsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navItems = [
    { id: 'map', label: 'Campus Map', icon: Map },
    { id: 'rooms', label: 'Rooms & Labs', icon: DoorOpen },
    { id: 'facilities', label: 'Parking & Facilities', icon: Car },
    { id: 'crowd', label: 'Crowd Heatmap', icon: Flame },
    { id: 'events', label: 'Events & Issues', icon: AlertTriangle },
    { id: 'analytics', label: 'Predictive Analytics', icon: BrainCircuit }
  ];

  return (
    <>
      <header className="bg-[#0C1222]/90 backdrop-blur-md border-b border-[#1E293B] sticky top-0 z-40 transition-colors duration-200 shadow-lg">
        {/* Top Header Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/25 flex items-center justify-center transition-transform hover:scale-105">
              <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight leading-none">
                  LPU DIGITAL TWIN
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  LPU LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Lovely Professional University — Phagwara, Punjab</p>
            </div>
          </div>

          {/* Right Metrics & Three-Dot Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Real-time Clock */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131B2E] border border-[#232E4A] text-xs font-mono text-slate-300 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>{currentTime}</span>
            </div>

            {/* Operational Health Vitality Score */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131B2E] border border-[#232E4A] text-xs shadow-sm">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-slate-400">Vitality:</span>
              <span className="font-bold text-emerald-400 font-mono">{animatedVitality}%</span>
            </div>

            {/* WebSocket Telemetry Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131B2E] border border-[#232E4A] text-xs shadow-sm">
              {isConnected ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-400 font-semibold hidden sm:inline">IoT Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400 font-semibold hidden sm:inline">Offline</span>
                </>
              )}
            </div>

            {/* Alerts Bell Button & Dropdown */}
            <div className="relative" ref={alertsRef}>
              <button
                onClick={() => {
                  setIsAlertsOpen(!isAlertsOpen);
                  setIsMenuOpen(false);
                }}
                className="btn-tactile relative p-2 rounded-xl bg-[#131B2E] border border-[#232E4A] text-slate-300 hover:text-white hover:border-[#3B82F6]/50 shadow-sm transition-all"
                title="System Alerts"
              >
                <Bell className="w-4 h-4" />
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                    {alerts.length}
                  </span>
                )}
              </button>

              {isAlertsOpen && (
                <div className="modal-pop absolute right-0 mt-2 w-80 bg-[#111827]/95 backdrop-blur-xl border border-[#2A3756] rounded-2xl shadow-2xl p-3 z-50 text-xs text-slate-200">
                  <div className="flex items-center justify-between pb-2 border-b border-[#232E4A] mb-2">
                    <span className="font-bold text-white">Live System Alerts ({alerts.length})</span>
                    <button onClick={() => setIsAlertsOpen(false)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {alerts.length === 0 ? (
                    <p className="text-slate-500 py-3 text-center">No active capacity or priority alerts.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {alerts.map((a) => (
                        <div
                          key={a.id}
                          className={`p-2.5 rounded-xl border flex items-start justify-between gap-2 transition-all ${
                            a.type === 'critical'
                              ? 'bg-rose-950/40 border-rose-800/40 text-rose-200'
                              : 'bg-amber-950/40 border-amber-800/40 text-amber-200'
                          }`}
                        >
                          <div>
                            <p className="font-medium text-[11px] leading-tight">{a.message}</p>
                            <span className="text-[9px] opacity-75 font-mono mt-1 block">{a.timestamp}</span>
                          </div>
                          <button
                            onClick={() => dismissAlert(a.id)}
                            className="text-slate-400 hover:text-white shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick 1-Click Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="btn-tactile p-2 rounded-xl bg-[#131B2E] border border-[#232E4A] text-slate-300 hover:text-white hover:border-[#3B82F6]/50 shadow-sm transition-all"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            {/* THREE-DOT (⋮) MENU (Requirement 3) */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => {
                  setIsMenuOpen(!isMenuOpen);
                  setIsAlertsOpen(false);
                }}
                className={`btn-tactile p-2 rounded-xl border transition-all ${
                  isMenuOpen
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 shadow-md shadow-blue-500/20'
                    : 'bg-[#131B2E] border-[#232E4A] text-slate-300 hover:text-white hover:border-[#3B82F6]/50 shadow-sm'
                }`}
                title="More options & Help"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Popover Dropdown with Smooth Entrance */}
              {isMenuOpen && (
                <div className="modal-pop absolute right-0 mt-2 w-56 bg-[#111827]/95 backdrop-blur-xl border border-[#2A3756] rounded-2xl shadow-2xl p-1.5 z-50 text-xs">
                  <button
                    onClick={() => {
                      setIsHelpOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-blue-600/20 transition-all text-left font-medium"
                  >
                    <HelpCircle className="w-4 h-4 text-blue-400" />
                    <span>Help & System Guide</span>
                  </button>

                  <button
                    onClick={() => {
                      toggleTheme();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/60 transition-all text-left font-medium"
                  >
                    {isDarkMode ? (
                      <>
                        <Sun className="w-4 h-4 text-amber-400" />
                        <span>Toggle Theme (Light)</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4 text-indigo-400" />
                        <span>Toggle Theme (Dark)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      refreshState();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-slate-800/60 transition-all text-left font-medium"
                  >
                    <RotateCcw className="w-4 h-4 text-emerald-400" />
                    <span>Sync State from DB</span>
                  </button>

                  <div className="h-px bg-[#232E4A] my-1"></div>

                  <div className="px-3 py-1.5 text-[10px] text-slate-500 font-mono flex items-center justify-between">
                    <span>Twin Engine v2.0</span>
                    <span className="text-emerald-500 font-bold">● Active</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`btn-tactile flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131B2E]/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Shared Global Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
};
