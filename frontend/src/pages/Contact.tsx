import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Card } from '@/components/ui';
import { TrishulMark, ContourField } from '@/components/core';
import contactBg from '@/assets/images/contact-bg.jpeg?url';

export function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', organization: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Valid email required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSubmitted(true);
      setFormData({ name: '', email: '', organization: '', message: '' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <div className="min-h-screen bg-mist-50 dark:bg-forest-950">
      <div>
        {/* Hero */}
        <section className="section-py bg-forest-950 relative" style={{ backgroundImage: `url(${contactBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} aria-labelledby="contact-hero-heading">
          <div className="absolute inset-0 bg-forest-950/70" aria-hidden="true" />
          <div className="relative container-main text-center">
            <p className="font-mono text-caption text-fern-400 tracking-widest uppercase mb-4 animate-fade-in">Get in Touch</p>
            <h1 id="contact-hero-heading" className="font-display text-hero-h1 font-medium text-mist-50 mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
               Contact Trishul Team
            </h1>
            <p className="text-body text-mist-50/70 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '200ms' }}>
              Partnerships, deployments, research collaboration, or just questions about the system. We're here.
            </p>
          </div>
        </section>

        {/* Contact Form + Info */}
        <section className="section-py bg-mist-50 dark:bg-forest-950" aria-labelledby="contact-form-heading">
          <div className="container-main">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Form */}
              <div>
                <h2 id="contact-form-heading" className="font-display text-h2 text-ink-900 dark:text-mist-50 mb-8">
                  Send a Message
                </h2>
                {submitted ? (
                  <Card className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-rudra-safe/10 border border-rudra-safe/30 flex items-center justify-center mx-auto mb-4">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rudra-safe" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-2">Message Sent</h3>
                    <p className="text-body text-ink-900/60 dark:text-mist-50/60 mb-6">Thank you for reaching out. We'll respond within 24 hours.</p>
                    <Button variant="secondary" onClick={() => setSubmitted(false)}>Send Another</Button>
                  </Card>
                ) : (
                  <Card>
                    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                      <Input
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        error={errors.name}
                        placeholder="Your name"
                        required
                        autoComplete="name"
                      />
                      <Input
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                        placeholder="you@organization.org"
                        required
                        autoComplete="email"
                      />
                      <Input
                        label="Organization"
                        name="organization"
                        value={formData.organization}
                        onChange={handleChange}
                        placeholder="Organization / Affiliation"
                        autoComplete="organization"
                      />
                      <div>
                        <label htmlFor="message" className="label">Message</label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          className={`input min-h-[140px] resize-y ${errors.message ? 'border-rudra-evacuate focus:border-rudra-evacuate focus:ring-rudra-evacuate/20' : ''}`}
                          placeholder="Tell us about your deployment, partnership idea, or question..."
                          required
                          aria-invalid={errors.message ? 'true' : 'false'}
                          aria-describedby={errors.message ? 'message-error' : undefined}
                        />
                        {errors.message && (
                          <p id="message-error" className="mt-1.5 text-caption text-rudra-evacuate" role="alert">{errors.message}</p>
                        )}
                      </div>
                      <Button type="submit" variant="primary-pill" className="w-full">
                        Send Message
                      </Button>
                    </form>
                  </Card>
                )}
              </div>

              {/* Contact Info */}
              <div>
                <h2 className="font-display text-h2 text-ink-900 dark:text-mist-50 mb-8">Other Ways to Reach Us</h2>
                <Card className="mb-8">
                  <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-6">Direct Contact</h3>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-forest-950/10 dark:bg-forest-800 border border-stone-200 dark:border-moss-600 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-900 dark:text-mist-50" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      </div>
                      <div>
                        <h4 className="font-sans font-medium text-ink-900 dark:text-mist-50">Email</h4>
                        <p className="text-body text-ink-900/70 dark:text-mist-50/70">contact@trishul-warning.org</p>
                        <p className="text-body text-ink-900/70 dark:text-mist-50/70">deployments@trishul-warning.org</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-forest-950/10 dark:bg-forest-800 border border-stone-200 dark:border-moss-600 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-900 dark:text-mist-50" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                      </div>
                      <div>
                        <h4 className="font-sans font-medium text-ink-900 dark:text-mist-50">Response Time</h4>
                        <p className="text-body text-ink-900/70 dark:text-mist-50/70">Partnership inquiries: 24 hours</p>
                        <p className="text-body text-ink-900/70 dark:text-mist-50/70">Technical questions: 48 hours</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card style={{ animationDelay: '60ms' }}>
                  <h3 className="font-display text-h3 text-ink-900 dark:text-mist-50 mb-6">Demo Coverage Area</h3>
                  <div className="bg-forest-950 rounded-lg border border-moss-600 p-8 relative aspect-square">
                    <ContourField className="absolute inset-0" opacity={0.12} />
                    <div className="relative flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="font-display text-h3 text-mist-50 mb-2">Prototype Zone</div>
                        <div className="font-mono text-xl text-fern-400 mb-4">Dhading District, Nepal</div>
                        <div className="space-y-1 text-caption text-mist-50/60 max-w-xs mx-auto">
                          <div>8 simulated zones</div>
                          <div>24 sensor nodes</div>
                          <div>3 fusion cores</div>
                          <div className="text-signal-amber mt-2">Fictional coordinates — demo only</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
