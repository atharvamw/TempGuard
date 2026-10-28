# ThermoGuard — Smart IoT Temperature Monitoring Dashboard

A lightweight, reliable IoT temperature-monitoring platform that collects temperature readings from an ESP32 (running MicroPython), stores them in MongoDB, and presents live and historical temperature data through a clean Next.js dashboard.

## Project Structure

```
├── docs/                 # Product Requirements Document (PRD) & specs
│   └── prd.md
├── web/                  # Next.js App Router (TypeScript, Tailwind CSS, shadcn/ui, MongoDB)
│   ├── src/
│   │   ├── app/          # App Router pages and API routes
│   │   ├── components/   # React components (Dashboard, Charts, UI)
│   │   ├── lib/          # MongoDB connection, validation, utilities
│   │   └── types/        # TypeScript type definitions
│   └── ...
├── firmware/             # ESP32 MicroPython firmware (Thonny compatible)
│   ├── boot.py           # Hardware init & safe boot
│   ├── main.py           # Periodic telemetry loop
│   ├── config.py         # Configuration templates
│   ├── wifi.py           # Wi-Fi connection manager with backoff
│   ├── sensor.py         # DS18B20 One-Wire sensor reader (GPIO 4)
│   └── api_client.py     # HTTPS POST client with bearer authentication
└── .gitignore
```

## Quick Start

### Web Dashboard & API

1. Navigate to the `web/` directory:
   ```bash
   cd web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Copy `.env.example` to `.env.local` and configure your `MONGODB_URI` and `DEVICE_API_TOKEN`.
4. Run development server:
   ```bash
   npm run dev
   ```

### ESP32 Firmware (MicroPython)

1. Open Thonny IDE and connect your ESP32.
2. Update Wi-Fi credentials and API endpoint in `firmware/config.py`.
3. Upload the files in `firmware/` to the ESP32.
