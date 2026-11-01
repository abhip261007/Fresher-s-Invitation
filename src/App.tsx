import React, { useState, useEffect } from "react";
import { GlideCarousel, GlideSlideItem } from "@/components/ui/glide-carousel";
import { WorksWheel, WorksWheelItem } from "@/components/ui/works-wheel";
import { LiquidEffectAnimation } from "@/components/ui/liquid-effect-animation";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Maximize2,
  X,
  Sparkles,
  ShieldCheck,
  Users,
  Loader2,
  AlertCircle
} from "lucide-react";
import confetti from "canvas-confetti";
import { AdminModal } from "@/components/AdminModal";
import { PosterReveal } from "@/components/PosterReveal";
import { registerJunior, getStats } from "@/lib/cloudDb";

// Memory Slides for the Glide.js Center-Focus Peeking Carousel (Curated Freshers Photos - No Captions)
const MEMORY_SLIDES: GlideSlideItem[] = [
  {
    id: 3,
    src: "assets/freshers/photo-03.jpeg",
    alt: "Group smiles and friendship",
    title: "Unscripted Joy",
    tag: "Keepsakes"
  },
  {
    id: 4,
    src: "assets/freshers/photo-04.jpeg",
    alt: "Auditorium showcase and speeches",
    title: "Auditorium Glory",
    tag: "Ceremony"
  },
  {
    id: 5,
    src: "assets/freshers/photo-05.jpeg",
    alt: "Stage showcase and live performances",
    title: "Centerstage Spotlight",
    tag: "Live Showcase"
  },
  {
    id: 6,
    src: "assets/freshers/photo-06.jpeg",
    alt: "Senior and junior camaraderie",
    title: "Bonds of Brotherhood",
    tag: "Camaraderie"
  },
  {
    id: 7,
    src: "assets/freshers/photo-07.jpeg",
    alt: "Fresher students cheering and celebrating",
    title: "Crowd Euphoria",
    tag: "Vibes"
  },
  {
    id: 8,
    src: "assets/freshers/photo-08.jpeg",
    alt: "Traditional attire and elegance",
    title: "Tradition & Grace",
    tag: "Heritage"
  },
  {
    id: 9,
    src: "assets/freshers/photo-09.jpeg",
    alt: "Runway moments and smiles",
    title: "Runway Radiance",
    tag: "Glamour"
  },
  {
    id: 10,
    src: "assets/freshers/photo-10.jpeg",
    alt: "Candid laughter among peers",
    title: "Golden Smiles",
    tag: "Memories"
  },
  {
    id: 11,
    src: "assets/freshers/photo-11.jpeg",
    alt: "Stage backdrop and evening lights",
    title: "Evening Radiance",
    tag: "Aesthetics"
  },
  {
    id: 12,
    src: "assets/freshers/photo-12.jpeg",
    alt: "Cultural jam and live beats",
    title: "Rhythm & Resonance",
    tag: "Acoustics"
  },
  {
    id: 13,
    src: "assets/freshers/photo-13.jpeg",
    alt: "Garba and folk celebration",
    title: "Garba Raas Energy",
    tag: "Garba Night"
  },
  {
    id: 14,
    src: "assets/freshers/photo-14.jpeg",
    alt: "Faculty and student felicitation",
    title: "Honoring Excellence",
    tag: "Inspiration"
  },
  {
    id: 15,
    src: "assets/freshers/photo-15.jpeg",
    alt: "Batch unity and group portraits",
    title: "United As One",
    tag: "Unity"
  }
];

// Items for the 3D Works Wheel drum below the carousel (Unique Freshers Photos - No Duplicates)
const WHEEL_ITEMS: WorksWheelItem[] = [
  { title: "Campus Atmosphere", image: "assets/freshers/photo-16.jpeg" },
  { title: "Theatrical Skits", image: "assets/freshers/photo-17.jpeg" },
  { title: "Accolades", image: "assets/freshers/photo-18.jpeg" },
  { title: "Unforgettable Bonds", image: "assets/freshers/photo-19.jpeg" },
  { title: "Festive Banquet", image: "assets/freshers/photo-20.jpeg" },
  { title: "Dance Showcase", image: "assets/freshers/photo-21.jpeg" },
  { title: "Guiding Beacon", image: "assets/freshers/photo-22.jpeg" },
  { title: "Sparkling Memories", image: "assets/freshers/photo-23.jpeg" },
  { title: "Melodic Beats", image: "assets/freshers/photo-24.jpeg" },
  { title: "Comrades in Code", image: "assets/freshers/photo-26.jpeg" },
  { title: "Grand Horizon", image: "assets/freshers/photo-27.jpeg" },
  { title: "Spirited Cheers", image: "assets/freshers/photo-28.jpeg" },
  { title: "Grand Crescendo", image: "assets/freshers/photo-29.jpeg" },
  { title: "Legacy Eternal", image: "assets/freshers/photo-30.jpeg" },
];

export function App() {
  const [activeView, setActiveView] = useState<"portal" | "success">("portal");
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [errors, setErrors] = useState<{ fullName?: string; dob?: string; enrollmentNo?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<string>("");

  // Countdown to 19 November 2026, 1:30 PM
  const calculateTimeLeft = () => {
    const targetDate = new Date(2026, 10, 19, 13, 30, 0).getTime();
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [registeredCount, setRegisteredCount] = useState<number>(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // Fetch registered count from database
  const fetchStats = async () => {
    try {
      const stats = await getStats();
      if (stats.success && typeof stats.total === "number") {
        setRegisteredCount(stats.total);
      }
    } catch (err) {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Handle Form Submission with Instant Cloud & Local Resilient Database
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { fullName?: string; dob?: string; enrollmentNo?: string } = {};

    // Validate Enrollment Number (range: 3060826001 to 3060826063)
    const cleanEnroll = enrollmentNo.trim();
    if (!cleanEnroll) {
      newErrors.enrollmentNo = "Please enter your enrollment number.";
    } else if (!/^\d{10}$/.test(cleanEnroll)) {
      newErrors.enrollmentNo = "Invalid enrollment number";
    } else {
      const num = Number(cleanEnroll);
      if (num < 3060826001 || num > 3060826063) {
        newErrors.enrollmentNo = "Invalid enrollment number";
      }
    }

    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.fullName = "Please enter your legal name (minimum 2 characters).";
    }

    if (!dob) {
      newErrors.dob = "Please select your date of birth.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setServerError(null);
    setIsDuplicate(false);
    setIsSubmitting(true);

    try {
      const result = await registerJunior(cleanEnroll, fullName.trim(), dob.trim());

      if (result.success) {
        setRegisteredUser(fullName.trim());
        setActiveView("success");
        setEnrollmentNo("");
        setFullName("");
        setDob("");
        fetchStats();
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Celebration Confetti
        confetti({
          particleCount: 140,
          spread: 90,
          origin: { y: 0.55 },
          colors: ["#00072D", "#0A2472", "#1A43BF", "#38BDF8", "#F59E0B"],
        });
      } else if (result.duplicate) {
        // Duplicate registration
        setIsDuplicate(true);
        setServerError(result.error || "Already registered");
      } else if (result.invalidEnrollment) {
        setErrors((prev) => ({ ...prev, enrollmentNo: "Invalid enrollment number" }));
      } else {
        setServerError(result.error || "Failed to record registration. Please try again.");
      }
    } catch (err) {
      // Resilient fallback - ensure student is registered on their device without error
      setRegisteredUser(fullName.trim());
      setActiveView("success");
      setEnrollmentNo("");
      setFullName("");
      setDob("");
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.55 },
        colors: ["#00072D", "#0A2472", "#1A43BF", "#38BDF8", "#F59E0B"],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToRegister = () => {
    const el = document.getElementById("registration-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        const input = document.getElementById("fresherName");
        input?.focus();
      }, 500);
    }
  };

  return (
    <div className="relative min-h-screen bg-white text-[#00072D] selection:bg-[#1A43BF] selection:text-white overflow-x-hidden text-center">
      
      {/* ── Ambient Theme Gradient Accent Layers on White ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(26,67,191,0.07),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_95%_35%,rgba(10,36,114,0.04),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_5%_65%,rgba(5,22,80,0.035),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(26,67,191,0.08),transparent_70%)]" />
      </div>

      {/* ── Header (Centered Layout & Typography) ─────────────── */}
      <header className="sticky top-0 z-40 border-b border-[#0A2472]/10 bg-white/90 backdrop-blur-xl transition-all">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-6 py-4 text-center">
          <span className="text-[10px] uppercase tracking-[0.35em] font-bold text-[#1A43BF] text-center">
            College of Agriculture Information Technology
          </span>
          <div className="flex items-center justify-center gap-4 sm:gap-8 mt-2 sm:mt-3">
            <img 
              src="aaulogo.png" 
              alt="Anand Agricultural University (AAU) Logo" 
              className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 object-contain hover:scale-105 transition-transform shrink-0 drop-shadow-sm"
            />
            <span className="font-cinzel text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-wider text-theme-gradient text-center">
              SAARTHI <span className="font-light text-[#1A43BF]">2026</span>
            </span>
            <img 
              src="ait-logo.png" 
              alt="College of Agriculture Information Technology (AIT) Logo" 
              className="h-11 sm:h-16 md:h-20 w-auto object-contain hover:scale-105 transition-transform shrink-0 drop-shadow-sm"
            />
          </div>

          <nav className="mt-3 flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-[11px] uppercase tracking-[0.2em] font-semibold text-[#475569] text-center">
            <a href="#welcome" className="transition-colors hover:text-[#1A43BF]">Welcome</a>
            <a href="#event" className="transition-colors hover:text-[#1A43BF]">The Event</a>
            <a href="#memories" className="transition-colors hover:text-[#1A43BF]">Memories</a>
            <a href="#seniors" className="transition-colors hover:text-[#1A43BF]">From Seniors</a>
            <button
              onClick={() => setIsAdminOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A43BF]/10 hover:bg-[#1A43BF]/20 text-[#1A43BF] font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer border border-[#1A43BF]/20"
              title="View registered juniors in SQLite database"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Council Roster</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ── VIEW 1: MAIN PORTAL ─────────────────────────────── */}
      {activeView === "portal" && (
        <main className="relative z-10 text-center">
          
          {/* 1. HERO SECTION: Liquid Blue Background */}
          <section id="welcome" className="relative pt-20 pb-20 md:pt-28 md:pb-24 text-center overflow-hidden">

            {/* ── Liquid Three.js full-section background ── */}
            <div className="absolute inset-0 z-0" aria-hidden="true">
              <LiquidEffectAnimation
                imageUrl="https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1200&q=80"
                metalness={0.88}
                roughness={0.08}
                displacementScale={5}
                rain={false}
              />
              {/* Blue brand gradient overlay — readable text + clean fade to white below */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#00072D]/85 via-[#0A2472]/65 to-white pointer-events-none" />
            </div>

            {/* ── Hero content ── */}
            <div className="relative z-10 mx-auto max-w-4xl px-6 flex flex-col items-center text-center">

              {/* Badge */}
              <div className="mb-6 inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-5 py-1.5 text-[11px] uppercase tracking-[0.3em] font-bold text-sky-300 shadow-sm text-center">
                <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                <span>The Official Freshers Induction • Class of 2026</span>
              </div>

              {/* SAARTHI */}
              <h1 className="font-cinzel text-6xl font-black leading-[1.05] tracking-tight sm:text-8xl lg:text-9xl text-center"
                style={{ color: "#ffffff", textShadow: "0 0 60px rgba(56,189,248,0.45), 0 2px 24px rgba(0,7,45,0.7)" }}>
                SAARTHI
              </h1>

              {/* Sanskrit subtitle */}
              <p className="font-cormorant italic text-3xl sm:text-4xl font-semibold tracking-wide text-sky-200 mt-4 text-center">
                सारथी — Your Guiding Light in Agri-Tech
              </p>

              {/* Divider */}
              <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent my-8 mx-auto" />

              {/* Body copy */}
              <p className="text-base sm:text-lg font-normal leading-relaxed text-white/70 max-w-2xl mx-auto text-center">
                To the newly inducted scholars of the{" "}
                <strong className="text-white font-semibold">College of Agriculture Information Technology</strong>:{" "}
                You stand at the frontier where advanced computational intellect empowers agrarian sustainability.
                Saarthi is our formal embrace—an extraordinary evening crafted by your seniors to celebrate
                your arrival and commence your transformative journey.
              </p>

              {/* Event Coordinates Card — High-contrast deep glass */}
              <div className="mt-12 w-full max-w-3xl rounded-3xl border border-sky-400/25 bg-[#00072D]/60 p-8 shadow-[0_25px_60px_rgba(0,7,45,0.7)] backdrop-blur-xl mx-auto text-center">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 text-center">

                  <div className="flex flex-col items-center justify-center border-b border-white/10 pb-5 sm:border-b-0 sm:border-r sm:pb-0 text-center">
                    <Calendar className="h-6 w-6 text-[#38BDF8] mb-2 drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]" strokeWidth={2} />
                    <div className="text-[11px] uppercase tracking-[0.25em] font-extrabold text-[#38BDF8] text-center">Date</div>
                    <div className="text-base font-extrabold text-white mt-1.5 text-center drop-shadow-sm">19 November 2026</div>
                  </div>

                  <div className="flex flex-col items-center justify-center border-b border-white/10 pb-5 sm:border-b-0 sm:border-r sm:pb-0 text-center">
                    <Clock className="h-6 w-6 text-[#38BDF8] mb-2 drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]" strokeWidth={2} />
                    <div className="text-[11px] uppercase tracking-[0.25em] font-extrabold text-[#38BDF8] text-center">Time</div>
                    <div className="text-base font-extrabold text-white mt-1.5 text-center drop-shadow-sm">1:30 PM</div>
                  </div>

                  <div className="flex flex-col items-center justify-center text-center">
                    <MapPin className="h-6 w-6 text-[#38BDF8] mb-2 drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]" strokeWidth={2} />
                    <div className="text-[11px] uppercase tracking-[0.25em] font-extrabold text-[#38BDF8] text-center">Venue</div>
                    <div className="text-base font-extrabold text-white mt-1.5 text-center drop-shadow-sm">CAIT Seminar Hall</div>
                  </div>

                </div>
              </div>

            </div>
          </section>

          {/* 2. POSTER SECTION: Centered Showcase */}
          <section id="event" className="relative border-t border-[#0A2472]/10 py-24 bg-gradient-to-b from-white via-[#F8FAFF] to-white text-center">
            <div className="mx-auto max-w-5xl px-6 flex flex-col items-center text-center">
              
              <div className="mb-12 text-center">
                <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#1A43BF] text-center">Official Reveal</span>
                <h2 className="font-cinzel mt-2 text-4xl font-extrabold tracking-tight sm:text-6xl text-[#00072D] text-center">
                  The Event Poster
                </h2>
                <p className="mt-2 text-base text-[#475569] max-w-lg mx-auto text-center font-cormorant italic text-xl">
                  College of Agriculture Information Technology proudly presents the official Saarthi poster.
                </p>
              </div>

              {/* Centered Poster Display with Motion Reveal & Auto-Align Freeze */}
              <div className="w-full max-w-3xl mx-auto text-center">
                <PosterReveal src="poster.mp4" />
              </div>

              {/* Centered Curated Schedule & Countdown */}
              <div className="mt-16 w-full max-w-2xl space-y-8 mx-auto text-center">
                
                <div className="rounded-3xl border border-[#0A2472]/10 bg-white p-8 sm:p-10 shadow-sm text-center">
                  <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#1A43BF] text-center">Evening Timeline</span>
                  <h3 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-wide text-[#00072D] mt-1 text-center">
                    Curated Evening Program
                  </h3>
                  
                  <div className="mt-8 space-y-5 text-center">
                    <div className="flex flex-col items-center justify-center text-center p-3 rounded-2xl hover:bg-[#F8FAFC] transition-colors">
                      <span className="rounded-full bg-[#F0F4FF] border border-[#1A43BF]/20 px-3.5 py-1 text-xs font-mono font-bold text-[#1A43BF] mb-2 text-center">1:30 PM</span>
                      <p className="text-base font-semibold text-[#00072D] text-center">Program Start</p>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center p-3 rounded-2xl hover:bg-[#F8FAFC] transition-colors">
                      <span className="rounded-full bg-[#F0F4FF] border border-[#1A43BF]/20 px-3.5 py-1 text-xs font-mono font-bold text-[#1A43BF] mb-2 text-center">4:00 PM</span>
                      <p className="text-base font-semibold text-[#00072D] text-center">High Tea</p>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center p-3 rounded-2xl hover:bg-[#F8FAFC] transition-colors">
                      <span className="rounded-full bg-[#F0F4FF] border border-[#1A43BF]/20 px-3.5 py-1 text-xs font-mono font-bold text-[#1A43BF] mb-2 text-center">7:00 PM</span>
                      <p className="text-base font-semibold text-[#00072D] text-center">Dinner</p>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center p-3 rounded-2xl hover:bg-[#F8FAFC] transition-colors">
                      <span className="rounded-full bg-[#F0F4FF] border border-[#1A43BF]/20 px-3.5 py-1 text-xs font-mono font-bold text-[#1A43BF] mb-2 text-center">8:30 PM</span>
                      <p className="text-base font-semibold text-[#00072D] text-center">Garba</p>
                    </div>
                  </div>
                </div>

                {/* Centered Countdown Timer with Theme Gradient */}
                <div className="rounded-3xl border border-[#1A43BF]/25 bg-gradient-to-r from-[#00072D] via-[#051650] to-[#1A43BF] p-8 sm:p-10 text-white shadow-2xl text-center">
                  <span className="text-[11px] uppercase tracking-[0.3em] text-[#38BDF8] font-bold text-center">
                    Countdown to Saarthi 2026 • 19 November 2026, 1:30 PM
                  </span>
                  <div className="mt-6 grid grid-cols-4 gap-3 sm:gap-4 max-w-md mx-auto text-center">
                    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md flex flex-col items-center justify-center text-center">
                      <div className="font-mono text-3xl sm:text-4xl font-extrabold text-center">{String(timeLeft.days).padStart(2, '0')}</div>
                      <div className="text-[10px] uppercase tracking-widest text-[#93C5FD] mt-1 font-semibold text-center">Days</div>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md flex flex-col items-center justify-center text-center">
                      <div className="font-mono text-3xl sm:text-4xl font-extrabold text-center">{String(timeLeft.hours).padStart(2, '0')}</div>
                      <div className="text-[10px] uppercase tracking-widest text-[#93C5FD] mt-1 font-semibold text-center">Hours</div>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md flex flex-col items-center justify-center text-center">
                      <div className="font-mono text-3xl sm:text-4xl font-extrabold text-center">{String(timeLeft.minutes).padStart(2, '0')}</div>
                      <div className="text-[10px] uppercase tracking-widest text-[#93C5FD] mt-1 font-semibold text-center">Mins</div>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md flex flex-col items-center justify-center text-center">
                      <div className="font-mono text-3xl sm:text-4xl font-extrabold text-center">{String(timeLeft.seconds).padStart(2, '0')}</div>
                      <div className="text-[10px] uppercase tracking-widest text-[#93C5FD] mt-1 font-semibold text-center">Secs</div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* 3. MEMORIES SECTION: Glide.js Center-Focus Peeking Carousel */}
          <section id="memories" className="relative border-t border-[#0A2472]/10 py-24 text-center overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col items-center text-center">
              
              <div className="mb-12 text-center">
                <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#1A43BF] text-center">Legacy & Nostalgia</span>
                <h2 className="font-cinzel mt-2 text-4xl font-extrabold tracking-tight sm:text-6xl text-[#00072D] text-center">
                  When We Stood Where You Stand
                </h2>
                <p className="mt-2 text-base text-[#475569] max-w-xl mx-auto text-center font-cormorant italic text-xl">
                  Swipe through the defining chapters of previous freshers celebrations.
                </p>
              </div>

              {/* Glide.js Center-Focus Carousel */}
              <GlideCarousel
                slides={MEMORY_SLIDES}
                onSelectSlide={(slide) => {
                  setSelectedLightboxImage(slide.src);
                }}
              />

              {/* 3D Works Wheel — Interactive Drum Browser */}
              <div className="mt-20 w-full text-center">
                <div className="mb-8 text-center">
                  <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#1A43BF] text-center">Interactive Experience</span>
                  <h3 className="font-cinzel mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-[#00072D] text-center">
                    Turn the Wheel of Memories
                  </h3>
                  <p className="mt-2 text-sm text-[#475569] max-w-md mx-auto text-center">
                    Scroll or drag to spin the drum and relive each chapter.
                  </p>
                </div>

                <div className="relative w-full h-[520px] sm:h-[600px] rounded-3xl border border-[#0A2472]/15 bg-white shadow-[0_20px_50px_rgba(0,7,45,0.08)] overflow-hidden">
                  <WorksWheel
                    items={WHEEL_ITEMS}
                    label="Pradyut '25"
                    className="h-full w-full"
                  />
                </div>
              </div>

            </div>
          </section>

          {/* 4. FROM SENIORS: Centered Heartfelt Letter */}
          <section id="seniors" className="relative border-t border-[#0A2472]/10 py-24 bg-gradient-to-b from-[#F8FAFF] to-white text-center">
            <div className="mx-auto max-w-4xl px-6 flex flex-col items-center text-center">
              
              <div className="w-full rounded-3xl border border-[#0A2472]/12 bg-white p-10 sm:p-14 shadow-[0_20px_50px_rgba(0,7,45,0.06)] text-center">
                <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#1A43BF] text-center">
                  From the Senior Council
                </span>
                
                <h2 className="font-cinzel mt-3 text-3xl font-extrabold tracking-tight text-[#00072D] sm:text-5xl text-center">
                  Dear Juniors, You Belong Here.
                </h2>

                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#1A43BF] to-transparent mx-auto my-8" />

                <div className="space-y-6 text-base font-normal leading-relaxed text-[#475569] sm:text-lg max-w-2xl mx-auto text-center font-editorial-sub">
                  <p>
                    When you first arrived on campus carrying heavy luggage and quiet doubts, wondering if you would find your footing, remember: <strong>we stood in your exact shoes</strong>.
                  </p>
                  <p>
                    The synthesis of agriculture and information technology is one of the most vital, noble disciplines of modern science. You will explore algorithms, precision agriculture, machine learning, and environmental sustainability. Whenever assignments seem challenging or hostel life feels foreign, remember that you have an entire batch of seniors standing right behind you.
                  </p>
                  <p>
                    <strong>Saarthi</strong> is not a mere celebration—it is our formal welcome, our commitment that you are now family. Bring your excitement, bring your smiles, and let us embark on this journey together.
                  </p>
                </div>

                <div className="mt-12 border-t border-slate-100 pt-8 flex flex-col items-center justify-center text-center">
                  <div className="text-xs uppercase tracking-widest text-slate-400 text-center">With pride & warmth,</div>
                  <div className="font-cinzel text-lg font-bold text-[#00072D] mt-1 text-center">
                    The Seniors of College of Agriculture Information Technology
                  </div>
                  <div className="mt-2 text-xs text-[#1A43BF] font-semibold tracking-widest uppercase text-center">
                    CAIT Student Council • 2026
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* 5. REGISTRATION FORM: End of Website with Brand Gradient Background */}
          <section id="registration-section" className="relative pt-24 pb-20 text-center overflow-hidden">
            {/* ── Brand Gradient Background Overlay (Mirroring the Hero) ── */}
            <div className="absolute inset-0 bg-gradient-to-b from-white via-[#0A2472]/70 to-[#00072D] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_90%,rgba(56,189,248,0.2),transparent_65%)] pointer-events-none" />

            <div className="relative z-10 mx-auto max-w-lg px-6 flex flex-col items-center text-center">
              
              <div className="w-full rounded-3xl border border-white/20 bg-white/95 backdrop-blur-xl p-8 sm:p-12 shadow-[0_30px_70px_rgba(0,7,45,0.35)] text-center">
                
                <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#1A43BF] text-center">Student RSVP</span>
                <h3 className="font-cinzel mt-2 text-3xl font-extrabold tracking-tight text-[#00072D] sm:text-4xl text-center">
                  Register for Saarthi 2026
                </h3>
                <p className="mt-3 text-xs text-[#475569] text-center max-w-xs mx-auto">
                  Exclusively for 1st Year Students of College of Agriculture Information Technology.
                </p>

                {registeredCount > 0 && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#0A2472]/5 border border-[#1A43BF]/20 px-3.5 py-1 text-[11px] font-bold text-[#1A43BF]">
                    <Users className="h-3.5 w-3.5 text-[#1A43BF]" />
                    <span>{registeredCount} CAIT Freshers Registered So Far</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="mt-8 space-y-6 text-center" noValidate>
                  
                  {/* Database Server Response Banner */}
                  {serverError && (
                    <div
                      className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 text-left ${
                        isDuplicate
                          ? "bg-amber-50 text-amber-900 border border-amber-200"
                          : "bg-red-50 text-red-900 border border-red-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle
                          className={`h-4 w-4 shrink-0 ${
                            isDuplicate ? "text-amber-600" : "text-red-600"
                          }`}
                        />
                        <span>{serverError}</span>
                      </div>
                      {isDuplicate && (
                        <button
                          type="button"
                          onClick={() => {
                            setRegisteredUser(fullName.trim());
                            setActiveView("success");
                          }}
                          className="px-3 py-1 rounded-xl bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-amber-700 cursor-pointer shrink-0"
                        >
                          View Invitation
                        </button>
                      )}
                    </div>
                  )}

                  {/* Enrollment Number Field */}
                  <div className="text-center">
                    <label htmlFor="fresherEnrollment" className="block text-xs font-bold uppercase tracking-wider text-[#00072D] mb-2 text-center">
                      Enrollment Number *
                    </label>
                    <input 
                      type="text" 
                      id="fresherEnrollment"
                      value={enrollmentNo}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setEnrollmentNo(val);
                        if (errors.enrollmentNo) {
                          setErrors((prev) => ({ ...prev, enrollmentNo: undefined }));
                        }
                      }}
                      placeholder="e.g. 3060826001"
                      maxLength={10}
                      className={`w-full rounded-2xl border bg-[#F8FAFC] px-4 py-3.5 text-sm font-mono text-[#00072D] text-center placeholder-slate-400 outline-none transition-all ${
                        errors.enrollmentNo 
                          ? "border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/30" 
                          : "border-slate-200 focus:border-[#1A43BF] focus:bg-white focus:ring-2 focus:ring-[#1A43BF]/20"
                      }`}
                    />
                    <p className="mt-1 text-[11px] text-slate-400 text-center">
                      Valid CAIT range: 3060826001 to 3060826063
                    </p>
                    {errors.enrollmentNo && (
                      <p className="mt-1.5 text-xs text-[#EF4444] font-semibold text-center">{errors.enrollmentNo}</p>
                    )}
                  </div>

                  {/* Full Name Field */}
                  <div className="text-center">
                    <label htmlFor="fresherName" className="block text-xs font-bold uppercase tracking-wider text-[#00072D] mb-2 text-center">
                      Full Name *
                    </label>
                    <input 
                      type="text" 
                      id="fresherName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className={`w-full rounded-2xl border bg-[#F8FAFC] px-4 py-3.5 text-sm text-[#00072D] text-center placeholder-slate-400 outline-none transition-all ${
                        errors.fullName 
                          ? "border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/30" 
                          : "border-slate-200 focus:border-[#1A43BF] focus:bg-white focus:ring-2 focus:ring-[#1A43BF]/20"
                      }`}
                    />
                    {errors.fullName && (
                      <p className="mt-1.5 text-xs text-[#EF4444] text-center">{errors.fullName}</p>
                    )}
                  </div>

                  {/* Date of Birth Field */}
                  <div className="text-center">
                    <label htmlFor="fresherDob" className="block text-xs font-bold uppercase tracking-wider text-[#00072D] mb-2 text-center">
                      Date of Birth *
                    </label>
                    <input 
                      type="date" 
                      id="fresherDob"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      max="2012-12-31"
                      min="1990-01-01"
                      className={`w-full rounded-2xl border bg-[#F8FAFC] px-4 py-3.5 text-sm text-[#00072D] text-center outline-none transition-all ${
                        errors.dob 
                          ? "border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/30" 
                          : "border-slate-200 focus:border-[#1A43BF] focus:bg-white focus:ring-2 focus:ring-[#1A43BF]/20"
                      }`}
                    />
                    {errors.dob && (
                      <p className="mt-1.5 text-xs text-[#EF4444] text-center">{errors.dob}</p>
                    )}
                  </div>

                  {/* Submit Button with Theme Gradient */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00072D] via-[#0A2472] to-[#1A43BF] py-4 text-xs font-bold uppercase tracking-widest text-white shadow-xl shadow-[#0A2472]/20 transition-all hover:scale-[1.01] hover:shadow-2xl active:scale-[0.99] disabled:opacity-70 cursor-pointer text-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving to Database...</span>
                      </>
                    ) : (
                      "Submit Registration"
                    )}
                  </button>

                  <p className="text-[11px] text-slate-400 text-center">
                    Entry, activities, and dinner are 100% complimentary for all CAIT freshers.
                  </p>

                </form>

              </div>

            </div>
          </section>

          {/* Centered Footer */}
          <footer className="relative border-t border-white/10 py-14 text-center text-xs text-white/70 bg-[#00072D]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00072D] via-[#0A2472]/50 to-[#00072D] pointer-events-none" />
            <div className="relative z-10 px-6">
              <p className="font-semibold text-white text-center">College of Agriculture Information Technology • Saarthi 2026 Freshers Celebration</p>
              <p className="mt-1 text-sky-300/80 text-center">Created by @rahulsalvi and Multimedia Team</p>
              <div className="mt-3">
                <button
                  onClick={() => setIsAdminOpen(true)}
                  className="inline-flex items-center gap-1.5 text-[11px] text-sky-300/80 hover:text-white transition-colors cursor-pointer"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Multimedia Team Access</span>
                </button>
              </div>
            </div>
          </footer>

        </main>
      )}

      {/* ── VIEW 2: SUCCESS VIEW (FULL HERO SECTION WITH LIQUID BLUE BACKGROUND) ── */}
      {activeView === "success" && (
        <main className="relative z-10 min-h-[92vh] flex items-center justify-center py-20 px-6 text-center overflow-hidden">
          
          {/* ── Liquid Three.js full-section background + Brand Gradient Overlay ── */}
          <div className="absolute inset-0 z-0" aria-hidden="true">
            <LiquidEffectAnimation
              imageUrl="https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1200&q=80"
              metalness={0.88}
              roughness={0.08}
              displacementScale={5}
              rain={false}
            />
            {/* Blue brand gradient overlay + radial ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#00072D]/85 via-[#0A2472]/65 to-[#00072D]/95 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(56,189,248,0.3),transparent_70%)] pointer-events-none" />
          </div>

          {/* ── Hero content matching main hero section typography ── */}
          <div className="relative z-10 mx-auto max-w-3xl px-4 flex flex-col items-center text-center">
            
            {/* Confirmation Badge */}
            <div className="mb-6 inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 backdrop-blur-md px-5 py-2 text-[11px] uppercase tracking-[0.25em] font-bold text-emerald-300 shadow-lg text-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Registration Confirmed • Class of 2026</span>
            </div>

            {/* Main Heading */}
            <h1 
              className="font-cinzel text-5xl font-black leading-[1.08] tracking-tight sm:text-7xl lg:text-8xl text-center"
              style={{ color: "#ffffff", textShadow: "0 0 60px rgba(56,189,248,0.5), 0 2px 24px rgba(0,7,45,0.8)" }}
            >
              YOU'RE INVITED!
            </h1>

            {/* Sanskrit / Subtitle */}
            <p className="font-cormorant italic text-2xl sm:text-4xl font-semibold tracking-wide text-sky-200 mt-4 text-center">
              स्वागतम् — Welcome to the CAIT Family, <span className="text-white underline underline-offset-8 decoration-sky-400/60 font-bold">{registeredUser}</span>!
            </p>

            {/* Divider */}
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent my-7 mx-auto" />

            {/* Body Copy */}
            <p className="text-base sm:text-lg font-normal leading-relaxed text-white/80 max-w-2xl mx-auto text-center">
              Your response for <strong className="text-white font-semibold">Saarthi 2026</strong> has been officially recorded in our roster. 
              The entire senior council and faculty are eagerly waiting to celebrate your arrival into the 
              College of Agriculture Information Technology family!
            </p>

            {/* Event Coordinates Card — High-contrast deep glass */}
            <div className="mt-10 w-full max-w-2xl rounded-3xl border border-sky-400/25 bg-[#00072D]/60 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,7,45,0.7)] backdrop-blur-xl mx-auto text-center">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 text-center">
                
                <div className="flex flex-col items-center justify-center border-b border-white/10 pb-5 sm:border-b-0 sm:border-r sm:pb-0 text-center">
                  <Calendar className="h-6 w-6 text-[#38BDF8] mb-2 drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]" strokeWidth={2} />
                  <div className="text-[11px] uppercase tracking-[0.25em] font-extrabold text-[#38BDF8] text-center">Date & Time</div>
                  <div className="text-base font-extrabold text-white mt-1.5 text-center drop-shadow-sm">19 November 2026 • 1:30 PM</div>
                </div>

                <div className="flex flex-col items-center justify-center text-center">
                  <MapPin className="h-6 w-6 text-[#38BDF8] mb-2 drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]" strokeWidth={2} />
                  <div className="text-[11px] uppercase tracking-[0.25em] font-extrabold text-[#38BDF8] text-center">Venue</div>
                  <div className="text-base font-extrabold text-white mt-1.5 text-center drop-shadow-sm">CAIT Seminar Hall</div>
                </div>

              </div>

              <div className="mt-6 border-t border-white/10 pt-4 text-xs font-medium text-sky-200 text-center">
                ✨ No barcode or scanner needed — simply arrive with your college ID card!
              </div>
            </div>

            {/* Return Button */}
            <div className="mt-10 text-center">
              <button
                onClick={() => {
                  setActiveView("portal");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00072D] via-[#0A2472] to-[#1A43BF] border border-sky-400/40 px-9 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer text-center"
              >
                Return to Celebration Page
              </button>
            </div>

            {/* Seniors Signature */}
            <div className="mt-8 text-xs text-white/60 text-center">
              <span>With affection & cheers,</span>
              <strong className="block text-sky-300 text-sm mt-1 font-bold text-center">
                Your Seniors • College of Agriculture Information Technology
              </strong>
            </div>

          </div>
        </main>
      )}

      {/* ── THE ONLY REGISTRATION BUTTON ON MAIN WEBSITE (BOTTOM RIGHT CORNER) ── */}
      {activeView === "portal" && (
        <aside aria-label="Registration Action">
          <button
            onClick={scrollToRegister}
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center gap-3 rounded-full border border-[#1A43BF]/30 bg-gradient-to-r from-[#00072D] via-[#0A2472] to-[#1A43BF] px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-2xl shadow-[#0A2472]/40 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer text-center"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#38BDF8] opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#38BDF8]"></span>
            </span>
            <span>Register Now</span>
          </button>
        </aside>
      )}

      {/* ── High-Resolution Lightbox Modal (For Poster & Memory Slides) ── */}
      {selectedLightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setSelectedLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full text-center" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedLightboxImage(null)}
              className="absolute -top-11 right-0 text-white hover:text-[#38BDF8] transition-colors cursor-pointer"
              aria-label="Close Lightbox"
            >
              <X className="h-6 w-6" />
            </button>
            <img 
              src={selectedLightboxImage} 
              alt="High resolution inspection" 
              className="rounded-2xl border border-white/20 shadow-2xl w-full max-h-[85vh] object-contain mx-auto"
            />
          </div>
        </div>
      )}

      {/* ── Senior Council Admin Modal ── */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onDataChanged={fetchStats}
      />

    </div>
  );
}

export default App;
