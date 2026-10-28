# boot.py - Executed on device cold boot / power-on
import gc
import esp
import time
import machine

# Disable noisy vendor OS debugging messages
esp.osdebug(None)

# Run garbage collection
gc.collect()

print("ThermoGuard ESP32 booting...")

# 1. Power stabilization delay:
# Allow USB power rail, 3.3V LDO regulator, and on-board capacitors to fully settle
time.sleep_ms(1500)

# 2. Boot indication LED flash (GPIO 2)
try:
    import config
    led_pin = getattr(config, "STATUS_LED_PIN", 2)
    led = machine.Pin(led_pin, machine.Pin.OUT)
    for _ in range(3):
        led.value(1)
        time.sleep_ms(80)
        led.value(0)
        time.sleep_ms(80)
except Exception:
    pass

print("Boot sequence complete. Starting ThermoGuard telemetry service...")

# 3. Explicitly launch main application so it runs reliably on standalone plug-in
try:
    import main
    if hasattr(main, "start"):
        main.start()
    elif hasattr(main, "main"):
        main.main()
except Exception as e:
    print("Error launching main application from boot.py:", e)
