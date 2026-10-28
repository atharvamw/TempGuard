# main.py - Main execution loop for ESP32 ThermoGuard
import time
import gc
import config
from wifi import connect_wifi, is_connected
from sensor import TemperatureSensor
from api_client import ApiClient

def main():
    print("Initializing ThermoGuard Telemetry Loop...")
    
    # 1. Initialize Wi-Fi
    if not connect_wifi(config.WIFI_SSID, config.WIFI_PASSWORD):
        print("Initial Wi-Fi connection failed. Will retry in loop.")

    # 2. Initialize Sensor & API Client
    sensor = TemperatureSensor(config.ONE_WIRE_PIN)
    client = ApiClient(config.API_URL, config.DEVICE_ID, config.DEVICE_API_TOKEN)

    consecutive_failures = 0

    while True:
        try:
            # Check and reconnect Wi-Fi if needed
            if not is_connected():
                print("Wi-Fi disconnected. Reconnecting...")
                if not connect_wifi(config.WIFI_SSID, config.WIFI_PASSWORD, timeout_sec=10):
                    time.sleep(config.RETRY_DELAY_SEC)
                    continue

            # Read temperature
            temp = sensor.read_temperature_c()
            if temp is None:
                print("Skipping transmission: invalid sensor reading.")
            else:
                print("Temperature reading: {:.2f} °C".format(temp))
                
                # Send to backend
                success, status, res = client.send_telemetry(temp)
                if success:
                    print("Telemetry sent successfully. Status:", status)
                    consecutive_failures = 0
                else:
                    consecutive_failures += 1
                    print("Telemetry upload failed. Status: {}, Response: {}".format(status, res))

            # Garbage collect to prevent memory fragmentation on MicroPython
            gc.collect()

        except Exception as e:
            print("Unexpected loop error:", e)

        # Sleep for measurement interval (e.g. 10 seconds)
        time.sleep(config.MEASUREMENT_INTERVAL_SEC)

if __name__ == "__main__":
    main()
