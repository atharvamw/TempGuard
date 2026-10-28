# main.py - Main execution loop for ESP32 ThermoGuard
import time
import gc
import machine
import config
from wifi import connect_wifi, is_connected
from sensor import TemperatureSensor
from api_client import ApiClient

_is_running = False

def blink_led(times=1, on_ms=100, off_ms=100):
    """Flashes onboard LED for visual user feedback."""
    try:
        led_pin = getattr(config, "STATUS_LED_PIN", 2)
        led = machine.Pin(led_pin, machine.Pin.OUT)
        for _ in range(times):
            led.value(1)
            time.sleep_ms(on_ms)
            led.value(0)
            time.sleep_ms(off_ms)
    except Exception:
        pass

def run_telemetry_loop():
    print("=" * 50)
    print("ThermoGuard Telemetry Engine Starting...")
    print("Device ID:      ", config.DEVICE_ID)
    print("Target Endpoint:", config.API_URL)
    print("Wi-Fi SSID:     ", config.WIFI_SSID)
    print("=" * 50)

    # 1. Initialize Wi-Fi safely
    wifi_failures = 0
    try:
        blink_led(2, 80, 80)
        if not connect_wifi(config.WIFI_SSID, config.WIFI_PASSWORD):
            print("Initial Wi-Fi connection failed. Will retry in main loop.")
            wifi_failures += 1
        else:
            blink_led(1, 400, 100)
    except Exception as e:
        print("Initial Wi-Fi exception:", e, "- Will retry in loop.")
        wifi_failures += 1

    # 2. Initialize Sensor & API Client
    sensor = TemperatureSensor(config.ONE_WIRE_PIN)
    client = ApiClient(config.API_URL, config.DEVICE_ID, config.DEVICE_API_TOKEN)

    consecutive_upload_failures = 0

    while True:
        try:
            # Check and reconnect Wi-Fi if needed
            if not is_connected():
                print("Wi-Fi not connected. Attempting reconnection to:", config.WIFI_SSID)
                blink_led(1, 50, 50)
                if not connect_wifi(config.WIFI_SSID, config.WIFI_PASSWORD, timeout_sec=12):
                    wifi_failures += 1
                    print("Wi-Fi reconnect failed (attempt {}).".format(wifi_failures))
                    # If Wi-Fi is stuck for 15 cycles (~2.5 minutes), do a clean hardware reset
                    if wifi_failures >= 15:
                        print("Persistent Wi-Fi failure detected. Resetting ESP32 hardware...")
                        time.sleep(1)
                        machine.reset()
                    time.sleep(config.RETRY_DELAY_SEC)
                    continue
                else:
                    print("Wi-Fi reconnected successfully.")
                    wifi_failures = 0
                    blink_led(1, 300, 100)
            else:
                wifi_failures = 0

            # Read temperature
            temp = sensor.read_temperature_c()
            if temp is None:
                print("Skipping transmission: waiting for valid sensor reading.")
            else:
                print("Temperature reading: {:.2f} °C".format(temp))
                
                # Send to backend
                success, status, res = client.send_telemetry(temp)
                if success:
                    print("Telemetry uploaded successfully. Status: {}".format(status))
                    consecutive_upload_failures = 0
                    # Quick confirmation blink
                    blink_led(1, 60, 40)
                else:
                    consecutive_upload_failures += 1
                    print("Telemetry upload failed. Status: {}, Response: {}".format(status, res))
                    blink_led(3, 50, 50)

            # Garbage collect to prevent heap fragmentation in MicroPython
            gc.collect()

        except Exception as e:
            print("Unexpected loop error:", e)

        # Sleep for measurement interval (e.g. 10 seconds)
        time.sleep(config.MEASUREMENT_INTERVAL_SEC)

def start():
    """Supervisor entrypoint: wraps loop in auto-restart watchdog."""
    global _is_running
    if _is_running:
        return
    _is_running = True

    while True:
        try:
            run_telemetry_loop()
        except Exception as err:
            print("Fatal supervisor crash in telemetry loop:", err)
            print("Restarting telemetry loop in 5 seconds...")
            blink_led(4, 100, 100)
            time.sleep(5)

def main():
    start()

if __name__ == "__main__":
    start()
