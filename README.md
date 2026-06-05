IRCTC Unified Chart Vacancy Simulator

A full-stack companion tool for Indian Railways Reservation Charts. It enables travelers to lookup schedules, decode PNR profiles, inspect real-time chart composition/vacant berths, visualize coach maps, and book vacant seat segments in a local simulation sandbox.

 🎯 Purpose of the Project

This application acts as a companion system to improve the usability and convenience of Indian Railways chart vacancy tracking. It addresses several limitations of the official IRCTC portal:

Unified Multi-Train Comparison**: Rather than querying reservation charts train-by-train and class-by-class, users can compare vacant seats across multiple trains side-by-side on a single route.
Visual Coach Map & Seat Locator**: Renders detailed interactive 2D layout diagrams (for 1A, 2A, 3A, SL, CC, EC coaches) so travelers can see exactly where vacant seats are (e.g., Lower, Upper, Aisle, Window) instead of reading a plain text list.
Co-traveler & Upgrade Seating (PNR Locator)**: Decodes ticket status from PNR numbers to pinpoint your assigned seat on the visual map, helping you check for nearby vacant berths to coordinate seating with split family members or find vacancy segments for upgrade opportunities.
Background Notification Tracking**: Runs a lightweight background loop that plays a chime sound and triggers a desktop push notification the minute a tracked train's reservation chart is prepared, helping users catch empty berths as early as possible.
Local Transaction Sandbox**: Simulates TTE and booking transactions safely using a local database without affecting actual railway ticketing databases.

Key Features

Multi-Train Vacancy Dashboard: Side-by-side comparison of current chart vacancies across all trains on a route.
Interactive 2D Coach Seat Visualizer**: Visual seat layout mapping for First AC (1A), Second AC (2A), Third AC (3A), Sleeper (SL), and Chair Car (CC/EC) coaches.
PNR Decoder & Locator: Decode PNR numbers to fetch ticket profiles and pinpoint passengers' booked seats directly inside the layout diagrams.
Live API Queries with Graceful Fallback**: Fetches live train charts, composition, and schedule data from public API endpoints. If blocked by rate limiting, it falls back to a deterministic simulation generator.
Simulated Booking Engine: Book specific vacant segments in the coach layouts. Seats booked in the sandbox are stored in MongoDB and dynamically filtered out from subsequent vacancy listings.
Real-time Chart Preparation Tracking: Background tracking loop that plays a chime sound and triggers native desktop push notifications the second a tracked train's reservation chart is prepared.

---

Tech Stack

Frontend: React (Vite, Lucide React icons)
Styling: Modern, responsive CSS with glassmorphism design accents
Backend: Node.js, Express.js
Database: MongoDB (Mongoose schemas)

---

Project Directory Structure
irctc/
├── models/
│   ├── Booking.js       # MongoDB schema for booking transactions
│   ├── Station.js       # MongoDB schema for station coordinates/codes
│   ├── Train.js         # MongoDB schema for predefined train details
│   └── User.js          # MongoDB schema for registered users & auth hashing
├── scratch/
│   └── test_api.js      # Endpoint integration testing script
├── services/
│   ├── db.js            # MongoDB Mongoose connector
│   ├── mockData.js      # Simulated backup generator & predefined static data
│   └── stations.json    # Complete database seed of Indian railway stations
├── src/
│   ├── components/
│   │   ├── CoachMap.jsx          # Interactive coach grid seat visualizer
│   │   ├── LoginModal.jsx        # Signup / Login modal dialog
│   │   ├── SearchForm.jsx        # Journey search and PNR lookup panel
│   │   ├── TrainList.jsx         # Departure timeline selection bar
│   │   ├── VacancyDashboard.jsx  # Chart listings, filtering, and stats cards
│   │   └── VacancyTable.jsx      # Sortable grid listing all vacant segments
│   ├── App.css
│   ├── App.jsx                   # Central state machine and event handlers
│   ├── index.css                 # Global stylesheets and design variables
│   └── main.jsx
├── eslint.config.js
├── index.html
├── package.json
├── seed.js                       # Station database seeder script
├── server.js                     # Express API endpoint server
└── vite.config.js


Installation & Setup
Prerequisites
Node.js (v18+ recommended)
MongoDB running locally 

Install Dependencies
npm install
Seed the Database
Populate the local MongoDB instance with the list of Indian Railways stations and mock trains:

node seed.js

Run in Development Mode
Starts both the backend Express server (port `5000`) and the Vite React frontend (port `5173`) concurrently:

npm run dev

 API Documentation

 1. Stations Autocomplete
Endpoint : `GET /api/stations?q=<query>`
Description : Returns matching station codes, cities, and names.

2. Search Trains
Endpoint : `POST /api/trains`
Body : `{ from: "NDLS", to: "HWH", date: "YYYY-MM-DD" }`
Description : Lists all trains operating between station codes. Falls back to route simulation if offline.

3. Get Vacancy Status
Endpoint : `POST /api/vacancy`
Body : `{ trainNo: "12314", boarding: "NDLS", destination: "HWH", classCode: "3A", date: "YYYY-MM-DD" }`
Description:  Fetches coaches and vacant berths, filtering out any seats booked locally.

 4. Decode PNR
Endpoint : `POST /api/pnr`
Body : `{ pnr: "10-digit-numeric" }`
Description : Decodes passenger profiles, coach/berth details, and date.

 5. Create Booking
Endpoint : `POST /api/bookings`
Headers : `Authorization: Bearer <user_token>`
Body : `{ trainNo, coach, berthNo, berthType, from, to, classCode, date, passengerName, passengerAge, passengerGender }`
Description : Persists booking in MongoDB, making the seat unavailable for subsequent queries.

<img width="1901" height="780" alt="image" src="https://github.com/user-attachments/assets/6c391407-e0c2-4536-9730-71327bde67c9" />
<img width="1899" height="813" alt="image" src="https://github.com/user-attachments/assets/a018025e-7606-4664-bf42-8d0dfaf70954" />
<img width="1912" height="860" alt="image" src="https://github.com/user-attachments/assets/7454109e-d1d0-4f07-8f35-ba8e3ed7570d" />
<img width="1899" height="869" alt="image" src="https://github.com/user-attachments/assets/c053395b-1a3e-44a0-9ae1-639f5469ef92" />
<img width="1894" height="822" alt="image" src="https://github.com/user-attachments/assets/48c8f3a2-7e58-43c3-af2e-b270a83feba5" />
<img width="1898" height="862" alt="image" src="https://github.com/user-attachments/assets/efc274b3-0b25-4fd4-8ff7-789f47ea426b" />
<img width="1896" height="863" alt="image" src="https://github.com/user-attachments/assets/16e1ef63-dbe3-43eb-b392-b0b233642220" />

