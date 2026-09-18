import React, { useState } from 'react';
import { CampusProvider, useCampus } from './context/CampusContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { SimulationControls } from './components/layout/SimulationControls';
import { CampusMap } from './components/map/CampusMap';
import { BuildingDrawer } from './components/map/BuildingDrawer';
import { RoomFinder } from './components/dashboard/RoomFinder';
import { FacilityParking } from './components/dashboard/FacilityParking';
import { CrowdHeatmapView } from './components/dashboard/CrowdHeatmapView';
import { EventsIssuesBoard } from './components/dashboard/EventsIssuesBoard';
import { AnalyticsPredictive } from './components/dashboard/AnalyticsPredictive';
import { ChatbotWidget } from './components/chat/ChatbotWidget';
import { useAnimatedNumber } from './hooks/useAnimatedNumber';
import { 
  Building2, 
  DoorOpen, 
  Car, 
  AlertTriangle, 
  Calendar, 
  ArrowUpRight,
  CheckCircle2,
  TrendingUp,
  Sparkles
} from 'lucide-react';

const MainDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('map');
  const { campusState, selectedBuilding, selectBuilding } = useCampus();

  // Animated Numbers for the KPI Ribbon
  const animOccupancy = useAnimatedNumber(campusState?.overall_occupancy_percentage || 0);
  const animCampusOcc = useAnimatedNumber(campusState?.total_campus_occupancy || 0);
  const animFreeRooms = useAnimatedNumber(campusState?.free_rooms_count || 0);
  const animParkingAvail = useAnimatedNumber(campusState?.parking_available_spots || 0);
  const animIssues = useAnimatedNumber(campusState?.open_issues_count || 0);
  const animEvents = useAnimatedNumber(campusState?.active_events_count || 0);

  if (!campusState) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-white">Booting Campus Digital Twin...</h2>
        <p className="text-xs text-slate-500 mt-1">Connecting to real-time IoT telemetry bus & database</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar with Three-Dot Help Menu */}
      <Navbar currentView={currentView} onSelectView={setCurrentView} />

      {/* Simulation Engine Controls Bar */}
      <SimulationControls />

      {/* Quick Global KPI Ribbon with Count-Up Numbers */}
      <section className="border-b border-[#1E293B] bg-[#0C1220]/60 py-3 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          {/* KPI 1: Overall Occupancy */}
          <div className="card-interactive p-3 rounded-2xl bg-[#131B2E] border border-[#232E4A] flex items-center justify-between shadow-sm">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Campus Load</span>
              <span className="text-base font-extrabold text-white font-mono">
                {animOccupancy}%
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono font-medium">
              {animCampusOcc} / {campusState.total_campus_capacity}
            </span>
          </div>

          {/* KPI 2: Free Classrooms */}
          <div className="card-interactive p-3 rounded-2xl bg-[#131B2E] border border-[#232E4A] flex items-center justify-between shadow-sm">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Free Rooms & Labs</span>
              <span className="text-base font-extrabold text-emerald-400 font-mono">
                {animFreeRooms}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono font-medium">
              / {campusState.total_rooms_count} Total
            </span>
          </div>

          {/* KPI 3: Available Parking */}
          <div className="card-interactive p-3 rounded-2xl bg-[#131B2E] border border-[#232E4A] flex items-center justify-between shadow-sm">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Parking Available</span>
              <span className={`text-base font-extrabold font-mono ${campusState.parking_available_spots < 40 ? 'text-rose-400' : 'text-blue-400'}`}>
                {animParkingAvail}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono font-medium">
              / {campusState.parking_total_spots} Spots
            </span>
          </div>

          {/* KPI 4: Active Incidents */}
          <div className="card-interactive p-3 rounded-2xl bg-[#131B2E] border border-[#232E4A] flex items-center justify-between shadow-sm">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Open Incidents</span>
              <span className={`text-base font-extrabold font-mono ${campusState.critical_issues_count > 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                {animIssues}
              </span>
            </div>
            <span className="text-xs text-rose-400 font-bold font-mono">
              {campusState.critical_issues_count} Critical
            </span>
          </div>

          {/* KPI 5: Events Today */}
          <div className="card-interactive col-span-2 sm:col-span-1 p-3 rounded-2xl bg-[#131B2E] border border-[#232E4A] flex items-center justify-between shadow-sm">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Scheduled Events</span>
              <span className="text-base font-extrabold text-purple-400 font-mono">
                {animEvents}
              </span>
            </div>
            <span className="text-xs text-purple-300 font-semibold">On Campus</span>
          </div>
        </div>
      </section>

      {/* Main Content Area with Smooth Fade Entrance */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* VIEW 1: CAMPUS MAP (Primary interactive view) */}
        {currentView === 'map' && (
          <div className="fade-in-up space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Interactive Digital Twin Campus Map</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hover over buildings for live preview cards. Click any building to inspect contained rooms, occupancy meters, schedules, and active incident tickets.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('rooms')}
                  className="btn-tactile text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 bg-[#131B2E] border border-[#232E4A] px-3.5 py-2 rounded-xl transition-all shadow-sm"
                >
                  <span>Browse Rooms</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentView('facilities')}
                  className="btn-tactile text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 bg-[#131B2E] border border-[#232E4A] px-3.5 py-2 rounded-xl transition-all shadow-sm"
                >
                  <span>Parking & Facilities</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive SVG Campus Map */}
            <CampusMap />

            {/* Quick Status Cards below map */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Highlight 1: Free Study & Lab Spaces */}
              <div className="card-interactive p-4 rounded-2xl bg-[#131B2E] border border-[#232E4A] shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <DoorOpen className="w-4 h-4 text-emerald-400" />
                    <span>Free Study & Lab Spaces</span>
                  </h3>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    {campusState.free_rooms_count} Available
                  </span>
                </div>
                <div className="space-y-2 mt-3 text-xs">
                  {campusState.buildings.flatMap((b) => b.rooms).filter((r) => r.status === 'free').slice(0, 3).map((r) => (
                    <div key={r.id} className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-center justify-between transition-colors hover:border-slate-700">
                      <div>
                        <span className="font-bold text-white">{r.name}</span>
                        <span className="text-[10px] text-slate-400 block capitalize">{r.type.replace('_', ' ')}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {r.next_available_time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Highlight 2: Parking Congestion Summary */}
              <div className="card-interactive p-4 rounded-2xl bg-[#131B2E] border border-[#232E4A] shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Car className="w-4 h-4 text-blue-400" />
                    <span>Parking Status Snapshot</span>
                  </h3>
                  <span className="text-xs font-mono text-blue-400 font-bold">
                    {campusState.parking_available_spots} Open Spots
                  </span>
                </div>
                <div className="space-y-2 mt-3 text-xs">
                  {campusState.parking_lots.map((p) => {
                    const occ = Math.round((p.current_occupied / p.total_capacity) * 100);
                    return (
                      <div key={p.id} className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-center justify-between transition-colors hover:border-slate-700">
                        <span className="font-bold text-white">{p.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-300 font-semibold">{p.current_occupied}/{p.total_capacity}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${occ >= 90 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 badge-pulse' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                            {occ}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Highlight 3: Priority Dispatch & Alerts */}
              <div className="card-interactive p-4 rounded-2xl bg-[#131B2E] border border-[#232E4A] shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Active Incident Dispatch</span>
                  </h3>
                  <button
                    onClick={() => setCurrentView('events')}
                    className="btn-tactile text-xs text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-2 mt-3 text-xs">
                  {campusState.issues.filter((i) => i.status !== 'resolved').slice(0, 3).map((iss) => (
                    <div key={iss.id} className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-center justify-between transition-colors hover:border-slate-700">
                      <div className="truncate max-w-[180px]">
                        <span className="font-bold text-white block truncate">{iss.title}</span>
                        <span className="text-[10px] text-slate-400 truncate block">{iss.location_name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 ${iss.priority === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 badge-pulse' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'}`}>
                        {iss.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: CLASSROOM & LAB AVAILABILITY */}
        {currentView === 'rooms' && <RoomFinder />}

        {/* VIEW 3: PARKING & FACILITIES */}
        {currentView === 'facilities' && <FacilityParking />}

        {/* VIEW 4: CROWD HEATMAP & TIME-SLIDER */}
        {currentView === 'crowd' && <CrowdHeatmapView />}

        {/* VIEW 5: EVENTS & REPORTED ISSUES */}
        {currentView === 'events' && <EventsIssuesBoard />}

        {/* VIEW 6: PREDICTIVE ANALYTICS */}
        {currentView === 'analytics' && <AnalyticsPredictive />}
      </main>

      {/* Building Slide-over Detail Panel */}
      <BuildingDrawer
        building={selectedBuilding}
        onClose={() => selectBuilding(null)}
      />

      {/* Floating LPU Campus Assistant Chatbot */}
      <ChatbotWidget />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <CampusProvider>
        <MainDashboard />
      </CampusProvider>
    </ThemeProvider>
  );
}
