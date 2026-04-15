import { useNavigate } from 'react-router-dom';
import {
  MapPin, CalendarCheck, Zap, CreditCard,
  FileText, Shield, ArrowRight, CheckCircle2,
  Car, Clock, Star,
} from 'lucide-react';

// ── Feature cards data ────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: MapPin,
    title: 'GPS Nearby Search',
    desc: 'Discover parking lots within your chosen radius using live GPS location.',
    color: 'bg-[#EDE8F5] text-[#3D52A0]',
  },
  {
    icon: CalendarCheck,
    title: 'Pre-Book or Walk-In',
    desc: 'Reserve a spot in advance or book instantly on arrival — your choice.',
    color: 'bg-blue-50 text-[#7091E6]',
  },
  {
    icon: Zap,
    title: 'Digital Check-In/Out',
    desc: 'Check in and out digitally with one tap. No queues, no paper tickets.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: CreditCard,
    title: 'Flexible Payments',
    desc: 'Pay via Card, UPI, Wallet or Cash. Fare is calculated at checkout.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: FileText,
    title: 'PDF Receipts',
    desc: 'Download instant PDF receipts for every completed parking session.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    desc: 'JWT-secured accounts, atomic spot booking to prevent double-booking.',
    color: 'bg-red-50 text-red-500',
  },
];

// ── How it works steps ────────────────────────────────────────────────────────
const STEPS = [
  {
    step: '01',
    title: 'Search',
    desc: 'Find nearby parking lots by GPS or search by city, area, or landmark.',
    icon: MapPin,
  },
  {
    step: '02',
    title: 'Book',
    desc: 'Choose your spot, select vehicle, pick time — confirm in seconds.',
    icon: CalendarCheck,
  },
  {
    step: '03',
    title: 'Park',
    desc: 'Arrive, check in digitally, and park without any hassle.',
    icon: Car,
  },
  {
    step: '04',
    title: 'Pay',
    desc: 'Check out, pay your fare, and download your receipt instantly.',
    icon: CreditCard,
  },
];

// ── Stats ─────────────────────────────────────────────────────────────────────
const STATS = [
  { value: '500+', label: 'Parking Lots' },
  { value: '50K+', label: 'Happy Drivers' },
  { value: '1M+',  label: 'Bookings Done' },
  { value: '4.8★', label: 'Driver Rating' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#EDE8F5]">

      {/* ── Public Navbar ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md 
                         border-b border-[#ADBBDA] shadow-sm">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#3D52A0] rounded-xl flex items-center 
                              justify-center shadow-sm">
                <span className="text-white font-black text-lg">P</span>
              </div>
              <div>
                <span className="text-[#3D52A0] font-bold text-lg tracking-tight">
                  ParkEase
                </span>
                <span className="hidden sm:block text-[#8697C4] text-[10px] 
                                 font-medium tracking-widest uppercase -mt-0.5">
                  Smart Parking
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/explore')}
                className="btn-ghost text-sm py-2 px-4"
              >
                Explore Parking
              </button>
              <button
                onClick={() => navigate('/auth/login')}
                className="btn-outline text-sm py-2 px-4"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/auth/register')}
                className="btn-primary text-sm py-2 px-4"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero Section ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-hero-gradient">

        {/* Decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-[400px] h-[400px] 
                        bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[300px] h-[300px] 
                        bg-[#7091E6]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 max-w-7xl py-24 md:py-32 
                        relative z-10">
          <div className="max-w-3xl">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 
                            backdrop-blur-sm border border-white/20 
                            rounded-full px-4 py-1.5 mb-6">
              <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span className="text-white/90 text-xs font-semibold 
                               tracking-wide uppercase">
                Smart Parking Platform
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black 
                           text-white leading-[1.05] tracking-tight mb-6">
              Find. Reserve.{' '}
              <span className="text-[#ADBBDA]">Park.</span>
              <br />
              <span className="text-[#EDE8F5]/70 text-4xl md:text-5xl 
                               font-bold">
                Effortlessly.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-white/75 text-lg md:text-xl leading-relaxed 
                          mb-10 max-w-xl">
              Discover nearby parking lots, reserve your spot in seconds, 
              check in digitally, and pay seamlessly — all from one app.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/auth/register')}
                className="flex items-center gap-2 bg-white text-[#3D52A0] 
                           font-bold px-7 py-3.5 rounded-xl shadow-lg 
                           hover:bg-[#EDE8F5] transition-all duration-200 
                           hover:shadow-xl active:scale-95 text-base"
              >
                Start Parking Free
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/explore')}
                className="flex items-center gap-2 bg-white/20 text-white 
                           border border-white/30 font-semibold 
                           px-7 py-3.5 rounded-xl hover:bg-white/30 
                           transition-all duration-200 text-base"
              >
                Explore Parking
              </button>
              <button
                onClick={() => navigate('/auth/login')}
                className="flex items-center gap-2 bg-white/10 text-white 
                           border border-white/20 font-semibold 
                           px-7 py-3.5 rounded-xl hover:bg-white/20 
                           transition-all duration-200 text-base"
              >
                Sign In
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-5 mt-10">
              {['No hidden fees', 'Instant confirmation', 'Cancel anytime'].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#ADBBDA]" />
                  <span className="text-white/70 text-sm">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-[#ADBBDA]">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x 
                          divide-[#EDE8F5]">
            {STATS.map(({ value, label }) => (
              <div key={label}
                className="flex flex-col items-center justify-center 
                           py-8 px-4 text-center">
                <span className="text-3xl font-black text-[#3D52A0]">
                  {value}
                </span>
                <span className="text-sm text-[#8697C4] font-medium mt-1">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ───────────────────────────────────────────────── */}
      <section className="py-20 bg-[#EDE8F5]">
        <div className="container mx-auto px-4 max-w-7xl">

          {/* Section header */}
          <div className="text-center mb-14">
            <span className="inline-block bg-[#3D52A0]/10 text-[#3D52A0] 
                             text-xs font-bold uppercase tracking-widest 
                             px-4 py-1.5 rounded-full mb-4">
              Why ParkEase
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-[#3D52A0] 
                           mb-4">
              Everything you need to park smarter
            </h2>
            <p className="text-[#8697C4] text-lg max-w-xl mx-auto">
              Designed for drivers who value their time and want a 
              stress-free parking experience.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title}
                className="bg-white rounded-2xl p-6 border border-[#ADBBDA] 
                           shadow-card hover:shadow-card-hover 
                           transition-all duration-200 group">
                <div className={`w-12 h-12 ${color} rounded-xl 
                                flex items-center justify-center mb-4
                                group-hover:scale-110 transition-transform 
                                duration-200`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-[#3D52A0] text-base mb-2">
                  {title}
                </h3>
                <p className="text-[#8697C4] text-sm leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">

          <div className="text-center mb-14">
            <span className="inline-block bg-[#3D52A0]/10 text-[#3D52A0] 
                             text-xs font-bold uppercase tracking-widest 
                             px-4 py-1.5 rounded-full mb-4">
              How It Works
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-[#3D52A0] mb-4">
              Park in 4 simple steps
            </h2>
            <p className="text-[#8697C4] text-lg max-w-xl mx-auto">
              From discovery to payment — the whole journey takes under 
              2 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(({ step, title, desc, icon: Icon }, idx) => (
              <div key={step} className="relative">

                {/* Connector line (desktop) */}
                {idx < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 
                                  left-[calc(50%+40px)] right-[-calc(50%-40px)] 
                                  h-px bg-[#ADBBDA] z-0" />
                )}

                <div className="relative z-10 flex flex-col items-center 
                                text-center p-6">
                  {/* Step circle */}
                  <div className="w-20 h-20 bg-[#EDE8F5] rounded-2xl 
                                  flex flex-col items-center justify-center 
                                  mb-4 border-2 border-[#ADBBDA] 
                                  group-hover:border-[#3D52A0]">
                    <Icon className="w-7 h-7 text-[#3D52A0] mb-1" />
                    <span className="text-[#7091E6] text-xs font-bold">
                      {step}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#3D52A0] text-lg mb-2">
                    {title}
                  </h3>
                  <p className="text-[#8697C4] text-sm leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[#7091E6]/10 pointer-events-none" />
        <div className="container mx-auto px-4 max-w-4xl text-center 
                        relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-5">
            Ready to park smarter?
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of drivers who've ditched parking stress 
            with ParkEase.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/auth/register')}
              className="flex items-center gap-2 bg-white text-[#3D52A0] 
                         font-bold px-8 py-4 rounded-xl shadow-lg 
                         hover:bg-[#EDE8F5] transition-all duration-200 
                         text-base hover:shadow-xl active:scale-95"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/auth/login')}
              className="flex items-center gap-2 bg-transparent text-white 
                         border-2 border-white/40 font-semibold 
                         px-8 py-4 rounded-xl hover:bg-white/10 
                         transition-all duration-200 text-base"
            >
              Already have an account?
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-[#3D52A0] py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center 
                          justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center 
                              justify-center">
                <span className="text-[#3D52A0] font-black text-base">P</span>
              </div>
              <span className="text-white font-bold">ParkEase</span>
            </div>
            <p className="text-[#ADBBDA] text-sm text-center">
              © 2026 ParkEase. Smart Parking Management Platform.
            </p>
            <div className="flex items-center gap-1 text-[#ADBBDA] text-sm">
              <Clock className="w-3.5 h-3.5" />
              <span>Available 24/7</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}