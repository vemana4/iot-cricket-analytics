# IoT Cricket Analytics

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Arduino](https://img.shields.io/badge/Arduino-ESP32-00979D?logo=arduino&logoColor=white)](https://www.arduino.cc)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

The IoT Cricket Analytics platform is an advanced, end-to-end hardware and software solution engineered to modernize cricket training and match analysis. At its core, it leverages ESP32 microcontrollers equipped with specialized IMU and piezoelectric sensors mounted directly on cricket stumps. These sensors capture high-fidelity impact data—including force, angle, and vibration signatures—the instant a ball strikes the wicket. This telemetry is streamed in real-time to a robust Express.js ingestion API, which reconstructs the ball's trajectory and classifies the delivery using a custom physics engine. Finally, coaches and players can review the data through a high-performance React dashboard featuring WebGL-accelerated 3D visualizations, empowering them to make data-driven decisions to improve bowling accuracy and pitch strategy.

---

## ✨ Features

- **📡 Real-Time Telemetry** — ESP32 microcontroller captures impact force, angle, and velocity at the stump
- **⚡ Physics Engine** — Server-side ball trajectory reconstruction and delivery classification
- **🎯 Wicket Detection** — Automatic wicket event recognition with timestamp and delivery context
- **📊 Quantum Pitch Dashboard** — WebGL-powered analytics dashboard for session review and trend analysis
- **🔧 Device Calibration** — Remote sensor calibration endpoints for field setup
- **📋 Session Management** — Track practice sessions, match innings, and historical delivery data
- **🏏 Delivery Analytics** — Classify deliveries by speed, swing, seam, and bounce characteristics

---

## 🏗️ System Architecture

```
┌─────────────────┐     HTTP/WS      ┌──────────────────┐      React       ┌─────────────────────┐
│                 │ ──────────────►   │                  │ ◄──────────────  │                     │
│   ESP32 Stump   │   Telemetry      │   Ingestion API  │    Queries       │  Quantum Pitch      │
│   Firmware      │   Payloads       │   (Express.js)   │    & Events      │  Dashboard (React)  │
│                 │                  │                  │                  │                     │
│  • IMU Sensor   │                  │  • Physics Engine│                  │  • Live Feed        │
│  • Piezo Impact │                  │  • Session Mgmt  │                  │  • WebGL Viz        │
│  • WiFi Module  │                  │  • Wicket Logic  │                  │  • Session Review   │
│  • Battery Mgmt │                  │  • Pusher Events │                  │  • Player Stats     │
└─────────────────┘                  └──────────────────┘                  └─────────────────────┘
```

---

## 📁 Project Structure

```
smart-cricket-iot/
├── esp32/
│   └── cricket_stump.ino        # Arduino firmware for ESP32
│
├── artifacts/
│   ├── api-server/              # Node.js Telemetry Ingestion API
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── physicsEngine.ts    # Ball trajectory & physics
│   │   │   │   ├── pusher.ts           # Real-time event broadcasting
│   │   │   │   └── logger.ts           # Structured logging
│   │   │   └── routes/
│   │   │       ├── telemetry.ts        # Sensor data ingestion
│   │   │       ├── stump.ts            # Stump device management
│   │   │       ├── deliveries.ts       # Delivery records & queries
│   │   │       ├── wickets.ts          # Wicket event tracking
│   │   │       ├── session.ts          # Session lifecycle
│   │   │       ├── calibrate.ts        # Remote calibration
│   │   │       ├── dashboard.ts        # Aggregated statistics
│   │   │       └── info.ts             # Device info & health
│   │   └── package.json
│   │
│   ├── quantum-pitch/           # React Analytics Dashboard
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   └── components/
│   │   │       ├── Layout.tsx
│   │   │       ├── WebGLFallback.tsx
│   │   │       └── ui/              # Shadcn/UI components
│   │   └── package.json
│   │
│   └── mockup-sandbox/          # UI Component Sandbox
│
├── lib/                         # Shared Packages
│   ├── api-client-react/        # Auto-generated React hooks
│   ├── api-spec/                # OpenAPI specification
│   ├── api-zod/                 # Zod validation schemas
│   └── db/                      # Database layer
│
├── pnpm-workspace.yaml
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **pnpm** 8+
- **Arduino IDE** 2.x (for ESP32 firmware)
- **ESP32 Dev Board** with IMU and piezoelectric sensors

### Software Setup

```bash
# Clone the repository
git clone https://github.com/vemana4/smart-cricket-iot.git
cd smart-cricket-iot

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env

# Start the ingestion API
pnpm --filter api-server dev

# Start the analytics dashboard
pnpm --filter quantum-pitch dev
```

### Hardware Setup

1. Open `esp32/cricket_stump.ino` in Arduino IDE
2. Configure WiFi credentials and API endpoint in the sketch
3. Flash to ESP32 dev board
4. Mount sensors on the cricket stump assembly
5. Run calibration via the `/calibrate` API endpoint

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Firmware** | C++ / Arduino (ESP32) |
| **Backend** | TypeScript, Express.js, Pusher |
| **Frontend** | React 18, Vite, WebGL, Shadcn/UI |
| **Physics** | Custom physics engine (TypeScript) |
| **Validation** | Zod schemas |
| **Monorepo** | pnpm workspaces |
| **Build** | esbuild, Vite |

---

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/vemana4">Vemana Hemanth Babu</a>
</p>
