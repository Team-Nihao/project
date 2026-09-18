import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  FusedCampusState, 
  FusedBuilding, 
  PredictionSummary, 
  TelemetryDelta, 
  IssueReport, 
  CampusEvent 
} from '../types/campus';

interface SimulationStatus {
  isPaused: boolean;
  intervalMs: number;
  scenario: string;
  tickCount: number;
}

interface CampusContextType {
  campusState: FusedCampusState | null;
  predictions: PredictionSummary | null;
  selectedBuilding: FusedBuilding | null;
  isConnected: boolean;
  activeLayer: 'availability' | 'crowd' | 'events_issues';
  simulationStatus: SimulationStatus;
  alerts: { id: string; message: string; type: 'warning' | 'critical' | 'info'; timestamp: string }[];
  selectBuilding: (id: string | null) => void;
  setActiveLayer: (layer: 'availability' | 'crowd' | 'events_issues') => void;
  reportIssue: (issue: {
    title: string;
    description: string;
    location_id: string;
    location_name: string;
    reported_by: string;
    category: string;
    priority: string;
  }) => Promise<boolean>;
  updateIssueStatus: (id: string, status: 'open' | 'in-progress' | 'resolved') => Promise<boolean>;
  togglePause: () => Promise<void>;
  setSpeed: (speed: number) => Promise<void>;
  triggerScenario: (scenario: string) => Promise<void>;
  dismissAlert: (id: string) => void;
  refreshState: () => Promise<void>;
}

const CampusContext = createContext<CampusContextType | undefined>(undefined);

export const CampusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [campusState, setCampusState] = useState<FusedCampusState | null>(null);
  const [predictions, setPredictions] = useState<PredictionSummary | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeLayer, setActiveLayer] = useState<'availability' | 'crowd' | 'events_issues'>('availability');
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>({
    isPaused: false,
    intervalMs: 3000,
    scenario: 'normal',
    tickCount: 0
  });
  const [alerts, setAlerts] = useState<{ id: string; message: string; type: 'warning' | 'critical' | 'info'; timestamp: string }[]>([]);

  // Fetch initial campus state
  const refreshState = useCallback(async () => {
    try {
      const [stateRes, predRes] = await Promise.all([
        fetch('http://localhost:4000/api/campus/state'),
        fetch('http://localhost:4000/api/analytics/predictions')
      ]);

      if (stateRes.ok) {
        const stateData: FusedCampusState = await stateRes.json();
        setCampusState(stateData);

        // Check for parking capacity alerts
        stateData.parking_lots.forEach((lot) => {
          if (lot.current_occupied / lot.total_capacity >= 0.9) {
            setAlerts((prev) => {
              const exists = prev.some((a) => a.id === `alert-park-${lot.id}`);
              if (!exists) {
                return [
                  ...prev,
                  {
                    id: `alert-park-${lot.id}`,
                    message: `⚠️ High Occupancy Alert: ${lot.name} is at ${Math.round((lot.current_occupied / lot.total_capacity) * 100)}% capacity!`,
                    type: 'warning',
                    timestamp: new Date().toLocaleTimeString()
                  }
                ];
              }
              return prev;
            });
          }
        });
      }

      if (predRes.ok) {
        const predData: PredictionSummary = await predRes.json();
        setPredictions(predData);
      }
    } catch (err) {
      console.error('Failed to fetch initial campus state:', err);
    }
  }, []);

  // Setup WebSocket connection
  useEffect(() => {
    refreshState();

    const socket: Socket = io('http://localhost:4000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('[WebSocket] Connected to Campus Twin live stream');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected from Campus Twin');
      setIsConnected(false);
    });

    socket.on('simulation:status', (status: SimulationStatus) => {
      setSimulationStatus(status);
    });

    // Handle high-speed real-time telemetry deltas
    socket.on('telemetry:delta', (delta: TelemetryDelta) => {
      setCampusState((prev) => {
        if (!prev) return prev;

        // 1. Update parking lots
        const updatedParking = prev.parking_lots.map((lot) => {
          const u = delta.parking.find((p) => p.id === lot.id);
          if (!u) return lot;
          return {
            ...lot,
            current_occupied: u.current_occupied,
            status: u.status,
            ev_occupied: u.ev_occupied
          };
        });

        // 2. Check for alerts on parking > 90%
        updatedParking.forEach((lot) => {
          if (lot.current_occupied / lot.total_capacity >= 0.9) {
            setAlerts((currentAlerts) => {
              const alertId = `alert-park-${lot.id}`;
              if (!currentAlerts.some((a) => a.id === alertId)) {
                return [
                  {
                    id: alertId,
                    message: `🚨 Parking Saturation: ${lot.name} is ${Math.round((lot.current_occupied / lot.total_capacity) * 100)}% full!`,
                    type: 'warning',
                    timestamp: new Date().toLocaleTimeString()
                  },
                  ...currentAlerts.slice(0, 4)
                ];
              }
              return currentAlerts;
            });
          }
        });

        // 3. Update facilities
        const updatedFacilities = prev.facilities.map((fac) => {
          const u = delta.facilities.find((f) => f.id === fac.id);
          if (!u) return fac;
          return {
            ...fac,
            current_occupancy: u.current_occupancy,
            status: u.status
          };
        });

        // 4. Update crowd zones
        const updatedCrowdZones = prev.crowd_zones.map((zone) => {
          const u = delta.crowd_zones.find((z) => z.id === zone.id);
          if (!u) return zone;
          return {
            ...zone,
            density_score: u.density_score,
            density_level: u.density_level
          };
        });

        // 5. Update rooms map
        const roomMap = new Map(delta.rooms.map((r) => [r.id, r]));

        // 6. Update buildings with new occupancies and updated rooms
        let newTotalCampusOcc = 0;
        let freeRoomCount = 0;

        const updatedBuildings = prev.buildings.map((bldg) => {
          const bldgUpdate = delta.buildings.find((b) => b.id === bldg.id);
          const updatedRooms = bldg.rooms.map((room) => {
            const rUpdate = roomMap.get(room.id);
            if (!rUpdate) {
              if (room.status === 'free') freeRoomCount++;
              return room;
            }
            if (rUpdate.status === 'free') freeRoomCount++;
            return {
              ...room,
              current_occupancy: rUpdate.current_occupancy,
              status: rUpdate.status,
              next_available_time: rUpdate.next_available_time
            };
          });

          const currentOcc = bldgUpdate ? bldgUpdate.current_occupancy : bldg.current_occupancy;
          const status = bldgUpdate ? bldgUpdate.status : bldg.status;

          newTotalCampusOcc += currentOcc;

          return {
            ...bldg,
            current_occupancy: currentOcc,
            status,
            rooms: updatedRooms
          };
        });

        let parkingAvail = 0;
        let parkingTotal = 0;
        updatedParking.forEach((p) => {
          parkingTotal += p.total_capacity;
          parkingAvail += Math.max(0, p.total_capacity - p.current_occupied);
        });

        return {
          ...prev,
          timestamp: delta.timestamp,
          total_campus_occupancy: newTotalCampusOcc,
          overall_occupancy_percentage: Math.round((newTotalCampusOcc / (prev.total_campus_capacity || 1)) * 100),
          free_rooms_count: freeRoomCount,
          parking_available_spots: parkingAvail,
          parking_total_spots: parkingTotal,
          buildings: updatedBuildings,
          parking_lots: updatedParking,
          facilities: updatedFacilities,
          crowd_zones: updatedCrowdZones
        };
      });

      setSimulationStatus((s) => ({
        ...s,
        tickCount: delta.simulation_stats.tick_count,
        scenario: delta.simulation_stats.scenario
      }));
    });

    // Handle new issue
    socket.on('issue:created', (newIssue: IssueReport) => {
      setCampusState((prev) => {
        if (!prev) return prev;
        const updatedIssues = [newIssue, ...prev.issues];
        const updatedBuildings = prev.buildings.map((b) => {
          if (b.id === newIssue.location_id) {
            return {
              ...b,
              active_issues: [newIssue, ...b.active_issues],
              critical_alert_count: (newIssue.priority === 'critical' || newIssue.priority === 'high') 
                ? b.critical_alert_count + 1 
                : b.critical_alert_count
            };
          }
          return b;
        });

        return {
          ...prev,
          issues: updatedIssues,
          open_issues_count: prev.open_issues_count + 1,
          critical_issues_count: (newIssue.priority === 'critical' || newIssue.priority === 'high')
            ? prev.critical_issues_count + 1
            : prev.critical_issues_count,
          buildings: updatedBuildings
        };
      });

      setAlerts((prev) => [
        {
          id: `alert-iss-${newIssue.id}`,
          message: `🚨 New Issue Reported: ${newIssue.title} (${newIssue.priority.toUpperCase()} priority at ${newIssue.location_name})`,
          type: newIssue.priority === 'critical' || newIssue.priority === 'high' ? 'critical' : 'info',
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 4)
      ]);
    });

    // Handle updated issue
    socket.on('issue:updated', (updated: IssueReport) => {
      setCampusState((prev) => {
        if (!prev) return prev;
        const newIssues = prev.issues.map((i) => (i.id === updated.id ? updated : i));
        const updatedBuildings = prev.buildings.map((b) => ({
          ...b,
          active_issues: b.active_issues.map((i) => (i.id === updated.id ? updated : i)).filter((i) => i.status !== 'resolved')
        }));
        return {
          ...prev,
          issues: newIssues,
          buildings: updatedBuildings
        };
      });
    });

    // Handle new event
    socket.on('event:created', (newEvent: CampusEvent) => {
      setCampusState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          events: [newEvent, ...prev.events],
          active_events_count: prev.active_events_count + 1
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [refreshState]);

  // Selected Building resolution
  const selectedBuilding = campusState?.buildings.find((b) => b.id === selectedBuildingId) || null;

  const selectBuilding = (id: string | null) => {
    setSelectedBuildingId(id);
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // Report Issue API
  const reportIssue = async (issueData: {
    title: string;
    description: string;
    location_id: string;
    location_name: string;
    reported_by: string;
    category: string;
    priority: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch('http://localhost:4000/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueData)
      });
      return res.ok;
    } catch (err) {
      console.error('Error reporting issue:', err);
      return false;
    }
  };

  // Update Issue Status API
  const updateIssueStatus = async (id: string, status: 'open' | 'in-progress' | 'resolved'): Promise<boolean> => {
    try {
      const res = await fetch(`http://localhost:4000/api/issues/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return res.ok;
    } catch (err) {
      console.error('Error updating issue status:', err);
      return false;
    }
  };

  // Toggle Pause
  const togglePause = async () => {
    try {
      const nextPaused = !simulationStatus.isPaused;
      await fetch('http://localhost:4000/api/simulation/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused: nextPaused })
      });
      setSimulationStatus((s) => ({ ...s, isPaused: nextPaused }));
    } catch (err) {
      console.error('Failed to toggle pause:', err);
    }
  };

  // Set Speed
  const setSpeed = async (speed: number) => {
    try {
      await fetch('http://localhost:4000/api/simulation/speed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed })
      });
    } catch (err) {
      console.error('Failed to set speed:', err);
    }
  };

  // Trigger Scenario
  const triggerScenario = async (scenario: string) => {
    try {
      await fetch('http://localhost:4000/api/simulation/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      });
      setSimulationStatus((s) => ({ ...s, scenario }));
    } catch (err) {
      console.error('Failed to trigger scenario:', err);
    }
  };

  return (
    <CampusContext.Provider
      value={{
        campusState,
        predictions,
        selectedBuilding,
        isConnected,
        activeLayer,
        simulationStatus,
        alerts,
        selectBuilding,
        setActiveLayer,
        reportIssue,
        updateIssueStatus,
        togglePause,
        setSpeed,
        triggerScenario,
        dismissAlert,
        refreshState
      }}
    >
      {children}
    </CampusContext.Provider>
  );
};

export const useCampus = () => {
  const context = useContext(CampusContext);
  if (!context) throw new Error('useCampus must be used within a CampusProvider');
  return context;
};

