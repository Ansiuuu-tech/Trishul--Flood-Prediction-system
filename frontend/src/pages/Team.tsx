import { team } from '@/data/team';
import { Navigation, Footer } from '@/components/layout';
import { ContourField } from '@/components/core';
import teamBg from '@/assets/images/team-bg.jpeg?url';

const initials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

function TeamPhoto({ member, index }: { member: typeof team[0]; index: number }) {
  return (
    <figure className="relative group">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg border-2 border-stone-200 dark:border-moss-600 bg-forest-950">
        <img
          src={member.photo}
          alt={member.name}
          className="team-photo w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement | null;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <div
          className="absolute inset-0 bg-forest-950/40 items-center justify-center hidden"
          aria-hidden="true"
        >
          <span className="font-display text-4xl text-mist-50/80">
            {initials(member.name)}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-forest-950/80 to-transparent" aria-hidden="true" />
        <figcaption className="absolute bottom-4 left-4 right-4 font-mono text-caption text-mist-50 tracking-wide">
          {member.name}
        </figcaption>
        <div className="absolute top-3 right-3 font-mono text-xs text-mist-50/50 bg-forest-950/40 px-2 py-1 rounded">
          {String(index + 1).padStart(2, '0')}
        </div>
      </div>
    </figure>
  );
}

export function TeamPage() {
  return (
    <div className="min-h-screen bg-mist-50 dark:bg-forest-950">
      <Navigation />
      <main id="main-content" className="pt-16">
        {/* Hero */}
        <section className="section-py bg-forest-950 relative" style={{ backgroundImage: `url(${teamBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} aria-labelledby="team-hero-heading">
          <div className="absolute inset-0 bg-forest-950/70" aria-hidden="true" />
          <div className="relative container-main text-center">
            <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-4 animate-fade-in">
              The People
            </p>
            <h1
              id="team-hero-heading"
              className="font-display text-hero-h1 font-medium text-mist-50 mb-6 animate-fade-in"
              style={{ animationDelay: '100ms' }}
            >
              Building the Warning<br />
              <span className="block">the Trishuli Didn't Get</span>
            </h1>
            <p
              className="text-body text-mist-50/70 max-w-3xl mx-auto animate-fade-in"
              style={{ animationDelay: '200ms' }}
            >
              Six people building the warning system Himalayan villages don't currently have.
            </p>
          </div>
        </section>

        {/* Team Grid — uniform frames, no partiality */}
        <section className="section-py bg-mist-50 dark:bg-forest-950" aria-labelledby="team-grid-heading">
          <div className="container-main">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {team.map((member, index) => (
                <TeamPhoto key={member.id} member={member} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Minimal closing text */}
        <section className="section-py bg-forest-950 relative text-center" aria-hidden="true">
          <ContourField className="absolute inset-0" opacity={0.08} />
          <div className="relative container-main">
            <p className="font-display text-h2 text-mist-50/80">
              One mission. One system. No village learns about a flood from the flood itself.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
