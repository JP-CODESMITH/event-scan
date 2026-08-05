# Event Scan

A modern, production-ready event QR code scanning system built with Bun, React, and TypeScript.

## Features

- **Admin Dashboard** — Real-time analytics, ticket management, live scan feed, charts, and full control
- **Mobile Scanner** — Phone-based QR code scanner with instant feedback (success/denied sounds, vibration)
- **Real-time Updates** — Socket.IO powered live updates for scans, stats, and ticket changes
- **Ticket Management** — Create, edit, block, reset, and manage attendee tickets
- **Multiple Gates** — Support for Gate A, Gate B, VIP, Back Gate with per-gate analytics
- **Bulk Actions** — Select and perform actions on multiple tickets at once
- **Data Export** — CSV export for tickets and scan history
- **CSV Import** — Import attendee data from CSV files
- **Ticket Authorization** — Manual whitelist system; only authorized tickets are accepted at the gate
- **Authorization Workflow** — Authorize/deauthorize tickets with a secure secondary password
- **Bulk Authorization** — Select and authorize multiple tickets at once
- **Audit Log** — All admin actions logged for accountability
- **Glassmorphism UI** — Beautiful dark mode interface with frosted glass effects

## Tech Stack

| Layer      | Technology                              |
| ---------- | --------------------------------------- |
| Runtime    | Bun                                     |
| Frontend   | React 18, TypeScript, Vite              |
| Styling    | TailwindCSS, shadcn/ui                  |
| Backend    | Bun HTTP Server                         |
| Realtime   | Socket.IO                               |
| Database   | SQLite (via bun:sqlite)                 |
| Charts     | Recharts                                |
| QR Scan    | @zxing/browser                          |
| Icons      | Lucide React                            |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0+

### Environment

Create a `.env` file in the project root (already provided):

```env
AUTHORIZATION_PASSWORD=Abraham123@
```

This password is required for authorizing/deauthorizing tickets.

### Installation

```bash
cd event-scan
bun install
```

### Seed the Database

```bash
bun run db:seed
```

This creates 300 tickets (001–300), each with 3 entries.

### Development

Run both the frontend (Vite) and backend (Bun) simultaneously:

```bash
bun run dev
```

- **Frontend**: http://localhost:5173 (or http://YOUR_LAN_IP:5173)
- **Backend API**: http://localhost:3000 (or http://YOUR_LAN_IP:3000)

### Production Build

```bash
bun run build
bun run start
```

This serves everything from port 3000.

## Usage

### Admin Login

1. Open the dashboard URL in a browser on your laptop
2. Log in with default credentials:
   - **Username**: `admin`
   - **Password**: `admin123`

### Scanning from Phones

1. Ensure phones are connected to the same WiFi as the laptop (or laptop hotspot)
2. Open `http://YOUR_LAN_IP:5173/scanner` (dev) or `http://YOUR_LAN_IP:3000/scanner` (prod)
3. Select a gate (Gate A, Gate B, VIP, or Back Gate)
4. Point the camera at a QR code containing the ticket number (e.g., "001")
5. The scanner shows green for success or red for denied

### QR Code Format

QR codes should encode the ticket number as plain text:

```
001
002
003
...
300
```

## Project Structure

```
event-scan/
├── server/
│   ├── index.ts              # Server entry point
│   ├── db/
│   │   ├── index.ts          # Database initialization
│   │   ├── schema.ts         # Drizzle ORM schemas
│   │   └── seed.ts           # Seed script (300 tickets)
│   ├── routes/
│   │   ├── admin.ts          # Admin auth & logs
│   │   ├── export.ts         # CSV export
│   │   ├── import.ts         # CSV import
│   │   ├── scans.ts          # Scan history
│   │   ├── settings.ts       # Event settings
│   │   └── tickets.ts        # Ticket CRUD
│   └── utils/
│       └── network.ts        # LAN IP detection
├── src/
│   ├── App.tsx               # Root component & routing
│   ├── main.tsx              # Entry point
│   ├── index.css             # Global styles & animations
│   ├── pages/
│   │   ├── Dashboard.tsx     # Main admin dashboard
│   │   ├── Login.tsx         # Admin login
│   │   ├── Scanner.tsx       # Mobile QR scanner
│   │   ├── Settings.tsx      # Event & system settings
│   │   ├── TicketsPage.tsx   # Ticket management
│   │   └── ScannerDevicesPage.tsx
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   ├── layout/           # Sidebar, Header, Layout
│   │   └── dashboard/        # Dashboard widgets
│   ├── hooks/
│   │   └── useSocket.ts      # Socket.IO React hooks
│   ├── lib/
│   │   ├── api.ts            # API client
│   │   ├── socket.ts         # Socket.IO client
│   │   └── utils.ts          # Utility functions
│   └── types/
│       └── index.ts          # TypeScript types
├── public/
│   └── favicon.svg
├── data/                     # SQLite database (auto-created)
├── dist/                     # Production build output
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## API Endpoints

| Method | Path                  | Description              |
| ------ | --------------------- | ------------------------ |
| GET    | /api/stats            | Dashboard statistics     |
| GET    | /api/tickets          | List tickets (paginated) |
| GET    | /api/tickets/:id      | Get ticket details       |
| PUT    | /api/tickets/:id      | Update ticket            |
| POST   | /api/tickets/:id/reset | Reset ticket entries     |
| POST   | /api/tickets/:id/block | Block ticket             |
| POST   | /api/tickets/:id/unblock | Unblock ticket         |
| DELETE | /api/tickets/:id/delete | Delete ticket           |
| POST   | /api/authorize        | Authorize a ticket        |
| POST   | /api/authorize/bulk   | Bulk authorize tickets   |
| POST   | /api/authorize/deauthorize | Remove authorization |
| POST   | /api/authorize/verify-password | Verify auth password |
| POST   | /api/scan             | Scan a ticket QR code    |
| GET    | /api/scans            | List scans (paginated)   |
| GET    | /api/chart-data       | Chart data               |
| GET    | /api/settings         | Get event settings       |
| PUT    | /api/settings         | Update event settings    |
| POST   | /api/admin/login      | Admin login              |
| POST   | /api/admin/verify     | Verify session           |
| GET    | /api/admin/logs       | Audit logs               |
| POST   | /api/bulk             | Bulk ticket actions      |
| GET    | /api/export/csv       | Export tickets CSV       |
| GET    | /api/export/history-csv | Export scan history CSV |
| POST   | /api/import/csv       | Import tickets from CSV  |
| GET    | /api/network          | Get LAN IP & port        |
| GET    | /api/search           | Search tickets           |
| GET    | /api/scanner-devices  | List scanner devices     |

## License

MIT
