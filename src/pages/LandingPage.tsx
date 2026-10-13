import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  ShieldCheck,
  ScanLine,
  Activity,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  TicketCheck,
  Radio,
  FileUp,
  ClipboardList,
  Users,
  Smartphone,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';

const STEPS = [
  {
    n: '01',
    icon: ShieldCheck,
    title: 'Authorize tickets',
    body: 'Import attendees with CSV or create tickets manually. Only whitelisted tickets pass the gate. Authorization needs a secondary password, so volunteers cannot fake entry.',
  },
  {
    n: '02',
    icon: ScanLine,
    title: 'Scan with any phone',
    body: 'Open /scanner on each gate phone, pick Gate A, Gate B, VIP or Back Gate, and point at the QR. Green means in, red means denied — with sound and vibration.',
  },
  {
    n: '03',
    icon: Activity,
    title: 'Watch it live',
    body: 'Every scan lands on the admin dashboard over Socket.IO: counts, per-gate charts, live feed and scan history. No refresh, no guessing at doors.',
  },
];

const FAQS = [
  {
    q: 'Do scanner phones need to be on the same network?',
    a: 'Yes for local events: connect phones to the same WiFi as the laptop (or the laptop hotspot) and open the scanner URL. The server prints its LAN address so gate staff can join in seconds.',
  },
  {
    q: 'What do QR codes contain?',
    a: 'Plain ticket numbers such as 001, 002, 003. Any QR generator works. Each ticket can carry multiple entries — for example 3 entries per ticket — and the scanner counts them down.',
  },
  {
    q: 'What happens on a duplicate or blocked ticket?',
    a: 'The scanner shows red, plays the denied sound, and logs the attempt. Blocked, unauthorized, or fully-used tickets are rejected, and the attempt appears in the audit log.',
  },
  {
    q: 'Where is the data stored?',
    a: 'Locally in SQLite next to the server. CSV export covers tickets and scan history, and every admin action is written to an audit log.',
  },
];

function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Event Scan home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
            <QrCode className="h-4.5 w-4.5 text-white" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Event <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Scan</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex" aria-label="Primary">
          <a className="transition-colors hover:text-foreground" href="#how">How it works</a>
          <a className="transition-colors hover:text-foreground" href="#features">Features</a>
          <a className="transition-colors hover:text-foreground" href="#roles">Who uses it</a>
          <a className="transition-colors hover:text-foreground" href="#faq">FAQ</a>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" asChild>
            <Link to="/scanner">
              <Smartphone className="mr-2 h-4 w-4" aria-hidden="true" />
              Open scanner
            </Link>
          </Button>
          <Button asChild>
            <Link to="/login">
              Admin login
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </Button>
      </div>

      {open && (
        <nav className="border-t border-white/5 px-4 py-3 md:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1 text-sm">
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
                className="rounded-lg px-3 py-2.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                {label}
              </a>
            ))}
            <div className="mt-2 flex gap-2">
              <Button variant="outline" asChild className="flex-1">
                <Link to="/scanner" onClick={() => setOpen(false)}>Open scanner</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link to="/login" onClick={() => setOpen(false)}>Admin login</Link>
              </Button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-heading">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-12 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:items-center md:pt-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            QR gate control for live events
          </p>
          <h1
            id="hero-heading"
            className="mt-5 max-w-[20ch] text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
          >
            Know every ticket at the gate.
          </h1>
          <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            Event Scan turns ordinary phones into gate scanners. Volunteers scan QR codes,
            the dashboard counts entries per gate in real time, and only tickets you
            authorized get through.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" asChild className="min-h-[48px]">
              <Link to="/login">
                Admin login
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="min-h-[48px]">
              <a href="#how">See how scanning works</a>
            </Button>
          </div>
          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <TicketCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              <span><strong className="text-foreground">4 gates</strong> tracked separately</span>
            </div>
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-blue-400" aria-hidden="true" />
              <span><strong className="text-foreground">Live</strong> Socket.IO feed</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-purple-400" aria-hidden="true" />
              <span><strong className="text-foreground">Whitelist</strong> entry control</span>
            </div>
          </dl>
        </div>

        <div className="relative" aria-label="Product preview">
          <Card className="gradient-border border-border/40 bg-slate-950/60">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Gate A — live</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
                  Connected
                </span>
              </div>
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-400" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-emerald-200">Ticket 042 accepted</p>
                    <p className="text-sm text-emerald-200/70">2 of 3 entries left · Gate A</p>
                  </div>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {[
                  ['Ticket 041 accepted', 'Gate B · 10s ago', true],
                  ['Ticket 118 denied — already used', 'VIP · 26s ago', false],
                  ['Ticket 039 accepted', 'Gate A · 41s ago', true],
                ].map(([text, meta, ok]) => (
                  <li
                    key={text as string}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2.5"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={cn('h-1.5 w-1.5 rounded-full', ok ? 'bg-emerald-400' : 'bg-red-400')}
                        aria-hidden="true"
                      />
                      <span>{text}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{meta}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  ['187', 'Scanned'],
                  ['113', 'Remaining'],
                  ['4', 'Gates'],
                ].map(([v, l]) => (
                  <div key={l} className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-3">
                    <p className="text-xl font-bold">{v}</p>
                    <p className="text-xs text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6" aria-labelledby="how-heading">
      <p className="text-sm font-semibold text-blue-400">How it works</p>
      <h2 id="how-heading" className="mt-2 max-w-[24ch] text-3xl font-bold tracking-tight sm:text-4xl">
        Three steps between you and open doors
      </h2>
      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.n} className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] p-6">
            <span className="text-xs font-bold tracking-widest text-muted-foreground" aria-hidden="true">{s.n}</span>
            <s.icon className="mt-4 h-7 w-7 text-blue-400" aria-hidden="true" />
            <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6" aria-labelledby="features-heading">
      <p className="text-sm font-semibold text-blue-400">What you get</p>
      <h2 id="features-heading" className="mt-2 max-w-[24ch] text-3xl font-bold tracking-tight sm:text-4xl">
        One dashboard runs the whole door
      </h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card className="border-border/40 md:col-span-2 md:row-span-2">
          <CardContent className="flex h-full flex-col justify-between gap-6 p-6 sm:p-8">
            <div>
              <Activity className="h-8 w-8 text-blue-400" aria-hidden="true" />
              <h3 className="mt-4 text-2xl font-bold tracking-tight">Real-time control room</h3>
              <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
                Counts, per-gate charts, and a live scan feed update the moment a phone scans.
                Spot a rush at Gate B before the queue forms, and pull scan history per ticket in one click.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {['Live feed', 'Gate charts', 'Search', 'History'].map((t) => (
                <span key={t} className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2.5 text-center text-xs font-medium">
                  {t}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
        {[
          {
            icon: ShieldCheck,
            title: 'Authorization whitelist',
            body: 'Tickets scan green only after you authorize them. Bulk-authorize lists with a secondary password.',
          },
          {
            icon: Smartphone,
            title: 'Phones as scanners',
            body: 'No rented hardware. Any modern phone camera works, with manual entry fallback and offline-tolerant UI.',
          },
          {
            icon: FileUp,
            title: 'CSV in and out',
            body: 'Import attendees in bulk, export tickets and full scan history for reconciliation.',
          },
          {
            icon: ClipboardList,
            title: 'Audit log',
            body: 'Every block, reset, and authorization is recorded with who did it and when.',
          },
        ].map((f) => (
          <Card key={f.title} className="border-border/40">
            <CardContent className="p-6">
              <f.icon className="h-6 w-6 text-purple-300" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Roles() {
  return (
    <section id="roles" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6" aria-labelledby="roles-heading">
      <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-start">
        <div>
          <p className="text-sm font-semibold text-blue-400">Who uses it</p>
          <h2 id="roles-heading" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Built for two jobs at once
          </h2>
          <p className="mt-3 text-muted-foreground">
            Organizers stay in control from a laptop. Volunteers get a screen so simple
            there is nothing to misconfigure at the gate.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link to="/login">Admin login<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/scanner">Open gate scanner</Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border/40">
            <CardContent className="p-6">
              <Users className="h-6 w-6 text-blue-400" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">Admin on laptop</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {['Authorize and block tickets', 'Manage gates and entries', 'Export CSV + audit log', 'Edit event settings'].map((t) => (
                  <li key={t} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-6">
              <ScanLine className="h-6 w-6 text-emerald-400" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">Volunteer on phone</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {['Pick a gate, point, scan', 'Instant green / red verdict', 'Sound + vibration feedback', 'Manual code entry fallback'].map((t) => (
                  <li key={t} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-14 sm:px-6" aria-labelledby="faq-heading">
      <p className="text-center text-sm font-semibold text-blue-400">FAQ</p>
      <h2 id="faq-heading" className="mt-2 text-center text-3xl font-bold tracking-tight sm:text-4xl">
        Questions from the door
      </h2>
      <div className="mt-8 space-y-2.5">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className="overflow-hidden rounded-xl border border-white/5 bg-white/[0.03]">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>{f.q}</span>
                <ChevronDown
                  className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>
              {isOpen && <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-foreground">
      <SiteHeader />
      <main id="main">
        <Hero />
        <div className="border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-4 text-xs text-muted-foreground sm:px-6">
            <span className="font-semibold uppercase tracking-wider">Runs on</span>
            <span>Gate A · Gate B · VIP · Back Gate</span>
            <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" />
            <span>QR payload is just the ticket number</span>
          </div>
        </div>
        <HowItWorks />
        <Features />
        <Roles />
        <Faq />
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6" aria-labelledby="cta-heading">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20 p-8 sm:p-12">
            <h2 id="cta-heading" className="max-w-[22ch] text-3xl font-bold tracking-tight sm:text-4xl">
              Doors open soon? Start from the login.
            </h2>
            <p className="mt-3 max-w-[52ch] text-muted-foreground">
              Admins sign in to authorize tickets and watch gates live. Gate phones go
              straight to the scanner — no account needed.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="min-h-[48px]">
                <Link to="/login">Admin login<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="min-h-[48px]">
                <Link to="/scanner">Open gate scanner</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Event Scan. All rights reserved.</p>
          <nav className="flex gap-5" aria-label="Footer">
            <Link className="transition-colors hover:text-foreground" to="/login">Login</Link>
            <Link className="transition-colors hover:text-foreground" to="/scanner">Scanner</Link>
            <a className="transition-colors hover:text-foreground" href="#faq">FAQ</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
