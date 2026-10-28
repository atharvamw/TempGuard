# ThermoGuard ESP32 MicroPython Firmware

This directory contains modular MicroPython firmware for the ESP32 temperature monitor.

## Hardware Connections
- **Sensor:** DS18B20 One-Wire Digital Temperature Sensor
- **Data Pin:** GPIO 4 (with a 4.7kΩ pull-up resistor connected between Data and 3.3V)
- **Power:** 3.3V
- **Ground:** GND

## Project Files
- `boot.py`: Initializes system, enables garbage collection.
- `config.py`: Device settings, Wi-Fi credentials, API endpoint, auth token.
- `wifi.py`: Wi-Fi connection and reconnection helper with bounded backoff.
- `sensor.py`: DS18B20 sensor driver using MicroPython `onewire` and `ds18x20`.
- `api_client.py`: Sends JSON telemetry payloads over HTTPS POST with authentication.
- `main.py`: Main telemetry loop (reads sensor, sends reading every ~10s, handles errors gracefully).

## Setup with Thonny
1. Flash MicroPython firmware onto your ESP32 if not already flashed.
2. In Thonny, configure interpreter: **MicroPython (ESP32)**.
3. Edit `config.py` with your Wi-Fi credentials, backend URL, and device token.
4. Save all files to your ESP32 device (`/`).
5. Reset or run `main.py`.
