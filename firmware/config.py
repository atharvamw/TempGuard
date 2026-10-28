# ThermoGuard ESP32 Configuration

# Wi-Fi Credentials
WIFI_SSID = "YOUR_WIFI_SSID"
WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"

# Backend Telemetry API Settings
# Your computer's current Wi-Fi LAN IP is 192.168.0.145
# Note: Start Next.js with `pnpm dev -H 0.0.0.0` so other LAN devices can reach it
API_URL = "http://192.168.0.145:3000/api/telemetry"

# Device Identification & Security
DEVICE_ID = "thermoguard-01"
DEVICE_API_TOKEN = "test-device-token-secret-12345"

# Hardware Configuration
ONE_WIRE_PIN = 4  # GPIO 4 for DS18B20 One-Wire

# Telemetry Timing
MEASUREMENT_INTERVAL_SEC = 10
RETRY_DELAY_SEC = 3
MAX_RETRIES = 3
