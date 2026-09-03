import { Link } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { TrishulMark, ContourField, DamageScene } from '@/components/core';
import aboutBg from '@/assets/images/about-bg.jpeg?url';

const incidents = [
  {
    year: '2023',
    label: 'Sikkim GLOF',
    detail: 'South Lhonak Lake outburst flood killed 55+ and destroyed the Teesta III dam. Existing water-level gauges detected the surge only after the flood wave had already passed through the village.',
  },
  {
    year: '2024',
    label: 'Himachal Cloudburst',
    detail: '28 dead, 55+ missing across Mandi, Kullu, and Shimla. Cloudbursts dumped >120mm in 3h, triggering debris flows that buried villages. Rain-gauge-only systems were overwhelmed.',
  },
  {
    year: '2024',
    label: 'Uttarakhand Debris Flows',
    detail: 'Multiple events in Garhwal. Research seismometer arrays detected precursor vibrations hours before flows arrived — but the data never reached operational warning channels.',
  },
  {
    year: '2025',
    label: 'Nepal Monsoon',
    detail: '140 total deaths in the 2025 monsoon (67 from landslides, 37 from floods). Soil-moisture monitoring absent from all operational systems. Saturated slopes failed without warning.',
  },
  {
    year: '2026',
    label: 'Trishuli Trigger Event',
    detail: 'Glacier collapse released a flood wave that raised the Trishuli by 9 metres in 30 minutes. Water-level sensors triggered only after impact. Trishul was conceived from this gap.',
  },
];

const geoConcepts = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M12 2L2 22h20L12 2z" />
        <path d="M12 22V12" />
        <path d="M5 14h14" />
      </svg>
    ),
    title: 'Orographic Amplification',
    desc: 'Himalayan catchments force moist monsoon air upward, producing 8–12× rainfall enhancement on windward slopes. A 25mm/hr cloudburst at the valley mouth can become 200mm+ in the headwaters within 2 hours.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M20 12V8a4 4 0 0 0-4-4h-2a4 4 0 0 0-4 4v4" />
        <path d="M12 12v8" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    title: 'Steep Terrain Hazards',
    desc: 'Slopes of 30–45° with loose scree and moraine deposits create ideal conditions for debris flows. Water travels at 20+ km/h down these channels, carrying boulders the size of cars.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M1 12s9-7 11-9 11 7 11 9-9 11-11 11S1 17 1 12z" />
      </svg>
    ),
    title: 'Morae Dam Instability',
    desc: 'Retreating glaciers leave unstable terminal moraine dams. These can breach catastrophically with no advance warning — a GLOF (glacier lake outburst flood) that travels 15+ km downstream in minutes.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M3 12s18 9 18 0-18-9-18 0z" />
        <path d="M8 12V7a4 4 0 0 1 8 0v5" />
        <path d="M5 12h14v10H5z" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    title: 'Debris-Flow Bulking',
    desc: 'A flash flood is not just moving water — it entrains sediment, boulders, and organic debris, becoming a denser, faster, more destructive flow. Debris flows can reach 20+ km/h and carry objects the size of cars, making them far more lethal than clear-water floods of the same depth.',
  },
];

const depthThreats = [
  { depth: '15cm', threat: 'Sweeping hazard: moving water at 15cm depth can sweep away an adult. Flow velocity is the multiplier.', },
  { depth: '30cm', threat: 'Floating hazard: enough buoyancy to lift and carry vehicles. Cars float at ~30cm depth.', },
  { depth: '1m', threat: 'Structural hazard: enough force to move boulders, collapse walls, and strip foundations.', },
  { depth: '3m+', threat: 'Total inundation: entire ground floors submerged. Only rooftop refuge survives.', },
];

export function AboutPage() {
  return (
    <div className="min-h-screen bg-mist-50 dark:bg-forest-950">
      <div>
        {/* Hero */}
        <section className="section-py bg-forest-950 relative" aria-labelledby="about-hero-heading">
          <img src={aboutBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35" />
          <ContourField className="absolute inset-0" opacity={0.08} />
          <div className="absolute inset-0 bg-forest-950/50" aria-hidden="true" />
          <div className="relative container-main text-center">
            <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-4 animate-fade-in">
              The System
            </p>
            <h1 id="about-hero-heading" className="font-display text-hero-h1 font-medium text-mist-50 mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              Trishul — Early Warning for Himalayan Flash Floods
            </h1>
            <p className="text-body text-mist-50/70 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '200ms' }}>
              Three environmental signals fused into one alert. Rainfall, ground saturation, and vibration — delivered through channels that survive grid failure.
            </p>
          </div>
        </section>

        {/* Project Overview */}
        <section className="section-py bg-mist-50 dark:bg-forest-950" aria-labelledby="project-overview-heading">
          <div className="container-main">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 id="project-overview-heading" className="font-display text-h2 text-ink-900 dark:text-mist-50 mb-6">
                  What Is Trishul?
                </h2>
                <p className="text-body text-ink-900/70 dark:text-mist-50/70 mb-6">
                  Trishul is a field-deployable early warning system for flash floods and debris flows in mountainous terrain. It deploys a network of sensor nodes at catchment headwaters, each measuring three precursors to catastrophic flooding: extreme rainfall intensity (Varuna Watch), soil saturation and slope tilt approaching failure (Bhumi Sense), and ground vibration signatures of debris flow or glacier collapse (Kampan Alert).
                </p>
                <p className="text-body text-ink-900/70 dark:text-mist-50/70 mb-6">
                  These three independent signals are fused in real time by a Bayesian engine (Trishul Core) that computes a posterior probability of imminent hazard. The result maps to four Rudra Levels — Safe, Watch, Warning, Evacuate — each with defined channel activation and community action protocols. Unlike water-level-only systems that detect the flood after it arrives, Trishul detects the conditions that create it, providing 4+ hours of lead time.
                </p>
                <p className="text-body text-ink-900/70 dark:text-mist-50/70">
                  When the grid fails and cell towers go down — as they do in every major mountain disaster — Trishul's delivery system (Ghanta Signal) activates solar-powered LoRa sirens, satellite-backed SMS, radio override, and community volunteer networks. The system is designed to warn the last village in the valley even when everything else is dark.
                </p>
              </div>
              <div className="flex justify-center">
                <TrishulMark size="lg" />
              </div>
            </div>
          </div>
        </section>

        {/* Flash Flood Science */}
        <section className="section-py bg-forest-950 relative" aria-labelledby="science-heading">
          <img src={aboutBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <ContourField className="absolute inset-0" opacity={0.06} drift />
          <div className="absolute inset-0 bg-forest-950/60" aria-hidden="true" />
          <div className="relative container-main">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 id="science-heading" className="font-display text-h2 text-mist-50 mb-4">
                The Science of Flash Floods
              </h2>
              <p className="text-body text-mist-50/60">
                A flash flood is a sudden, violent rush of water — or water-laden debris — that reaches dangerous levels within six hours of its triggering event. In mountain terrain, this can mean a 10-metre wall of water, rocks, and trees moving at highway speeds.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {geoConcepts.map((concept) => (
                <Card key={concept.title} variant="dark" className="text-center">
                   <div className="text-mist-50/60 mb-4 flex justify-center" aria-hidden="true">{concept.icon}</div>
                  <h3 className="font-display text-h3 text-mist-50 mb-3">{concept.title}</h3>
                  <p className="text-body text-mist-50/70">{concept.desc}</p>
                </Card>
              ))}
            </div>

            <div className="max-w-3xl mx-auto">
              <h3 className="font-display text-h3 text-mist-50 text-center mb-8">Depth Equals Danger</h3>
              <div className="space-y-4">
                   {depthThreats.map((item) => (
                   <div key={item.depth} className="flex items-start gap-4">
                     <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-rudra-evacuate/10 border border-rudra-evacuate/30 flex items-center justify-center">
                       <span className="font-mono text-rudra-evacuate font-medium text-xl">{item.depth}</span>
                     </div>
                     <div>
                       <p className="text-body text-mist-50/70">{item.threat}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="max-w-prose mx-auto mt-16">
              <h3 className="font-display text-h3 text-mist-50 text-center mb-8">Defining Characteristics</h3>
              <p className="text-body text-mist-50/70 mb-6 text-center">
                What distinguishes a flash flood from riverine or coastal flooding is velocity of onset — the entire sequence from trigger to destructive flow can unfold in under six hours. Unlike river floods that build over days as a watershed slowly saturates, a flash flood's destructive potential is driven by three factors: orographic rainfall enhancement (rain falling faster than the land can absorb), limited infiltration capacity on steep or impermeable slopes, and debris-flow bulking, where the water entrains sediment that increases density and destructive force. The result is a moving column of water, rocks, and debris with enough momentum to strip foundations, uproot century-old trees, and scour channels hundreds of meters wide.
              </p>
              <p className="text-body text-mist-50/70 text-center">
                Lead time is equally compressed. While a river flood gives days of warning as water rises gradually, a flash flood triggered by a landslide-dammed lake breach or intense orographic rainfall reaches communities in minutes to hours. The time between trigger and impact scales with catchment area: small catchments (&lt; 5 km²) can see flows arrive in under an hour, while larger basins (50–100 km²) may take 2–6 hours. Trishul's detection system is built around this constraint — it monitors the precursors (extreme rainfall, saturated soil, ground vibration) rather than waiting for water to arrive.
              </p>
            </div>

            <div className="mt-20">
              <div className="grid lg:grid-cols-2 gap-12 items-start">
                <div>
                  <h3 className="font-display text-h3 text-mist-50 mb-6">Orographic Amplification</h3>
                  <p className="text-body text-mist-50/70 mb-4">
                    When moist air encounters a mountain barrier, it is forced upward. As it rises, it cools at the dry adiabatic lapse rate (~10°C per 1000m). If enough moisture is present, condensation releases latent heat, further accelerating the upward motion and deepening the low-pressure zone at the surface. The result is concentrated, often extreme, precipitation on windward slopes — typically 8–12× the rainfall rate measured at equivalent elevation on the valley floor.
                  </p>
                  <p className="text-body text-mist-50/70 mb-4">
                    This is why a cloudburst measured at 25mm/hr by a valley rain gauge can produce 200mm+ in headwater catchments within two hours. The leeward side receives far less, creating a stark rain shadow — a pattern that single-point gauges miss entirely. Trishul's sensor network is positioned at catchment ridgelines to capture this orographic signal directly, rather than relying on valley-floor stations that underestimate the hazard.
                  </p>
                </div>
                <div className="bg-forest-950 rounded-lg border border-moss-600 p-6">
                  <svg width="400" height="240" viewBox="0 0 400 240" className="w-full h-auto">
                    <defs>
                      <linearGradient id="skyGrad" x1="0" y1="0" y2="0" x2="1">
                        <stop offset="0" stopColor="#60a3bc" />
                        <stop offset="1" stopColor="#9eceda" />
                      </linearGradient>
                      <linearGradient id="rainGrad" x1="0" y1="0" y2="0" x2="1">
                        <stop offset="0" stopColor="#4a90d9" />
                        <stop offset="0.5" stopColor="#2563eb" />
                        <stop offset="1" stopColor="#1e40af" />
                      </linearGradient>
                      <linearGradient id="dryGrad" x1="0" y1="0" y2="0" x2="1">
                        <stop offset="0" stopColor="#9eceda" />
                        <stop offset="1" stopColor="#60a3bc" />
                      </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="400" height="240" fill="url(#skyGrad)" />
                    <path d="M0,180 Q100,100 400,180" fill="url(#rainGrad)" fillOpacity="0.7" />
                    <path d="M0,180 Q100,100 400,180 L400,240 L0,240 Z" fill="#2d5a3d" />
                    <path d="M200,180 L200,240" stroke="#1e40af" strokeWidth="2" strokeDasharray="4,3" />
                    <path d="M100,180 L100,240" stroke="#1e40af" strokeWidth="2" strokeDasharray="4,3" />
                    <path d="M300,180 L300,240" stroke="#1e40af" strokeWidth="2" strokeDasharray="4,3" />
                    <path d="M0,180 L400,180" stroke="#1a1a2e" strokeWidth="3" />
                    <path d="M0,200 Q100,140 200,200 T400,200" fill="none" stroke="#9eceda" strokeWidth="1.5" strokeOpacity="0.6" />
                    <path d="M0,220 Q100,160 200,220 T400,220" fill="none" stroke="#9eceda" strokeWidth="1" strokeOpacity="0.4" />
                    <text x="30" y="90" fill="#ffffff" fontSize="11" fontFamily="General Sans, sans-serif" fontWeight="500">Moist air</text>
                    <text x="60" y="75" fill="#93c5fd" fontSize="10" fontFamily="General Sans, sans-serif">↑ Forced ascent</text>
                    <text x="30" y="220" fill="#93c5fd" fontSize="10" fontFamily="General Sans, sans-serif">Windward — heavy rain</text>
                    <text x="300" y="220" fill="#93c5fd" fontSize="10" fontFamily="General Sans, sans-serif">Leeward — dry</text>
                    <text x="190" y="175" fill="#fbbf24" fontSize="10" fontFamily="General Sans, sans-serif">Crest</text>
                    <text x="15" y="210" fill="#fbbf24" fontSize="9" fontFamily="General Sans, sans-serif">0m</text>
                    <text x="160" y="210" fill="#fbbf24" fontSize="9" fontFamily="General Sans, sans-serif">1000m</text>
                    <text x="340" y="210" fill="#fbbf24" fontSize="9" fontFamily="General Sans, sans-serif">2000m</text>
                    <text x="15" y="234" fill="#9ca3af" fontSize="9" fontFamily="General Sans, sans-serif">25mm/hr valley gauge</text>
                    <text x="160" y="234" fill="#fbbf24" fontSize="9" fontFamily="General Sans, sans-serif">→ 200mm+ headwaters</text>
                  </svg>
                  <p className="text-caption text-mist-50/50 mt-3 text-center">Windward slope receives 8–12× the rainfall of the valley floor</p>
                </div>
              </div>
            </div>

            <div className="mt-20">
              <div className="grid lg:grid-cols-2 gap-12 items-start">
                <div>
                  <h3 className="font-display text-h3 text-mist-50 mb-6">Glacial Lake Outburst Floods (GLOF)</h3>
                  <p className="text-body text-mist-50/70 mb-4">
                    As glaciers retreat, they leave behind terminal moraine dams — unconsolidated piles of till, rock flour, and ice that can be kilometers long and tens of meters high. Unlike engineered concrete dams, moraine dams have no spillway and no cohesion to speak of. A GLOF occurs when this dam breaches, either through overtopping (from heavy rain or ice melt raising lake levels above the dam crest) or through a structural failure (often triggered by an upstream ice avalanche or landslide entering the lake, generating a displacement wave that overtops and undermines the moraine).
                  </p>
                  <p className="text-body text-mist-50/70 mb-4">
                    The breach is catastrophic and near-instantaneous. A lake holding millions of cubic meters of water can drain in less than an hour, sending a surge down the valley at 30+ km/h. The flood wave picks up sediment, boulders, and woody debris, becoming a debris-charged flow that can sustain itself for tens of kilometers. The 2023 Sikkim event exemplified this pattern: the South Lhonak Lake outburst traveled through the Teesta valley, destroying the Chungtham dam and killing 55+ people downstream — all without any water-level sensor detecting the rising lake until the flood had already passed.
                  </p>
                </div>
                <div className="bg-forest-950 rounded-lg border border-moss-600 p-6">
                  <svg width="400" height="240" viewBox="0 0 400 240" className="w-full h-auto">
                    <defs>
                      <linearGradient id="iceGrad" x1="0" y1="0" y2="0" x2="1">
                        <stop offset="0" stopColor="#93c5bd" />
                        <stop offset="1" stopColor="#bfdbfe" />
                      </linearGradient>
                      <linearGradient id="waterGrad" x1="0" y1="0" y2="0" x2="1">
                        <stop offset="0" stopColor="#4a90d9" />
                        <stop offset="1" stopColor="#1e40af" />
                      </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="400" height="240" fill="#f8fafc" />
                    <line x1="0" y1="170" x2="400" y2="170" stroke="#1e293b" strokeWidth="2" />
                    <path d="M0,170 Q40,155 80,165 Q120,175 160,162 Q200,150 240,158 Q280,168 320,155 Q360,140 400,150 L400,170 Z" fill="#2d5a3d" fillOpacity="0.3" />
                    <path d="M0,170 Q40,155 80,165 Q120,175 160,162 Q200,150 240,158 Q280,168 320,155 Q360,140 400,150 L400,170 Z" fill="url(#waterGrad)" fillOpacity="0.3" />
                    <path d="M30,170 Q60,145 80,140 Q100,135 120,140 Q140,145 160,142" fill="#93c5bd" />
                    <path d="M80,140 L80,120 Q90,110 100,110 Q110,110 120,120 L120,140" fill="#93c5fd" stroke="#1e40af" strokeWidth="1" />
                    <rect x="60" y="130" width="60" height="10" fill="#93c5bd" />
                    <rect x="65" y="125" width="50" height="15" fill="#93c5bd" />
                    <rect x="70" y="120" width="40" height="10" fill="#93c5bd" />
                    <path d="M80,140 L80,125 Q80,120 85,120 Q90,120 90,120" fill="#ffffff" fillOpacity="0.8" />
                    <line x1="200" y1="140" x2="220" y2="125" stroke="#4a90d9" strokeWidth="3" />
                    <line x1="220" y1="125" x2="240" y2="110" stroke="#4a90d9" strokeWidth="3" />
                    <circle cx="210" cy="128" r="4" fill="#ffffff" />
                    <text x="15" y="210" fill="#1e293b" fontSize="11" fontFamily="General Sans, sans-serif" fontWeight="600">Moraine dam</text>
                    <text x="15" y="226" fill="#1e293b" fontSize="10" fontFamily="General Sans, sans-serif">Lake</text>
                    <text x="80" y="205" fill="#fbbf24" fontSize="9" fontFamily="General Sans, sans-serif">Glacier</text>
                    <text x="190" y="210" fill="#93c5fd" fontSize="11" fontFamily="General Sans, sans-serif" fontWeight="600">Ice collapse → wave</text>
                    <text x="250" y="120" fill="#dc2626" fontSize="10" fontFamily="General Sans, sans-serif" fontWeight="600">Breach</text>
                  </svg>
                  <p className="text-caption text-mist-50/50 mt-3 text-center"> Moraine dam breach releases the lake in under an hour. No gauge downstream can detect it before impact. </p>
                </div>
              </div>
            </div>

            <div className="mt-20 max-w-prose mx-auto">
              <h3 className="font-display text-h3 text-mist-50 text-center mb-8">Response Time vs Catchment</h3>
              <p className="text-body text-mist-50/70 text-center mb-8">
                Trishul's Rudra Level thresholds are calibrated against the empirical relationship between catchment area and time-to-peak — the window between a triggering rainfall event and when peak flood discharge arrives at the catchment mouth. Smaller catchments (&lt; 5 km²) give almost no warning window; larger basins allow hours. The system weights each zone's terrain_risk against this curve so that thresholds tighten for small, fast-responding catchments.
              </p>
              <div className="bg-forest-950 rounded-lg border border-moss-600 p-6">
                <svg width="560" height="300" viewBox="0 0 560 300" className="w-full h-auto">
                  <defs>
                    <linearGradient id="responseGrad" x1="0" y1="0" y2="1" x2="0">
                      <stop offset="0" stopColor="#0f172a" stopOpacity="0.1" />
                      <stop offset="1" stopColor="#0f172a" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <text x="280" y="20" textAnchor="middle" fill="#f1f5f9" fontSize="13" fontFamily="General Sans, sans-serif" fontWeight="500">Time-to-Peak vs Catchment Area</text>
                  <line x1="50" y1="260" x2="530" y2="260" stroke="#94a3b8" strokeWidth="1.5" />
                  <line x1="50" y1="260" x2="50" y2="30" stroke="#94a3b8" strokeWidth="1.5" />
                  <text x="290" y="285" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="General Sans, sans-serif">Catchment Area (km²)</text>
                  <text x="15" y="145" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="General Sans, sans-serif" transform="rotate(-90, 15, 145)">Time to Peak (minutes)</text>
                  <rect x="50" y="30" width="480" height="230" fill="url(#responseGrad)" />
                  <line x1="50" y1="220" x2="530" y2="120" stroke="#4a90d9" strokeWidth="2" strokeOpacity="0.5" strokeDasharray="6,4" />
                  <text x="510" y="115" fill="#93c5fd" fontSize="9" fontFamily="General Sans, sans-serif">Theoretical curve</text>
                  <g fill="#4C8B5A">
                    <circle cx="80" cy="230" r="5" />
                    <text x="88" y="234" fill="#94a3b8" fontSize="9" 
fontFamily="General Sans, sans-serif">Chamoli (1.2 km²)</text>
                  </g>
                  <g fill="#4C8B5A">
                    <circle cx="110" cy="225" r="5" />
                    <text x="118" y="229" fill="#94a3b8" fontSize="9" fontFamily="General Sans, sans-serif">Small (&lt; 5)</text>
                  </g>
                  <g fill="#C9A227">
                    <circle cx="200" cy="200" r="5" />
                    <text x="208" y="204" fill="#94a3b8" fontSize="9" fontFamily="General Sans, sans-serif">Medium (15 km²)</text>
                  </g>
                  <g fill="#D67C2B">
                    <circle cx="330" cy="170" r="5" />
                    <text x="338" y="174" fill="#94a3b8" fontSize="9" fontFamily="General Sans, sans-serif">Large (50 km²)</text>
                  </g>
                  <g fill="#B23A2E">
                    <circle cx="440" cy="140" r="5" />
                    <text x="448" y="144" fill="#94a3b8" fontSize="9" fontFamily="General Sans, sans-serif">Extra-large (100 km²)</text>
                  </g>
                  <text x="80" y="245" fill="#4C8B5A" fontSize="8" fontFamily="General Sans, sans-serif">→ 45 min</text>
                  <text x="200" y="210" fill="#C9A227" fontSize="8" fontFamily="General Sans, sans-serif">→ 3 h</text>
                  <text x="440" y="150" fill="#B23A2E" fontSize="8" fontFamily="General Sans, sans-serif">→ 6 h</text>
                </svg>
                <div className="grid grid-cols-4 gap-2 mt-4 text-center text-caption">
                  <div>
                    <span className="font-mono text-fern-400">P(fail) ≥ 0.7</span> = Evacuate
                  </div>
                  <div>
                    <span className="font-mono text-rudra-watch">0.4–0.7</span> = Watch
                  </div>
                  <div>
                    <span className="font-mono text-rudra-warn">0.2–0.5</span> = Warning
                  </div>
                  <div>
                    <span className="font-mono text-rudra-safe">≤ 0.2</span> = Safe
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Incidents */}
        <section className="section-py bg-mist-50 dark:bg-forest-950" aria-labelledby="incidents-heading">
          <div className="container-main">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 id="incidents-heading" className="font-display text-h2 text-ink-900 dark:text-mist-50 mb-4">
                When the Warnings Failed
              </h2>
              <p className="text-body text-ink-900/60 dark:text-mist-50/60">
                Across the Himalayas, communities have paid the price for single-signal, post-arrival warning systems. Each event below was detected only after the flood had already reached the village.
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              {incidents.map((incident) => (
                <Card key={`${incident.year}-${incident.label}`}>
                  <div className="flex gap-6">
                    <div className="flex-shrink-0">
                      <span className="font-display text-3xl font-medium text-rudra-evacuate">{incident.year}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-2">
                        {incident.label}
                      </h3>
                      <p className="text-body text-ink-900/70 dark:text-mist-50/70">{incident.detail}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How We Evacuate */}
        <section className="section-py bg-forest-950 relative overflow-hidden" aria-labelledby="evacuation-heading">
          <DamageScene shaktiScore={0} className="absolute inset-0 opacity-15" />
          <div className="absolute inset-0 bg-forest-950/70" aria-hidden="true" />
          <div className="relative container-main">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 id="evacuation-heading" className="font-display text-h2 text-mist-50 mb-4">
                From Alert to Safety
              </h2>
              <p className="text-body text-mist-50/60">
                Detection without delivery is noise. Trishul's evacuation pipeline moves people from a statistical posterior to a safe location — through six redundant channels, pre-mapped routes, and community-confirmed checkpoints.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-rudra-warn/20 border border-rudra-warn/30 flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rudra-warn" aria-hidden="true">
                    <path d="M12 2v20M5 12h14" />
                  </svg>
                </div>
                <h3 className="font-display text-h3 text-mist-50 mb-2">Siren (LoRa)</h3>
                <p className="text-body text-mist-50/70">Solar-powered, 120 dB at 100m. Activates at Warning level. Mesh network survives single-node failure.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-signal-amber/20 border border-signal-amber/30 flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-signal-amber" aria-hidden="true">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h3 className="font-display text-h3 text-mist-50 mb-2">SMS + WhatsApp</h3>
                <p className="text-body text-mist-50/70">Template messages per level. Satellite backhaul option. Bulk delivery with individual receipts.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-rudra-evacuate/20 border border-rudra-evacuate/30 flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rudra-evacuate" aria-hidden="true">
                    <path d="M12 19V5M5 12l7 7 7-7" />
                  </svg>
                </div>
                <h3 className="font-display text-h3 text-mist-50 mb-2">Community Action</h3>
                <p className="text-body text-mist-50/70">Volunteer app with checkpoint confirmation. Evacuation routes pre-mapped to nearest safe ground (schools, temples, high points).</p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link to="/dashboard">
                <Button variant="primary-pill" size="lg">
                  See Live Evacuation Routes
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Further Reading */}
        <section className="section-py bg-forest-950 relative" aria-labelledby="further-reading-heading">
          <img src={aboutBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15" />
          <ContourField className="absolute inset-0" opacity={0.06} drift />
          <div className="absolute inset-0 bg-forest-950/70" aria-hidden="true" />
          <div className="relative container-main">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 id="further-reading-heading" className="font-display text-h2 text-mist-50 mb-4">
                Further Reading
              </h2>
              <p className="text-body text-mist-50/60 max-w-2xl mx-auto">
                The science above is a starting point. These authoritative sources provide deeper technical background on each hazard mechanism.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card variant="dark">
                <div className="space-y-4">
                   <h3 className="font-display text-h3 text-mist-50">Flash Floods & Debris Flows</h3>
                  <ul className="space-y-3 text-sm">
                    <li>
                      <a
                        href="https://en.wikipedia.org/wiki/Flash_flood"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-mist-50/70 hover:text-mist-50 transition-colors"
                      >
                        Flash flood — Wikipedia
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="inline-block ml-1 text-xs" aria-hidden="true">
                          <path d="M7 7l10 10M17 7l-10 10" />
                        </svg>
                      </a>
                      <p className="text-caption text-mist-50/40 mt-1">Definition, causes, and warning timeframes.</p>
                    </li>
                    <li>
                      <a
                        href="https://en.wikipedia.org/wiki/Debris_flow"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-mist-50/70 hover:text-mist-50 transition-colors"
                      >
                        Debris flow — Wikipedia
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="inline-block ml-1 text-xs" aria-hidden="true">
                          <path d="M7 7l10 10M17 7l-10 10" />
                        </svg>
                      </a>
                      <p className="text-caption text-mist-50/40 mt-1">Flow mechanics, bulking, and runout characteristics.</p>
                    </li>
                    <li>
                      <a
                        href="https://en.wikipedia.org/wiki/Orographic_lift"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-mist-50/70 hover:text-mist-50 transition-colors"
                      >
                        Orographic lift — Wikipedia
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="inline-block ml-1 text-xs" aria-hidden="true">
                          <path d="M7 7l10 10M17 7l-10 10" />
                        </svg>
                      </a>
                      <p className="text-caption text-mist-50/40 mt-1">How mountains force air upward to produce extreme rainfall.</p>
                    </li>
                  </ul>
                </div>
              </Card>

              <Card variant="dark">
                <div className="space-y-4">
                  <h3 className="font-display text-h3 text-mist-50">Glacier Hazards & Case Studies</h3>
                  <ul className="space-y-3 text-sm">
                    <li>
                      <a
                        href="https://en.wikipedia.org/wiki/Glacial_lake_outburst_flood"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-mist-50/70 hover:text-mist-50 transition-colors"
                      >
                        Glacial lake outburst flood — Wikipedia
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="inline-block ml-1 text-xs" aria-hidden="true">
                          <path d="M7 7l10 10M17 7l-10 10" />
                        </svg>
                      </a>
                      <p className="text-caption text-mist-50/40 mt-1">Moraine dam failure mechanics and global inventory.</p>
                    </li>
                    <li>
                      <a
                        href="https://en.wikipedia.org/wiki/2013_North_India_floods"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-mist-50/70 hover:text-mist-50 transition-colors"
                      >
                        2013 North India Floods
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="inline-block ml-1 text-xs" aria-hidden="true">
                          <path d="M7 7l10 10M17 7l-10 10" />
                        </svg>
                      </a>
                      <p className="text-caption text-mist-50/40 mt-1">Baseline case for post-arrival detection failures.</p>
                    </li>
                    <li>
                      <a
                        href="https://en.wikipedia.org/wiki/2025_India_floods"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-mist-50/70 hover:text-mist-50 transition-colors"
                      >
                        2025 India Floods (Monsoon)
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="inline-block ml-1 text-xs" aria-hidden="true">
                          <path d="M7 7l10 10M17 7l-10 10" />
                        </svg>
                      </a>
                      <p className="text-caption text-mist-50/40 mt-1">Missing soil-moisture monitoring and 140 fatalities.</p>
                    </li>
                  </ul>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="section-py bg-mist-50 dark:bg-forest-950" aria-labelledby="disclaimer-heading">
          <div className="container-main">
            <Card className="max-w-3xl mx-auto">
              <h2 id="disclaimer-heading" className="font-sans font-medium text-caption uppercase tracking-wider text-fern-400 mb-4">
                Important Disclaimer
              </h2>
              <p className="text-body text-ink-900/70 dark:text-mist-50/70">
                This is a hackathon prototype / decision-support demonstrator, not a certified emergency system. All sensor readings, alert sequences, and evacuation routes shown are simulated from prototype data. Trishul does not replace official meteorological, hydrological, or disaster management authorities. In an actual emergency, follow instructions from your local disaster management office and official warning channels.
              </p>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
