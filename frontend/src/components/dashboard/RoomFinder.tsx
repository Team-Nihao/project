import React, { useState, useMemo } from 'react';
import { 
  Search, 
  DoorOpen, 
  Filter, 
  Clock, 
  MapPin, 
  Sparkles, 
  CheckCircle, 
  XCircle,
  Calendar,
  Compass,
  X
} from 'lucide-react';
import { useCampus } from '../../context/CampusContext';
import { Room } from '../../types/campus';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';

export const RoomFinder: React.FC = () => {
  const { campusState, selectBuilding } = useCampus();

  const [search, setSearch] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'free' | 'occupied' | 'scheduled'>('all');
  const [nearMeBuilding, setNearMeBuilding] = useState<string | null>(null);

  // Flatten all rooms across buildings with building details
  const allRooms: (Room & { building_name: string; building_code: string })[] = useMemo(() => {
    if (!campusState) return [];
    return campusState.buildings.flatMap((bldg) =>
      bldg.rooms.map((room) => ({
        ...room,
        building_name: bldg.name,
        building_code: bldg.code
      }))
    );
  }, [campusState]);

  // "Find Free Room Near Me" algorithm
  const handleFindNearMe = () => {
    const refBuildingId = selectedBuildingId !== 'all' ? selectedBuildingId : 'bldg-block-34';
    setNearMeBuilding(refBuildingId);
    setStatusFilter('free');
  };

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return allRooms.filter((room) => {
      if (selectedBuildingId !== 'all' && room.building_id !== selectedBuildingId) return false;
      if (nearMeBuilding && room.building_id !== nearMeBuilding) return false;
      if (selectedType !== 'all' && room.type !== selectedType) return false;
      if (statusFilter !== 'all' && room.status !== statusFilter) return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = room.name.toLowerCase().includes(query);
        const matchBldg = room.building_name.toLowerCase().includes(query) || room.building_code.toLowerCase().includes(query);
        const matchClass = room.next_class.toLowerCase().includes(query);
        if (!matchName && !matchBldg && !matchClass) return false;
      }

      return true;
    });
  }, [allRooms, selectedBuildingId, nearMeBuilding, selectedType, statusFilter, search]);

  const rawFreeCount = allRooms.filter((r) => r.status === 'free').length;
  const rawOccupiedCount = allRooms.filter((r) => r.status === 'occupied').length;

  const animatedFree = useAnimatedNumber(rawFreeCount);
  const animatedOccupied = useAnimatedNumber(rawOccupiedCount);

  return (
    <div className="fade-in-up space-y-4">
      {/* Header and Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#131B2E] p-5 rounded-2xl border border-[#232E4A] shadow-md">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-blue-400" />
            <span>Classroom & Lab Availability</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time live telemetry for classrooms, research labs, seminar halls, and study pods.
          </p>
        </div>

        {/* Quick Counts & Near Me Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-xs shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
            <span className="text-slate-400">Available:</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">{animatedFree}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-xs shadow-inner">
            <span className="w-2 h-2 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50"></span>
            <span className="text-slate-400">Occupied:</span>
            <span className="font-bold text-rose-400 font-mono text-sm">{animatedOccupied}</span>
          </div>

          <button
            onClick={handleFindNearMe}
            className={`btn-tactile flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all ${
              nearMeBuilding
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{nearMeBuilding ? 'Filtered Near CS Hall' : 'Find Free Room Near Me'}</span>
          </button>

          {nearMeBuilding && (
            <button
              onClick={() => {
                setNearMeBuilding(null);
                setStatusFilter('all');
              }}
              className="btn-tactile text-xs text-slate-400 hover:text-white px-2.5 py-2 rounded-xl bg-slate-800"
              title="Reset location filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room, course, code..."
            className="w-full pl-10 pr-8 py-2.5 bg-[#131B2E] border border-[#232E4A] rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Building Filter Dropdown */}
        <select
          value={selectedBuildingId}
          onChange={(e) => {
            setSelectedBuildingId(e.target.value);
            setNearMeBuilding(null);
          }}
          className="px-3.5 py-2.5 bg-[#131B2E] border border-[#232E4A] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 shadow-sm"
        >
          <option value="all">All Buildings ({campusState?.buildings.length})</option>
          {campusState?.buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.code})
            </option>
          ))}
        </select>

        {/* Room Type Dropdown */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3.5 py-2.5 bg-[#131B2E] border border-[#232E4A] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 shadow-sm"
        >
          <option value="all">All Room Types</option>
          <option value="classroom">Classroom</option>
          <option value="lab">Research Lab</option>
          <option value="seminar_hall">Seminar Hall</option>
          <option value="study_room">Study Pod / Commons</option>
        </select>

        {/* Status Pills */}
        <div className="flex bg-[#131B2E] p-1 rounded-xl border border-[#232E4A] text-xs shadow-sm">
          {(['all', 'free', 'occupied'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn-tactile flex-1 py-1.5 rounded-lg capitalize font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-102'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Rooms Grid with Micro-Interactions */}
      {filteredRooms.length === 0 ? (
        <div className="p-12 text-center bg-[#131B2E] rounded-2xl border border-[#232E4A] text-slate-400">
          <DoorOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-base font-medium text-slate-300">No rooms matched your criteria</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => {
            const occPct = Math.round((room.current_occupancy / room.capacity) * 100);

            return (
              <div
                key={room.id}
                className="card-interactive p-4 rounded-2xl bg-[#131B2E] border border-[#232E4A] flex flex-col justify-between group shadow-sm"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-blue-400">
                          {room.building_code}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs text-slate-400">Floor {room.floor}</span>
                      </div>
                      <h3 className="font-bold text-white text-base mt-0.5 group-hover:text-blue-300 transition-colors">
                        {room.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 capitalize">
                        {room.type.replace('_', ' ')}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize flex items-center gap-1.5 ${
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

                  {/* Occupancy Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Occupancy: <strong className="text-slate-100 font-mono">{room.current_occupancy}</strong> / {room.capacity}</span>
                      <span className="font-mono font-bold text-slate-300">{occPct}%</span>
                    </div>
                    <div className="w-full bg-[#0B0F19] h-2 rounded-full overflow-hidden border border-[#1E293B]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          occPct > 80 ? 'bg-rose-500' : occPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, occPct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Schedule & Next Available */}
                <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 truncate max-w-[170px]" title={room.next_class}>
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate text-slate-300">{room.next_class}</span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-500 block">Next Available</span>
                    <span className={`font-bold ${room.status === 'free' ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {room.next_available_time}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
