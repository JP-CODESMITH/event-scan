import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ClipboardList,
  FileUp,
  Menu,
  ScanLine,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { Brand } from '../components/layout/Brand';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

const STEPS = [
  {
    n: '01',
    title: 'Authorise the guest list',
    body: 'Import attendees with CSV or add them by hand. Only whitelisted tickets pass the gate, and authorisation needs a secondary password so a volunteer cannot wave someone through.',
  },
  {
    n: '02',
    title: 'Turn phones into gates',
    body: 'Open the scanner on any gate phone, choose the door, and point it at the QR. The verdict fills the screen: admitted, already used, blocked or not on the list.',
  },
  {
    n: '03',
    title: 'Watch the door live',
    body: 'Every scan lands on the desk over the local network — counts, entries per gate, remaining capacity and a live feed. No refresh, no guessing at the door.',
  },
];

const FAQS = [
  {
    q: 'Do scanner phones need to be on the same network?',
    a: 'Yes for local events: connect the phones to the same WiFi as the laptop, or to the laptop hotspot, and open the scanner URL. The server prints its LAN address so gate staff can join in seconds.',
  },
  {
    q: 'What do the QR codes contain?',
    a: 'Plain ticket numbers such as 001, 002, 003. Any QR generator works. Each ticket can carry multiple entries — for example three entries per ticket — and the scanner counts them down.',
  },
  {
    q: 'What happens on a duplicate or blocked ticket?',
    a: 'The scanner shows the refusal, plays the denied sound, and logs the attempt. Blocked, unauthorised or fully-used tickets are rejected, and the attempt appears in the scan history.',
  },
  {
    q: 'Where is the data stored?',
    a: 'Locally in SQLite next to the server. CSV export covers tickets and scan history, and every admin action is written to an audit log.',
  },
];

function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/95">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2.5 focus:text-small focus:text-bg"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" aria-label="Event Scan home">
          <Brand />
        </Link>

        <nav className="hidden items-center gap-7 text-small text-ink-secondary md:flex" aria-label="Primary">
          <a className="transition-colors hover:text-ink" href="#how">How it works</a>
          <a className="transition-colors hover:text-ink" href="#features">Features</a>
          <a className="transition-colors hover:text-ink" href="#roles">Who uses it</a>
          <a className="transition-colors hover:text-ink" href="#faq">FAQ</a>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" asChild>
            <Link to="/scanner">
              <Smartphone className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              Open scanner
            </Link>
          </Button>
          <Button asChild>
            <Link to="/login">
              Admin login
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="flex h-11 w-11 items-center justify-center rounded-sm text-ink-secondary transition-colors hover:bg-sunken hover:text-ink md:hidden"
        >
          {open ? <X className="h-5 w-5" strokeWidth={1.8} /> : <Menu className="h-5 w-5" strokeWidth={1.8} />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-border bg-bg px-4 py-3 md:hidden" aria-label="Mobile">
          <div className="flex flex-col text-small">
            {[
              ['#how', 'How it works'],
              ['#features', 'Features'],
              ['#roles', 'Who uses it'],
              ['#faq', 'FAQ'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center border-b border-border/60 px-1 text-ink-secondary transition-colors hover:text-ink"
              >
                {label}
              </a>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" asChild className="flex-1">
              <Link to="/scanner" onClick={() => setOpen(false)}>Open scanner</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link to="/login" onClick={() => setOpen(false)}>Admin login</Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="paper relative overflow-hidden border-b border-border" aria-labelledby="hero-heading">
      <div className="mx-auto grid max-w-6xl gap-14 px-4 pb-16 pt-14 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:items-center md:pb-24 md:pt-20">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <span className="status-dot bg-success" aria-hidden="true" />
            Door control for live events
          </p>
          <h1
            id="hero-heading"
            className="mt-5 max-w-[13ch] font-display text-display font-medium text-ink"
          >
            Know every ticket at the door.
          </h1>
          <p className="mt-6 max-w-[48ch] text-lead text-ink-secondary">
            Event Scan turns ordinary phones into gate scanners. Volunteers scan QR codes,
            the desk sees every entry as it happens, and only the tickets you authorised
            get through.
          </p>
          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
            <Button size="lg" asChild>
              <Link to="/login">
                Open the desk
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/scanner">
                <ScanLine className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                Try the scanner
              </Link>
            </Button>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-2 gap-x-8 gap-y-4 border-t border-border pt-5">
            {[
              ['4', 'gates tracked separately'],
              ['1', 'QR per guest, any generator'],
              ['Local', 'SQLite, no cloud account'],
              ['Live', 'scan feed over WiFi'],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-tertiary">{value}</dt>
                <dd className="mt-0.5 text-tiny text-ink-secondary">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="relative mx-auto w-full max-w-[380px]">
          <div className="absolute -inset-3 -z-10 border border-border/60" aria-hidden="true" />
          <div className="bg-[hsl(var(--slip))] px-6 py-6 text-[hsl(var(--slip-ink))] shadow-lift">
            <div className="flex items-center justify-between border-b border-dashed border-[hsl(var(--slip-border))] pb-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[hsl(var(--slip-secondary))]">Event Scan</p>
                <p className="mt-1 text-tiny font-medium">Back of the Church</p>
              </div>
              <p className="font-mono text-[10px] tabular text-[hsl(var(--slip-secondary))]">20:14</p>
            </div>

            <div className="pt-6">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[hsl(150_56%_27%/0.3)] bg-[hsl(99_26%_89%)] text-[hsl(150_56%_27%)]">
                <Check className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
              </span>
              <p className="mt-4 font-display text-[3.4rem] font-medium leading-[0.85] tracking-[-0.045em]">Admitted</p>
              <p className="mt-4 text-title font-medium tracking-[-0.02em]">Ada Lovelace</p>
              <p className="mt-0.5 font-mono text-small tabular text-[hsl(var(--slip-secondary))]">Ticket 042</p>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 border-y border-[hsl(var(--slip-border))] py-3">
              {[
                ['Entry', '2 of 3'],
                ['Remaining', '1'],
                ['Gate', 'A'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[hsl(var(--slip-secondary))]">{label}</p>
                  <p className="mt-1 font-mono text-small font-medium tabular">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-end justify-between gap-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[hsl(var(--slip-secondary))]">
                Valid for entry
              </p>
              <div
                className="h-5 w-24 opacity-50"
                aria-hidden="true"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, hsl(var(--slip-ink)) 0 1px, transparent 1px 3px, hsl(var(--slip-ink)) 3px 5px, transparent 5px 8px)',
                }}
              />
            </div>
          </div>
          <figcaption className="mt-4 text-center text-tiny text-ink-tertiary">
            The scan verdict, full screen. Readable from a metre away.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-20" aria-labelledby="how-heading">
      <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow">How it works</p>
          <h2 id="how-heading" className="mt-3 max-w-[16ch] font-display text-display-sm font-medium text-ink">
            Three moves from list to open door.
          </h2>
        </div>

        <ol className="divide-y divide-border border-t border-border">
          {STEPS.map((step) => (
            <li key={step.n} className="grid gap-3 py-6 sm:grid-cols-[48px_1fr] sm:gap-5">
              <span className="font-mono text-tiny tabular text-accent-strong">{step.n}</span>
              <div>
                <h3 className="text-title font-medium text-ink">{step.title}</h3>
                <p className="mt-1.5 max-w-[56ch] text-small leading-relaxed text-ink-secondary">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="border-y border-border bg-surface" aria-labelledby="features-heading">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <p className="eyebrow">What you get</p>
        <h2 id="features-heading" className="mt-3 max-w-[20ch] font-display text-display-sm font-medium text-ink">
          One desk runs the whole door.
        </h2>

        <div className="mt-10 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
          <div className="bg-surface p-6 md:col-span-2 md:row-span-2 md:p-8">
            <Activity className="h-6 w-6 text-accent-strong" strokeWidth={1.6} aria-hidden="true" />
            <h3 className="mt-5 font-display text-heading font-medium text-ink">A live control room</h3>
            <p className="mt-3 max-w-[50ch] text-small leading-relaxed text-ink-secondary">
              Counts, entries per gate and a live scan feed update the moment a phone scans.
              Spot the queue at Gate B before it forms, and pull a guest's full scan history
              in one click.
            </p>
            <div className="mt-8 border-t border-border pt-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                {['Live feed', 'Gate charts', 'Search', 'History'].map((t) => (
                  <span key={t} className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {[
            {
              icon: ShieldCheck,
              title: 'Authorisation whitelist',
              body: 'A ticket scans green only after you clear it. Bulk-authorise a list with a secondary password.',
            },
            {
              icon: Smartphone,
              title: 'Phones as scanners',
              body: 'No rented hardware. Any modern phone works, with manual code entry when a QR will not read.',
            },
            {
              icon: FileUp,
              title: 'CSV in and out',
              body: 'Import the guest list in bulk, export tickets and the full scan history for reconciliation.',
            },
            {
              icon: ClipboardList,
              title: 'Audit trail',
              body: 'Every block, reset and authorisation is recorded with who did it and when.',
            },
          ].map((feature) => (
            <div key={feature.title} className="bg-surface p-6">
              <feature.icon className="h-5 w-5 text-ink-secondary" strokeWidth={1.6} aria-hidden="true" />
              <h3 className="mt-4 text-base font-semibold text-ink">{feature.title}</h3>
              <p className="mt-1.5 text-small leading-relaxed text-ink-secondary">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Roles() {
  return (
    <section id="roles" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-20" aria-labelledby="roles-heading">
      <div className="grid gap-12 md:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="eyebrow">Who uses it</p>
          <h2 id="roles-heading" className="mt-3 max-w-[14ch] font-display text-display-sm font-medium text-ink">
            Built for two jobs at once.
          </h2>
          <p className="mt-4 max-w-[42ch] text-small leading-relaxed text-ink-secondary">
            Organisers stay in control from a laptop. Volunteers get a screen so plain there
            is nothing to misconfigure at the gate.
          </p>
          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <Button asChild>
              <Link to="/login">
                Admin login
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/scanner">Open gate scanner</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-10 sm:grid-cols-2">
          <div>
            <p className="rule-label">Desk</p>
            <h3 className="mt-3 text-title font-medium text-ink">On the laptop</h3>
            <ul className="mt-3 space-y-2.5">
              {['Authorise and block tickets', 'Manage entries per ticket', 'Watch gates and live feed', 'Export CSV and audit log'].map((t) => (
                <li key={t} className="flex gap-2.5 text-small text-ink-secondary">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={2} aria-hidden="true" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="rule-label">Door</p>
            <h3 className="mt-3 text-title font-medium text-ink">On the phone</h3>
            <ul className="mt-3 space-y-2.5">
              {['Pick a gate, point, scan', 'Full-screen admit or refuse verdict', 'Sound and vibration feedback', 'Manual code entry fallback'].map((t) => (
                <li key={t} className="flex gap-2.5 text-small text-ink-secondary">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={2} aria-hidden="true" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-border bg-surface" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-20">
        <p className="eyebrow">FAQ</p>
        <h2 id="faq-heading" className="mt-3 font-display text-display-sm font-medium text-ink">
          Questions from the door.
        </h2>

        <div className="mt-8 border-t border-border">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="border-b border-border">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-accent-strong focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <span className="text-base font-medium text-ink">{f.q}</span>
                  <ChevronDown
                    className={cn('h-4 w-4 shrink-0 text-ink-tertiary transition-transform duration-fast', isOpen && 'rotate-180')}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <p id={`faq-panel-${i}`} className="max-w-[62ch] pb-5 text-small leading-relaxed text-ink-secondary">
                    {f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <SiteHeader />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Features />
        <Roles />
        <Faq />

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20" aria-labelledby="cta-heading">
          <div className="bg-ink px-6 py-10 text-bg sm:px-10 sm:py-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-bg/60">Doors open soon</p>
            <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 id="cta-heading" className="max-w-[18ch] font-display text-display-sm font-medium">
                  Start from the login. The gate can wait.
                </h2>
                <p className="mt-3 max-w-[48ch] text-small leading-relaxed text-bg/70">
                  Admins sign in to authorise tickets and watch the door live. Gate phones go
                  straight to the scanner — no account needed.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row">
                <Button variant="accent" size="lg" asChild>
                  <Link to="/login">
                    Admin login
                    <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  asChild
                  className="border-bg/30 bg-transparent text-bg hover:border-bg hover:bg-bg/10"
                >
                  <Link to="/scanner">
                    Open scanner
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-tiny text-ink-tertiary sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <Brand compact />
            <p>© {new Date().getFullYear()} Event Scan. Local event tooling.</p>
          </div>
          <nav className="flex gap-5" aria-label="Footer">
            <Link className="transition-colors hover:text-ink" to="/login">Login</Link>
            <Link className="transition-colors hover:text-ink" to="/scanner">Scanner</Link>
            <a className="transition-colors hover:text-ink" href="#faq">FAQ</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
