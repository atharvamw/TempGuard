# ThermoGuard ESP32 Configuration

# Wi-Fi Credentials
# Pre-configured with your SSID "G62". Replace WIFI_PASSWORD with your Wi-Fi password.
WIFI_SSID = "G62"
WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"

# Backend Telemetry API Settings (Vercel Cloud Production)
API_URL = "https://tempguard.vercel.app/api/telemetry"

# Device Identification & Security
DEVICE_ID = "thermoguard-01"
DEVICE_API_TOKEN = "test-device-token-secret-12345"

# Hardware Configuration
ONE_WIRE_PIN = 4     # GPIO 4 for DS18B20 One-Wire data line
STATUS_LED_PIN = 2   # GPIO 2 for onboard status LED indicator (blinks on activity)

# Telemetry Timing
MEASUREMENT_INTERVAL_SEC = 10
RETRY_DELAY_SEC = 3
MAX_RETRIES = 3
