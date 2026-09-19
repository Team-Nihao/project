"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initDatabase = initDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.resolve(__dirname, '../../campus_twin.db');
exports.db = new better_sqlite3_1.default(dbPath);
// Enable WAL mode for high concurrency
exports.db.pragma('journal_mode = WAL');
function initDatabase() {
    exports.db.exec(`
    CREATE TABLE IF NOT EXISTS buildings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      width REAL NOT NULL,
      height REAL NOT NULL,
      floors INTEGER NOT NULL,
      total_capacity INTEGER NOT NULL,
      current_occupancy INTEGER NOT NULL,
      status TEXT NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      building_id TEXT NOT NULL,
      name TEXT NOT NULL,
      floor INTEGER NOT NULL,
      type TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      current_occupancy INTEGER NOT NULL,
      status TEXT NOT NULL,
      next_class TEXT NOT NULL,
      next_available_time TEXT NOT NULL,
      sensor_id TEXT NOT NULL,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (building_id) REFERENCES buildings(id)
    );

    CREATE TABLE IF NOT EXISTS parking_lots (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      total_capacity INTEGER NOT NULL,
      current_occupied INTEGER NOT NULL,
      status TEXT NOT NULL,
      ev_charging_spots INTEGER NOT NULL,
      ev_occupied INTEGER NOT NULL,
      sensor_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS facilities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      building_id TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      current_occupancy INTEGER NOT NULL,
      operating_hours TEXT NOT NULL,
      status TEXT NOT NULL,
      peak_hours TEXT NOT NULL,
      sensor_id TEXT NOT NULL,
      FOREIGN KEY (building_id) REFERENCES buildings(id)
    );

    CREATE TABLE IF NOT EXISTS crowd_zones (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      zone_type TEXT NOT NULL,
      density_level TEXT NOT NULL,
      density_score REAL NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      radius REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      location_id TEXT NOT NULL,
      location_name TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      category TEXT NOT NULL,
      organizer TEXT NOT NULL,
      expected_attendees INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      location_id TEXT NOT NULL,
      location_name TEXT NOT NULL,
      reported_by TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sensor_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sensor_id TEXT NOT NULL,
      sensor_type TEXT NOT NULL,
      source_ref TEXT NOT NULL,
      value REAL NOT NULL,
      timestamp TEXT NOT NULL,
      quality TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_rooms_building ON rooms(building_id);
    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_sensor_readings_source ON sensor_readings(source_ref, timestamp);
  `);
    console.log('Database initialized successfully at', dbPath);
}
