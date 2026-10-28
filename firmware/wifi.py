# wifi.py - Wi-Fi connection manager with robust state recovery
import network
import time

def connect_wifi(ssid, password, timeout_sec=20):
    """
    Connects to the specified Wi-Fi network with robust error handling and state reset.
    Returns True if connected, False otherwise.
    """
    try:
        # 1. Disable Access Point (AP) mode if active to prevent state conflict
        ap = network.WLAN(network.AP_IF)
        if ap.active():
            ap.active(False)
            time.sleep_ms(100)
    except Exception:
        pass

    wlan = network.WLAN(network.STA_IF)

    # 2. Check if already connected
    if wlan.active() and wlan.isconnected():
        print("Already connected to Wi-Fi. IP:", wlan.ifconfig()[0])
        return True

    # 3. Clean reset of the station interface to avoid 'Wifi Internal State Error'
    try:
        if not wlan.active():
            wlan.active(True)
        else:
            try:
                wlan.disconnect()
            except Exception:
                pass
    except Exception as e:
        print("Warning during WLAN reset:", e)

    # Critical delay: allow ESP-IDF Wi-Fi driver event loop to settle into READY state
    time.sleep_ms(400)

    print("Connecting to Wi-Fi SSID:", ssid)
    try:
        wlan.connect(ssid, password)
    except OSError as e:
        # If ESP-IDF threw state error (e.g. 0x3008), do full radio power-cycle
        print("Initial connect encountered state error ({}), cycling Wi-Fi radio...".format(e))
        try:
            wlan.active(False)
            time.sleep_ms(500)
            wlan.active(True)
            time.sleep_ms(500)
            wlan.connect(ssid, password)
        except Exception as retry_err:
            print("Failed to initiate connection on retry:", retry_err)
            return False

    # 4. Wait for connection with timeout
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
    try:
        wlan = network.WLAN(network.STA_IF)
        return wlan.active() and wlan.isconnected()
    except Exception:
        return False
