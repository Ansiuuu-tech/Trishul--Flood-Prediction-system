// features.js — Single source of truth for all 8 Trishul feature pages.
// Each entry drives the shared <FeaturePage /> template.
// Content sourced from trishul-content-spec.md — verbatim.

export const features = [
  {
    id: 'varuna-watch',
    name: 'Varuna Watch',
    myth: 'Varuna — god of water and rain',
    description: 'Varuna Watch is the rainfall intelligence module. It ingests gauge-corrected radar estimates and ground-truth rain gauge data, computing accumulation across three operational windows — 1-hour, 3-hour, and 24-hour — with intensity classification (light, moderate, heavy, extreme) calibrated for Himalayan orographic enhancement. Output feeds directly into Trishul Core as the rainfall likelihood component.',
    icon: { type: 'rainfall' },
    sections: [
      { number: 1, title: 'Ingest', desc: 'Radar QPE + gauge network fused via kriging interpolation at 500m resolution.' },
      { number: 2, title: 'Window', desc: 'Rolling 1h / 3h / 24h accumulations updated every 5 minutes.' },
      { number: 3, title: 'Classify', desc: 'Intensity thresholds tuned to Himalayan catchment response curves.' },
      { number: 4, title: 'Emit', desc: 'Rainfall likelihood score (0–1) streamed to Trishul Core fusion engine.' },
    ],
    feedsInto: 'Varuna Watch emits a rainfall likelihood score (0–1) and the dominant intensity class. Trishul Core weights this against Bhumi Sense slope stability probability and Kampan Alert vibration anomaly score. When rainfall likelihood exceeds 0.7 concurrently with rising soil saturation, the fusion posterior shifts toward Warning/Evacuate even before vibration triggers.',
    feedsIntoConnections: [
      { label: 'Trishul Core', desc: 'Likelihood 0.73', color: 'fern-400' },
      { label: 'Kailash View', desc: 'Rainfall raster', color: 'moss-600' },
      { label: 'Drishti Panel', desc: 'Attribution', color: 'signal-amber' },
    ],
    mockup: {
      type: 'varuna',
      rainfallWindows: [
        { window: '1h', value: '47mm', class: 'extreme', label: 'Extreme', level: 'evacuate' },
        { window: '3h', value: '112mm', class: 'extreme', label: 'Extreme', level: 'evacuate' },
        { window: '24h', value: '289mm', class: 'heavy', label: 'Heavy', level: 'warn' },
      ],
      intensityClasses: [
        { label: 'Light', range: '< 2.5 mm/h', color: 'rudra-safe' },
        { label: 'Moderate', range: '2.5–10 mm/h', color: 'rudra-watch' },
        { label: 'Heavy', range: '10–50 mm/h', color: 'rudra-warn' },
        { label: 'Extreme', range: '> 50 mm/h', color: 'rudra-evacuate' },
      ],
      gaugeData: {
        primary: { value: '47mm', label: '1h Accumulation' },
        zone: 'Zone 3 — Dhading',
        status: 'LIVE',
        lastUpdate: '2 min ago',
        nextRefresh: '3 min',
      },
    },
    cta: {
      text: 'See It on the Live Dashboard',
      sub: 'Trishul Core fuses Varuna Watch with Bhumi Sense and Kampan Alert into a single Rudra Level.',
      link: '/features/trishul-core',
      linkLabel: 'Enter Trishul Core Demo',
    },
  },
  {
    id: 'bhumi-sense',
    name: 'Bhumi Sense',
    myth: 'Bhumi — goddess of the earth',
    description: 'Bhumi Sense monitors volumetric water content (VWC) at multiple depths and slope inclination via MEMS inclinometers. It outputs a slope stability probability (0–1) derived from a physically-based infinite-slope model parameterized with real-time pore pressure estimates. The module detects progressive saturation leading to loss of shear strength — the precursor to shallow landslides and debris flows.',
    icon: { type: 'ground' },
    sections: [
      { number: 1, title: 'Sense', desc: 'Capacitance VWC probes at 0.2m, 0.5m, 1.0m depths + biaxial tilt sensors at 0.1° resolution.' },
      { number: 2, title: 'Model', desc: 'Infinite-slope stability model with real-time pore pressure from VWC via soil-water characteristic curve.' },
      { number: 3, title: 'Probabilize', desc: 'Monte Carlo sampling of soil cohesion/friction angle uncertainty yields P(failure | conditions).' },
      { number: 4, title: 'Emit', desc: 'Slope stability probability (0–1) and dominant failure mode streamed to Trishul Core.' },
    ],
    feedsInto: 'Bhumi Sense emits slope stability probability and the critical depth of potential failure. Trishul Core combines this with Varuna Watch rainfall likelihood: sustained heavy rain on already saturated slopes drives the fusion posterior toward Warning/Evacuate. The critical depth informs Kailash View runout zone estimates.',
    feedsIntoConnections: [
      { label: 'Trishul Core', desc: 'P(fail): 0.82', color: 'fern-400' },
      { label: 'Kailash View', desc: 'Runout zones', color: 'moss-600' },
      { label: 'Drishti Panel', desc: 'Attribution', color: 'signal-amber' },
    ],
    mockup: {
      type: 'bhumi',
      sensorProfile: [
        { depth: '0.2m', vwc: '38%', status: 'Saturated', level: 'evacuate' },
        { depth: '0.5m', vwc: '34%', status: 'Near Saturation', level: 'warn' },
        { depth: '1.0m', vwc: '28%', status: 'Wetting', level: 'watch' },
      ],
      slopeStats: [
        { label: 'Current Tilt', value: '12.3°', color: 'rudra-safe' },
        { label: '24h Change', value: '+0.8°', color: 'rudra-watch' },
        { label: 'P(Failure)', value: '0.87', color: 'rudra-warn' },
      ],
      stabilityGauge: {
        value: '0.87',
        label: 'Slope Stability Probability',
        level: 'warn',
      },
    },
    cta: {
      text: 'See It on the Live Dashboard',
      sub: 'Trishul Core fuses Bhumi Sense with Varuna Watch and Kampan Alert into a single Rudra Level.',
      link: '/features/trishul-core',
      linkLabel: 'Enter Trishul Core Demo',
    },
  },
  {
    id: 'kampan-alert',
    name: 'Kampan Alert',
    myth: 'Kampan — vibration, tremor, resonance',
    description: 'Kampan Alert operates a triaxial MEMS accelerometer array (400 Hz sampling) at each node. On-device DSP computes real-time PSD, dominant frequency, and kurtosis. A lightweight classifier distinguishes: anthropogenic noise (vehicles, construction), tectonic microseisms, and debris-flow vibration signatures (broadband 10–80 Hz with rising amplitude). Outputs vibration anomaly score (0–1) and classification label to Trishul Core.',
    icon: { type: 'vibration' },
    sections: [
      { number: 1, title: 'Sample', desc: 'Triaxial MEMS at 400 Hz, anti-aliased, GPS-time-synced across nodes.' },
      { number: 2, title: 'Extract', desc: 'On-device STFT → PSD, dominant frequency, spectral centroid, kurtosis every 5s.' },
      { number: 3, title: 'Classify', desc: 'TinyML model (4-class): quiet, anthropogenic, tectonic, debris-flow.' },
      { number: 4, title: 'Emit', desc: 'Vibration anomaly score (0–1) + class label streamed to Trishul Core.' },
    ],
    feedsInto: 'Kampan Alert emits vibration anomaly score and class. A debris-flow classification with score > 0.6 triggers immediate Warning in Trishul Core regardless of rainfall/soil state — it represents ground truth of mass movement. Tectonic class feeds seismic context; anthropogenic is suppressed.',
    feedsIntoConnections: [
      { label: 'Trishul Core', desc: 'Score: 0.91', color: 'fern-400' },
      { label: 'Drishti Panel', desc: 'Evidence timeline', color: 'signal-amber' },
      { label: 'Kailash View', desc: 'Vibration heatmap', color: 'moss-600' },
    ],
    mockup: {
      type: 'kampan',
      classifications: [
        { label: 'Quiet', score: '0.02', level: 'safe' },
        { label: 'Anthropogenic', score: '0.15', level: 'watch' },
        { label: 'Tectonic', score: '0.34', level: 'watch' },
        { label: 'Debris Flow', score: '0.91', level: 'evacuate' },
      ],
      spectralFeatures: [
        { label: 'Dominant Freq', value: '23.4 Hz' },
        { label: 'Kurtosis', value: '4.7' },
        { label: 'Anomaly Score', value: '0.89' },
      ],
      classificationResult: {
        label: 'DEBRIS FLOW',
        level: 'evacuate',
        confidence: '91%',
        amplitudeTrend: 'Rising',
        bandwidth: '10–78 Hz',
      },
    },
    cta: {
      text: 'See It on the Live Dashboard',
      sub: 'Trishul Core fuses Kampan Alert with Varuna Watch and Bhumi Sense into a single Rudra Level.',
      link: '/features/trishul-core',
      linkLabel: 'Enter Trishul Core Demo',
    },
  },
  {
    id: 'trishul-core',
    name: 'Trishul Core',
    myth: 'Trishul — the three-pronged fusion',
    description: 'Trishul Core is the Bayesian fusion engine. It receives three independent likelihood streams: Varuna Watch (rainfall likelihood), Bhumi Sense (slope failure probability), Kampan Alert (vibration anomaly). Each stream updates at its own cadence (5 min, 15 min, 5 s). The core computes posterior P(hazard | all evidence) using a conditional independence assumption calibrated on historical Himalayan events. Output: a single Rudra Level (Safe, Watch, Warning, Evacuate) with per-sensor attribution — the explainable "why" behind every alert.',
    icon: { type: 'core' },
    sections: [
      { number: 1, title: 'Normalize', desc: 'Each sensor stream mapped to P(hazard | sensor) via platform-specific calibration curves.' },
      { number: 2, title: 'Fuse', desc: 'Naïve Bayes fusion: P(hazard | all) ∝ P(hazard) × ∏ P(sensor_i | hazard) / P(sensor_i).' },
      { number: 3, title: 'Threshold', desc: 'Posterior mapped to Rudra Levels: <0.2 Safe, 0.2–0.5 Watch, 0.5–0.8 Warning, >0.8 Evacuate.' },
      { number: 4, title: 'Attribute', desc: 'Shapley values computed per sensor — explains which signal drove the level change.' },
    ],
    feedsInto: 'Trishul Core emits the authoritative Rudra Level for each zone. This drives Kailash View map rings, Drishti Panel explanations, and Ghanta Signal delivery routing. The attribution vector (rain %, ground %, vibration %) is the input to Drishti Panel. The level determines which Ghanta channels activate: Watch → SMS/WhatsApp; Warning → +Siren/IVR; Evacuate → +Radio/Door-to-door/PA systems.',
    feedsIntoConnections: [
      { label: 'Kailash View', desc: 'Map rings', color: 'fern-400' },
      { label: 'Drishti Panel', desc: 'Attribution', color: 'signal-amber' },
      { label: 'Ghanta Signal', desc: 'Delivery', color: 'rudra-warn' },
      { label: 'Rudra Levels', desc: 'Alert state', color: 'rudra-evacuate' },
    ],
    mockup: {
      type: 'core',
      inputStreams: [
        { name: 'Varuna Watch', metric: 'Rainfall Likelihood', value: '0.73', trend: 'Rising', level: 'warn' },
        { name: 'Bhumi Sense', metric: 'Slope P(Failure)', value: '0.82', trend: 'Rising', level: 'warn' },
        { name: 'Kampan Alert', metric: 'Vibration Anomaly', value: '0.91', trend: 'Spiking', level: 'evacuate' },
      ],
      attribution: [
        { sensor: 'Rainfall (Varuna)', contribution: 35, color: 'fern-400' },
        { sensor: 'Ground (Bhumi)', contribution: 42, color: 'moss-600' },
        { sensor: 'Vibration (Kampan)', contribution: 23, color: 'signal-amber' },
      ],
      fusionOutput: {
        level: 'evacuate',
        posterior: 0.94,
        zone: 'Zone 3 — Dhading',
        lastFusion: '45s ago',
        sirenActive: true,
      },
    },
    cta: {
      text: 'Explore the Alert System',
      sub: 'Rudra Levels defines the four-tier escalation that Trishul Core outputs.',
      link: '/features/rudra-levels',
      linkLabel: 'View Rudra Levels',
    },
  },
  {
    id: 'rudra-levels',
    name: 'Rudra Levels',
    myth: 'Rudra — the roarer, the howler, the storm god',
    description: 'Rudra Levels is the four-tier alert taxonomy that Trishul Core outputs. It replaces ambiguous "color codes" with action-bound levels: Safe (no action), Watch (prepare), Warning (move vulnerable), Evacuate (move everyone). Thresholds are calibrated on Himalayan catchment response times — not generic hydrology. Each level has defined channel activation (Ghanta Signal), community SOP, and auto-expiry logic. The system never cries wolf: pulse animation only at Warning/Evacuate.',
    icon: { type: 'levels' },
    sections: [
      { number: 1, title: 'Calibrate', desc: 'Thresholds derived from 2013–2026 Himalayan event database: time-to-peak vs. catchment area.' },
      { number: 2, title: 'Define', desc: 'Four levels with posterior probability bounds and mandatory community actions per level.' },
      { number: 3, title: 'Signal', desc: 'Signal-amber reserved exclusively for Warning/Evacuate UI — never decorative.' },
      { number: 4, title: 'Expire', desc: 'Auto-downgrade rules: Evacuate→Warning after 2h no-evidence; Warning→Watch after 1h.' },
    ],
    feedsInto: 'Rudra Levels is the output contract of Trishul Core. Kailash View renders level rings on the map. Drishti Panel shows the attribution for the current level. Ghanta Signal routes the level to the correct channel subset. The level also gates simulation mode in the dashboard — Tandav demo cycles through levels to train operators.',
    feedsIntoConnections: [
      { label: 'Kailash View', desc: 'Map rings', color: 'fern-400' },
      { label: 'Drishti Panel', desc: 'Attribution', color: 'signal-amber' },
      { label: 'Ghanta Signal', desc: 'Delivery routing', color: 'rudra-warn' },
      { label: 'Dashboard', desc: 'Two-state UI', color: 'rudra-evacuate' },
    ],
    mockup: {
      type: 'rudra',
      levels: [
        { level: 'safe', label: 'Safe', posterior: '< 0.20', action: 'No action required. Routine monitoring.', channels: 'None', color: 'rudra-safe' },
        { level: 'watch', label: 'Watch', posterior: '0.20 – 0.50', action: 'Prepare: check supplies, review routes, monitor updates.', channels: 'SMS, WhatsApp, App push', color: 'rudra-watch' },
        { level: 'warn', label: 'Warning', posterior: '0.50 – 0.80', action: 'Move vulnerable: elderly, children, disabled to safe ground.', channels: '+ Siren, IVR, Community radio', color: 'rudra-warn' },
        { level: 'evacuate', label: 'Evacuate', posterior: '> 0.80', action: 'Move everyone. Immediate evacuation to designated shelters.', channels: '+ Radio, Door-to-door, PA systems', color: 'rudra-evacuate' },
      ],
    },
    cta: {
      text: 'See the Dashboard',
      sub: 'The Dashboard renders two-state views: calm at Safe/Watch, full alert at Warning/Evacuate.',
      link: '/dashboard',
      linkLabel: 'Open Dashboard',
    },
  },
  {
    id: 'kailash-view',
    name: 'Kailash View',
    myth: 'Kailash — the mountain, the axis, the view from above',
    description: 'Kailash View is the GIS dashboard: a terrain-aware map (MapLibre GL + AWS Terrain Tiles) showing zone polygons, sensor node locations, and live Rudra Level rings pulsing at each zone centroid. Layers: rainfall accumulation (raster), soil saturation (interpolated), vibration heatmap, contour lines (signature element). Operators can click any zone for Drishti Panel drill-down. Dark mode default — matches field tablet use at night.',
    icon: { type: 'map' },
    sections: [
      { number: 1, title: 'Base', desc: 'MapLibre GL style with custom hillshade + contour layers (signature element).' },
      { number: 2, title: 'Zones', desc: 'GeoJSON polygons with live Rudra Level ring at centroid — pulse at Warning/Evacuate.' },
      { number: 3, title: 'Sensors', desc: 'Node markers colored by last heartbeat; click for raw timeseries.' },
      { number: 4, title: 'Overlays', desc: 'Toggleable: rainfall raster, VWC interpolation, vibration heatmap, runout zones.' },
    ],
    feedsInto: 'Kailash View consumes Trishul Core Rudra Levels for zone rings and Drishti Panel attribution for click-through. It feeds operator decisions back to Ghanta Signal (manual override broadcast) and to the simulation engine (Tandav mode replays historical events on the map).',
    feedsHeading: 'Connects To',
    feedsIntoConnections: [
      { label: 'Trishul Core', desc: 'Rudra Levels', color: 'fern-400' },
      { label: 'Drishti Panel', desc: 'Drill-down', color: 'signal-amber' },
      { label: 'Ghanta Signal', desc: 'Override', color: 'rudra-warn' },
      { label: 'Tandav Sim', desc: 'Replay', color: 'rudra-evacuate' },
    ],
    mockup: {
      type: 'kailash',
      zones: [
        { label: 'Zone 1', level: 'safe', pulse: false },
        { label: 'Zone 2', level: 'safe', pulse: false },
        { label: 'Zone 3', level: 'safe', pulse: false },
        { label: 'Zone 4', level: 'watch', pulse: false },
        { label: 'Zone 5', level: 'warn', pulse: true },
        { label: 'Zone 6', level: 'evacuate', pulse: true },
      ],
      mapStyle: 'MapLibre GL • Hillshade • Contours • Live Rings',
    },
    cta: {
      text: 'See the Reasoning',
      sub: 'Drishti Panel explains why each zone is at its current Rudra Level.',
      link: '/features/drishti-panel',
      linkLabel: 'Open Drishti Panel',
    },
    backgroundImage: 'kailash',
  },
  {
    id: 'drishti-panel',
    name: 'Drishti Panel',
    myth: 'Drishti — sight, vision, insight',
    description: 'Drishti Panel is the explainable-alert interface. When an operator clicks a zone in Kailash View, Drishti opens a side panel showing: the current Rudra Level, the posterior probability, and a Shapley attribution breakdown (rain %, ground %, vibration %). It also shows the evidence timeline — what each sensor reported in the last 6 hours — and the "what changed" delta since the last level transition. No black box: every alert can be traced to its sensor drivers.',
    icon: { type: 'insight' },
    sections: [
      { number: 1, title: 'Attribute', desc: 'Shapley values computed per sensor at fusion time — additive, consistent, local accuracy.' },
      { number: 2, title: 'Timeline', desc: 'Last 6h of each sensor stream aligned to fusion ticks — shows convergence/divergence.' },
      { number: 3, title: 'Delta', desc: 'What changed since last level transition: which sensor crossed threshold, by how much.' },
      { number: 4, title: 'Audit', desc: 'Immutable log of every fusion decision, level change, and operator acknowledgment.' },
    ],
    feedsInto: 'Drishti Panel is the human-readable layer on Trishul Core. It feeds operator confidence — critical for Ghanta Signal authorization (operators must acknowledge Warning/Evacuate before siren activation). It also feeds training data: attribution patterns that disagree with operator judgment are flagged for model recalibration.',
    feedsHeading: 'Feeds Operator Decisions',
    feedsIntoConnections: [
      { label: 'Ghanta Signal', desc: 'Authorize', color: 'rudra-warn' },
      { label: 'Model Recal', desc: 'Flag drift', color: 'signal-amber' },
      { label: 'Audit Log', desc: 'Immutable', color: 'fern-400' },
    ],
    mockup: {
      type: 'drishti',
      zone: {
        name: 'Zone 3 — Dhading District',
        lastFusion: '2 min ago',
        level: 'evacuate',
        posterior: 0.94,
      },
      attribution: [
        { sensor: 'Rainfall (Varuna Watch)', value: 35, color: 'fern-400', detail: '1h: 47mm (Extreme) • 3h: 112mm (Extreme)' },
        { sensor: 'Ground (Bhumi Sense)', value: 42, color: 'moss-600', detail: 'P(fail): 0.87 • Depth: 0.45m • Tilt: +0.8°/24h' },
        { sensor: 'Vibration (Kampan Alert)', value: 23, color: 'signal-amber', detail: 'Class: Debris Flow • Score: 0.91 • Kurtosis: 4.7' },
      ],
      deltaSinceTransition: [
        { label: 'Rainfall likelihood', value: '+0.18', color: 'rudra-warn' },
        { label: 'Slope P(failure)', value: '+0.31', color: 'rudra-evacuate' },
        { label: 'Vibration anomaly', value: '+0.57', color: 'rudra-evacuate' },
      ],
    },
    cta: {
      text: 'See Alert Delivery',
      sub: 'Ghanta Signal routes Rudra Levels to every channel that works when power fails.',
      link: '/features/ghanta-signal',
      linkLabel: 'Open Ghanta Signal',
    },
  },
  {
    id: 'ghanta-signal',
    name: 'Ghanta Signal',
    myth: 'Ghanta — the bell, the call, the alarm',
    description: 'Ghanta Signal is the multi-channel alert delivery system. It receives Rudra Levels from Trishul Core and routes to: Siren (solar-powered, LoRa-triggered, 120 dB at 100m), SMS (bulk gateway, template per level), WhatsApp Business API (rich templates with map link), IVR (automated voice call in Nepali/Hindi/local dialect), Community Radio (FM override), Door-to-door (volunteer app with checkpoint confirmation). Redundancy is the principle: every level activates a superset of the previous level\'s channels. Works on solar + battery when grid fails.',
    icon: { type: 'gong' },
    sections: [
      { number: 1, title: 'Route', desc: 'Level-to-channel mapping: Safe→none, Watch→digital, Warning→+audio, Evacuate→all.' },
      { number: 2, title: 'Template', desc: 'Pre-approved message templates per level per channel — no composition delay.' },
      { number: 3, title: 'Confirm', desc: 'Delivery receipts tracked; IVR/Door-to-door require acknowledgment; auto-escalate on failure.' },
      { number: 4, title: 'Resilient', desc: 'Siren nodes: LoRa mesh, solar + 72h battery. Gateway: satellite backhaul option.' },
    ],
    feedsInto: 'Ghanta Signal is the terminal action layer. It receives Rudra Level from Trishul Core and operator acknowledgment from Drishti Panel (required for Warning/Evacuate siren activation). Delivery receipts feed back to Kailash View (green checkmarks on zone) and to audit log. Failed deliveries auto-escalate to next channel in hierarchy.',
    feedsIntoConnections: [
      { label: 'Trishul Core', desc: 'Rudra Level', color: 'fern-400' },
      { label: 'Kailash View', desc: 'Receipts', color: 'moss-600' },
      { label: 'Drishti Panel', desc: 'Ack required', color: 'signal-amber' },
    ],
    mockup: {
      type: 'ghanta',
      channelMatrix: [
        { name: 'Siren (LoRa)', safe: '—', watch: '—', warn: '✓ Auto', evacuate: '✓ Auto', color: 'rudra-evacuate' },
        { name: 'SMS', safe: '—', watch: '✓', warn: '✓', evacuate: '✓', color: 'fern-400' },
        { name: 'WhatsApp', safe: '—', watch: '✓', warn: '✓', evacuate: '✓', color: 'fern-400' },
        { name: 'IVR (Voice)', safe: '—', watch: '—', warn: '✓ Auto', evacuate: '✓ Auto', color: 'rudra-warn' },
        { name: 'Community Radio', safe: '—', watch: '—', warn: '—', evacuate: '✓ Override', color: 'rudra-evacuate' },
        { name: 'Door-to-door', safe: '—', watch: '—', warn: '—', evacuate: '✓ Volunteer', color: 'rudra-evacuate' },
      ],
      activeBroadcast: {
        level: 'evacuate',
        zone: 'Zone 3',
        sirenMessage: 'Evacuate immediately. Proceed to designated shelter at Ward 4 School. Do not wait. Trishul Warning System.',
        sirenSub: '"Evacuate Now"',
      },
      deliveryStatus: [
        { channel: 'Siren Node Z3-01', status: 'ACTIVE', detail: '120 dB • LoRa mesh • Solar', level: 'evacuate' },
        { channel: 'SMS Gateway', status: 'DELIVERED', detail: '1,247 recipients • 98% success', level: 'safe' },
        { channel: 'WhatsApp Business', status: 'DELIVERED', detail: '892 recipients • Read: 67%', level: 'safe' },
        { channel: 'IVR (Nepali)', status: 'CALLING', detail: '412 calls • 23 answered', level: 'watch' },
        { channel: 'Community Radio FM', status: 'OVERRIDE', detail: 'Live interrupt • 15km radius', level: 'evacuate' },
        { channel: 'Volunteer App', status: 'CHECKPOINT 3/5', detail: 'Door-to-door confirmed', level: 'warn' },
      ],
    },
    cta: {
      text: 'Back to Overview',
      sub: 'All eight modules work together as one warning system.',
      link: '/features',
      linkLabel: 'View All Features',
      isLight: true,
    },
  },
];

// Export a lookup for dynamic route matching
export const featureIds = features.map(f => f.id);
export const featureByPath: Record<string, typeof features[0]> = {};
features.forEach(f => {
  featureByPath[f.id] = f;
});
