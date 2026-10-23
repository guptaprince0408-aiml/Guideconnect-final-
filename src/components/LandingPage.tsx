import React from 'react';
import {
  Compass,
  Languages,
  CheckCircle2,
  Calendar,
  Lock,
  ArrowRight,
  Star,
  Users,
  Award,
  Zap,
  DollarSign
} from 'lucide-react';
import { GuideProfile } from '../types';

interface LandingPageProps {
  guides: GuideProfile[];
  onFindGuide: () => void;
  onBecomeGuide: () => void;
  onOpenSimulator: () => void;
  onOpenDocs: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  guides,
  onFindGuide,
  onBecomeGuide,
  onOpenSimulator,
  onOpenDocs
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 py-20 lg:py-28 text-white">
        <div className="absolute inset-0">
          <img
            src="/src/assets/images/hero_cultural_exploration_1791808671160.jpg"
            alt="Multilingual tourist guide leading international travelers through historic heritage alley"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 mb-4 tracking-wide uppercase">
              <span>Verified Multilingual Guides</span>
              <span aria-hidden="true">·</span>
              <span>Single-Winner Transactional Booking</span>
              <span aria-hidden="true">·</span>
              <span>Transparent Price Bargaining</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight text-balance">
              Eliminate language barriers with verified local tourist guides.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed max-w-2xl">
              GuideConnect pairs international travelers with licensed, multilingual guides based on exact spoken dialects, certified destinations, and conflict-free schedules.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={onFindGuide}
                className="px-6 py-3.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <span>Find a Verified Guide</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onBecomeGuide}
                className="px-6 py-3.5 text-sm font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
              >
                Become a Guide (Get Unique Guide ID)
              </button>
              <button
                onClick={onOpenSimulator}
                className="px-5 py-3.5 text-sm font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-950/60 border border-amber-800/60 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Simulate Concurrency Race</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Architecture Pillars Strip */}
      <section className="bg-white border-b border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                <Award className="w-4 h-4" />
                <span>1. Unique Guide ID & Handle</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                System-generated stable IDs like <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">GC-G-100001</code> paired with guide-chosen usernames like <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">@mumbai_explorer</code>.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
                <Lock className="w-4 h-4" />
                <span>2. Single-Winner Atomic Transaction</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                When two guides click Accept simultaneously, database row locking ensures exactly one booking is created. No race conditions or double reservations.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                <DollarSign className="w-4 h-4" />
                <span>3. Separated Matching, Booking & Bargaining</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Matching tests qualification. Acceptance reserves the slot atomically. Counteroffer bargaining determines the final agreed fee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How the Platform Works */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">
            Engine Workflow
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
            Designed for Reliability at Every Stage
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 bg-white border border-slate-200 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base mb-4">
              01
            </div>
            <h4 className="font-semibold text-slate-900 mb-2">Client Request Creation</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tourists specify destination, language proficiency required, travel date, time window, group size, and budget.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base mb-4">
              02
            </div>
            <h4 className="font-semibold text-slate-900 mb-2">Smart Eligibility Match</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              The matching engine verifies active status, city coverage, dialect fluency, and filters out guides with overlapping accepted bookings.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-base mb-4">
              03
            </div>
            <h4 className="font-semibold text-slate-900 mb-2">Atomic Acceptance</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              First qualified guide to accept wins the booking. All other invitations are atomically withdrawn with a complete audit record.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-base mb-4">
              04
            </div>
            <h4 className="font-semibold text-slate-900 mb-2">Transparent Bargaining</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Both parties negotiate the fee around an indicative price range. Offers and counteroffers are logged until mutual agreement is reached.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Popular Destinations */}
      <section className="bg-slate-100 py-16 lg:py-24 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Destinations
              </h2>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Explore with Certified Local Guides
              </h3>
            </div>
            <button
              onClick={onFindGuide}
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5"
            >
              <span>Explore all destinations</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mumbai Card */}
            <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm flex flex-col">
              <div className="h-52 relative overflow-hidden bg-slate-200">
                <img
                  src="/src/assets/images/destination_mumbai_heritage_1791808690908.jpg"
                  alt="Historic Victorian Gothic landmark in Mumbai with street scene"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span>India</span>
                    <span aria-hidden="true">·</span>
                    <span>2 Verified Guides</span>
                    <span aria-hidden="true">·</span>
                    <span>From ₹650/hr</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Mumbai</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Colonial Victorian architecture, bustling Fort heritage lanes, Marine Drive sunsets, and authentic street gastronomy.
                  </p>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Languages: English · Hindi · French · German
                </div>
              </div>
            </div>

            {/* Kyoto Card */}
            <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm flex flex-col">
              <div className="h-52 relative overflow-hidden bg-slate-200">
                <img
                  src="/src/assets/images/destination_kyoto_temple_1791808708728.jpg"
                  alt="Scenic Japanese traditional pagoda temple in Kyoto with autumn maples"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span>Japan</span>
                    <span aria-hidden="true">·</span>
                    <span>National Licensed Guide</span>
                    <span aria-hidden="true">·</span>
                    <span>From ¥3,800/hr</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Kyoto</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Zen gardens, Gion preservation quarters, tea ceremony protocols, and centuries-old wooden shrines.
                  </p>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Languages: Japanese · English · Spanish
                </div>
              </div>
            </div>

            {/* Rome Card */}
            <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm flex flex-col">
              <div className="h-52 relative overflow-hidden bg-slate-200">
                <img
                  src="/src/assets/images/destination_rome_colosseum_1791808720486.jpg"
                  alt="Roman Colosseum stone arches in golden Mediterranean afternoon light"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span>Italy</span>
                    <span aria-hidden="true">·</span>
                    <span>Regione Lazio Certified</span>
                    <span aria-hidden="true">·</span>
                    <span>From €32/hr</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Rome</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Imperial Forum ruins, Vatican secrets, underground crypts, and Trastevere culinary culture.
                  </p>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Languages: Italian · English · French
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Featured Verified Guides Spotlight */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">
              Verified Talents
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Featured Tourist Guides
            </h3>
          </div>
          <p className="text-xs text-slate-500 max-w-sm">
            Every guide holds an auto-generated system Guide ID and undergoes government or regional credential verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {guides.slice(0, 3).map(guide => (
            <div
              key={guide.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <img
                    src={guide.profilePhoto}
                    alt={guide.fullName}
                    className="w-14 h-14 rounded-full object-cover border border-slate-200"
                  />
                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold text-slate-600 block">
                      {guide.guideId}
                    </span>
                    <span className="text-xs text-emerald-700 font-medium block">
                      @{guide.username}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mb-1">
                  <h4 className="font-bold text-slate-900 text-base">{guide.fullName}</h4>
                  {guide.isVerified && (
                    <span title="Verified Guide" className="inline-flex">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <span>{guide.country}</span>
                  <span aria-hidden="true">·</span>
                  <span>{guide.yearsOfExperience} yrs exp</span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center text-amber-700 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-0.5" />
                    {guide.rating.toFixed(2)} ({guide.reviewCount})
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                  {guide.bio}
                </p>

                <div className="space-y-1.5 mb-4 text-xs">
                  <div className="text-slate-500">
                    <span className="font-medium text-slate-700">Languages: </span>
                    {guide.languages.map(l => `${l.language} (${l.proficiency.toLowerCase()})`).join(', ')}
                  </div>
                  <div className="text-slate-500">
                    <span className="font-medium text-slate-700">Specializations: </span>
                    {guide.specializations.join(', ')}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-800">
                  {guide.currency} {guide.baseHourlyRate}/hr
                </span>
                <button
                  onClick={onFindGuide}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>Request Tour</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Authentic Testimonials */}
      <section className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Verified Tourist Reviews
            </h2>
            <h3 className="text-2xl font-bold text-slate-900">
              Trusted by Travelers Across 40+ Countries
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1 text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed mb-4">
                "Finding Aarav (GC-G-100001) in Mumbai eliminated our anxiety about navigating South Bombay’s colonial quarter. His French was immaculate and the transparent price bargaining gave us complete peace of mind."
              </p>
              <div className="text-xs">
                <span className="font-semibold text-slate-900 block">Elena Rostova</span>
                <span className="text-slate-500">Toronto, Canada · Booking BK-2026-0012</span>
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1 text-amber-500 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed mb-4">
                "Matteo in Rome was phenomenal. He explained the Imperial forums in French, handled the entry queues, and gave our family a once-in-a-lifetime tour. GuideConnect's single-winner reservation system worked flawlessly."
              </p>
              <div className="text-xs">
                <span className="font-semibold text-slate-900 block">Jean-Pierre Dubois</span>
                <span className="text-slate-500">Lyon, France · Booking BK-2026-0028</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Compass className="w-5 h-5 text-emerald-500" />
              <span>GuideConnect</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-slate-400">
              <button onClick={onOpenDocs} className="hover:text-white transition-colors">
                Architecture Blueprint
              </button>
              <button onClick={onOpenSimulator} className="hover:text-white transition-colors">
                Race Simulator
              </button>
              <span className="hover:text-white transition-colors cursor-pointer">
                Safety & Verification
              </span>
              <span className="hover:text-white transition-colors cursor-pointer">
                Terms of Service
              </span>
              <span className="hover:text-white transition-colors cursor-pointer">
                Privacy Policy
              </span>
            </div>
          </div>
          <div className="text-center md:text-left text-slate-500 pt-6 border-t border-slate-800">
            GuideConnect Multilingual Tourist-Guide Platform. Compliant with strict single-winner transactional integrity and separated bargaining workflows.
          </div>
        </div>
      </footer>
    </div>
  );
};
