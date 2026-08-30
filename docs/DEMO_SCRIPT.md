# Trishul — 5-Minute Hackathon Demo Script

**Setup (before judges arrive):** run `docker compose up --build` (or the local dev commands in the README) and confirm `http://localhost:5173` loads with all 8 zones showing Safe (green).

---

### 0:00 – 0:30 · The problem
> "Hilly regions get flash floods and landslides with almost no warning. Existing systems rely on a single signal — just rainfall, or just a seismometer. Trishul fuses six signals — rainfall, soil moisture, slope tilt, vibration, terrain, and history — into one explainable risk score per village, so local officials know *why* a zone is at risk and *what to do*, not just a number."

Point out the **Demo Mode** badge — this is a decision-support prototype, not a certified emergency system.

### 0:30 – 1:15 · Overview dashboard
Open the **Overview** page.
- "8 fictional zones across a fictional hill district — all currently Safe."
- Point to the stat row: total zones, Safe/Watch/Warning/Evacuate counts, active alerts, sensor uptime.
- Point to the live map: color-coded polygons and markers, green = Safe.

### 1:15 – 1:45 · Zone detail & explainability
Click into **Dharali**.
- Show population, elevation, slope, terrain risk.
- Show the "Why this risk level?" panel — this is the explainability layer judges care about.
- Show recommended action, estimated lead time, safe location, and evacuation route.

### 1:45 – 3:30 · The main event: Run Rapid Escalation
Go to **Simulation Control**.
- Select **Dharali** as the target zone.
- Click **Run Rapid Escalation**.
- Narrate while it runs (ticks every 2 seconds, ~7 ticks total):
  - "Rainfall, soil moisture, tilt, and vibration are all climbing."
  - Switch to **Live Map** — watch Dharali's polygon shift green → yellow → orange → red in real time via the WebSocket feed.
  - Switch to **Alerts Center** — three new alerts appear: Safe→Watch, Watch→Warning, Warning→Evacuate, each with its own reasons.
  - Open **Dharali**'s zone page again — the reasons list now shows things like "Extreme rainfall + saturated soil + rapid tilt change → minimum level Evacuate" (a hard escalation rule, not just the weighted score) and the recommended action now reads "Issue immediate evacuation order."

### 3:30 – 4:00 · Alert handling
Back in **Alerts Center**, as an Operator:
- Acknowledge the Watch→Warning alert.
- Resolve the Warning→Evacuate alert once safe.
- Point out delivery channels are marked "demo mode" for Telegram/email since no credentials are configured — flip a switch in `.env` and it would actually deliver.

### 4:00 – 4:30 · Analytics & roles
Open **Analytics** — bar chart of current risk score per zone, alerts generated per zone, population currently in Warning/Evacuate zones.
Open **Settings** — switch role between Viewer / Operator / Administrator to show role-gated permissions (only Operator+ can run simulations or act on alerts).

### 4:30 – 5:00 · Reset & close
Click **Reset all zones** in Simulation Control — everything returns to baseline Safe.
> "Everything you saw ran without any physical hardware — the same pipeline works unchanged with our ESP32 sensor sketch in `hardware/`, which we also built and can show on request. The whole stack — FastAPI, PostgreSQL, React — runs from one `docker compose up` command."

---

## Backup talking points (if asked)
- **Why weighted fusion + hard rules?** Weighted scoring is smooth and explainable; hard rules catch dangerous single-signal spikes (e.g. a vibration sensor firing) that a blended score might dilute.
- **Why cooldown on alerts?** Prevents alert fatigue from noisy sensors while still catching every genuine escalation — tested with unit tests.
- **What's fictional vs. real?** All 8 zones, their coordinates, and historical events are invented for this demo; the risk model and pipeline are real, general-purpose engineering.
