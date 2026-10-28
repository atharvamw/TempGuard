# sensor.py - DS18B20 One-Wire Temperature Sensor Driver
import machine
import onewire
import ds18x20
import time

class TemperatureSensor:
    def __init__(self, pin_number):
        self.pin = machine.Pin(pin_number)
        self.ow = onewire.OneWire(self.pin)
        self.ds = ds18x20.DS18X20(self.ow)
        self.roms = self.ds.scan()
        if not self.roms:
            print("Warning: No DS18B20 sensor found on GPIO", pin_number)
        else:
            print("Found {} DS18B20 sensor(s)".format(len(self.roms)))

    def scan(self):
        """Rescans the 1-Wire bus for devices."""
        self.roms = self.ds.scan()
        return self.roms

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
            
            # Check for invalid DS18B20 reading (e.g., 85.0C is initial power-on reset, -127C is disconnected)
            if temp == 85.0 or temp == -127.0:
                print("Warning: Sensor returned invalid reading:", temp)
                return None

            return round(temp, 2)
        except Exception as e:
            print("Sensor read error:", e)
            return None
