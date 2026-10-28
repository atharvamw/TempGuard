#!/usr/bin/env python3
"""
ThermoGuard ESP32 Simulator Script
Simulates an ESP32 publishing temperature readings to the ThermoGuard Next.js backend.
Useful for local end-to-end testing without physical hardware.
"""

import sys
import time
import random
import json
import urllib.request
import urllib.error

# Default settings (can be overridden via environment or config.py)
try:
    import config
    API_URL = config.API_URL
    DEVICE_ID = config.DEVICE_ID
    DEVICE_API_TOKEN = config.DEVICE_API_TOKEN
    INTERVAL = config.MEASUREMENT_INTERVAL_SEC
except ImportError:
    API_URL = "https://tempguard.vercel.app/api/telemetry"
    DEVICE_ID = "thermoguard-01"
    DEVICE_API_TOKEN = "test-device-token-secret-12345"
    INTERVAL = 10

def send_reading(temperature_c):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {DEVICE_API_TOKEN}"
    }
    payload = {
        "deviceId": DEVICE_ID,
        "temperatureC": round(temperature_c, 2)
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(API_URL, data=data, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            res_body = response.read().decode("utf-8")
            status = response.status
            return status, json.loads(res_body)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(error_body)
        except Exception:
            parsed = error_body
        return e.code, parsed
    except urllib.error.URLError as e:
        return 0, str(e.reason)

def main():
    print("=" * 60)
    print("ThermoGuard ESP32 Simulator")
    print(f"Target API Endpoint: {API_URL}")
    print(f"Device Identifier:   {DEVICE_ID}")
    print(f"Interval:            {INTERVAL}s")
    print("=" * 60)

    # Initial starting room temperature
    current_temp = 24.0

    count = 0
    while True:
        count += 1
        # Random realistic drift (-0.3°C to +0.3°C)
        current_temp += random.uniform(-0.3, 0.3)
        # Keep within realistic room range 18°C - 30°C
        current_temp = max(18.0, min(30.0, current_temp))

        print(f"[{time.strftime('%H:%M:%S')}] Transmitting reading #{count}: {current_temp:.2f}°C ...", end=" ")
        status, response = send_reading(current_temp)

        if status == 201 or status == 200:
            print(f"SUCCESS (HTTP {status}) -> Stored with ID: {response.get('data', {}).get('id')}")
        else:
            print(f"FAILED (HTTP {status}) -> {response}")

        time.sleep(INTERVAL)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nSimulator stopped by user.")
        sys.exit(0)
