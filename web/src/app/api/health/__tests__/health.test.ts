import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";

// Mock the mongodb module so we can test healthy and unavailable scenarios deterministically
vi.mock("@/lib/mongodb", () => {
  return {
    getDatabase: vi.fn(),
    ensureMongoIndices: vi.fn().mockResolvedValue({ success: true, message: "Indices verified" }),
  };
});

import { getDatabase } from "@/lib/mongodb";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 and healthy status when database ping succeeds", async () => {
    // Mock successful database command ping
    vi.mocked(getDatabase).mockResolvedValue({
      command: vi.fn().mockResolvedValue({ ok: 1 }),
    } as any);

    const req = new Request("http://localhost:3000/api/health");
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.status).toBe("healthy");
    expect(json.data.services.api).toBe("up");
    expect(json.data.services.database).toBe("connected");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("returns 503 and degraded status when database ping fails", async () => {
    // Mock database connection failure
    vi.mocked(getDatabase).mockRejectedValue(new Error("MongoServerSelectionError"));

    const req = new Request("http://localhost:3000/api/health");
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.data.status).toBe("degraded");
    expect(json.data.services.api).toBe("up");
    expect(json.data.services.database).toBe("unavailable");
  });

  it("triggers index initialization when ?initIndices=true is requested", async () => {
    vi.mocked(getDatabase).mockResolvedValue({
      command: vi.fn().mockResolvedValue({ ok: 1 }),
    } as any);

    const req = new Request("http://localhost:3000/api/health?initIndices=true");
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.indices).toBeDefined();
    expect(json.data.indices.success).toBe(true);
  });
});
