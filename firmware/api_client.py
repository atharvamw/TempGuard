# api_client.py - HTTP/HTTPS Telemetry Transmission Client
try:
    import urequests as requests
except ImportError:
    import requests
import ujson as json

class ApiClient:
    def __init__(self, api_url, device_id, api_token):
        self.api_url = api_url
        self.device_id = device_id
        self.api_token = api_token

    def send_telemetry(self, temperature_c, measured_at=None):
        """
        Sends temperature telemetry to the backend API.
        Returns (success: bool, status_code: int, response_data: dict or str)
        """
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + self.api_token
        }

        payload = {
            "deviceId": self.device_id,
            "temperatureC": temperature_c
        }
        if measured_at:
            payload["measuredAt"] = measured_at

        try:
            body = json.dumps(payload)
            res = requests.post(self.api_url, data=body, headers=headers)
            status = res.status_code
            try:
                data = res.json()
            except Exception:
                data = res.text
            res.close()
            return (200 <= status < 300, status, data)
        except Exception as e:
            print("HTTP request error:", e)
            return (False, 0, str(e))
