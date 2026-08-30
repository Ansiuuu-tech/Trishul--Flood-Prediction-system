import { Card } from '@/components/ui';
import { TrishulMark, ContourField } from '@/components/core';
import { Navigation, Footer } from '@/components/layout';

const teamMembers = [
  {
    name: 'Priya Sharma',
    role: 'IoT Developer',
    bio: 'Designs ruggedized sensor nodes for Himalayan conditions — solar, LoRa, MEMS, 72h battery.',
    avatar: 'PS',
  },
  {
    name: 'Arjun Patel',
    role: 'Backend Developer',
    bio: 'Builds the fusion pipeline: Kafka → Flink → PostgreSQL/Redis. Real-time at scale.',
    avatar: 'AP',
  },
  {
    name: 'Mei Chen',
    role: 'Data / ML Developer',
    bio: 'Trains TinyML classifiers for vibration, calibrates Bayesian fusion, builds attribution.',
    avatar: 'MC',
  },
  {
    name: 'Rohan Joshi',
    role: 'Frontend / GIS Developer',
    bio: 'MapLibre terrain dashboard, contour signature, real-time zone rings, Drishti Panel.',
    avatar: 'RJ',
  },
  {
    name: 'Lakpa Sherpa',
    role: 'Presenter / Domain Lead',
    bio: 'Himalayan hydrology & community resilience. Bridges tech and village reality.',
    avatar: 'LS',
  },
];

export function TeamPage() {
  return (
    <div className="min-h-screen bg-mist-50 dark:bg-forest-950">
      <Navigation />
      <main id="main-content" className="pt-16">
        {/* Hero */}
        <section className="section-py bg-forest-950 relative" aria-labelledby="team-hero-heading">
          <ContourField className="absolute inset-0" opacity={0.08} />
          <div className="relative container-main text-center">
            <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-4 animate-fade-in">The People</p>
            <h1 id="team-hero-heading" className="font-display text-hero-h1 font-medium text-mist-50 mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              Building the Warning<br />
              <span className="block">the Trishuli Didn't Get</span>
            </h1>
            <p className="text-body text-mist-50/70 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '200ms' }}>
              Five roles. One mission. Each person owns a prong of the system — and the fusion that binds them.
            </p>
          </div>
        </section>

        {/* Team Grid */}
        <section className="section-py bg-mist-50 dark:bg-forest-950" aria-labelledby="team-grid-heading">
          <div className="container-main">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.map((member, index) => (
                <Card key={member.name} hover className="text-center" style={{ animationDelay: `${index * 60}ms` }}>
                  <div className="w-24 h-24 rounded-full bg-forest-950 flex items-center justify-center mx-auto mb-4 font-display text-2xl font-medium text-mist-50 border border-moss-600">
                    {member.avatar}
                  </div>
                  <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-1">{member.name}</h3>
                  <p className="font-sans text-caption font-medium text-fern-400 mb-3">{member.role}</p>
                  <p className="text-body text-ink-900/70 dark:text-mist-50/70">{member.bio}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Text Section */}
        <section className="section-py bg-forest-950 relative" aria-labelledby="team-mission-heading">
          <ContourField className="absolute inset-0" opacity={0.08} drift />
          <div className="relative container-main">
            <div className="max-w-4xl mx-auto text-center">
              <h2 id="team-mission-heading" className="font-display text-h2 text-mist-50 mb-6">
                Building Trishul
              </h2>
              <p className="text-body text-mist-50/70 mb-8">
                We are a five-person team from Nepal and abroad, united by a single question: why do villages learn about flash floods from the flood itself? Our backgrounds span Himalayan hydrology, embedded systems, machine learning, and community resilience. We built Trishul as a field-deployable early warning system that fuses environmental signals — rainfall, ground saturation, and vibration — into a single alert level delivered through channels that survive grid failure.
              </p>
              <p className="text-body text-mist-50/70 mb-8">
                Each of us owns one prong of the system: the IoT hardware, the backend fusion engine, the ML models, the map interface, and the domain knowledge that ties it to real mountain communities. We prototyped in the Dhading District catchment, tested against the 2026 Trishuli event data, and designed every threshold for the catchments where false alarms mean lives lost to complacency and missed alerts mean lives lost to surprise.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <span className="inline-block px-4 py-2 rounded-btn bg-fern-400/10 text-fern-400 text-caption font-medium">
                  Prototype Zone: Dhading District, Nepal
                </span>
                <span className="inline-block px-4 py-2 rounded-btn bg-moss-600/10 text-moss-600 text-caption font-medium">
                  8 Zones • 24 Sensor Nodes • 3 Fusion Cores
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}