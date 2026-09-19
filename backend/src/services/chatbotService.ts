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
          type: targetBldg.type,
          description: targetBldg.description,
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
          facilities: targetBldg.facilities.map((f) => f.name),
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
  /**
   * Comprehensive Context-Aware Semantic Engine
   */
  public static processWithSemanticEngine(
    query: string,
    sessionId: string
  ): ChatResponse {
    const raw = query.trim();
    const lower = raw.toLowerCase();
    const timestamp = new Date().toISOString();
    const state = DataFusionService.getFusedCampusState();

    // 1. CONVERSATIONAL INTENTS (Greetings, identity, gratitude, appreciation, farewell)
    if (/^(who are you|what are you|your name|what can you do|introduce yourself|tell me about yourself)\b/i.test(lower)) {
      return {
        response: "👋 I am your **LPU Campus Digital Twin AI Assistant**!\n\nI am connected in real time to our ~600-acre campus IoT telemetry stream, timetable scheduling database, and facilities management system. Here is what I can assist you with:\n• 🏫 **Classroom & Lab Availability**: Find free rooms, coding suites, and study spaces.\n• 🚗 **Parking Saturation & EV Bays**: Real-time open spots across all 4 campus lots.\n• 👥 **Crowd Density & Hotspots**: Locate quiet study areas or monitor cafeteria rushes.\n• 📅 **Campus Events & Fests**: Schedules for YouthVibe, hackathons, and UniPolis gatherings.\n• 🛠️ **Issue & Incident Reporting**: Guidance on logging maintenance, IT, or safety tickets.\n• 🏛️ **Campus Landmarks & Navigation**: Instant status for any of our 12 major campus blocks!",
        sessionId,
        timestamp,
        intent: 'identity',
        suggestions: ['Is Block 34 free right now?', 'Where can I eat lunch?', 'Parking near Uni-Mall', 'What events are happening today?']
      };
    }

    if (/^(thank you|thanks|thx|appreciate it|thank u|many thanks)\b/i.test(lower)) {
      return {
        response: "You're very welcome! 😊 Feel free to ask anytime you need real-time campus info—whether it's finding an open lab, checking parking near Gate 1, or checking crowd levels at the Uni-Mall. Have a great day at LPU!",
        sessionId,
        timestamp,
        intent: 'gratitude',
        suggestions: ['Is Block 34 free?', 'Check Uni-Mall Food Court', "Today's Events", 'Parking Status']
      };
    }

    if (/^(cool|awesome|great|nice|super|perfect|good job|well done|excellent)\b/i.test(lower)) {
      return {
        response: "Glad I could help! 👍 Let me know if you need any other real-time updates across the campus blocks.",
        sessionId,
        timestamp,
        intent: 'acknowledgment',
        suggestions: ['Check Free Rooms', 'Parking near Block 34', 'Central Library status', 'Show Campus Overview']
      };
    }

    if (/^(bye|goodbye|see you|cya|take care|have a good day)\b/i.test(lower)) {
      return {
        response: "Goodbye! 👋 Wishing you a smooth and productive day on campus. Return whenever you need live telemetry updates!",
        sessionId,
        timestamp,
        intent: 'farewell',
        suggestions: ['Campus Overview', 'Check Free Rooms', "Today's Events"]
      };
    }

    if (/^(hi|hello|hey|greetings|namaste|good morning|good afternoon|good evening|what's up|sup)\b/i.test(lower)) {
      const hr = new Date().getHours();
      const timeGreeting = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
      return {
        response: `${timeGreeting}! 👋 I am your **Campus Digital Twin Assistant**. I monitor real-time telemetry across LPU's 600-acre smart campus. You can ask me about classroom and lab availability, parking capacity, crowd levels, or scheduled events.`,
        sessionId,
        timestamp,
        intent: 'greeting',
        suggestions: ['Is Block 34 free?', 'Where can I eat lunch?', 'Parking near Uni-Mall', "What's crowded right now?"]
      };
    }

    // 2. VITALITY SCORE & DIGITAL TWIN ARCHITECTURE
    if (
      lower.includes('vitality') ||
      lower.includes('vitality score') ||
      lower.includes('what is this app') ||
      lower.includes('how does this work') ||
      lower.includes('how does it work') ||
      lower.includes('what is digital twin') ||
      lower.includes('architecture') ||
      lower.includes('telemetry')
    ) {
      return {
        response: `🌐 **Campus Digital Twin & Vitality Score**:\n\n` +
          `• **Operational Vitality Score**: Currently **${state.campus_vitality_score}/100** (Optimal health range: 85–100). This real-time metric aggregates overall campus load (${state.overall_occupancy_percentage}%), room availability (${state.free_rooms_count} free), parking saturation (${state.parking_available_spots} open bays), and active unresolved tickets (${state.open_issues_count} open).\n` +
          `• **Real-Time IoT Pipeline**: A background simulation engine ticks every 3 seconds to generate realistic PIR motion, ultrasonic parking barrier, and crowd Wi-Fi readings stored in an embedded SQLite WAL database.\n` +
          `• **Predictive Intelligence**: Calculates 1–2 hour forward demand forecasts for high-traffic facilities and rate-of-change parking saturation warnings.\n\n` +
          `💡 **Try this**: Use the scenario buttons in the top toolbar (*Lunch Rush*, *Class Change*, *Evacuation*) to inject campus disruptions on the fly!`,
        sessionId,
        timestamp,
        intent: 'vitality_score',
        dataUsed: {
          vitality: state.campus_vitality_score,
          load: state.overall_occupancy_percentage,
          openIssues: state.open_issues_count
        },
        suggestions: ['Is Block 34 free?', 'Check Crowd Heatmap', 'Parking Status', 'Active Issues']
      };
    }

    // 3. FOOD, DINING, CAFES & LUNCH
    if (/\b(food|eat|eating|lunch|dinner|breakfast|canteen|food court|hungry|cafe|restaurant|dominos|subway|meals|snack|coffee)\b/i.test(lower)) {
      const unimall = state.buildings.find((b) => b.id === 'bldg-unimall');
      const foodCourtCrowd = state.crowd_zones.find((z) => z.id === 'zone-canteen-plaza');
      const mallParking = state.parking_lots.find((p) => p.id === 'park-unimall');
      const mallOpen = mallParking ? (mallParking.total_capacity - mallParking.current_occupied) : 0;
      const unimallLoad = unimall ? Math.round((unimall.current_occupancy / unimall.total_capacity) * 100) : 75;
      const crowdScore = foodCourtCrowd ? foodCourtCrowd.density_score : 80;

      return {
        response: `🍽️ **Dining & Food Options at LPU**:\n\n` +
          `• **Uni-Mall Central Food Court**: The primary dining hotspot featuring multi-cuisine food counters, Domino's, Subway, bakeries, and cafes. It is currently at **${unimallLoad}% load** with a crowd density score of **${crowdScore}/100**.\n` +
          `• **Residential Mess**: North Residence (BH-4) and South Residence (GH-2) dining halls offer full student meal plans and evening snacks.\n` +
          `• **Tech Walkway Kiosks**: Nescafe hubs and juice counters adjacent to Block 34 (CSE) and Block 32 (Mechanical).\n\n` +
          `🚗 **Parking Advice**: The Uni-Mall Multi-Deck parking currently has **${mallOpen} open bays**.`,
        sessionId,
        timestamp,
        intent: 'food_dining',
        dataUsed: { unimallLoad, crowdScore, mallOpen },
        suggestions: ['How crowded is Uni-Mall right now?', 'Parking near Uni-Mall', 'Is Block 34 free?', 'Campus Overview']
      };
    }

    // 4. SPORTS, GYM & FITNESS
    if (/\b(gym|fitness|workout|sport|sports|badminton|swimming|pool|cricket|football|basketball|tennis|squash|stadium|exercise|match)\b/i.test(lower)) {
      const sportsBldg = state.buildings.find((b) => b.id === 'bldg-sports');
      const sportsOcc = sportsBldg ? Math.round((sportsBldg.current_occupancy / sportsBldg.total_capacity) * 100) : 50;

      return {
        response: `🏅 **Sports, Recreation & Fitness Facilities**:\n\n` +
          `The **Shanti Devi Mittal Indoor Stadium & Sports Complex (SDM)** is LPU's world-class athletic hub! Highlights include:\n` +
          `• **Olympic Aquatic Center**: 50-meter Olympic-size indoor heated swimming pool.\n` +
          `• **Racquet & Ball Courts**: 12 indoor badminton courts, squash courts, and table tennis arena.\n` +
          `• **Fitness & Gym**: Modern multi-station fitness suite, free weights, and cardio zone.\n` +
          `• **Outdoor Grounds**: Full-sized cricket ground, football stadium, and 400m synthetic athletic track.\n\n` +
          `📊 **Live Telemetry**: SDM Complex is currently at **${sportsOcc}% load** (${sportsBldg?.current_occupancy || 0}/${sportsBldg?.total_capacity || 0} active users). All facilities are open for student sessions!`,
        sessionId,
        timestamp,
        intent: 'sports_fitness',
        dataUsed: sportsBldg,
        suggestions: ['Where is SDM Stadium?', 'Is Uni-Mall crowded?', 'Check Free Rooms', 'Campus Overview']
      };
    }

    // 5. HEALTHCARE, CLINIC, DOCTOR & EMERGENCY
    if (/\b(doctor|hospital|clinic|medical|medicine|emergency|ambulance|sick|fever|injury|health|first aid|dispensary|pharmacy)\b/i.test(lower)) {
      const medBldg = state.buildings.find((b) => b.id === 'bldg-med');
      const medOcc = medBldg ? Math.round((medBldg.current_occupancy / medBldg.total_capacity) * 100) : 30;

      return {
        response: `🏥 **University Health Centre & Emergency Medical Care**:\n\n` +
          `• **24/7 Campus Clinic & Hospital**: Located on the eastern medical wing (near Block 25 Pharmacy), equipped with emergency treatment beds, inpatient care, and general physicians.\n` +
          `• **On-Campus Pharmacy**: Fully stocked in-house pharmacy for routine prescriptions and over-the-counter medication.\n` +
          `• **Ambulance & Trauma Support**: 24/7 dedicated campus ambulance on standby for immediate hospital transit.\n\n` +
          `📊 **Current Clinic Load**: Operating normally at **${medOcc}% capacity** (${medBldg?.current_occupancy || 0}/${medBldg?.total_capacity || 0} patients). In an acute emergency, please alert the nearest security gate or campus emergency desk immediately.`,
        sessionId,
        timestamp,
        intent: 'healthcare_medical',
        dataUsed: medBldg,
        suggestions: ['Where is Uni-Hospital located?', 'Active issues on campus', 'Check Central Library', 'Campus Overview']
      };
    }

    // 6. HOSTELS & STUDENT RESIDENCES
    if (/\b(hostel|hostels|boys hostel|girls hostel|bh4|bh-4|gh2|gh-2|dorm|dormitory|residence|warden|curfew|laundry)\b/i.test(lower)) {
      const bh4 = state.buildings.find((b) => b.id === 'bldg-bh-4');
      const gh2 = state.buildings.find((b) => b.id === 'bldg-gh-2');
      const bh4Occ = bh4 ? Math.round((bh4.current_occupancy / bh4.total_capacity) * 100) : 60;
      const gh2Occ = gh2 ? Math.round((gh2.current_occupancy / gh2.total_capacity) * 100) : 60;

      return {
        response: `🏢 **Student Residences & Hostels at LPU**:\n\n` +
          `• **North Residence (Hostel BH-4)**: Multi-storey male undergraduate residence featuring AC/non-AC rooms, attached dining mess, indoor gym, study pods, and 24/7 power backup. Current load: **${bh4Occ}%** (${bh4?.current_occupancy || 0}/${bh4?.total_capacity || 0}).\n` +
          `• **South Residence (Hostel GH-2)**: Modern secure female residence cluster with dedicated dining facilities, reading lounges, laundromat, and 24/7 security. Current load: **${gh2Occ}%** (${gh2?.current_occupancy || 0}/${gh2?.total_capacity || 0}).\n\n` +
          `Both residential complexes feature biometric entry, on-site wardens, and high-speed campus Wi-Fi.`,
        sessionId,
        timestamp,
        intent: 'hostels_residence',
        dataUsed: { bh4, gh2 },
        suggestions: ['Is Block 34 CSE free?', 'Where can I eat lunch?', 'Check SDM Sports Gym', 'Campus Overview']
      };
    }

    // 7. DSW, STUDENT WELFARE, CLUBS, ADMISSIONS & ADMINISTRATION
    if (/\b(dsw|student welfare|club|clubs|societies|admission|admissions|fee|fees|chancellor|vice chancellor|vc|id card|identity card|admin|senate|registrar|exam branch)\b/i.test(lower)) {
      return {
        response: `🏛️ **Student Welfare, Clubs & Central Administration**:\n\n` +
          `• **Division of Student Welfare (Block 13 - DSW)**: Headquartered in Block 13. Coordinates 100+ student organizations, cultural societies, robotics clubs, NCC/NSS units, student grievance redressal, and YouthVibe festival organization.\n` +
          `• **Senate House (Block 01 - Central Admin)**: The administrative seat housing the Vice-Chancellor's Secretariat, Registrar's Office, Admissions Directorate, Examinations Wing, and Student Accounts/Fee desks.\n` +
          `• **Student ID Cards & Official Certifications**: Processed at the Registrar service counters in Senate House and the DSW Helpdesk in Block 13.\n\n` +
          `💡 Both blocks are accessible from the central campus boulevard with nearby parking at Gate 1.`,
        sessionId,
        timestamp,
        intent: 'admin_dsw',
        suggestions: ['Where is Block 13 DSW?', 'Gate 1 GT Road parking', "Today's Events", 'Campus Overview']
      };
    }

    // 8. WI-FI, INTERNET & IT NETWORK
    if (/\b(wifi|wi-fi|internet|network|ums|login|portal|connectivity|broadband)\b/i.test(lower)) {
      return {
        response: `📶 **Campus High-Speed Wi-Fi & IT Services**:\n\n` +
          `• **SSID / Network**: Connect to **\`LPU_Student\`** or **\`LPU_Staff\`**.\n` +
          `• **Login Credentials**: Use your University Registration Number and UMS password at the captive portal prompt.\n` +
          `• **Coverage**: High-density enterprise Wi-Fi 6 access points cover all academic blocks (Blocks 34, 32, 25, 37, 13), Uni-Mall, and residential hostels.\n\n` +
          `💡 **Facing connectivity or speed issues?** Click the **'Report Issue'** button in the **'Events & Issues'** tab to file an IT maintenance ticket for rapid technician dispatch!`,
        sessionId,
        timestamp,
        intent: 'wifi_it',
        suggestions: ['How to report an issue?', 'Is Block 34 CSE free?', 'Check Block 37 Library', 'Campus Overview']
      };
    }

    // 9. 3D AERIAL MASTERPLAN & CAMPUS ZONES INTENT
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

    // 10. NON-EXISTENT / FICTIONAL LOCATIONS (Hogwarts, Stanford, etc.)
    const imaginaryLocations = ['hogwarts', 'stanford', 'harvard', 'mit', 'building z', 'hostel 99', 'alien', 'moon'];
    for (const loc of imaginaryLocations) {
      if (lower.includes(loc)) {
        return {
          response: `I couldn't find "${loc}" on the university campus. The digital twin tracks 12 authentic campus blocks including Academic Blocks (CS Block 34, Mechanical Block 32, Pharmacy Block 25), Central Library Block 37, Uni-Mall, UniPolis Arena, Residence Halls, and the Sports Complex. Check the main map to explore all 12 blocks!`,
          sessionId,
          timestamp,
          intent: 'unknown_location',
          suggestions: ['Is Block 34 free?', 'Check Central Library', 'Check Campus Mall', 'Show Campus Overview']
        };
      }
    }

    // 11. MAP COLORS & LEGEND EXPLANATION
    if (
      lower.includes('what do the colors mean') ||
      lower.includes('color meaning') ||
      lower.includes('legend') ||
      (lower.includes('color') && lower.includes('green')) ||
      (lower.includes('map') && lower.includes('legend'))
    ) {
      return {
        response: "🗺️ **Campus Map Color Indicators & Legend**:\n\n" +
          "• 🟢 **Emerald (<60% Load / Free)**: High room/facility availability, optimal study conditions, and plenty of vacant seats.\n" +
          "• 🟡 **Amber (60%–80% Load / Busy)**: Moderate occupancy, ongoing classes, or active hallway traffic.\n" +
          "• 🔴 **Rose (>80% Load / Congested)**: Peak saturation, few or no vacant classrooms, and high crowd concentration.\n\n" +
          "You can toggle between **Availability**, **Crowd Heatmap**, and **Events & Issues** layers on the top right map toolbar!",
        sessionId,
        timestamp,
        intent: 'map_legend',
        suggestions: ['Is Block 34 free?', 'Where to park near Gate 1?', "Check Crowd Heatmap", 'Report an Issue']
      };
    }

    // 12. SPECIFIC BUILDING OR ROOM INQUIRY (Check early so queries like "tell me about block 34" or "is library open" match directly)
    const bldgOrRoomResult = this.queryBuildingOrRoom(lower);
    if (bldgOrRoomResult.found && bldgOrRoomResult.building) {
      const b = bldgOrRoomResult.building;
      const statusEmoji = b.occupancy_pct >= 80 ? '🔴 Congested' : b.occupancy_pct >= 60 ? '🟡 Busy' : '🟢 Available';

      // Check if user specifically asked about rooms/free seats in this building
      if (lower.includes('room') || lower.includes('free') || lower.includes('lab') || lower.includes('seat') || lower.includes('vacant')) {
        let resp = `${statusEmoji} **${b.name} (${b.code})** is currently at **${b.occupancy_pct}% load** (${b.current_occupancy}/${b.total_capacity} occupants).`;
        if (b.free_rooms_count > 0) {
          const sample = b.free_rooms.slice(0, 3).map((r: any) => `**${r.name}** (Free until ${r.next_available_time})`).join(', ');
          resp += `\n\nThere are **${b.free_rooms_count} free rooms** available right now: ${sample}.`;
        } else {
          resp += `\n\nAll scheduled classrooms and labs in this block are currently in session.`;
        }
        if (b.active_issues_count > 0) {
          resp += ` *(Note: ${b.active_issues_count} open maintenance ticket(s) in this block).*`;
        }
        return {
          response: resp,
          sessionId,
          timestamp,
          intent: 'building_rooms',
          dataUsed: b,
          suggestions: [`Parking near ${b.code}`, 'Find free labs near me', 'Check Central Library', 'Campus Overview']
        };
      }

      // Check if user specifically asked about parking near this building
      if (lower.includes('park') || lower.includes('car') || lower.includes('vehicle')) {
        const parkingData = this.queryParking(lower);
        if (parkingData.matched_lot) {
          const lot = parkingData.matched_lot;
          return {
            response: `🚗 **Parking near ${b.name}**:\nYour closest facility is **${lot.name}**, currently featuring **${lot.open_spots} open spots** (${lot.occupancy_pct}% full) and **${lot.ev_available} EV charging bays** ready.`,
            sessionId,
            timestamp,
            intent: 'building_parking',
            dataUsed: lot,
            suggestions: [`Is ${b.code} free right now?`, 'Uni-Mall Food Court rush', "Today's Events"]
          };
        } else {
          const lot = parkingData.lots[0] || { name: 'Gate 1 GT Road Parking', open: 50, pct: 50, ev_open: 5 };
          return {
            response: `🚗 **Parking near ${b.name}**:\nRecommended facility is **${lot.name}**, currently featuring **${lot.open} open spots** (${lot.pct}% full) and **${lot.ev_open} EV charging bays** ready.`,
            sessionId,
            timestamp,
            intent: 'building_parking',
            dataUsed: lot,
            suggestions: [`Is ${b.code} free right now?`, 'Uni-Mall Food Court rush', "Today's Events"]
          };
        }
      }

      // General building information & status query
      let buildingResp = `🏛️ **${b.name} (${b.code})**\n\n` +
        `• **Overview**: ${b.description}\n` +
        `• **Real-Time Load**: ${statusEmoji} at **${b.occupancy_pct}% capacity** (${b.current_occupancy}/${b.total_capacity} people active).\n` +
        `• **Classrooms & Labs**: ${b.free_rooms_count > 0 ? `**${b.free_rooms_count} free spaces** available right now (including ${b.free_rooms.slice(0, 2).map((r: any) => r.name).join(', ')}).` : 'All classrooms currently occupied.'}\n`;

      if (b.facilities && b.facilities.length > 0) {
        buildingResp += `• **Facilities**: ${b.facilities.join(', ')}.\n`;
      }
      if (b.active_issues_count > 0) {
        buildingResp += `• **Alerts**: ${b.active_issues_count} active maintenance ticket(s) recorded in this block.\n`;
      }

      buildingResp += `\n💡 Click on this building on the main map to inspect its full interactive room-by-room floor plan!`;

      return {
        response: buildingResp,
        sessionId,
        timestamp,
        intent: 'building_overview',
        dataUsed: b,
        suggestions: [`Free rooms in ${b.code}`, `Parking near ${b.code}`, 'Check Central Library', 'Campus Overview']
      };
    } else if (bldgOrRoomResult.found && bldgOrRoomResult.room) {
      const r = bldgOrRoomResult.room;
      const statusColor = r.status === 'free' ? '🟢 Available' : '🔴 Occupied';
      return {
        response: `📍 **${r.name} (${r.building})**\n\n• **Status**: ${statusColor}\n• **Floor & Type**: Floor ${r.floor} • ${r.type.toUpperCase()}\n• **Occupancy**: ${r.current_occupancy} / ${r.capacity} seats\n• **Schedule**: Next class *"${r.next_class}"* (Available until ${r.next_available_time}).`,
        sessionId,
        timestamp,
        intent: 'room_detail',
        dataUsed: r,
        suggestions: ['Find other free labs', 'Is Block 34 free?', 'Campus Overview']
      };
    }

    // 13. GENERAL CLASSROOM, LAB & STUDY SPACE VACANCIES
    if (
      lower.includes('free') ||
      lower.includes('available') ||
      lower.includes('vacant') ||
      lower.includes('lab') ||
      lower.includes('room') ||
      lower.includes('classroom') ||
      lower.includes('study space') ||
      lower.includes('study pod') ||
      lower.includes('quiet place') ||
      lower.includes('where to study')
    ) {
      const freeSummary = this.queryFreeRooms(
        lower.includes('lab') ? 'lab' : lower.includes('study') ? 'study_room' : undefined
      );
      const roomList = freeSummary.sample_rooms
        .map((r: any) => `• **${r.name}** (${r.building}, Floor ${r.floor}) — free until **${r.next_available_time}** (${r.capacity} seats)`)
        .join('\n');

      return {
        response: `Across LPU campus, there are currently **${freeSummary.total_free} free spaces** ready for students! Here are top available options:\n\n${roomList}\n\n💡 Switch to the **"Classrooms & Labs"** tab to filter by department, floor, or room type.`,
        sessionId,
        timestamp,
        intent: 'room_availability',
        dataUsed: freeSummary,
        suggestions: ['Is Block 34 CSE free?', 'Check Central Library Block 37', 'Check Uni-Mall Food Court']
      };
    }

    // 14. CAMPUS EVENTS, FESTS & CONFERENCES
    if (/\b(event|events|fest|fests|hackathon|happening|today|youthvibe|concert|cultural|symposium)\b/i.test(lower)) {
      const eventData = this.queryEvents(lower);

      if (eventData.events.length === 0) {
        return {
          response: `No specific events matched your search term. However, there are ${eventData.total_events} scheduled flagship events today across LPU campus!`,
          sessionId,
          timestamp,
          intent: 'events',
          suggestions: ["Today's Events", 'Check UniPolis Arena', 'Campus Overview']
        };
      }

      const list = eventData.events
        .slice(0, 4)
        .map((e: any) => `• 🌟 **${e.title}** @ *${e.venue}*\n  Timing: ${e.start_time.split('T')[1]?.slice(0,5) || '10:00'} – ${e.end_time.split('T')[1]?.slice(0,5) || '18:00'} | Category: ${e.category} (~${e.attendees} attendees)`)
        .join('\n\n');

      return {
        response: `Here are the top flagship events happening at LPU today:\n\n${list}\n\n💡 Switch to the **"Events & Issues"** tab to see pinned map locations and venue directions!`,
        sessionId,
        timestamp,
        intent: 'events',
        dataUsed: eventData,
        suggestions: ['Check UniPolis Arena', 'YouthVibe Hackathon 2026', 'Campus Overview']
      };
    }

    // 15. PARKING INQUIRIES
    if (/\b(park|parking|car|cars|vehicle|vehicles|ev|evs|charging|bays|valet|lot|lots)\b/i.test(lower)) {
      const parkingData = this.queryParking(lower);

      if (parkingData.matched_lot) {
        const lot = parkingData.matched_lot;
        const warn = lot.is_critical ? '⚠️ High congestion! ' : '✅ Good availability! ';
        return {
          response: `${warn}**${lot.name}** currently has **${lot.open_spots} open bays** out of ${lot.total_capacity} (${lot.occupancy_pct}% full). EV Charging: **${lot.ev_available}/${lot.ev_spots} chargers free**.`,
          sessionId,
          timestamp,
          intent: 'parking',
          dataUsed: lot,
          suggestions: ['Gate 1 GT Road parking', 'UniPolis Event Parking', 'Block 34 Deck Parking', 'Campus Overview']
        };
      }

      const bestLot = [...parkingData.lots].sort((a, b) => b.open - a.open)[0] || { name: 'Gate 1 GT Road Parking', open: 0 };
      const lotSummary = parkingData.lots
        .map((l) => `• **${l.name}**: ${l.open}/${l.capacity} spots open (${l.pct}% full, ${l.ev_open} EV chargers)`)
        .join('\n');

      return {
        response: `🚗 **Campus Parking Status** (Overall: **${parkingData.occupancy_pct}% full**, **${parkingData.total_available} total spots open**):\n\n${lotSummary}\n\n💡 Your best option right now is **${bestLot.name}** with **${bestLot.open} open bays**!`,
        sessionId,
        timestamp,
        intent: 'parking',
        dataUsed: parkingData,
        suggestions: ['Parking near Uni-Mall', 'Gate 1 GT Road Parking', 'Block 34 Deck Parking']
      };
    }

    // 16. CROWD DENSITY & RUSH
    if (/\b(crowd|crowded|rush|busy|traffic|density|quiet|peaceful)\b/i.test(lower)) {
      const crowdData = this.queryCrowd(lower);

      if (crowdData.matched_zone) {
        const z = crowdData.matched_zone;
        const levelEmoji = z.density_score >= 80 ? '🔴 Critical' : z.density_score >= 60 ? '🟡 High' : '🟢 Moderate';
        return {
          response: `**${z.name}** is currently experiencing **${levelEmoji} crowd density** (Score: **${z.density_score}/100**). Use the Time Scrub slider in the "Crowd Density" tab to view rush playback throughout the day.`,
          sessionId,
          timestamp,
          intent: 'crowd',
          dataUsed: z,
          suggestions: ['Quietest place to study?', 'Check Block 37 Library', 'Uni-Mall Food Court rush']
        };
      }

      return {
        response: `👥 **Campus Crowd & Density Overview**:\n\n• **Busiest Hotspot**: **${crowdData.most_crowded.name}** with a density score of **${crowdData.most_crowded.density_score}/100** (High traffic zone).\n• **Quietest Spot**: **${crowdData.quietest.name}** with a density score of **${crowdData.quietest.density_score}/100** (Optimal for peaceful study).\n\n💡 Switch to the **"Crowd Density"** tab to scrub through the 24-hour timeline or watch the animated heatmap playback!`,
        sessionId,
        timestamp,
        intent: 'crowd',
        dataUsed: crowdData,
        suggestions: ['Is Uni-Mall crowded?', 'Is Block 37 Library busy?', 'Check Free Rooms']
      };
    }

    // 17. ISSUES, COMPLAINTS & MAINTENANCE
    if (
      lower.includes('issue') ||
      lower.includes('issues') ||
      lower.includes('problem') ||
      lower.includes('ticket') ||
      lower.includes('broken') ||
      lower.includes('repair') ||
      lower.includes('leak') ||
      lower.includes('complaint') ||
      lower.includes('report')
    ) {
      const issueData = this.queryIssues(lower);

      if (lower.includes('how') && lower.includes('report')) {
        return {
          response: "🛠️ **How to Report a Campus Maintenance Issue**:\n\n1. Click the **'Report Issue'** button in the top right of the **'Events & Issues'** tab (or click on any building card and select 'Report Ticket').\n2. Provide the location (e.g., Block 34, Uni-Mall, Central Library), category (Maintenance, Electrical, IT, Water, Safety), and a brief description.\n3. Submit the ticket — it immediately pins to the building on the digital map and notifies campus facilities teams!",
          sessionId,
          timestamp,
          intent: 'issues',
          suggestions: ['Active issues in Block 34', 'Show critical tickets', 'Campus Overview']
        };
      }

      if (issueData.active_issues.length > 0) {
        const ticketList = issueData.active_issues
          .slice(0, 3)
          .map((t) => `• **${t.title}** @ *${t.location}* (Priority: ${t.priority.toUpperCase()}, Status: ${t.status})`)
          .join('\n');

        return {
          response: `There are currently **${issueData.total_open_issues} active maintenance tickets** (${issueData.critical_issues} critical) being tracked:\n\n${ticketList}\n\nTrack real-time progress on the Kanban board in the **'Events & Issues'** tab.`,
          sessionId,
          timestamp,
          intent: 'issues',
          dataUsed: issueData,
          suggestions: ['How to report an issue?', 'Check Block 34 CSE', 'Campus Overview']
        };
      }

      return {
        response: "✅ Great news! There are currently no open maintenance issues recorded for this area. All facilities are operating normally.",
        sessionId,
        timestamp,
        intent: 'issues',
        suggestions: ['Campus Overview', 'Check Free Rooms', 'Parking Status']
      };
    }

    // 18. SMART KEYWORD MATCHING ACROSS LIVE DATABASE
    // If the query didn't match specific intents, search keywords in buildings, rooms, facilities, and events
    const stopWords = new Set(['the', 'and', 'for', 'are', 'what', 'where', 'how', 'who', 'why', 'can', 'you', 'tell', 'about', 'is', 'it', 'in', 'on', 'at', 'to', 'from', 'with', 'does', 'have', 'any', 'some', 'there', 'please']);
    const tokens = lower.split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !stopWords.has(t));

    if (tokens.length > 0) {
      const matchingBldgs = state.buildings.filter((b) =>
        tokens.some((tok) => b.name.toLowerCase().includes(tok) || b.code.toLowerCase().includes(tok) || b.description.toLowerCase().includes(tok))
      );
      const matchingEvents = state.events.filter((e) =>
        tokens.some((tok) => e.title.toLowerCase().includes(tok) || e.location_name.toLowerCase().includes(tok) || e.category.toLowerCase().includes(tok))
      );

      if (matchingBldgs.length > 0 || matchingEvents.length > 0) {
        let matchResp = `Regarding your query about **"${query.trim()}"**, here is what I found on campus:\n\n`;

        if (matchingBldgs.length > 0) {
          matchResp += `🏛️ **Matching Campus Blocks**:\n`;
          matchingBldgs.slice(0, 2).forEach((b) => {
            const occ = Math.round((b.current_occupancy / b.total_capacity) * 100);
            matchResp += `• **${b.name} (${b.code})**: ${b.description.slice(0, 100)}... (Currently at **${occ}% load** with **${b.rooms.filter(r => r.status === 'free').length} free rooms**).\n`;
          });
          matchResp += `\n`;
        }

        if (matchingEvents.length > 0) {
          matchResp += `🌟 **Relevant Campus Events**:\n`;
          matchingEvents.slice(0, 2).forEach((e) => {
            matchResp += `• **${e.title}** @ *${e.location_name}* (${e.category}, ~${e.expected_attendees} attendees).\n`;
          });
        }

        return {
          response: matchResp.trim(),
          sessionId,
          timestamp,
          intent: 'smart_search',
          dataUsed: { matchingBldgs, matchingEvents },
          suggestions: ['Is Block 34 free?', 'Parking near Uni-Mall', "Today's Events", 'Show Campus Overview']
        };
      }
    }

    // 19. INTELLIGENT DIRECT FALLBACK (Customized to user's question, NEVER a generic automated template)
    return {
      response: `I searched our live digital twin for **"${query.trim()}"**, but couldn't find a matching facility or live record. \n\nAs your LPU Campus Assistant, I can instantly check:\n• 🏫 **Classroom & Lab Availability** in Blocks 34, 32, 25, 37, or 13\n• 🚗 **Parking Vacancies & EV Chargers** at Gate 1, Block 34, Uni-Mall, or UniPolis\n• 🍽️ **Food Court & Dining status** at Uni-Mall\n• 🏅 **Sports Complex & Gym** at SDM Stadium\n• 👥 **Crowd Rush** and quiet study spots across campus\n\nWhat would you like to explore?`,
      sessionId,
      timestamp,
      intent: 'contextual_fallback',
      suggestions: ['Is Block 34 CSE free?', 'Where can I eat lunch?', 'Parking near Uni-Mall', "What's crowded right now?"]
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
