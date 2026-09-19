import { DataFusionService, FusedCampusState, FusedBuilding } from './dataFusion';
import { Room, ParkingLot, CrowdZone, CampusEvent, IssueReport } from '../models/types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  response: string;
  sessionId: string;
  timestamp: string;
  intent: string;
  suggestions: string[];
  dataUsed?: any;
}

export class ChatbotService {
  private static sessions = new Map<string, ChatMessage[]>();

  // Map of common aliases and nicknames to Building IDs
  private static buildingAliases: Record<string, string> = {
    '34': 'bldg-block-34',
    'block 34': 'bldg-block-34',
    'blk 34': 'bldg-block-34',
    'blk-34': 'bldg-block-34',
    'cse': 'bldg-block-34',
    'computer science': 'bldg-block-34',
    'tech block': 'bldg-block-34',
    'coding lab': 'bldg-block-34',

    '32': 'bldg-block-32',
    'block 32': 'bldg-block-32',
    'blk 32': 'bldg-block-32',
    'blk-32': 'bldg-block-32',
    'mech': 'bldg-block-32',
    'mechanical': 'bldg-block-32',
    'robotics': 'bldg-block-32',

    '25': 'bldg-block-25',
    'block 25': 'bldg-block-25',
    'blk 25': 'bldg-block-25',
    'blk-25': 'bldg-block-25',
    'pharma': 'bldg-block-25',
    'pharmacy': 'bldg-block-25',
    'biotech': 'bldg-block-25',

    '37': 'bldg-block-37',
    'block 37': 'bldg-block-37',
    'blk 37': 'bldg-block-37',
    'blk-37': 'bldg-block-37',
    'library': 'bldg-block-37',
    'central library': 'bldg-block-37',
    'reading room': 'bldg-block-37',

    'unimall': 'bldg-unimall',
    'uni-mall': 'bldg-unimall',
    'mall': 'bldg-unimall',
    'campus mall': 'bldg-unimall',
    'commercial complex': 'bldg-unimall',
    'food court': 'bldg-unimall',
    'canteen': 'bldg-unimall',
    'cafe': 'bldg-unimall',
    'dominos': 'bldg-unimall',
    'subway': 'bldg-unimall',

    'unipolis': 'bldg-unipolis',
    'uni-polis': 'bldg-unipolis',
    'convention center': 'bldg-unipolis',
    'convention arena': 'bldg-unipolis',
    'amphitheatre': 'bldg-unipolis',
    'auditorium': 'bldg-unipolis',
    'arena': 'bldg-unipolis',

    'bh4': 'bldg-bh-4',
    'bh-4': 'bldg-bh-4',
    'bh-04': 'bldg-bh-4',
    'boys hostel': 'bldg-bh-4',
    'boys hostel 4': 'bldg-bh-4',
    'hostel b4': 'bldg-bh-4',
    'north residence': 'bldg-bh-4',

    'gh2': 'bldg-gh-2',
    'gh-2': 'bldg-gh-2',
    'gh-02': 'bldg-gh-2',
    'girls hostel': 'bldg-gh-2',
    'girls hostel 2': 'bldg-gh-2',
    'hostel g2': 'bldg-gh-2',
    'south residence': 'bldg-gh-2',

    'sports': 'bldg-sports',
    'stadium': 'bldg-sports',
    'sdm': 'bldg-sports',
    'indoor stadium': 'bldg-sports',
    'sports complex': 'bldg-sports',
    'gym': 'bldg-sports',
    'badminton': 'bldg-sports',
    'swimming pool': 'bldg-sports',

    'hospital': 'bldg-med',
    'uni-hospital': 'bldg-med',
    'health centre': 'bldg-med',
    'health center': 'bldg-med',
    'medical': 'bldg-med',
    'clinic': 'bldg-med',

    'admin': 'bldg-admin',
    'block 1': 'bldg-admin',
    'blk 1': 'bldg-admin',
    'senate': 'bldg-admin',
    'senate house': 'bldg-admin',
    'vc': 'bldg-admin',
    'secretariat': 'bldg-admin',

    '13': 'bldg-block-13',
    'block 13': 'bldg-block-13',
    'blk 13': 'bldg-block-13',
    'dsw': 'bldg-block-13',
    'student welfare': 'bldg-block-13',
    'innovation': 'bldg-block-13'
  };

  /**
   * Main entry point for processing a user message
   */
  public static async processMessage(
    userMessage: string,
    sessionId: string = 'default-session'
  ): Promise<ChatResponse> {
    const trimmed = userMessage.trim();
    if (!trimmed) {
      return {
        response: "Hello! Try asking about free rooms in Block 34, parking availability, or today's campus events.",
        sessionId,
        timestamp: new Date().toISOString(),
        intent: 'empty',
        suggestions: ['Is Block 34 free?', 'Parking near Campus Mall', "Today's Events", 'Central Library status']
      };
    }

    // Retrieve or initialize session history
    const history = this.sessions.get(sessionId) || [];
    history.push({
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString()
    });

    // Check if Claude API key is configured
    const apiKey = process.env.ANTHROPIC_API_KEY;
    let chatResponse: ChatResponse;

    if (apiKey && apiKey !== 'your_anthropic_api_key_here' && apiKey.startsWith('sk-ant-')) {
      try {
        chatResponse = await this.processWithClaudeLLM(trimmed, sessionId, apiKey);
      } catch (err: any) {
        console.warn('[ChatbotService] Claude LLM error, falling back to deterministic semantic engine:', err?.message || err);
        chatResponse = this.processWithSemanticEngine(trimmed, sessionId);
      }
    } else {
      chatResponse = this.processWithSemanticEngine(trimmed, sessionId);
    }

    // Save assistant response to session history (capped at last 20 messages)
    history.push({
      role: 'assistant',
      content: chatResponse.response,
      timestamp: chatResponse.timestamp
    });
    if (history.length > 20) {
      this.sessions.set(sessionId, history.slice(history.length - 20));
    } else {
      this.sessions.set(sessionId, history);
    }

    return chatResponse;
  }

  /**
   * Tool 1: Query Building / Room live availability
   */
  public static queryBuildingOrRoom(query: string) {
    const state = DataFusionService.getFusedCampusState();
    const lower = query.toLowerCase();

    // 1. Check if asking about a specific building
    let targetBldg: FusedBuilding | undefined;
    for (const [alias, bldgId] of Object.entries(this.buildingAliases)) {
      if (lower.includes(alias)) {
        targetBldg = state.buildings.find((b) => b.id === bldgId);
        if (targetBldg) break;
      }
    }

    // Direct name/code search fallback
    if (!targetBldg) {
      targetBldg = state.buildings.find(
        (b) =>
          lower.includes(b.code.toLowerCase()) ||
          lower.includes(b.name.toLowerCase()) ||
          b.name.toLowerCase().includes(lower)
      );
    }

    if (targetBldg) {
      const occPct = Math.round((targetBldg.current_occupancy / targetBldg.total_capacity) * 100);
      const freeRooms = targetBldg.rooms.filter((r) => r.status === 'free');
      const occupiedRooms = targetBldg.rooms.filter((r) => r.status === 'occupied');
      const criticalTickets = targetBldg.active_issues.filter((i) => i.priority === 'critical');

      return {
        found: true,
        type: 'building',
        building: {
          id: targetBldg.id,
          name: targetBldg.name,
          code: targetBldg.code,
          current_occupancy: targetBldg.current_occupancy,
          total_capacity: targetBldg.total_capacity,
          occupancy_pct: occPct,
          status: targetBldg.status,
          total_rooms: targetBldg.rooms.length,
          free_rooms_count: freeRooms.length,
          occupied_rooms_count: occupiedRooms.length,
          free_rooms: freeRooms.map((r) => ({
            name: r.name,
            floor: r.floor,
            type: r.type,
            next_available_time: r.next_available_time,
            next_class: r.next_class
          })),
          active_issues_count: targetBldg.active_issues.length,
          critical_alerts: criticalTickets.length
        }
      };
    }

    // 2. Check if asking about a specific Room name across campus
    const allRooms = state.buildings.flatMap((b) =>
      b.rooms.map((r) => ({ ...r, building_name: b.name, building_code: b.code }))
    );
    const matchedRoom = allRooms.find(
      (r) => lower.includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(lower)
    );

    if (matchedRoom) {
      return {
        found: true,
        type: 'room',
        room: {
          name: matchedRoom.name,
          building: matchedRoom.building_name,
          code: matchedRoom.building_code,
          floor: matchedRoom.floor,
          status: matchedRoom.status,
          type: matchedRoom.type,
          current_occupancy: matchedRoom.current_occupancy,
          capacity: matchedRoom.capacity,
          next_class: matchedRoom.next_class,
          next_available_time: matchedRoom.next_available_time
        }
      };
    }

    return { found: false };
  }

  /**
   * Tool 2: Query Free Rooms across all buildings
   */
  public static queryFreeRooms(roomType?: 'classroom' | 'lab' | 'study_room' | 'seminar_hall') {
    const state = DataFusionService.getFusedCampusState();
    const allFree = state.buildings.flatMap((b) =>
      b.rooms
        .filter((r) => r.status === 'free' && (!roomType || r.type === roomType))
        .map((r) => ({
          name: r.name,
          building: b.name,
          code: b.code,
          floor: r.floor,
          capacity: r.capacity,
          next_available_time: r.next_available_time
        }))
    );

    return {
      total_free: allFree.length,
      sample_rooms: allFree.slice(0, 4)
    };
  }

  /**
   * Tool 3: Query Parking Lot Availability
   */
  public static queryParking(query?: string) {
    const state = DataFusionService.getFusedCampusState();
    const lower = (query || '').toLowerCase();

    // Check if looking for a specific lot
    let matchedLot: any;
    if (lower.includes('gate 1') || lower.includes('gate1') || lower.includes('north gate')) {
      matchedLot = state.parking_lots.find((p) => p.id === 'park-gate1');
    } else if (lower.includes('block 34') || lower.includes('cse') || lower.includes('engineering')) {
      matchedLot = state.parking_lots.find((p) => p.id === 'park-block34');
    } else if (lower.includes('arena') || lower.includes('unipolis') || lower.includes('stadium')) {
      matchedLot = state.parking_lots.find((p) => p.id === 'park-unipolis');
    } else if (lower.includes('unimall') || lower.includes('mall') || lower.includes('food court') || lower.includes('canteen')) {
      matchedLot = state.parking_lots.find((p) => p.id === 'park-unimall');
    }

    const lots = state.parking_lots.map((p) => {
      const occPct = Math.round((p.current_occupied / p.total_capacity) * 100);
      return {
        id: p.id,
        name: p.name,
        capacity: p.total_capacity,
        occupied: p.current_occupied,
        open: p.total_capacity - p.current_occupied,
        pct: occPct,
        ev_open: p.ev_charging_spots - p.ev_occupied
      };
    });

    const totalCapacity = lots.reduce((acc, l) => acc + l.capacity, 0);
    const totalOccupied = lots.reduce((acc, l) => acc + l.occupied, 0);
    const totalAvailable = lots.reduce((acc, l) => acc + l.open, 0);
    const totalEvAvailable = lots.reduce((acc, l) => acc + l.ev_open, 0);
    const occupancyPct = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    if (matchedLot) {
      const occPct = Math.round((matchedLot.current_occupied / matchedLot.total_capacity) * 100);
      return {
        matched_lot: {
          id: matchedLot.id,
          name: matchedLot.name,
          total_capacity: matchedLot.total_capacity,
          current_occupied: matchedLot.current_occupied,
          open_spots: matchedLot.total_capacity - matchedLot.current_occupied,
          occupancy_pct: occPct,
          ev_spots: matchedLot.ev_charging_spots,
          ev_occupied: matchedLot.ev_occupied,
          ev_available: matchedLot.ev_charging_spots - matchedLot.ev_occupied,
          is_critical: occPct >= 90
        },
        lots,
        total_capacity: totalCapacity,
        total_occupied: totalOccupied,
        total_available: totalAvailable,
        total_ev_available: totalEvAvailable,
        occupancy_pct: occupancyPct
      };
    }

    return {
      matched_lot: null,
      lots,
      total_capacity: totalCapacity,
      total_occupied: totalOccupied,
      total_available: totalAvailable,
      total_ev_available: totalEvAvailable,
      occupancy_pct: occupancyPct
    };
  }

  /**
   * Tool 4: Query Crowd Density Levels
   */
  public static queryCrowd(query?: string) {
    const state = DataFusionService.getFusedCampusState();
    const lower = (query || '').toLowerCase();

    let matchedZone: any;
    if (lower.includes('library') || lower.includes('reading')) {
      matchedZone = state.crowd_zones.find((z) => z.id === 'zone-lib-concourse');
    } else if (lower.includes('unimall') || lower.includes('mall') || lower.includes('canteen') || lower.includes('food court')) {
      matchedZone = state.crowd_zones.find((z) => z.id === 'zone-canteen-plaza');
    } else if (lower.includes('block 34') || lower.includes('cse') || lower.includes('walkway')) {
      matchedZone = state.crowd_zones.find((z) => z.id === 'zone-tech-walk');
    }

    const allZones = state.crowd_zones.map((z) => ({
      name: z.name,
      density_score: z.density_score,
      density_level: z.density_level
    }));

    const sorted = [...allZones].sort((a, b) => b.density_score - a.density_score);
    const mostCrowded = sorted[0] || { name: 'Campus Center', density_score: 50, density_level: 'moderate' as const };
    const quietest = sorted[sorted.length - 1] || { name: 'Quiet Gardens', density_score: 10, density_level: 'low' as const };

    return {
      matched_zone: matchedZone,
      all_zones: allZones,
      most_crowded: mostCrowded,
      quietest: quietest
    };
  }

  /**
   * Tool 5: Query Campus Events
   */
  public static queryEvents(category?: string) {
    const state = DataFusionService.getFusedCampusState();
    let events = state.events;

    if (category) {
      const lower = category.toLowerCase();
      events = events.filter((e) => e.category.toLowerCase().includes(lower) || e.title.toLowerCase().includes(lower));
    }

    return {
      total_events: events.length,
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        venue: e.location_name,
        start_time: e.start_time,
        end_time: e.end_time,
        category: e.category,
        attendees: e.expected_attendees
      }))
    };
  }

  /**
   * Tool 6: Query Active Maintenance Issues & Incidents
   */
  public static queryIssues(location?: string) {
    const state = DataFusionService.getFusedCampusState();
    let issues = state.issues.filter((i) => i.status !== 'resolved');

    if (location) {
      const lower = location.toLowerCase();
      issues = issues.filter(
        (i) => i.location_name.toLowerCase().includes(lower) || i.title.toLowerCase().includes(lower)
      );
    }

    const mapped = issues.map((i) => ({
      title: i.title,
      location: i.location_name,
      priority: i.priority,
      status: i.status
    }));

    const criticalCount = issues.filter((i) => i.priority === 'critical').length;

    return {
      total_active: issues.length,
      total_open_issues: issues.length,
      critical_issues: criticalCount,
      active_issues: mapped,
      issues: mapped
    };
  }

  /**
   * Deterministic Semantic Engine
   */
  public static processWithSemanticEngine(
    query: string,
    sessionId: string
  ): ChatResponse {
    const lower = query.toLowerCase();
    const timestamp = new Date().toISOString();

    // GREETINGS
    if (/^(hi|hello|hey|greetings|namaste|good morning|good afternoon|what's up|sup)\b/i.test(lower)) {
      return {
        response: "Hello! I am your **Campus Digital Twin Assistant**. I monitor real-time telemetry across the university's 600-acre smart campus. You can ask me about classroom and lab availability, parking capacity, crowd levels, or scheduled events.",
        sessionId,
        timestamp,
        intent: 'greeting',
        suggestions: ['Is Block 34 free?', 'Parking near Campus Mall', "What's crowded right now?", "Today's Events"]
      };
    }

    // CAMPUS APP HELP & MAP NAVIGATION
    if (
      lower.includes('how to') ||
      lower.includes('what do the colors mean') ||
      lower.includes('color meaning') ||
      lower.includes('help me') ||
      lower.includes('instructions') ||
      (lower.includes('map') && lower.includes('how'))
    ) {
      return {
        response: "Here is a quick guide to the digital twin: 🟢 Emerald indicators signify <60% occupancy (Available), 🟡 Amber signifies 60-80% (Busy), and 🔴 Rose signifies >80% (Congested). You can pan and zoom on the map, hover on any building for live preview statistics, or toggle 'Crowd Heatmap' to review density hotspots.",
        sessionId,
        timestamp,
        intent: 'help',
        suggestions: ['Is Block 34 free?', 'Where to park near North Gate?', "Check Crowd Heatmap", 'Report an Issue']
      };
    }

    // 3D AERIAL MASTERPLAN & CAMPUS ZONES INTENT
    if (
      lower.includes('aerial') ||
      lower.includes('masterplan') ||
      lower.includes('zones') ||
      lower.includes('satellite') ||
      lower.includes('radar') ||
      (lower.includes('map') && (lower.includes('show') || lower.includes('view') || lower.includes('3d') || lower.includes('look') || lower.includes('photo')))
    ) {
      return {
        response: `🛰️ **University Campus Masterplan & Digital Twin**:\n\n` +
          `• **Academic Core (Center)**: Senate House (Administration), Central Library Rotunda on the lake, Block 34 (Computer Science & AI), Block 32 (Mechanical/Robotics), Block 25 (Pharmacy), and Block 13 (Innovation Studios).\n` +
          `• **Student Residential Township (West)**: North Residence Hall (Hostel B4) and South Residence Hall (Hostel G2) enclaves with dining halls.\n` +
          `• **Sports & Recreation Precinct (East)**: Olympic Sports Complex & Aquatic Center, and University Grand Amphitheatre & Convention Arena.\n` +
          `• **Commercial & Healthcare (South-East)**: Campus Commercial Mall & Food Court, and University Health Centre & 24/7 Clinic.\n\n` +
          `💡 **Tip**: Click the **"🛰️ 3D Aerial Masterplan"** toggle on the map toolbar to explore the high-resolution aerial layout with live holographic IoT telemetry and Sonar Radar Sweep!`,
        sessionId,
        timestamp,
        intent: 'campus_masterplan',
        suggestions: ['Is Block 34 (CSE) free right now?', 'Where can I park near Campus Mall?', 'How crowded is the Central Library?', 'What events are happening today?']
      };
    }

    // CHECK FOR KNOWN NON-EXISTENT LOCATIONS (e.g. Hogwarts, Stanford)
    const imaginaryLocations = ['hogwarts', 'stanford', 'harvard', 'mit', 'building z', 'hostel 99', 'alien'];
    for (const loc of imaginaryLocations) {
      if (lower.includes(loc)) {
        return {
          response: `I couldn't find "${loc}" on the university campus. The digital twin tracks 12 core campus blocks including Academic Blocks (CS, Mechanical, Pharmacy), Central Library, Campus Mall, Convention Arena, Residence Halls, and the Sports Complex. Check the main map to explore all 12 blocks!`,
          sessionId,
          timestamp,
          intent: 'unknown_location',
          suggestions: ['Is Block 34 free?', 'Check Central Library', 'Check Campus Mall', 'Show Campus Overview']
        };
      }
    }

    // AMBIGUOUS SHORT QUERIES (e.g. "Is it open?", "Is it free?")
    if (/^(is it free|is it open|can i go|is it busy|what is the status|status)\??$/i.test(query.trim())) {
      return {
        response: "Which facility or building are you inquiring about? For example, you can ask: *'Is Block 34 CSE free right now?'*, *'How crowded is the Campus Mall?'*, or *'Is North Gate parking full?'*",
        sessionId,
        timestamp,
        intent: 'clarification',
        suggestions: ['Is Block 34 free?', 'Is Campus Mall food court busy?', 'Parking near North Gate', 'Central Library status']
      };
    }

    // ROOM / CLASSROOM / LAB AVAILABILITY
    if (
      lower.includes('free') ||
      lower.includes('available') ||
      lower.includes('vacant') ||
      lower.includes('lab') ||
      lower.includes('room') ||
      lower.includes('classroom') ||
      lower.includes('study space') ||
      lower.includes('study pod')
    ) {
      // Check if a specific building was named
      const result = this.queryBuildingOrRoom(lower);

      if (result.found && result.building) {
        const b = result.building;
        const statusEmoji = b.occupancy_pct >= 80 ? '🔴' : b.occupancy_pct >= 60 ? '🟡' : '🟢';
        let resp = `${statusEmoji} **${b.name} (${b.code})** is currently at **${b.occupancy_pct}% load** (${b.current_occupancy}/${b.total_capacity} occupants).`;

        if (b.free_rooms_count > 0) {
          const sample = b.free_rooms.slice(0, 2).map((r: any) => `**${r.name}** (Free until ${r.next_available_time})`).join(', ');
          resp += ` You'll find **${b.free_rooms_count} free rooms** right now, including ${sample}.`;
        } else {
          resp += ` All scheduled classrooms in this block are currently active.`;
        }

        if (b.active_issues_count > 0) {
          resp += ` *(Note: ${b.active_issues_count} open maintenance ticket(s) in this block).*`;
        }

        return {
          response: resp,
          sessionId,
          timestamp,
          intent: 'room_availability',
          dataUsed: b,
          suggestions: ['Find a free lab near me', 'Check Block 37 Library', 'Parking near Block 34', 'Campus Overview']
        };
      } else if (result.found && result.room) {
        const r = result.room;
        const statusColor = r.status === 'free' ? '🟢 Available' : '🔴 Occupied';
        return {
          response: `${r.name} in **${r.building}** is currently **${statusColor}** (${r.current_occupancy}/${r.capacity} seats). Next scheduled class: *${r.next_class}* (Available: ${r.next_available_time}).`,
          sessionId,
          timestamp,
          intent: 'room_availability',
          dataUsed: r,
          suggestions: ['Find free labs near me', 'Check Block 34 CSE', 'Check Block 37 Library']
        };
      }

      // Generic "find free rooms" query
      const freeSummary = this.queryFreeRooms(
        lower.includes('lab') ? 'lab' : lower.includes('study') ? 'study_room' : undefined
      );
      const roomList = freeSummary.sample_rooms
        .map((r: any) => `• **${r.name}** (${r.building}) — free until ${r.next_available_time}`)
        .join('\n');

      return {
        response: `Across campus, there are **${freeSummary.total_free} free spaces** available right now! Here are top options:\n${roomList}\n\nYou can also jump to the **"Classroom & Labs"** tab to filter by floor and department.`,
        sessionId,
        timestamp,
        intent: 'room_availability',
        dataUsed: freeSummary,
        suggestions: ['Is Block 34 CSE free?', 'Check Block 37 Library', 'Check Uni-Mall Food Court']
      };
    }

    // CAMPUS EVENTS & FESTS (Check before parking so words like 'events' are never hijacked)
    if (/\b(event|events|fest|fests|hackathon|happening|today)\b/i.test(lower)) {
      const eventData = this.queryEvents(lower);

      if (eventData.events.length === 0) {
        return {
          response: `No special events found matching your search. There are ${eventData.total_events} scheduled flagship events today across LPU campus!`,
          sessionId,
          timestamp,
          intent: 'events',
          suggestions: ["Today's Events", 'Check UniPolis Arena', 'Campus Overview']
        };
      }

      const list = eventData.events
        .slice(0, 3)
        .map((e: any) => `• **${e.title}** @ *${e.venue}* (${e.start_time.split('T')[1]?.slice(0,5) || '10:00'} - ${e.end_time.split('T')[1]?.slice(0,5) || '18:00'}, ~${e.attendees} attendees)`)
        .join('\n');

      return {
        response: `Here are the top active events at LPU today:\n${list}\n\nCheck the **"Events & Issues"** tab to view pinned map locations!`,
        sessionId,
        timestamp,
        intent: 'events',
        dataUsed: eventData,
        suggestions: ['Check UniPolis Arena', 'YouthVibe Hackathon 2026', 'One India Cultural Inaugural']
      };
    }

    // PARKING INQUIRIES
    if (/\b(park|parking|car|cars|vehicle|vehicles|ev|evs|charging|bays|valet|lot|lots)\b/i.test(lower)) {
      const parkingData = this.queryParking(lower);

      if (parkingData.matched_lot) {
        const lot = parkingData.matched_lot;
        const warn = lot.is_critical ? '⚠️ High congestion! ' : '✅ Good availability! ';
        return {
          response: `${warn}**${lot.name}** has **${lot.open_spots} open bays** out of ${lot.total_capacity} (${lot.occupancy_pct}% full). EV Charging: **${lot.ev_available}/${lot.ev_spots} chargers free**.`,
          sessionId,
          timestamp,
          intent: 'parking',
          dataUsed: lot,
          suggestions: ['Gate 1 GT Road parking', 'UniPolis Event Parking', 'Block 34 Deck Parking', 'Campus Overview']
        };
      }

      const bestLot = [...parkingData.lots].sort((a, b) => b.open - a.open)[0] || { name: 'Gate 1 GT Road Parking', open: 0 };
      return {
        response: `Campus-wide parking is currently at **${parkingData.occupancy_pct}% capacity** with **${parkingData.total_available} total open spots** and **${parkingData.total_ev_available} EV charging stations ready**. Your best bet right now is **${bestLot.name}** with **${bestLot.open} open bays**!`,
        sessionId,
        timestamp,
        intent: 'parking',
        dataUsed: parkingData,
        suggestions: ['Parking near Uni-Mall', 'Gate 1 GT Road Parking', 'Block 34 Deck Parking']
      };
    }

    // CROWD DENSITY & RUSH
    if (/\b(crowd|crowded|rush|busy|traffic|density|canteen|food court)\b/i.test(lower)) {
      const crowdData = this.queryCrowd(lower);

      if (crowdData.matched_zone) {
        const z = crowdData.matched_zone;
        const levelEmoji = z.density_score >= 80 ? '🔴 Critical' : z.density_score >= 60 ? '🟡 High' : '🟢 Moderate';
        return {
          response: `**${z.name}** is currently experiencing **${levelEmoji} crowd density** (Score: **${z.density_score}/100**). Use the Time Scrub slider in the "Crowd Density" tab to view rush playback.`,
          sessionId,
          timestamp,
          intent: 'crowd',
          dataUsed: z,
          suggestions: ['Quietest place to study?', 'Check Block 37 Library', 'Uni-Mall Food Court rush']
        };
      }

      return {
        response: `Right now, the busiest hotspot is **${crowdData.most_crowded.name}** (Density: **${crowdData.most_crowded.density_score}/100**), while the quietest area is **${crowdData.quietest.name}** (Density: **${crowdData.quietest.density_score}/100**).`,
        sessionId,
        timestamp,
        intent: 'crowd',
        dataUsed: crowdData,
        suggestions: ['Is Uni-Mall crowded?', 'Is Block 37 Library busy?', 'Check Free Rooms']
      };
    }

    // ISSUES, COMPLAINTS & MAINTENANCE
    if (
      lower.includes('issue') ||
      lower.includes('issues') ||
      lower.includes('problem') ||
      lower.includes('ticket') ||
      lower.includes('broken') ||
      lower.includes('wifi') ||
      lower.includes('complaint') ||
      lower.includes('report')
    ) {
      const issueData = this.queryIssues(lower);

      if (lower.includes('how') && lower.includes('report')) {
        return {
          response: "To report an issue: click the **'Report Issue'** button in the **'Events & Issues'** tab (or inspect any building card and click 'Report Ticket'). Provide the location, category (IT, Electrical, Maintenance, Safety), and description. It dispatches immediately to campus maintenance!",
          sessionId,
          timestamp,
          intent: 'issues',
          suggestions: ['Active issues in Block 34', 'Show critical tickets', 'Campus Overview']
        };
      }

      if (issueData.active_issues.length > 0) {
        const topIssue = issueData.active_issues[0];
        return {
          response: `There are currently **${issueData.total_open_issues} active tickets** (${issueData.critical_issues} critical). For instance: *"${topIssue.title}"* at **${topIssue.location}** (Priority: ${topIssue.priority.toUpperCase()}). You can track real-time resolution in the Events & Issues board.`,
          sessionId,
          timestamp,
          intent: 'issues',
          dataUsed: issueData,
          suggestions: ['How to report an issue?', 'Check Block 34 CSE', 'Campus Overview']
        };
      }

      return {
        response: "Great news! There are currently no open critical maintenance issues for this area. Everything is operating normally.",
        sessionId,
        timestamp,
        intent: 'issues',
        suggestions: ['Campus Overview', 'Check Free Rooms', 'Parking Status']
      };
    }

    // CAMPUS OVERVIEW / DEFAULT STATUS
    const state = DataFusionService.getFusedCampusState();
    return {
      response: `Here is the current live pulse for **Lovely Professional University (Phagwara)**: Campus load is at **${state.overall_occupancy_percentage}%** (${state.total_campus_occupancy}/${state.total_campus_capacity} people), with **${state.free_rooms_count} free classrooms/labs**, **${state.parking_available_spots} open parking bays**, and **${state.active_events_count} active campus events**. How can I help you navigate?`,
      sessionId,
      timestamp,
      intent: 'campus_overview',
      dataUsed: {
        load: state.overall_occupancy_percentage,
        freeRooms: state.free_rooms_count,
        parkingAvail: state.parking_available_spots
      },
      suggestions: ['Is Block 34 free right now?', 'Parking near Uni-Mall', "Today's Events", 'Report an Issue']
    };
  }

  /**
   * Process with Anthropic Claude LLM + Tool Calling (activated when ANTHROPIC_API_KEY is present)
   */
  private static async processWithClaudeLLM(
    userMessage: string,
    sessionId: string,
    apiKey: string
  ): Promise<ChatResponse> {
    const tools = [
      {
        name: 'getBuildingOrRoomAvailability',
        description: 'Get live real-time occupancy, free rooms count, and next available times for a specific LPU building or room.',
        input_schema: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'Building name, code (e.g. Block 34, Block 37, Uni-Mall), or room name' }
          },
          required: ['location']
        }
      },
      {
        name: 'getParkingStatus',
        description: 'Get real-time open parking bays and EV charging availability for LPU campus parking lots.',
        input_schema: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'Parking lot name or nearby building (e.g. Gate 1, Block 34 Deck, Uni-Mall)' }
          }
        }
      },
      {
        name: 'getCrowdLevels',
        description: 'Check crowd density levels and rush status for plazas, walkways, or concourses.',
        input_schema: {
          type: 'object',
          properties: {
            zone: { type: 'string', description: 'Area or zone name (e.g. Uni-Mall Food Court, Central Library concourse)' }
          }
        }
      },
      {
        name: 'getTodayEvents',
        description: 'Fetch active and upcoming events happening on campus today.',
        input_schema: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Optional category (hackathon, cultural, academic)' }
          }
        }
      },
      {
        name: 'getIssuesAndIncidents',
        description: 'Check active reported maintenance or IT issues for a building or campus-wide.',
        input_schema: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'Optional building or location name' }
          }
        }
      }
    ];

    const messages = [
      {
        role: 'user',
        content: userMessage
      }
    ];

    // Initial tool-calling turn
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 450,
        system: "You are the friendly, helpful AI Campus Assistant for Lovely Professional University (LPU), Phagwara, Punjab. You answer questions about room availability, parking, crowd density, events, and maintenance tickets using REAL DATA provided by tool calls. Never hallucinate numbers. Keep answers concise (2-4 sentences), friendly, and informative.",
        messages,
        tools
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API returned ${response.status}: ${await response.text()}`);
    }

    const data: any = await response.json();

    // Check if tool calling was requested
    if (data.stop_reason === 'tool_use') {
      const toolCall = data.content.find((c: any) => c.type === 'tool_use');
      if (toolCall) {
        let toolResult: any;
        if (toolCall.name === 'getBuildingOrRoomAvailability') {
          toolResult = this.queryBuildingOrRoom(toolCall.input.location || '');
        } else if (toolCall.name === 'getParkingStatus') {
          toolResult = this.queryParking(toolCall.input.location);
        } else if (toolCall.name === 'getCrowdLevels') {
          toolResult = this.queryCrowd(toolCall.input.zone);
        } else if (toolCall.name === 'getTodayEvents') {
          toolResult = this.queryEvents(toolCall.input.category);
        } else if (toolCall.name === 'getIssuesAndIncidents') {
          toolResult = this.queryIssues(toolCall.input.location);
        }

        // Second turn with tool result
        const followUp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 450,
            system: "You are the AI Campus Assistant for Lovely Professional University (LPU). State the real data cleanly and concisely.",
            messages: [
              ...messages,
              { role: 'assistant', content: data.content },
              {
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: toolCall.id,
                    content: JSON.stringify(toolResult)
                  }
                ]
              }
            ]
          })
        });

        if (followUp.ok) {
          const followUpData: any = await followUp.json();
          const textBlock = followUpData.content.find((c: any) => c.type === 'text');
          return {
            response: textBlock?.text || "Here's the latest information from the campus twin.",
            sessionId,
            timestamp: new Date().toISOString(),
            intent: toolCall.name,
            dataUsed: toolResult,
            suggestions: ['Is Block 34 free?', 'Parking near Uni-Mall', "Today's Events", 'Report an Issue']
          };
        }
      }
    }

    const textBlock = data.content.find((c: any) => c.type === 'text');
    return {
      response: textBlock?.text || "I'm your LPU Campus Assistant. How can I help you today?",
      sessionId,
      timestamp: new Date().toISOString(),
      intent: 'claude_direct',
      suggestions: ['Is Block 34 free?', 'Parking near Uni-Mall', "Today's Events", 'Report an Issue']
    };
  }
}
