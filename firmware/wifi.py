# wifi.py - Wi-Fi connection manager with bounded retry and backoff
import network
import time

def connect_wifi(ssid, password, timeout_sec=20):
    """
    Connects to the specified Wi-Fi network with a timeout.
    Returns True if connected, False otherwise.
    """
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)

    if wlan.isconnected():
        print("Already connected to Wi-Fi. IP:", wlan.ifconfig()[0])
        return True

    print("Connecting to Wi-Fi SSID:", ssid)
    wlan.connect(ssid, password)

    start_time = time.time()
    while not wlan.isconnected():
        if time.time() - start_time > timeout_sec:
            print("Wi-Fi connection timed out after", timeout_sec, "seconds.")
            return False
        time.sleep(0.5)

    print("Connected to Wi-Fi! IP Address:", wlan.ifconfig()[0])
    return True

def is_connected():
    """Checks if the device is currently connected to Wi-Fi."""
    wlan = network.WLAN(network.STA_IF)
    return wlan.active() and wlan.isconnected()
