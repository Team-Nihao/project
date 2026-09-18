export type BuildingType = 'academic' | 'hostel' | 'admin' | 'sports' | 'facility';
export type RoomType = 'classroom' | 'lab' | 'seminar_hall' | 'study_room';
export type RoomStatus = 'free' | 'occupied' | 'scheduled';
export type ParkingStatus = 'available' | 'filling' | 'full';
export type FacilityType = 'library' | 'canteen' | 'gym' | 'auditorium' | 'lab';
export type FacilityStatus = 'open' | 'crowded' | 'closing_soon' | 'closed';
export type CrowdLevel = 'low' | 'medium' | 'high' | 'critical';
export type EventCategory = 'academic' | 'hackathon' | 'cultural' | 'sports' | 'seminar';
export type IssueCategory = 'maintenance' | 'safety' | 'it' | 'water' | 'electrical';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus = 'open' | 'in-progress' | 'resolved';
export type SensorType = 'occupancy' | 'parking' | 'crowd' | 'temperature' | 'air_quality';

export interface Building {
  id: string;
  name: string;
  code: string;
  type: BuildingType;
  x: number; // map SVG coordinate x
  y: number; // map SVG coordinate y
  width: number;
  height: number;
  floors: number;
  total_capacity: number;
  current_occupancy: number;
  status: 'normal' | 'busy' | 'congested';
  description: string;
  image_url?: string;
}

export interface Room {
  id: string;
  building_id: string;
  building_name?: string;
  name: string;
  floor: number;
  type: RoomType;
  capacity: number;
  current_occupancy: number;
  status: RoomStatus;
  next_class: string;
  next_available_time: string;
  sensor_id: string;
  last_updated?: string;
}

export interface ParkingLot {
  id: string;
  name: string;
  location: string;
  x: number;
  y: number;
  total_capacity: number;
  current_occupied: number;
  status: ParkingStatus;
  ev_charging_spots: number;
  ev_occupied: number;
  sensor_id: string;
  hourly_rate?: number;
}

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  building_id: string;
  capacity: number;
  current_occupancy: number;
  operating_hours: string;
  status: FacilityStatus;
  peak_hours: string;
  sensor_id: string;
}

export interface CrowdZone {
  id: string;
  name: string;
  zone_type: 'quad' | 'plaza' | 'walkway' | 'concourse';
  density_level: CrowdLevel;
  density_score: number; // 0 to 100
  x: number;
  y: number;
  radius: number;
  historical_trend?: { time: string; density: number }[];
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  location_id: string;
  location_name: string;
  start_time: string;
  end_time: string;
  category: EventCategory;
  organizer: string;
  expected_attendees: number;
}

export interface IssueReport {
  id: string;
  title: string;
  description: string;
  location_id: string;
  location_name: string;
  reported_by: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface SensorReading {
  id?: number;
  sensor_id: string;
  sensor_type: SensorType;
  source_ref: string;
  value: number;
  timestamp: string;
  quality: 'good' | 'noisy' | 'gap';
}

export interface TelemetryDelta {
  timestamp: string;
  buildings: { id: string; current_occupancy: number; status: 'normal' | 'busy' | 'congested' }[];
  rooms: { id: string; current_occupancy: number; status: RoomStatus; next_available_time: string }[];
  parking: { id: string; current_occupied: number; status: ParkingStatus; ev_occupied: number }[];
  facilities: { id: string; current_occupancy: number; status: FacilityStatus }[];
  crowd_zones: { id: string; density_score: number; density_level: CrowdLevel }[];
  recent_readings: SensorReading[];
  simulation_stats: {
    tick_count: number;
    active_sensors: number;
    scenario: string;
    campus_occupancy_rate: number;
  };
}

export interface PredictionSummary {
  facility_forecasts: {
    facility_id: string;
    facility_name: string;
    current_occupancy: number;
    capacity: number;
    forecast_1h: number;
    forecast_2h: number;
    predicted_peak_time: string;
    risk_level: 'normal' | 'moderate' | 'high';
    recommendation: string;
  }[];
  parking_forecasts: {
    lot_id: string;
    lot_name: string;
    current_occupied: number;
    total_capacity: number;
    forecast_30m: number;
    forecast_1h: number;
    time_to_full_minutes: number | null;
    status: ParkingStatus;
  }[];
  crowd_movement_trends: {
    zone_id: string;
    zone_name: string;
    trend: 'rising' | 'falling' | 'stable';
    predicted_next_hour_density: number;
  }[];
}

