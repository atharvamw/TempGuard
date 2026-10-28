# ThermoGuard ESP32 Configuration

# Wi-Fi Credentials
WIFI_SSID = "YOUR_WIFI_SSID"
WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"

# Backend Telemetry API Settings
# Replace with your deployed Vercel domain or local LAN IP during testing:
# e.g. "https://thermoguard.vercel.app/api/telemetry" or "http://192.168.1.100:3000/api/telemetry"
API_URL = "http://192.168.1.100:3000/api/telemetry"

# Device Identification & Security
DEVICE_ID = "thermoguard-01"
DEVICE_API_TOKEN = "your_secure_device_token_here"

# Hardware Configuration
ONE_WIRE_PIN = 4  # GPIO 4 for DS18B20 One-Wire

# Telemetry Timing
MEASUREMENT_INTERVAL_SEC = 10
RETRY_DELAY_SEC = 3
MAX_RETRIES = 3
