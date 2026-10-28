# Product Requirements Document (PRD)

## ThermoGuard — Smart IoT Temperature Monitoring Dashboard

**Version:** 1.1  
**Status:** Ready for implementation  
**Platform:** Web application + ESP32 firmware  
**Deployment:** Vercel  
**Application stack:** Next.js + TypeScript  
**Database:** MongoDB Atlas  
**Temperature unit:** Degrees Celsius (°C)

---

## 1. Product Overview

ThermoGuard is a lightweight IoT temperature-monitoring platform that collects temperature readings from an ESP32, stores them in MongoDB, and presents current and historical temperature data through a modern, responsive web dashboard.

The ESP32 sends a temperature reading to a Next.js backend API approximately every 10 seconds. The backend validates and stores each reading in MongoDB. The frontend periodically fetches the latest reading and historical measurements to display the current temperature, trends, statistics, and device status.

The application must remain useful when the device disconnects, data becomes stale, or the API or database temporarily fails.

### Product vision

Build a reliable, elegant, easy-to-use IoT dashboard that feels like a polished developer product rather than a generic IoT template.

### Primary goals

- Monitor temperature remotely from any device with internet access.
- Store timestamped temperature readings and display historical graphs.
- Show minimum, maximum, and average temperatures for a selected period.
- Provide configurable temperature thresholds and clear status indicators.
- Gracefully handle stale readings, API errors, database failures, and network interruptions.
- Maintain a simple, modular, readable, and maintainable codebase.

### Success criteria

- A valid ESP32 reading appears on the dashboard within approximately 15 seconds under normal conditions.
- Historical readings persist across browser refreshes and application redeployments.
- A reading older than one hour is clearly marked as stale.
- The dashboard remains usable on mobile, tablet, and desktop.
- Backend errors never expose stack traces, credentials, or internal infrastructure details to users.

## 2. Target Users

**Primary user:** The project owner monitoring the ESP32 temperature sensor.  
**Secondary users:** Teachers, evaluators, and other viewers inspecting the system during a demonstration.

The MVP supports one primary sensor device. The data model must allow additional devices to be added later without redesigning the entire application.

## 3. Scope

### In scope — MVP

- ESP32-to-backend communication over Wi-Fi and HTTPS.
- Temperature ingestion and MongoDB persistence.
- Latest temperature display.
- Historical temperature graph.
- Time-range selection: 1 hour, 24 hours, and 7 days.
- Minimum, maximum, and average statistics for the selected period.
- Configurable high- and low-temperature thresholds.
- Device freshness and connectivity status.
- Graceful loading, empty, stale, and error states.
- Responsive and accessible UI.
- Secure configuration through environment variables.
- Automated tests and production deployment on Vercel.

### Out of scope — initial release

- Multi-device management interface.
- User accounts and role-based permissions.
- Mobile application.
- Remote control of physical devices.
- Machine-learning-based predictions.
- Complex analytics and report exports.
- Hardware control or safety-critical automation.

The architecture should leave room for these additions without implementing them prematurely.

## 4. System Architecture

### High-level data flow

**Data ingestion**

ESP32 → Next.js ingestion API → validation and device authentication → MongoDB Atlas

**Dashboard**

Browser → Next.js read API → MongoDB Atlas → JSON response → UI and graph

The browser must never connect directly to MongoDB. All database access must happen through server-side backend code.

### Components

**1. ESP32 firmware**

- Reads temperature from the existing One-Wire sensor on GPIO 4.
- Attempts to transmit a reading every 10 seconds.
- Sends readings using HTTPS POST over Wi-Fi.
- Handles failed requests without blocking sensor acquisition indefinitely.
- Retries transient failures with bounded backoff.
- Never treats a failed request as a successful database write.
- Stores an optional measurement timestamp only if the ESP32 clock has been synchronized and is trustworthy.

**2. Next.js backend**

- Exposes API endpoints for telemetry ingestion, latest readings, historical readings, and health checks.
- Validates all incoming data.
- Authenticates ingestion requests using a device-specific secret or bearer token.
- Writes and queries MongoDB collections.
- Reuses a MongoDB client connection across warm serverless invocations where supported; it must not open a brand-new connection for every API request unnecessarily.
- Returns predictable JSON responses.
- Applies appropriate cache controls to telemetry API responses.

**3. Database — MongoDB Atlas**

- Stores each accepted temperature reading as a separate document in a `temperature_readings` collection.
- Stores configurable device thresholds and related settings in a separate `device_settings` collection.
- Uses indexes to support latest-reading and time-range queries efficiently.
- Persists records independently of Vercel application instances.
- Uses managed MongoDB Atlas hosting; local filesystem or in-memory storage must not be used for production persistence.

**4. Frontend**

- Fetches telemetry through the Next.js backend API.
- Displays the latest successfully stored reading, not a fabricated or locally generated measurement.
- Refreshes latest data approximately every 10 seconds.
- Loads historical readings for graphs and statistics.
- Handles stale data and failures without crashing or blanking the entire page.

### Deployment requirements

The application must be compatible with Vercel's request-based serverless execution model. It must not depend on a permanently running in-memory server, local filesystem persistence, or an always-running background process.

Use a supported MongoDB Atlas connection string stored as a server-only environment variable. Never expose the connection string or other private secrets in client-side code.

## 5. Functional Requirements

### FR-01: Temperature ingestion

The ESP32 shall send a JSON payload to the backend every 10 seconds under normal operating conditions.

**Endpoint:** `POST /api/telemetry`

Example request:

```json
{
  "deviceId": "thermoguard-01",
  "temperatureC": 27.4
}
```

Requirements:

- Accept only valid JSON and supported fields.
- Reject missing fields, invalid types, `NaN`, infinity, and temperatures outside a configured plausible range suitable for the sensor and use case.
- Use °C internally for consistent storage and calculations.
- Generate `receivedAt` on the server in UTC; do not trust a client-supplied timestamp for freshness calculations.
- Optionally accept `measuredAt` when the ESP32 clock is synchronized. Treat it as device metadata, not the authority for connectivity freshness.
- Authenticate the device using a device-specific secret or bearer token.
- Insert a new reading document for each valid accepted measurement.
- Return success only after the document has been persisted.
- Return appropriate HTTP status codes for validation, authentication, rate-limit, and database errors.
- Avoid storing credentials or secrets within telemetry documents.

### FR-02: Latest temperature

**Endpoint:** `GET /api/telemetry/latest`

The endpoint shall return the latest successfully stored reading for the configured device.

The response shall include:

- Device identifier.
- Temperature in °C.
- Server receipt timestamp in UTC.
- Optional device measurement timestamp.
- Reading age or enough information for the client to determine freshness.

If the device has never submitted a valid reading, return a predictable empty-state response rather than a fabricated temperature.

The endpoint must not return cached data that is incorrectly presented as current. Use suitable cache-control headers for live telemetry responses.

### FR-03: Historical readings

**Endpoint:** `GET /api/telemetry/history?range=24h`

Supported ranges:

- `1h`
- `24h`
- `7d`

The backend shall:

- Validate the requested range and device identifier.
- Query by `deviceId` and `receivedAt` using the relevant MongoDB index.
- Return chronologically ordered readings.
- Exclude readings outside the selected period.
- Limit or downsample large result sets to prevent excessive response sizes.
- Return consistent timestamps and temperature values.
- Handle empty history without treating it as a server error.

The frontend shall display the selected time range clearly.

### FR-04: Dashboard statistics

Display minimum, maximum, and average temperature for the selected historical period.

Requirements:

- Calculate statistics from valid stored measurements within the selected period.
- Ensure the displayed range matches the statistics calculation period.
- Show an appropriate empty state when no measurements exist.
- Update statistics when the selected range changes.
- Use consistent rounding across graph tooltips and summary values.
- Prefer a database aggregation pipeline or a well-bounded server-side calculation rather than fetching an unlimited collection into application memory.

### FR-05: Temperature graph

Display a clean line chart with:

- Time on the horizontal axis.
- Temperature in °C on the vertical axis.
- Hover or tap tooltips showing the measurement and timestamp.
- A clearly highlighted selected period.
- A useful empty state when there is no history.
- Appropriate handling of gaps in measurements.

The graph must use actual backend data. Missing readings must not be replaced by fabricated points or a continuous line that implies measurements were received.

### FR-06: Temperature thresholds

Allow the user to configure a minimum and maximum temperature threshold through a simple dashboard control.

Requirements:

- Reject invalid threshold values and minimum thresholds greater than or equal to the maximum threshold.
- Persist settings in MongoDB, in a separate `device_settings` document, so they survive page refreshes and redeployments.
- Show a clear status when the latest valid reading falls outside the configured range.
- Avoid repeatedly triggering the same alert on every refresh.
- Support recovery to a normal status when readings return to the configured range.

For the MVP, threshold violations are informational dashboard alerts. External notifications such as email or Telegram can be added later.

### FR-07: Device status and freshness

Calculate the age of the latest successfully received reading using the server-generated `receivedAt` timestamp.

Status rules:

- **Live:** Latest reading received within the last 60 seconds.
- **Delayed:** Latest reading is more than 60 seconds but no more than one hour old.
- **Stale / Offline:** Latest reading is more than one hour old.
- **Awaiting first reading:** No valid reading has ever been stored.
- **Service unavailable:** The frontend cannot currently verify device data because the API or database is unavailable.

The UI must display the last received timestamp and communicate when the value was last updated.

An API failure must not automatically be interpreted as proof that the ESP32 is offline. Distinguish an unverifiable device status from a confirmed stale reading whenever possible.

### FR-08: Auto-refresh

- Refresh the latest temperature and device freshness approximately every 10 seconds.
- Avoid overlapping requests when a previous request has not finished.
- Stop unnecessary polling when the page is no longer visible, where practical.
- Resume refreshes when the user returns to the page.
- Refresh historical data periodically when necessary and immediately when the selected range changes.
- Prevent duplicate timers during component mounting and unmounting.
- Handle rate limits and temporary failures without spinning in a rapid retry loop.

Use simple HTTP polling for the initial release. WebSockets are not required.

### FR-09: Health endpoint

**Endpoint:** `GET /api/health`

Return a minimal service-health response that can help verify deployment and basic service availability.

Do not expose credentials, database connection strings, stack traces, or sensitive infrastructure information. Dependency availability may be reported in a non-sensitive way.

## 6. API Response and Error Standards

All endpoints must follow a consistent JSON response structure.

Example successful latest-reading response:

```json
{
  "data": {
    "deviceId": "thermoguard-01",
    "temperatureC": 27.4,
    "receivedAt": "2026-10-28T15:40:00.000Z"
  }
}
```

Example error response:

```json
{
  "error": {
    "code": "DATABASE_UNAVAILABLE",
    "message": "Temperature data is temporarily unavailable.",
    "retryable": true
  }
}
```

Requirements:

- Use suitable HTTP status codes, including `400`, `401`, `404` where applicable, `429`, `500`, and `503`.
- Never return a successful ingestion response unless persistence succeeded.
- Avoid leaking internal exception messages.
- Set appropriate `Cache-Control` headers to prevent stale telemetry from being presented as current.
- Validate input on the server even if the ESP32 firmware also validates it.
- Restrict CORS to the actual deployment origin when cross-origin requests are used. If the browser frontend and API share the same Next.js origin, avoid unnecessary permissive CORS configuration.

## 7. Error Handling and Recovery

Error handling is a core product requirement, not final polish.

### ESP32 cannot connect to Wi-Fi

Continue attempting recovery using bounded delays. Do not repeatedly reboot in a tight loop. Resume telemetry uploads after connectivity returns.

### ESP32 cannot reach the API

Record the failure locally where practical, avoid excessive retries, and retry transient errors. If temporary local buffering is implemented, queued records must retain their original measurement timestamps and must not be represented as newly measured readings.

### MongoDB write fails

The ingestion endpoint must return an error. The ESP32 must not assume the reading was saved merely because the request was sent. The backend should log diagnostic details safely and return a generic retryable error where appropriate.

### No data has been received

Display a calm first-run state such as:

**Waiting for your first reading**

“Connect the sensor and bring the device online. Temperature data will appear here automatically.”

### The latest reading is older than one hour

Keep the last saved temperature visible, but clearly label it as stale.

Example:

**Device is offline**

“Last reading received 2 hours ago. Showing the last recorded temperature, not a live measurement.”

Use a subtle amber status treatment with the exact timestamp. Do not show the last reading as a live value.

### API request fails in the dashboard

- Preserve the most recent previously fetched value and historical graph in the current page session.
- Clearly indicate that the latest refresh failed.
- Show when the data was last successfully fetched.
- Retry automatically with a bounded delay.
- Recover to a normal state when requests succeed again.

### Empty chart history

Show a designed empty state rather than an empty chart frame or broken axes.

### General application errors

Use graceful fallback UI, safe logging, and clear user-facing messages. Errors in one widget should not cause the entire dashboard to become unusable.

## 8. User Interface and Design Requirements

### Design direction

The UI should feel premium, calm, precise, and human-made, inspired by the restraint and clarity of products such as Linear and Claude.

Avoid generic IoT dashboard visuals, excessive cards, decorative gradients, neon colors, oversized headings, unnecessary animation, and template-like aesthetics.

### Visual system

- Use a warm, low-glare neutral background instead of pure white everywhere.
- Use dark, readable text and restrained secondary text.
- Choose one understated accent color.
- Use subtle borders and consistent spacing.
- Use typography with a clear hierarchy and comfortable line lengths.
- Use color to communicate meaningful states rather than decorate every component.
- Keep charts minimal, with thin grid lines and readable axis labels.
- Prefer small, purposeful transitions rather than elaborate animations.

### Dashboard layout

**Header**
- Product name: ThermoGuard.
- Small device or system status indicator.
- Last refresh status.

**Main temperature section**
- Large current temperature value in °C.
- Clear Live, Delayed, Stale, or error status.
- Last received timestamp.
- Small contextual status text.

**Statistics**
- Minimum temperature.
- Maximum temperature.
- Average temperature.

**Historical section**
- Temperature line chart.
- Time-range selector.
- Tooltip and readable timestamps.

**Threshold section**
- Configurable minimum and maximum temperature.
- Clear normal or threshold-exceeded indication.

### Responsive design

- **Mobile:** Single-column layout, large temperature value, compact statistics, touch-friendly controls, and readable chart labels.
- **Tablet:** Balanced stacked or two-column layout.
- **Desktop:** Spacious layout with temperature summary and statistics above or beside the main chart.

The dashboard must work without horizontal page scrolling at common mobile widths.

### Accessibility

- Maintain sufficient text contrast.
- Use semantic HTML and accessible labels.
- Do not use color as the only indicator of status.
- Make controls keyboard-accessible.
- Respect reduced-motion preferences.
- Provide text alternatives for chart summaries where practical.

## 9. Technical Architecture and Code Organization

Use Next.js with TypeScript and a structure that separates presentation, business logic, data access, and API handling.

Suggested structure:

```text
src/
  app/
    page.tsx
    layout.tsx
    api/
      telemetry/
        route.ts
        latest/
          route.ts
        history/
          route.ts
      settings/
        route.ts
      health/
        route.ts

  components/
    dashboard/
      TemperatureOverview.tsx
      TemperatureChart.tsx
      TemperatureStats.tsx
      DeviceStatus.tsx
      ThresholdSettings.tsx
    ui/
      StatusBadge.tsx
      LoadingState.tsx
      ErrorState.tsx
      EmptyState.tsx

  lib/
    mongodb.ts
    telemetry.ts
    validation.ts
    device-auth.ts
    errors.ts
    utils.ts

  types/
    telemetry.ts

tests/
  unit/
  integration/
  e2e/
```

This structure is illustrative. Keep it small and adjust it only when a real need arises.

### MongoDB connection requirements

- Use the official MongoDB Node.js driver for a straightforward, explicit data-access layer. Mongoose is also acceptable if the implementation has a clear reason to use an ODM, but do not introduce both.
- Create a shared MongoDB client module that reuses the client across warm Vercel serverless invocations where possible.
- Do not connect to MongoDB from client components.
- Do not create a new connection for every 10-second request if a reusable client can be used.
- Configure connection timeouts and handle connection failures explicitly.
- Keep database name, collection names, and index creation in one documented setup or migration/init path.
- Use atomic database operations where appropriate and avoid unnecessary reads before writes.

### Code quality requirements

- Use TypeScript with strict type checking.
- Keep React components focused on presentation and user interactions.
- Keep MongoDB queries inside the server-side data-access layer.
- Separate API validation, authentication, business logic, and database operations.
- Reuse shared types and utility functions.
- Avoid unnecessary state management libraries and excessive abstractions.
- Avoid giant components, duplicated logic, unexplained constants, and deeply nested conditionals.
- Document non-obvious decisions and configuration requirements.
- Use consistent formatting, naming, and linting rules.

The project should favour understandable code over clever abstractions.

## 10. MongoDB Data Model

Use a database named `thermoguard` or another documented name, with the following collections.

### Collection: `temperature_readings`

Each accepted sensor reading is stored as a separate document.

Example document:

```json
{
  "_id": "ObjectId(...) ",
  "deviceId": "thermoguard-01",
  "temperatureC": 27.4,
  "receivedAt": "2026-10-28T15:40:00.000Z",
  "measuredAt": "2026-10-28T15:39:59.000Z"
}
```

In the actual MongoDB document, `receivedAt` and `measuredAt` must be BSON `Date` values, not strings. `measuredAt` is optional and should be omitted if the device clock is not trustworthy.

Fields:

| Field | BSON type | Description |
|---|---|---|
| `_id` | ObjectId | Unique document identifier |
| `deviceId` | String | Sensor device identifier |
| `temperatureC` | Number | Temperature in Celsius |
| `receivedAt` | Date | Server receipt timestamp in UTC; authoritative for freshness |
| `measuredAt` | Date, optional | Device measurement time, when trustworthy |

### Required indexes

Create the following indexes during setup or migration, not on every request:

1. `{ deviceId: 1, receivedAt: -1 }` — efficiently fetch the latest reading for one device.
2. `{ deviceId: 1, receivedAt: 1 }` — efficiently query a device's time range in chronological order. Assess whether the first compound index can also satisfy this query before adding a second index; avoid redundant indexes without measured need.
3. Optional TTL index on `{ receivedAt: 1 }` with `expireAfterSeconds: 2592000` if the chosen policy is to automatically expire telemetry after approximately 30 days. TTL deletion is asynchronous and approximate; do not rely on it for exact-time deletion or compliance requirements.

Use explain plans or realistic tests to confirm the final index set. More indexes speed some reads but add write and storage overhead.

### Collection: `device_settings`

Store configurable settings separately from readings.

Example document:

```json
{
  "deviceId": "thermoguard-01",
  "minTemperatureC": 5,
  "maxTemperatureC": 30,
  "updatedAt": "2026-10-28T15:40:00.000Z"
}
```

As with readings, `updatedAt` must be a BSON `Date` in MongoDB. Create a unique index on `{ deviceId: 1 }` so each device has one settings document. Use an upsert when saving settings, with server-side validation.

### Data and query requirements

- Store timestamps as BSON `Date` values in UTC.
- Generate `receivedAt` on the server.
- Insert one new document per accepted measurement; do not overwrite historical records.
- Query by `deviceId` and timestamp range.
- Sort history in ascending time order for charts; sort descending with a limit when fetching the latest reading.
- Calculate statistics through a bounded query or aggregation pipeline.
- Establish an initial retention policy of 30 days. If records are retained longer, review expected storage and query volume first.
- Do not rely on an unlimited collection scan for routine dashboard requests.
- Keep settings separate from time-series telemetry to simplify data access and retention.

## 11. Security Requirements

- Protect the ingestion endpoint with a device-specific API secret or bearer token.
- Keep the MongoDB Atlas connection string and server-side secrets in environment variables.
- Never expose private environment variables through client-side code.
- Never commit actual credentials to source control.
- Validate every incoming field on the server.
- Apply reasonable request-size limits and rate limiting.
- Avoid detailed public error responses.
- Use HTTPS in production.
- Restrict Atlas network access and database permissions to what the deployment requires; use a database user with the minimum required permissions.
- Keep the dashboard read-only with respect to sensor data.
- Document whether dashboard read endpoints are publicly accessible.
- Do not allow arbitrary client-supplied device IDs to grant access to data or settings that the caller is not authorized to view or change.

The initial dashboard may be publicly viewable for a classroom demonstration. Device ingestion must still be authenticated so arbitrary visitors cannot submit fake readings. If threshold settings can be changed publicly, consider a simple access-control mechanism before exposing the dashboard widely.

## 12. Non-Functional Requirements

### Reliability

- Recover gracefully from transient API, network, and database failures.
- Never crash the entire dashboard because a single widget or request fails.
- Distinguish stale data from a failed refresh.
- Persist accepted telemetry so browser refreshes do not lose history.
- Use bounded retries to avoid excessive load.

### Performance

- Target a latest-reading API response time below one second at the 95th percentile under normal operating conditions.
- Keep API responses small and database queries indexed.
- Limit historical response sizes and downsample longer ranges when necessary.
- Prevent overlapping polling requests and uncontrolled component re-rendering.
- Reuse MongoDB connections where possible rather than reconnecting for each request.

### Freshness

- ESP32 upload interval: approximately 10 seconds.
- Frontend refresh interval: approximately 10 seconds.
- Live status: reading received within 60 seconds.
- Stale status: reading older than one hour.

These are application-level targets. Actual freshness depends on Wi-Fi, internet connectivity, API availability, and database performance.

### Maintainability

- Use modular components and clearly named functions.
- Maintain a simple setup process.
- Keep configuration documented.
- Use automated formatting, linting, and type checks.
- Avoid dependencies without a clear purpose.

### Compatibility

- Support current major desktop and mobile browsers.
- Work across common screen sizes.
- Handle intermittent network connectivity without losing the ability to render the last successfully fetched state.

### Observability

- Log useful server-side errors with timestamps and relevant request context.
- Never log device secrets, bearer tokens, or database credentials.
- Record enough information to troubleshoot failed ingestion and database queries.
- Provide a non-sensitive health endpoint.

## 13. Testing and Acceptance Criteria

The application is ready only when the following checks pass.

### Sensor and ingestion tests

- A valid reading is accepted and persisted in MongoDB.
- A subsequent reading creates a new document rather than overwriting an earlier reading.
- Invalid JSON, missing fields, non-numeric values, and invalid temperatures are rejected.
- Missing or incorrect device credentials are rejected.
- Database failures produce an error response and do not falsely report success.
- Requests exceeding configured rate limits are handled correctly.
- Server receipt timestamps are generated by the backend.

### MongoDB tests

- The required collections and indexes are created correctly.
- Latest-reading queries return the newest record for the requested device.
- Historical queries return only the requested time range in chronological order.
- Statistics match known test data.
- Settings are upserted and persist after page refreshes and redeployments.
- A simulated MongoDB connection failure is handled gracefully.
- Retention behaviour is documented and tested at the policy level; TTL deletion timing is not asserted as immediate.

### Dashboard tests

- The latest saved reading is displayed correctly.
- Live polling updates the value without a full-page reload.
- The graph displays timestamped historical measurements.
- Changing the range updates the graph and statistics.
- Minimum, maximum, and average values are calculated correctly.
- Empty history displays a designed empty state.
- Threshold changes persist after a page refresh.
- The UI remains usable on mobile, tablet, and desktop.

### Reliability tests

- No reading received yet produces the first-run state.
- A reading older than 60 seconds displays a delayed status.
- A reading older than one hour displays a stale/offline state.
- The previous value remains visible when a refresh fails.
- The UI clearly distinguishes a backend failure from a confirmed stale device.
- The dashboard automatically recovers when the API becomes available again.
- Repeated refreshes do not create duplicate timers or uncontrolled requests.
- Missing measurements appear as gaps rather than fabricated continuous data.
- Temporary network failures do not create rapid, unbounded retry loops.

### Security tests

- The ingestion API cannot be called successfully without valid authentication.
- Secrets are not present in client-side bundles or production logs.
- API errors do not expose stack traces or internal configuration.
- Input validation occurs on the server.
- MongoDB credentials are not accessible to browser clients.
- Database permissions and Atlas network rules follow least privilege.

### Deployment tests

- Production build, linting, and TypeScript checks pass.
- Environment variables are configured in Vercel.
- MongoDB Atlas connectivity works in the deployed environment.
- ESP32 requests reach the production API over HTTPS.
- The public dashboard loads and refreshes correctly from a phone using a separate internet connection.
- Data persists across browser refreshes and application redeployments.

## 14. Environment Configuration

Document required environment variables in `.env.example` with placeholders only.

Expected configuration:

- `MONGODB_URI` — MongoDB Atlas connection string.
- `MONGODB_DB` — database name, for example `thermoguard`.
- `DEVICE_API_TOKEN` — secret used to authenticate ESP32 ingestion.
- `NEXT_PUBLIC_APP_URL` — public application URL if required by client-facing code or URL generation.

Only variables explicitly intended for browser access may use the `NEXT_PUBLIC_` prefix. Private credentials must never use it. Configure production values in Vercel's project settings and local values in `.env.local`, which must not be committed.

Provide setup instructions for MongoDB Atlas, database user and network access, local development, required indexes, firmware configuration, tests, and deployment.

## 15. Operational Considerations

- Every 10 seconds produces approximately 8,640 readings per device per day, or 259,200 readings over 30 days for one continuously reporting device. This is a manageable prototype workload when queries and indexes are designed appropriately, but actual storage depends on document and index overhead.
- The backend should write one document per accepted reading and avoid extra database writes for routine reads.
- Do not update a separate “latest reading” document on every upload in the MVP unless profiling shows a concrete need. The indexed latest-reading query is simpler and avoids duplicate state that could become inconsistent.
- Keep the UI poll interval and ingestion interval configurable constants rather than scattered magic numbers.
- Add basic rate limiting and bounded historical query limits before exposing the API publicly.
- Review MongoDB Atlas quotas, connection limits, and pricing before moving beyond the classroom prototype; don't assume a free plan has unlimited capacity.

## 16. Definition of Done

The MVP is complete when:

1. The ESP32 sends valid temperature readings to the production backend approximately every 10 seconds.
2. The backend authenticates, validates, and persists incoming readings in MongoDB Atlas.
3. The dashboard displays the latest stored temperature and refreshes automatically.
4. Historical graphs and period-specific statistics work correctly.
5. Thresholds can be configured and persist in MongoDB.
6. Fresh, delayed, stale, empty, and backend-error states behave as specified.
7. The design is polished, responsive, accessible, and visually consistent.
8. Production secrets remain protected.
9. Automated tests, type checks, linting, and production build pass.
10. End-to-end testing confirms that the complete ESP32 → API → MongoDB → API → dashboard flow works.

## 17. Recommended Implementation Order

1. Initialize the Next.js TypeScript application and establish the design system.
2. Create a MongoDB Atlas project, database user, and connection string.
3. Implement a reusable MongoDB client and create the collections and indexes.
4. Implement and test authenticated telemetry ingestion.
5. Implement latest-reading and historical-reading APIs.
6. Build the dashboard using real API responses.
7. Add auto-refresh, statistics, and historical graphs.
8. Add threshold persistence and status handling.
9. Implement security, validation, logging, and recovery behaviour.
10. Test stale data, network failures, and MongoDB outages.
11. Deploy on Vercel and verify the complete system using the ESP32 and a mobile browser.

## Product Principle

**Always show the truth about the data.** A last-known temperature can remain useful when the device is offline, but it must never be presented as a live measurement.
