import { Dashboard } from "@/components/dashboard/Dashboard";

export const metadata = {
  title: "ThermoGuard — IoT Temperature Dashboard",
  description: "Live and historical temperature monitoring with ESP32 and MongoDB.",
};

export default function Page() {
  const deviceId = process.env.DEVICE_ID || "thermoguard-01";
  return <Dashboard deviceId={deviceId} />;
}
