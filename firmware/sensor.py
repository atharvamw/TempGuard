# sensor.py - DS18B20 One-Wire Temperature Sensor Driver
import machine
import onewire
import ds18x20
import time

class TemperatureSensor:
    def __init__(self, pin_number):
        self.pin_number = pin_number
        self.pin = None
        self.ow = None
        self.ds = None
        self.roms = []
        self._init_bus()

    def _init_bus(self):
        """Initializes the One-Wire GPIO and DS18X20 driver safely."""
        try:
            self.pin = machine.Pin(self.pin_number)
            self.ow = onewire.OneWire(self.pin)
            self.ds = ds18x20.DS18X20(self.ow)
            self.scan()
        except Exception as e:
            print("Sensor bus initialization warning on GPIO {}: {}".format(self.pin_number, e))

    def scan(self):
        """Rescans the 1-Wire bus for devices."""
        try:
            if self.ds is None:
                self._init_bus()
                return self.roms
            self.roms = self.ds.scan()
            if not self.roms:
                print("Warning: No DS18B20 sensor found on GPIO", self.pin_number)
            else:
                print("Found {} DS18B20 sensor(s)".format(len(self.roms)))
            return self.roms
        except Exception as e:
            print("Sensor scan error:", e)
            return []

    def read_temperature_c(self):
        """
        Triggers conversion and reads temperature in Celsius from the primary DS18B20 sensor.
        Returns float temperature in Celsius, or None on failure.
        """
        try:
            if not self.roms:
                self.scan()
                if not self.roms:
                    return None

            # Convert temperature
            self.ds.convert_temp()
            # DS18B20 conversion requires up to 750ms at 12-bit resolution
            time.sleep_ms(750)

            # Read from primary sensor
            temp = self.ds.read_temp(self.roms[0])
            
            # Check for invalid DS18B20 readings (85.0C is power-on reset value; -127C is disconnected)
            if temp == 85.0 or temp == -127.0:
                print("Warning: Sensor returned transient invalid reading:", temp)
                # Rescan bus to recover from loose connection
                self.scan()
                return None

            return round(temp, 2)
        except Exception as e:
            print("Sensor read error:", e)
            self.roms = []  # Clear so next iteration rescans
            return None
