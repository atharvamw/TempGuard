import React from "react";
import { Activity, ShieldCheck, Cpu, Database } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col justify-between p-6 md:p-12 max-w-5xl mx-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center font-semibold text-lg border border-primary/20">
            θ
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              ThermoGuard
            </h1>
            <p className="text-xs text-muted-foreground">
              IoT Temperature Monitoring Dashboard
            </p>
          </div>
        </div>

        {/* System Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground border border-primary/20">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Initialized</span>
        </div>
      </header>

      {/* Main Hero Card */}
      <section className="my-12 p-8 rounded-lg border border-border bg-card shadow-sm space-y-6">
        <div className="space-y-2">
          <div className="inline-block px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-muted text-muted-foreground">
            Phase 1 Foundation Ready
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Smart, Resilient Temperature Ingestion & Visualization
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            ThermoGuard is connected to MongoDB Atlas and ready to receive telemetry from the ESP32.
            Built with strict validation, zero-trust device bearer authentication, and automated 7-day data retention.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="p-4 rounded-md border border-border bg-secondary/30 space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Cpu className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Firmware
              </span>
            </div>
            <div className="text-sm font-semibold">ESP32 (MicroPython)</div>
            <p className="text-xs text-muted-foreground">
              DS18B20 One-Wire on GPIO 4 with automatic backoff retry.
            </p>
          </div>

          <div className="p-4 rounded-md border border-border bg-secondary/30 space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Database className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Database
              </span>
            </div>
            <div className="text-sm font-semibold">MongoDB Atlas</div>
            <p className="text-xs text-muted-foreground">
              TTL index set to 7 days auto-expiration with compound index queries.
            </p>
          </div>

          <div className="p-4 rounded-md border border-border bg-secondary/30 space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Security
              </span>
            </div>
            <div className="text-sm font-semibold">Bearer Auth & Range Checks</div>
            <p className="text-xs text-muted-foreground">
              Constant-time secret comparison and physical boundary validation.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-md border border-border bg-muted/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Health Check Endpoint:</span>
            <code className="bg-background px-1.5 py-0.5 rounded border border-border font-mono">
              /api/health
            </code>
          </div>
          <span className="text-muted-foreground font-mono">HTTP 200 OK</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground border-t border-border pt-6">
        ThermoGuard &bull; High Reliability IoT Dashboard &bull; Built with Next.js 15 & MongoDB
      </footer>
    </main>
  );
}
