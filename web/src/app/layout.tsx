import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThermoGuard — Smart IoT Temperature Monitor",
  description: "Lightweight, reliable IoT temperature monitoring dashboard for ESP32 and MongoDB.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
        {children}
      </body>
    </html>
  );
}
