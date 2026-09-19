"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const database_1 = require("./database");
function seedDatabase() {
    (0, database_1.initDatabase)();
    const clearExisting = database_1.db.transaction(() => {
        database_1.db.exec(`
      DELETE FROM rooms;
      DELETE FROM facilities;
      DELETE FROM buildings;
      DELETE FROM parking_lots;
      DELETE FROM crowd_zones;
      DELETE FROM events;
      DELETE FROM issues;
      DELETE FROM sensor_readings;
    `);
    });
    clearExisting();
    // 1. Insert Buildings (University Campus Topology)
    const insertBuilding = database_1.db.prepare(`
    INSERT INTO buildings (id, name, code, type, x, y, width, height, floors, total_capacity, current_occupancy, status, description)
    VALUES (@id, @name, @code, @type, @x, @y, @width, @height, @floors, @total_capacity, @current_occupancy, @status, @description)
  `);
    const buildings = [
        {
            id: 'bldg-block-34',
            name: 'Block 34 – Computer Science & Engineering (CSE)',
            code: 'BLK-34',
            type: 'academic',
            x: 180,
            y: 120,
            width: 140,
            height: 100,
            floors: 5,
            total_capacity: 750,
            current_occupancy: 520,
            status: 'busy',
            description: 'Houses Computer Science, AI, Cloud Computing supercomputing clusters, and software development studios.'
        },
        {
            id: 'bldg-block-32',
            name: 'Block 32 – Mechanical & Robotics Engineering',
            code: 'BLK-32',
            type: 'academic',
            x: 360,
            y: 120,
            width: 150,
            height: 100,
            floors: 4,
            total_capacity: 700,
            current_occupancy: 410,
            status: 'normal',
            description: 'Mechanical, Mechatronics, Automotive engineering workshops, and CAD/CAM research labs.'
        },
        {
            id: 'bldg-block-25',
            name: 'Block 25 – Pharmaceutical Sciences & Bio-Tech',
            code: 'BLK-25',
            type: 'academic',
            x: 550,
            y: 120,
            width: 140,
            height: 100,
            floors: 4,
            total_capacity: 550,
            current_occupancy: 290,
            status: 'normal',
            description: 'Drug discovery wet labs, pharmacology suites, tissue culture rooms, and genetics research facilities.'
        },
        {
            id: 'bldg-block-37',
            name: 'Central Library & Knowledge Resource Centre',
            code: 'BLK-37',
            type: 'facility',
            x: 360,
            y: 280,
            width: 160,
            height: 120,
            floors: 5,
            total_capacity: 950,
            current_occupancy: 680,
            status: 'busy',
            description: 'Comprehensive university library with 1.5M+ books, automated RFID kiosks, digital archives, and quiet study pods.'
        },
        {
            id: 'bldg-unimall',
            name: 'Campus Commercial Complex & Central Food Court',
            code: 'UNIMALL',
            type: 'facility',
            x: 180,
            y: 280,
            width: 140,
            height: 110,
            floors: 3,
            total_capacity: 650,
            current_occupancy: 540,
            status: 'congested',
            description: 'Central campus lifestyle township hub featuring multi-cuisine dining, cafes, stationery, student store, and amenities.'
        },
        {
            id: 'bldg-admin',
            name: 'Senate House & Central Administration',
            code: 'BLK-01',
            type: 'admin',
            x: 560,
            y: 280,
            width: 130,
            height: 100,
            floors: 3,
            total_capacity: 320,
            current_occupancy: 160,
            status: 'normal',
            description: 'Offices of the University Administration, Vice-Chancellor Secretariat, Registrar, Admissions, and Campus Security.'
        },
        {
            id: 'bldg-block-13',
            name: 'Division of Student Welfare & Innovation Studios',
            code: 'BLK-13',
            type: 'academic',
            x: 730,
            y: 180,
            width: 130,
            height: 110,
            floors: 6,
            total_capacity: 500,
            current_occupancy: 240,
            status: 'normal',
            description: 'Student club headquarters, robotics incubator, music/theatre rehearsal spaces, and startup acceleration suites.'
        },
        {
            id: 'bldg-unipolis',
            name: 'University Grand Amphitheatre & Convention Arena',
            code: 'UNIPOLIS',
            type: 'facility',
            x: 730,
            y: 330,
            width: 140,
            height: 120,
            floors: 2,
            total_capacity: 1500,
            current_occupancy: 220,
            status: 'normal',
            description: 'Iconic 10,000+ seat open-air convention arena hosting convocations, international symposiums, and cultural festivals.'
        },
        {
            id: 'bldg-bh-4',
            name: 'North Residence Hall (Hostel B4)',
            code: 'BH-04',
            type: 'hostel',
            x: 170,
            y: 440,
            width: 150,
            height: 110,
            floors: 7,
            total_capacity: 750,
            current_occupancy: 510,
            status: 'normal',
            description: 'Multi-storey residential wing for undergraduate engineering students with mess, gym, and 24/7 security.'
        },
        {
            id: 'bldg-gh-2',
            name: 'South Residence Hall (Hostel G2)',
            code: 'GH-02',
            type: 'hostel',
            x: 360,
            y: 440,
            width: 150,
            height: 110,
            floors: 7,
            total_capacity: 700,
            current_occupancy: 480,
            status: 'normal',
            description: 'Dedicated gated residence hall for students with biometric turnstiles, reading lounges, in-house dining, and recreation.'
        },
        {
            id: 'bldg-sports',
            name: 'Olympic Sports Complex & Indoor Stadium',
            code: 'SDM-IND',
            type: 'sports',
            x: 550,
            y: 440,
            width: 150,
            height: 120,
            floors: 3,
            total_capacity: 900,
            current_occupancy: 380,
            status: 'normal',
            description: 'Olympic-grade heated swimming pool, 12 synthetic badminton courts, squash arenas, basketball court, and athletic gym.'
        },
        {
            id: 'bldg-med',
            name: 'University Health Centre & 24/7 Medical Clinic',
            code: 'UNI-HOSP',
            type: 'facility',
            x: 730,
            y: 480,
            width: 120,
            height: 80,
            floors: 2,
            total_capacity: 180,
            current_occupancy: 55,
            status: 'normal',
            description: '24/7 campus health center, emergency trauma care, medical dispensary, and diagnostic testing facility.'
        }
    ];
    const seedBuildings = database_1.db.transaction(() => {
        for (const b of buildings)
            insertBuilding.run(b);
    });
    seedBuildings();
    // 2. Insert Rooms / Labs across Academic Blocks
    const insertRoom = database_1.db.prepare(`
    INSERT INTO rooms (id, building_id, name, floor, type, capacity, current_occupancy, status, next_class, next_available_time, sensor_id)
    VALUES (@id, @building_id, @name, @floor, @type, @capacity, @current_occupancy, @status, @next_class, @next_available_time, @sensor_id)
  `);
    const rooms = [
        // Block 34 (CSE & IT)
        { id: 'rm-b34-101', building_id: 'bldg-block-34', name: 'Lecture Theatre 34-101', floor: 1, type: 'classroom', capacity: 120, current_occupancy: 98, status: 'occupied', next_class: 'CSE320: Distributed Systems & Clouds at 14:00', next_available_time: '15:30', sensor_id: 'iot-rm-b34-101' },
        { id: 'rm-b34-102', building_id: 'bldg-block-34', name: 'Smart Classroom 34-102', floor: 1, type: 'classroom', capacity: 60, current_occupancy: 0, status: 'free', next_class: 'CSE205: Data Structures & Algorithms at 15:00', next_available_time: 'Now', sensor_id: 'iot-rm-b34-102' },
        { id: 'rm-b34-201', building_id: 'bldg-block-34', name: 'AI & Deep Learning Supercomputing Lab', floor: 2, type: 'lab', capacity: 45, current_occupancy: 42, status: 'occupied', next_class: 'INT404: Neural Networks & PyTorch at 16:00', next_available_time: '17:30', sensor_id: 'iot-rm-b34-201' },
        { id: 'rm-b34-202', building_id: 'bldg-block-34', name: 'Linux Kernel & Systems Lab 202', floor: 2, type: 'lab', capacity: 40, current_occupancy: 38, status: 'occupied', next_class: 'CSE316: Operating Systems Internals at 14:30', next_available_time: '16:00', sensor_id: 'iot-rm-b34-202' },
        { id: 'rm-b34-301', building_id: 'bldg-block-34', name: 'Cybersecurity & Ethical Hacking Sandbox', floor: 3, type: 'lab', capacity: 35, current_occupancy: 0, status: 'free', next_class: 'CSE455: Network Penetration Testing at 16:30', next_available_time: 'Now', sensor_id: 'iot-rm-b34-301' },
        { id: 'rm-b34-302', building_id: 'bldg-block-34', name: 'Block 34 Seminar Hall', floor: 3, type: 'seminar_hall', capacity: 90, current_occupancy: 0, status: 'scheduled', next_class: 'Tech Talk: Generative AI at Scale at 13:30', next_available_time: '14:45', sensor_id: 'iot-rm-b34-302' },
        { id: 'rm-b34-401', building_id: 'bldg-block-34', name: 'AWS Cloud Architecture Research Room', floor: 4, type: 'lab', capacity: 30, current_occupancy: 24, status: 'occupied', next_class: 'CSE430: Cloud Infrastructure at 15:00', next_available_time: '16:30', sensor_id: 'iot-rm-b34-401' },
        { id: 'rm-b34-402', building_id: 'bldg-block-34', name: 'Postgrad Coding Pod 34-4A', floor: 4, type: 'study_room', capacity: 16, current_occupancy: 7, status: 'free', next_class: 'Open Research Access', next_available_time: 'Now', sensor_id: 'iot-rm-b34-402' },
        // Block 32 (Mechanical & Robotics)
        { id: 'rm-b32-101', building_id: 'bldg-block-32', name: 'Mechatronics & Robotics Workshop', floor: 1, type: 'lab', capacity: 50, current_occupancy: 45, status: 'occupied', next_class: 'MEC304: Industrial Robotics at 14:00', next_available_time: '16:00', sensor_id: 'iot-rm-b32-101' },
        { id: 'rm-b32-102', building_id: 'bldg-block-32', name: 'Automotive & Engine Diagnostic Lab', floor: 1, type: 'lab', capacity: 45, current_occupancy: 0, status: 'free', next_class: 'AUT201: Internal Combustion Engines at 15:30', next_available_time: 'Now', sensor_id: 'iot-rm-b32-102' },
        { id: 'rm-b32-201', building_id: 'bldg-block-32', name: 'CATIA & SolidWorks CAD Studio', floor: 2, type: 'lab', capacity: 60, current_occupancy: 48, status: 'occupied', next_class: 'MEC410: Finite Element Simulation at 15:00', next_available_time: '17:00', sensor_id: 'iot-rm-b32-201' },
        { id: 'rm-b32-202', building_id: 'bldg-block-32', name: 'Auditorium 32-202', floor: 2, type: 'classroom', capacity: 140, current_occupancy: 0, status: 'scheduled', next_class: 'ENG101: Engineering Mechanics at 14:00', next_available_time: '15:15', sensor_id: 'iot-rm-b32-202' },
        { id: 'rm-b32-301', building_id: 'bldg-block-32', name: 'Aerospace Wind Tunnel Facility', floor: 3, type: 'lab', capacity: 25, current_occupancy: 18, status: 'occupied', next_class: 'AER402: Aerodynamic Drag Analysis at 16:00', next_available_time: '17:30', sensor_id: 'iot-rm-b32-301' },
        { id: 'rm-b32-302', building_id: 'bldg-block-32', name: 'Classroom 32-302', floor: 3, type: 'classroom', capacity: 55, current_occupancy: 0, status: 'free', next_class: 'MTH302: Applied Engineering Mathematics at 16:00', next_available_time: 'Now', sensor_id: 'iot-rm-b32-302' },
        // Block 25 (Pharmacy & Bio-Tech)
        { id: 'rm-b25-101', building_id: 'bldg-block-25', name: 'Pharmaceutics Formulation Wet Lab', floor: 1, type: 'lab', capacity: 40, current_occupancy: 36, status: 'occupied', next_class: 'PHR301: Dosage Form Design at 14:30', next_available_time: '16:30', sensor_id: 'iot-rm-b25-101' },
        { id: 'rm-b25-102', building_id: 'bldg-block-25', name: 'Pharmacology & Toxicology Lab', floor: 1, type: 'lab', capacity: 40, current_occupancy: 0, status: 'free', next_class: 'PHR202: Drug Screening Mechanisms at 15:00', next_available_time: 'Now', sensor_id: 'iot-rm-b25-102' },
        { id: 'rm-b25-201', building_id: 'bldg-block-25', name: 'Biotech Genetic Engineering Suite', floor: 2, type: 'lab', capacity: 30, current_occupancy: 22, status: 'occupied', next_class: 'BT405: CRISPR & Recombinant DNA at 15:30', next_available_time: '17:00', sensor_id: 'iot-rm-b25-201' },
        { id: 'rm-b25-202', building_id: 'bldg-block-25', name: 'Pharmacy Lecture Hall 25-202', floor: 2, type: 'classroom', capacity: 130, current_occupancy: 110, status: 'occupied', next_class: 'BIO101: Cell Biology & Biochemistry at 14:00', next_available_time: '15:30', sensor_id: 'iot-rm-b25-202' },
        { id: 'rm-b25-301', building_id: 'bldg-block-25', name: 'Molecular Biology Clean Room', floor: 3, type: 'lab', capacity: 35, current_occupancy: 0, status: 'free', next_class: 'BT410: Protein Engineering at 16:00', next_available_time: 'Now', sensor_id: 'iot-rm-b25-301' },
        // Block 37 (Central Library)
        { id: 'rm-b37-101', building_id: 'bldg-block-37', name: 'Ground Reading Commons & Digital Kiosks', floor: 1, type: 'study_room', capacity: 220, current_occupancy: 185, status: 'occupied', next_class: 'Open Reading Commons', next_available_time: 'Now (High Traffic)', sensor_id: 'iot-rm-b37-101' },
        { id: 'rm-b37-201', building_id: 'bldg-block-37', name: 'E-Library & Digital Multimedia Lab', floor: 2, type: 'lab', capacity: 50, current_occupancy: 20, status: 'free', next_class: 'Workshop: IEEE Research Database Access at 16:00', next_available_time: 'Now', sensor_id: 'iot-rm-b37-201' },
        { id: 'rm-b37-301', building_id: 'bldg-block-37', name: 'Silent Research Reading Floor 3', floor: 3, type: 'study_room', capacity: 200, current_occupancy: 165, status: 'occupied', next_class: 'Silent Study All Day', next_available_time: 'Now', sensor_id: 'iot-rm-b37-301' },
        { id: 'rm-b37-401', building_id: 'bldg-block-37', name: 'Scholars Discussion Pod 37-4A', floor: 4, type: 'study_room', capacity: 12, current_occupancy: 0, status: 'free', next_class: 'Faculty Book Discussion at 15:00', next_available_time: 'Now', sensor_id: 'iot-rm-b37-401' },
        { id: 'rm-b37-402', building_id: 'bldg-block-37', name: 'Scholars Discussion Pod 37-4B', floor: 4, type: 'study_room', capacity: 12, current_occupancy: 9, status: 'occupied', next_class: 'PhD Viva Defense Prep at 14:00', next_available_time: '16:00', sensor_id: 'iot-rm-b37-402' },
        { id: 'rm-b37-501', building_id: 'bldg-block-37', name: 'Special Archives & Rare Manuscripts Hall', floor: 5, type: 'study_room', capacity: 35, current_occupancy: 8, status: 'free', next_class: 'Historical Archives Access', next_available_time: 'Now', sensor_id: 'iot-rm-b37-501' },
        // Block 13 (DSW & Innovation)
        { id: 'rm-b13-101', building_id: 'bldg-block-13', name: 'Robotics & Hardware Makerspace', floor: 1, type: 'lab', capacity: 50, current_occupancy: 38, status: 'occupied', next_class: 'Workshop: 3D Rapid Prototyping at 15:00', next_available_time: '16:30', sensor_id: 'iot-rm-b13-101' },
        { id: 'rm-b13-201', building_id: 'bldg-block-13', name: 'Student Startup Incubator Pitch Arena', floor: 2, type: 'seminar_hall', capacity: 110, current_occupancy: 0, status: 'scheduled', next_class: 'Angel Investor Pitch Day at 14:00', next_available_time: '16:30', sensor_id: 'iot-rm-b13-201' },
        { id: 'rm-b13-301', building_id: 'bldg-block-13', name: 'Media Production & Digital Arts Studio', floor: 3, type: 'lab', capacity: 35, current_occupancy: 14, status: 'free', next_class: 'Music Studio Rehearsal at 16:30', next_available_time: 'Now', sensor_id: 'iot-rm-b13-301' },
        // Block 1 (Administration)
        { id: 'rm-adm-101', building_id: 'bldg-admin', name: 'Academic Council Boardroom 101', floor: 1, type: 'seminar_hall', capacity: 40, current_occupancy: 28, status: 'occupied', next_class: 'University Senate Meeting at 13:00', next_available_time: '15:00', sensor_id: 'iot-rm-adm-101' },
        { id: 'rm-adm-201', building_id: 'bldg-admin', name: 'Student Services & Academic Advising Desk', floor: 2, type: 'study_room', capacity: 25, current_occupancy: 8, status: 'free', next_class: 'Walk-in Student Services Desk', next_available_time: 'Now', sensor_id: 'iot-rm-adm-201' },
        // Olympic Sports Complex
        { id: 'rm-sdm-101', building_id: 'bldg-sports', name: 'Synthetic Badminton Courts 1-6', floor: 1, type: 'classroom', capacity: 120, current_occupancy: 85, status: 'occupied', next_class: 'Varsity Badminton Practice at 15:30', next_available_time: '17:00', sensor_id: 'iot-rm-sdm-101' },
        { id: 'rm-sdm-102', building_id: 'bldg-sports', name: 'Aerobics & Yoga Studio', floor: 2, type: 'study_room', capacity: 45, current_occupancy: 0, status: 'free', next_class: 'Evening Power Yoga at 17:00', next_available_time: 'Now', sensor_id: 'iot-rm-sdm-102' },
        // Boys Hostel 4 (BH-4)
        { id: 'rm-bh4-101', building_id: 'bldg-bh-4', name: 'BH-4 Student Common Lounge & TV Room', floor: 1, type: 'study_room', capacity: 70, current_occupancy: 35, status: 'free', next_class: 'Open Resident Lounge', next_available_time: 'Now', sensor_id: 'iot-rm-bh4-101' },
        { id: 'rm-bh4-201', building_id: 'bldg-bh-4', name: 'BH-4 Floor 2 Night Study Room', floor: 2, type: 'study_room', capacity: 35, current_occupancy: 22, status: 'occupied', next_class: 'Silent Study All Day', next_available_time: 'Now', sensor_id: 'iot-rm-bh4-201' },
        { id: 'rm-bh4-301', building_id: 'bldg-bh-4', name: 'BH-4 Tech Coding Den 3A', floor: 3, type: 'study_room', capacity: 15, current_occupancy: 0, status: 'free', next_class: 'Peer Study All Night', next_available_time: 'Now', sensor_id: 'iot-rm-bh4-301' },
        // Girls Hostel 2 (GH-2)
        { id: 'rm-gh2-101', building_id: 'bldg-gh-2', name: 'GH-2 Recreation & Reading Atrium', floor: 1, type: 'study_room', capacity: 65, current_occupancy: 40, status: 'occupied', next_class: 'Hostel Committee Meet at 18:00', next_available_time: '19:30', sensor_id: 'iot-rm-gh2-101' },
        { id: 'rm-gh2-201', building_id: 'bldg-gh-2', name: 'GH-2 Quiet Study Suite Floor 2', floor: 2, type: 'study_room', capacity: 25, current_occupancy: 9, status: 'free', next_class: 'Group Study Hours', next_available_time: 'Now', sensor_id: 'iot-rm-gh2-201' },
        { id: 'rm-gh2-301', building_id: 'bldg-gh-2', name: 'GH-2 Music & Practice Booth', floor: 3, type: 'lab', capacity: 10, current_occupancy: 5, status: 'occupied', next_class: 'Vocal Rehearsal at 17:00', next_available_time: '18:30', sensor_id: 'iot-rm-gh2-301' },
        // University Health Center
        { id: 'rm-med-101', building_id: 'bldg-med', name: '24/7 Emergency Triage & Trauma Suite', floor: 1, type: 'lab', capacity: 20, current_occupancy: 8, status: 'occupied', next_class: 'Emergency Walk-in Priority', next_available_time: 'Now', sensor_id: 'iot-rm-med-101' },
        { id: 'rm-med-201', building_id: 'bldg-med', name: 'Medical Diagnostics & Pathology Lab', floor: 2, type: 'lab', capacity: 15, current_occupancy: 5, status: 'occupied', next_class: 'Diagnostic Screening', next_available_time: '16:00', sensor_id: 'iot-rm-med-201' },
        // Convention Arena
        { id: 'rm-unip-101', building_id: 'bldg-unipolis', name: 'Grand Arena Green Room & VIP Briefing Suite', floor: 1, type: 'seminar_hall', capacity: 45, current_occupancy: 0, status: 'free', next_class: 'Dignitary Briefing at 14:00', next_available_time: 'Now', sensor_id: 'iot-rm-unip-101' },
        { id: 'rm-unip-102', building_id: 'bldg-unipolis', name: 'Arena Broadcast & Acoustics Control', floor: 2, type: 'lab', capacity: 18, current_occupancy: 10, status: 'occupied', next_class: 'Sound Check & Livestream Setup', next_available_time: '17:00', sensor_id: 'iot-rm-unip-102' }
    ];
    const seedRooms = database_1.db.transaction(() => {
        for (const r of rooms)
            insertRoom.run(r);
    });
    seedRooms();
    // 3. Insert Parking Lots (Campus Gates & Multi-Decks)
    const insertParking = database_1.db.prepare(`
    INSERT INTO parking_lots (id, name, location, x, y, total_capacity, current_occupied, status, ev_charging_spots, ev_occupied, sensor_id)
    VALUES (@id, @name, @location, @x, @y, @total_capacity, @current_occupied, @status, @ev_charging_spots, @ev_occupied, @sensor_id)
  `);
    const parkingLots = [
        {
            id: 'park-gate1',
            name: 'North Main Gate Visitor & Staff Parking (P1)',
            location: 'Adjacent to North Main Entrance Gateway & Senate House',
            x: 140,
            y: 70,
            total_capacity: 220,
            current_occupied: 202,
            status: 'filling',
            ev_charging_spots: 20,
            ev_occupied: 17,
            sensor_id: 'iot-park-gate1'
        },
        {
            id: 'park-block34',
            name: 'Engineering Academic Quad Parking (P2)',
            location: 'North of Computer Science & Mechanical Engineering Blocks',
            x: 390,
            y: 70,
            total_capacity: 280,
            current_occupied: 260,
            status: 'filling',
            ev_charging_spots: 28,
            ev_occupied: 25,
            sensor_id: 'iot-park-block34'
        },
        {
            id: 'park-unipolis',
            name: 'Convention Arena & Stadium Event Parking (P4)',
            location: 'South perimeter near Convention Arena & Sports Complex',
            x: 580,
            y: 600,
            total_capacity: 380,
            current_occupied: 175,
            status: 'available',
            ev_charging_spots: 30,
            ev_occupied: 12,
            sensor_id: 'iot-park-unipolis'
        },
        {
            id: 'park-unimall',
            name: 'Campus Mall & Student Housing Multi-Deck Parking (P3)',
            location: 'Between Campus Mall and North Residence Hall',
            x: 270,
            y: 590,
            total_capacity: 200,
            current_occupied: 184,
            status: 'filling',
            ev_charging_spots: 16,
            ev_occupied: 14,
            sensor_id: 'iot-park-unimall'
        }
    ];
    const seedParking = database_1.db.transaction(() => {
        for (const p of parkingLots)
            insertParking.run(p);
    });
    seedParking();
    // 4. Insert Facilities
    const insertFacility = database_1.db.prepare(`
    INSERT INTO facilities (id, name, type, building_id, capacity, current_occupancy, operating_hours, status, peak_hours, sensor_id)
    VALUES (@id, @name, @type, @building_id, @capacity, @current_occupancy, @operating_hours, @status, @peak_hours, @sensor_id)
  `);
    const facilities = [
        {
            id: 'fac-lib',
            name: 'Central Library & Research Commons',
            type: 'library',
            building_id: 'bldg-block-37',
            capacity: 950,
            current_occupancy: 680,
            operating_hours: '07:00 - 24:00',
            status: 'open',
            peak_hours: '14:00 - 18:00',
            sensor_id: 'iot-fac-lib'
        },
        {
            id: 'fac-canteen',
            name: 'Campus Mall Central Food Court & Dining Common',
            type: 'canteen',
            building_id: 'bldg-unimall',
            capacity: 650,
            current_occupancy: 540,
            operating_hours: '07:30 - 23:00',
            status: 'crowded',
            peak_hours: '12:00 - 14:30',
            sensor_id: 'iot-fac-canteen'
        },
        {
            id: 'fac-gym',
            name: 'Olympic Fitness & Conditioning Centre',
            type: 'gym',
            building_id: 'bldg-sports',
            capacity: 250,
            current_occupancy: 130,
            operating_hours: '06:00 - 22:00',
            status: 'open',
            peak_hours: '17:00 - 20:00',
            sensor_id: 'iot-fac-gym'
        },
        {
            id: 'fac-audi',
            name: 'University Grand Amphitheatre & Convention Arena',
            type: 'auditorium',
            building_id: 'bldg-unipolis',
            capacity: 1500,
            current_occupancy: 220,
            operating_hours: '08:00 - 23:00',
            status: 'open',
            peak_hours: '18:00 - 22:00',
            sensor_id: 'iot-fac-audi'
        },
        {
            id: 'fac-makerspace',
            name: 'Student Innovation & Robotics Makerspace (Block 13)',
            type: 'lab',
            building_id: 'bldg-block-13',
            capacity: 90,
            current_occupancy: 52,
            operating_hours: '08:00 - 23:00',
            status: 'open',
            peak_hours: '14:00 - 19:00',
            sensor_id: 'iot-fac-maker'
        }
    ];
    const seedFacilities = database_1.db.transaction(() => {
        for (const f of facilities)
            insertFacility.run(f);
    });
    seedFacilities();
    // 5. Insert Crowd Zones (Key Campus Foot-Traffic Nodes)
    const insertCrowdZone = database_1.db.prepare(`
    INSERT INTO crowd_zones (id, name, zone_type, density_level, density_score, x, y, radius)
    VALUES (@id, @name, @zone_type, @density_level, @density_score, @x, @y, @radius)
  `);
    const crowdZones = [
        { id: 'zone-canteen-plaza', name: 'Campus Mall Plaza & Food Court', zone_type: 'plaza', density_level: 'critical', density_score: 91, x: 250, y: 335, radius: 65 },
        { id: 'zone-lib-concourse', name: 'Central Library Concourse', zone_type: 'concourse', density_level: 'high', density_score: 74, x: 440, y: 340, radius: 70 },
        { id: 'zone-tech-walk', name: 'Engineering Academic Spine (Blocks 34-32)', zone_type: 'walkway', density_level: 'medium', density_score: 58, x: 270, y: 170, radius: 50 },
        { id: 'zone-central-quad', name: 'Central Lawn & Academic Amphitheatre', zone_type: 'quad', density_level: 'medium', density_score: 52, x: 450, y: 220, radius: 60 },
        { id: 'zone-sci-promenade', name: 'Bio-Tech & Pharmacy Promenade (Block 25)', zone_type: 'walkway', density_level: 'low', density_score: 30, x: 620, y: 170, radius: 45 },
        { id: 'zone-hostel-spine', name: 'Residence Hall Walkway (Hostels B4 & G2)', zone_type: 'quad', density_level: 'medium', density_score: 64, x: 330, y: 495, radius: 55 },
        { id: 'zone-sports-plaza', name: 'Olympic Stadium Forecourt', zone_type: 'plaza', density_level: 'low', density_score: 36, x: 625, y: 500, radius: 50 },
        { id: 'zone-innov-atrium', name: 'Student Welfare & Innovation Atrium', zone_type: 'concourse', density_level: 'low', density_score: 40, x: 795, y: 235, radius: 50 }
    ];
    const seedCrowd = database_1.db.transaction(() => {
        for (const z of crowdZones)
            insertCrowdZone.run(z);
    });
    seedCrowd();
    // 6. Insert Events (University Campus Life)
    const insertEvent = database_1.db.prepare(`
    INSERT INTO events (id, title, description, location_id, location_name, start_time, end_time, category, organizer, expected_attendees)
    VALUES (@id, @title, @description, @location_id, @location_name, @start_time, @end_time, @category, @organizer, @expected_attendees)
  `);
    const events = [
        {
            id: 'evt-hackathon',
            title: 'Annual Smart Campus Hackathon 2026: AI & IoT',
            description: 'Annual 48-hour national flagship hackathon focusing on IoT telemetry, digital twins, and autonomous campus operations.',
            location_id: 'bldg-block-34',
            location_name: 'Block 34 CSE - Advanced Cloud Lab 301',
            start_time: '2026-09-18T10:00:00Z',
            end_time: '2026-09-20T18:00:00Z',
            category: 'hackathon',
            organizer: 'University Developer Student Club & School of Computing',
            expected_attendees: 400
        },
        {
            id: 'evt-keynote',
            title: 'Annual Campus Cultural Gala & Showcase',
            description: 'Campus-wide celebration highlighting diverse cultural heritage, regional dances, and global arts.',
            location_id: 'bldg-unipolis',
            location_name: 'University Grand Amphitheatre & Arena',
            start_time: '2026-09-18T15:00:00Z',
            end_time: '2026-09-18T18:00:00Z',
            category: 'cultural',
            organizer: 'Division of Student Welfare & Campus Activities Board',
            expected_attendees: 1200
        },
        {
            id: 'evt-football',
            title: 'All-University Inter-Collegiate Badminton Championship',
            description: 'Collegiate tournament hosted at the Olympic Sports Complex with top varsity players.',
            location_id: 'bldg-sports',
            location_name: 'Olympic Sports Complex & Indoor Stadium',
            start_time: '2026-09-18T18:00:00Z',
            end_time: '2026-09-18T21:30:00Z',
            category: 'sports',
            organizer: 'University Athletics Department',
            expected_attendees: 850
        },
        {
            id: 'evt-career-fair',
            title: 'Annual Campus Career Expo 2026: Technology Recruitment',
            description: 'Over 65 global tech and engineering organizations interviewing graduating students for engineering and software roles.',
            location_id: 'bldg-block-37',
            location_name: 'Central Library Exhibition Hall',
            start_time: '2026-09-19T09:00:00Z',
            end_time: '2026-09-19T17:00:00Z',
            category: 'seminar',
            organizer: 'Centre for Career Advancement & Placements',
            expected_attendees: 1500
        },
        {
            id: 'evt-cultural',
            title: 'International Student Cultural Fest & Food Fair',
            description: 'International students presenting traditional music, attire exhibitions, and world street food kiosks.',
            location_id: 'bldg-unimall',
            location_name: 'Campus Mall Plaza & Student Square',
            start_time: '2026-09-18T19:00:00Z',
            end_time: '2026-09-18T22:30:00Z',
            category: 'cultural',
            organizer: 'Office of International Student Programs',
            expected_attendees: 600
        }
    ];
    const seedEvents = database_1.db.transaction(() => {
        for (const e of events)
            insertEvent.run(e);
    });
    seedEvents();
    // 7. Insert Issues (Campus Operations)
    const insertIssue = database_1.db.prepare(`
    INSERT INTO issues (id, title, description, location_id, location_name, reported_by, category, priority, status, created_at, resolved_at)
    VALUES (@id, @title, @description, @location_id, @location_name, @reported_by, @category, @priority, @status, @created_at, @resolved_at)
  `);
    const issues = [
        {
            id: 'iss-101',
            title: 'Server Rack Cooling Fan Warning in High-Performance GPU Lab',
            description: 'High ambient temperature (28.4°C) in Block 34 3rd floor rack; server throttling detected.',
            location_id: 'bldg-block-34',
            location_name: 'Block 34 CSE - Room 302 (AI Lab)',
            reported_by: 'Dr. Amritpal Singh (Faculty, CSE)',
            category: 'maintenance',
            priority: 'high',
            status: 'in-progress',
            created_at: '2026-09-18T11:20:00Z',
            resolved_at: null
        },
        {
            id: 'iss-102',
            title: 'WiFi AP-37 High Packet Loss on Reading Floor 3',
            description: '5GHz access point dropping connections near silent research study pods in Central Library.',
            location_id: 'bldg-block-37',
            location_name: 'Central Library - Level 3 Reading Wing',
            reported_by: 'Kavita Sharma (Research Scholar)',
            category: 'it',
            priority: 'medium',
            status: 'open',
            created_at: '2026-09-18T12:05:00Z',
            resolved_at: null
        },
        {
            id: 'iss-103',
            title: 'North Main Gate 1 RFID Barrier Latency',
            description: 'Automatic vehicle barrier sensor experiencing delay during peak morning staff entry at North Gate.',
            location_id: 'park-gate1',
            location_name: 'North Main Gate Visitor & Staff Parking (P1)',
            reported_by: 'Campus Security Control Room',
            category: 'electrical',
            priority: 'medium',
            status: 'in-progress',
            created_at: '2026-09-18T09:45:00Z',
            resolved_at: null
        },
        {
            id: 'iss-104',
            title: 'Water Dispenser Purifier Filter Service Due',
            description: 'RO water purification unit blinking red filter replacement LED near Pharmacy labs.',
            location_id: 'bldg-block-25',
            location_name: 'Block 25 Pharmacy - Floor 2',
            reported_by: 'Estate Maintenance Team',
            category: 'water',
            priority: 'low',
            status: 'open',
            created_at: '2026-09-18T12:40:00Z',
            resolved_at: null
        },
        {
            id: 'iss-105',
            title: 'South Residence Hall Corridor Emergency Light Fixture Flicker',
            description: 'Wing B 2nd-floor corridor LED emergency fitting flickering intermittently.',
            location_id: 'bldg-gh-2',
            location_name: 'South Residence Hall (Hostel G2) - Wing B',
            reported_by: 'Hostel Warden Office',
            category: 'safety',
            priority: 'medium',
            status: 'resolved',
            created_at: '2026-09-18T08:15:00Z',
            resolved_at: '2026-09-18T11:00:00Z'
        },
        {
            id: 'iss-106',
            title: 'Grand Arena Line-Array Acoustic Audio Feed Handshake Issue',
            description: 'Stage monitor DSP unit requires sync reset before 4 PM technical rehearsal.',
            location_id: 'bldg-unipolis',
            location_name: 'University Grand Amphitheatre Stage',
            reported_by: 'Campus AV Production Crew',
            category: 'it',
            priority: 'critical',
            status: 'in-progress',
            created_at: '2026-09-18T12:55:00Z',
            resolved_at: null
        }
    ];
    const seedIssues = database_1.db.transaction(() => {
        for (const i of issues)
            insertIssue.run(i);
    });
    seedIssues();
    // 8. Seed Initial Sensor Readings
    const insertSensor = database_1.db.prepare(`
    INSERT INTO sensor_readings (sensor_id, sensor_type, source_ref, value, timestamp, quality)
    VALUES (@sensor_id, @sensor_type, @source_ref, @value, @timestamp, @quality)
  `);
    const initialReadings = [
        { sensor_id: 'iot-rm-b34-101', sensor_type: 'occupancy', source_ref: 'rm-b34-101', value: 98, timestamp: new Date().toISOString(), quality: 'good' },
        { sensor_id: 'iot-rm-b34-201', sensor_type: 'occupancy', source_ref: 'rm-b34-201', value: 42, timestamp: new Date().toISOString(), quality: 'good' },
        { sensor_id: 'iot-park-gate1', sensor_type: 'parking', source_ref: 'park-gate1', value: 202, timestamp: new Date().toISOString(), quality: 'good' },
        { sensor_id: 'iot-fac-lib', sensor_type: 'occupancy', source_ref: 'fac-lib', value: 680, timestamp: new Date().toISOString(), quality: 'good' },
        { sensor_id: 'iot-zone-canteen', sensor_type: 'crowd', source_ref: 'zone-canteen-plaza', value: 91, timestamp: new Date().toISOString(), quality: 'good' }
    ];
    const seedSensors = database_1.db.transaction(() => {
        for (const s of initialReadings)
            insertSensor.run(s);
    });
    seedSensors();
    console.log('Campus Digital Twin database seeded successfully with comprehensive university topology, blocks, hostels, and facilities!');
}
if (require.main === module) {
    seedDatabase();
}
