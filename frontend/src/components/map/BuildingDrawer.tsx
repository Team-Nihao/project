import React, { useState } from 'react';
import { 
  X, 
  Users, 
  DoorOpen, 
  AlertTriangle, 
  Calendar, 
  Radio, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { FusedBuilding, Room } from '../../types/campus';
import { useCampus } from '../../context/CampusContext';

interface BuildingDrawerProps {
  building: FusedBuilding | null;
  onClose: () => void;
}

export const BuildingDrawer: React.FC<BuildingDrawerProps> = ({ building, onClose }) => {
  const { updateIssueStatus } = useCampus();
  const [activeTab, setActiveTab] = useState<'rooms' | 'facilities' | 'issues' | 'events'>('rooms');
  const [roomFilter, setRoomFilter] = useState<'all' | 'free' | 'occupied'>('all');

  if (!building) return null;

  const occupancyPct = Math.round((building.current_occupancy / building.total_capacity) * 100);
  const freeRooms = building.rooms.filter((r) => r.status === 'free');
  const filteredRooms = building.rooms.filter((r) => {
    if (roomFilter === 'free') return r.status === 'free';
    if (roomFilter === 'occupied') return r.status === 'occupied';
    return true;
  });

  return (
    <div 
      className="fixed inset-y-0 right-0 w-full max-w-lg bg-[#0E1526]/95 backdrop-blur-2xl border-l border-[#232E4A] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 transition-transform ease-out"
    >
      {/* Header */}
      <div className="p-5 border-b border-[#232E4A] flex items-start justify-between bg-gradient-to-b from-[#162038] to-transparent">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {building.code}
            </span>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              {building.type}
            </span>
            {building.critical_alert_count > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 badge-pulse">
                <ShieldAlert className="w-3.5 h-3.5" />
                {building.critical_alert_count} Alert{building.critical_alert_count > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-white leading-snug">{building.name}</h2>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{building.description}</p>
        </div>

        <button
          onClick={onClose}
          className="btn-tactile p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Metrics Bar */}
      <div className="px-5 py-3 bg-[#121A2D] border-b border-[#232E4A] grid grid-cols-3 gap-3 text-center">
        <div className="p-2.5 rounded-xl bg-[#0B0F19]/60 border border-[#1E293B]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Live Occupancy</div>
          <div className="text-base font-bold text-white flex items-center justify-center gap-1 font-mono">
            <span>{building.current_occupancy}</span>
            <span className="text-xs text-slate-500 font-normal">/ {building.total_capacity}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                occupancyPct > 80 ? 'bg-rose-500' : occupancyPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, occupancyPct)}%` }}
            />
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#0B0F19]/60 border border-[#1E293B]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Free Rooms</div>
          <div className="text-base font-bold text-emerald-400 flex items-center justify-center gap-1 font-mono">
            <span>{freeRooms.length}</span>
            <span className="text-xs text-slate-500 font-normal">/ {building.rooms.length}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Available Now</div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#0B0F19]/60 border border-[#1E293B]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Floors / Labs</div>
          <div className="text-base font-bold text-blue-400 font-mono">
            {building.floors} <span className="text-xs text-slate-400 font-normal">Floors</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">
            {building.rooms.filter((r) => r.type === 'lab').length} Active Labs
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#232E4A] bg-[#0E1526] px-5 gap-1">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`btn-tactile px-3 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'rooms'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <DoorOpen className="w-3.5 h-3.5" />
          <span>Rooms & Labs ({building.rooms.length})</span>
        </button>

        {building.facilities.length > 0 && (
          <button
            onClick={() => setActiveTab('facilities')}
            className={`btn-tactile px-3 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'facilities'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Facilities ({building.facilities.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('issues')}
          className={`btn-tactile px-3 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'issues'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Issues ({building.active_issues.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`btn-tactile px-3 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'events'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Events ({building.active_events.length})</span>
        </button>
      </div>

      {/* Tab Contents with Fade-In Transition */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {/* ROOMS TAB */}
        {activeTab === 'rooms' && (
          <div className="fade-in-up space-y-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 pb-1">
              {(['all', 'free', 'occupied'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setRoomFilter(mode)}
                  className={`btn-tactile px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                    roomFilter === mode
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 shadow-sm'
                      : 'bg-[#151D30] text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {mode === 'all' ? `All (${building.rooms.length})` : mode}
                </button>
              ))}
            </div>

            {filteredRooms.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No rooms match the selected filter.
              </div>
            ) : (
              filteredRooms.map((room) => {
                const roomOccPct = Math.round((room.current_occupancy / room.capacity) * 100);
                return (
                  <div
                    key={room.id}
                    className="card-interactive p-4 rounded-xl bg-[#131B2E] border border-[#232E4A]"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{room.name}</h4>
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                            Floor {room.floor}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 capitalize flex items-center gap-1.5">
                          <span>{room.type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span className="font-mono text-[11px] text-slate-500">{room.sensor_id}</span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize flex items-center gap-1.5 ${
                          room.status === 'free'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : room.status === 'occupied'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            room.status === 'free'
                              ? 'bg-emerald-400'
                              : room.status === 'occupied'
                              ? 'bg-rose-400 badge-pulse'
                              : 'bg-amber-400'
                          }`}
                        />
                        {room.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>
                          Live Occupancy: <strong className="text-white font-mono">{room.current_occupancy}</strong> / {room.capacity}
                        </span>
                        <span className="font-mono font-bold text-slate-300">{roomOccPct}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            roomOccPct > 80 ? 'bg-rose-500' : roomOccPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, roomOccPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Schedule & Availability */}
                    <div className="mt-3 pt-2.5 border-t border-[#1C263D] flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 truncate max-w-[260px]" title={room.next_class}>
                        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate text-slate-300">{room.next_class}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-slate-500 text-[10px] block">Next Available</span>
                        <span className="text-emerald-400 font-bold text-xs">{room.next_available_time}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* FACILITIES TAB */}
        {activeTab === 'facilities' && (
          <div className="fade-in-up space-y-3">
            {building.facilities.map((fac) => (
              <div
                key={fac.id}
                className="card-interactive p-4 rounded-xl bg-[#131B2E] border border-[#232E4A]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-base">{fac.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">Hours: {fac.operating_hours}</p>
                    <p className="text-xs text-amber-400 font-medium mt-0.5">Peak Window: {fac.peak_hours}</p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                      fac.status === 'open'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {fac.status}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>
                      Occupancy: <strong className="text-white font-mono">{fac.current_occupancy}</strong> / {fac.capacity}
                    </span>
                    <span className="font-mono font-bold text-slate-200">{Math.round((fac.current_occupancy / fac.capacity) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(fac.current_occupancy / fac.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ISSUES TAB */}
        {activeTab === 'issues' && (
          <div className="fade-in-up space-y-3">
            {building.active_issues.length === 0 ? (
              <div className="p-8 text-center bg-[#131B2E] rounded-xl border border-[#232E4A]">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                <h4 className="text-white font-semibold text-sm">No Active Issues</h4>
                <p className="text-xs text-slate-400 mt-1">
                  All systems and facilities in this building are operating smoothly.
                </p>
              </div>
            ) : (
              building.active_issues.map((iss) => (
                <div
                  key={iss.id}
                  className="card-interactive p-4 rounded-xl bg-[#131B2E] border border-[#232E4A]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            iss.priority === 'critical'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 badge-pulse'
                              : iss.priority === 'high'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                          }`}
                        >
                          {iss.priority}
                        </span>
                        <span className="text-xs text-slate-400 capitalize">{iss.category}</span>
                      </div>
                      <h4 className="font-bold text-white text-sm mt-1.5 leading-snug">{iss.title}</h4>
                      <p className="text-xs text-slate-300 mt-1">{iss.description}</p>
                      <div className="text-[11px] text-slate-500 mt-2 font-mono">
                        Reported by: {iss.reported_by} • {new Date(iss.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* Status update buttons */}
                  <div className="mt-3 pt-3 border-t border-[#1E293B] flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Status: <span className="text-white font-semibold capitalize">{iss.status}</span>
                    </span>
                    <div className="flex gap-2">
                      {iss.status === 'open' && (
                        <button
                          onClick={() => updateIssueStatus(iss.id, 'in-progress')}
                          className="btn-tactile px-3 py-1 text-xs rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 font-semibold"
                        >
                          Start Work
                        </button>
                      )}
                      {iss.status !== 'resolved' && (
                        <button
                          onClick={() => updateIssueStatus(iss.id, 'resolved')}
                          className="btn-tactile px-3 py-1 text-xs rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-semibold"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <div className="fade-in-up space-y-3">
            {building.active_events.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No events currently scheduled in this building.
              </div>
            ) : (
              building.active_events.map((evt) => (
                <div
                  key={evt.id}
                  className="card-interactive p-4 rounded-xl bg-[#131B2E] border border-[#232E4A]"
                >
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    {evt.category}
                  </span>
                  <h4 className="font-bold text-white text-base mt-2">{evt.title}</h4>
                  <p className="text-xs text-slate-300 mt-1">{evt.description}</p>

                  <div className="mt-3 pt-2.5 border-t border-[#1E293B] grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Organizer</span>
                      <span className="text-slate-200 font-medium">{evt.organizer}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Expected Crowd</span>
                      <span className="text-blue-400 font-bold font-mono">~{evt.expected_attendees} attendees</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
