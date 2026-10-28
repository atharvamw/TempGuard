# boot.py - Executed on device boot
import gc
import esp

# Disable vendor OS debugging messages
esp.osdebug(None)

# Run garbage collection
gc.collect()

print("ThermoGuard ESP32 booting...")
