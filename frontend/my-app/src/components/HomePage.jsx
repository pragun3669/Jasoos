import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, Eye, Code, Play, Users, BarChart3, Zap,
  CheckCircle, ArrowRight, Menu, X,
  ChevronDown, Lock, Camera, Brain, FileText,
   Mail, Monitor
} from 'lucide-react';

// ── Intersection Observer hook ─────────────────────────────────────────────────
const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
};

// ── Nav ────────────────────────────────────────────────────────────────────────
const Nav = ({ onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = ['Features', 'How It Works', 'Tech Stack', 'Contact'];

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-gray-950/96 backdrop-blur-xl border-b border-white/5 shadow-2xl' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('/')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-black text-xl tracking-tight font-display">
              JASOOS<span className="text-emerald-400">.</span>AI
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {links.map(link => (
              <a key={link} href={`#${link.toLowerCase().replace(' ', '-')}`}
                className="text-sm text-gray-400 hover:text-white transition-colors duration-200 font-medium tracking-wide">
                {link}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => onNavigate('/login')}
              className="text-sm text-gray-300 hover:text-white transition-colors font-medium px-4 py-2">
              Educator Login
            </button>
            <button onClick={() => onNavigate('/signup')}
              className="text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/30">
              Get Started
            </button>
          </div>

          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-gray-950 border-t border-white/5 px-6 py-6 space-y-4">
          {links.map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(' ', '-')}`}
              className="block text-gray-300 hover:text-white font-medium py-2"
              onClick={() => setMobileOpen(false)}>
              {link}
            </a>
          ))}
          <div className="pt-4 flex flex-col gap-3">
            <button onClick={() => onNavigate('/login')}
              className="w-full py-3 border border-white/10 rounded-lg text-white font-medium hover:bg-white/5 transition-colors">
              Educator Login
            </button>
            <button onClick={() => onNavigate('/signup')}
              className="w-full py-3 bg-emerald-500 rounded-lg text-white font-semibold hover:bg-emerald-400 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const HomePage = ({ onNavigate }) => {
  const [heroVisible, setHeroVisible] = useState(false);
  const [featuresRef, featuresInView] = useInView(0.1);
  const [howRef, howInView] = useInView(0.15);
  const [techRef, techInView] = useInView(0.1);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // ── Data ───────────────────────────────────────────────────────────────────
  const features = [
    {
      icon: Brain,
      title: 'AI Face Mesh Analysis',
      desc: 'MediaPipe-powered 468-landmark face tracking detects gaze deviation, head pose, and eye closure in real time — entirely client-side, with no video stored.',
      tag: 'Core AI',
      color: 'emerald',
    },
    {
      icon: Monitor,
      title: 'Tab Switch Detection',
      desc: 'Every browser focus change is captured and timestamped. Configurable thresholds allow educators to auto-terminate exams after repeated violations.',
      tag: 'Security',
      color: 'blue',
    },
    {
      icon: Shield,
      title: 'Copy-Paste Prevention',
      desc: 'Clipboard events outside the integrated code editor are intercepted and logged. Both the student and educator receive immediate notification of each attempt.',
      tag: 'Integrity',
      color: 'violet',
    },
    {
      icon: Code,
      title: 'Containerised Code Runner',
      desc: 'Docker-isolated execution environments evaluate C++, Python, Java, and C submissions against hidden test cases, with per-problem time and memory limits.',
      tag: 'Evaluation',
      color: 'amber',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      desc: 'Per-student score breakdowns, test-case pass rates, plagiarism similarity scores, and a full proctoring violation timeline — all accessible in one place.',
      tag: 'Analytics',
      color: 'cyan',
    },
    {
      icon: Zap,
      title: 'AI-Assisted Test Generation',
      desc: 'Generate coding problems, hidden test cases, and model solutions from a topic prompt using Groq-accelerated LLMs — a significant time-saver for faculty.',
      tag: 'AI Tools',
      color: 'pink',
    },
  ];

  const colorMap = {
    emerald: { icon: 'from-emerald-400 to-teal-500',   tag: 'text-emerald-400 bg-emerald-400/10' },
    blue:    { icon: 'from-blue-400 to-indigo-500',    tag: 'text-blue-400 bg-blue-400/10'    },
    violet:  { icon: 'from-violet-400 to-purple-500',  tag: 'text-violet-400 bg-violet-400/10' },
    amber:   { icon: 'from-amber-400 to-orange-500',   tag: 'text-amber-400 bg-amber-400/10'   },
    cyan:    { icon: 'from-cyan-400 to-sky-500',       tag: 'text-cyan-400 bg-cyan-400/10'    },
    pink:    { icon: 'from-pink-400 to-rose-500',      tag: 'text-pink-400 bg-pink-400/10'    },
  };

  const steps = [
    { n: '01', icon: FileText, title: 'Create or Generate a Test',   desc: 'Build coding assessments manually or use AI generation to produce problems, hidden test cases, and model solutions from a topic description.' },
    { n: '02', icon: Users,    title: 'Share the Secure Link',       desc: 'Each test produces a unique, single-use link per student. No account creation is required from the student\'s side.' },
    { n: '03', icon: Camera,   title: 'Proctoring Runs Automatically', desc: 'Face mesh tracking, tab monitoring, and clipboard detection activate automatically once the exam begins — no plugins or downloads needed.' },
    { n: '04', icon: BarChart3, title: 'Review Results Instantly',   desc: 'Scores, submitted code, test-case results, and the complete violation log are available on the educator dashboard the moment a student submits.' },
  ];

  const techStack = [
    { label: 'Frontend',       items: ['React 18', 'Tailwind CSS', 'MediaPipe Face Mesh'] },
    { label: 'Backend',        items: ['Spring Boot 3', 'REST API', 'JWT Authentication'] },
    { label: 'Code Execution', items: ['Docker', 'Isolated Containers', 'Custom Judge'] },
    { label: 'AI / ML',        items: ['Groq LLM API', 'MediaPipe', 'AST Plagiarism Diff'] },
    { label: 'Database',       items: ['PostgreSQL', 'JPA / Hibernate'] },
    { label: 'DevOps',         items: ['Docker Compose', 'GitHub Actions', 'Render / Railway'] },
  ];

  const capabilities = [
    'Real-time face mesh analysis — client-side, no video storage',
    'Tab-switch and focus-loss event logging with timestamps',
    'Clipboard interception outside the code editor',
    'Containerised multi-language code runner (C++, C, Python, Java)',
    'AST-based plagiarism similarity scoring across all submissions',
    'AI-generated problems with auto-created hidden test cases',
    'Per-student violation timeline and score breakdown',
    'Role-based access: Educator and Student portals',
    'JWT-secured API with role-based access control',
  ];

  const faqs = [
    { q: 'Do students need to install anything?', a: 'No. All proctoring runs in the browser using the MediaPipe WebAssembly runtime. Students only need a modern Chromium-based browser and a working webcam.' },
    { q: 'Which programming languages does the code runner support?', a: 'The current build supports C, C++, Python 3, and Java. Each submission runs in an isolated Docker container with configurable time and memory limits.' },
    { q: 'How does plagiarism detection work?', a: 'We compute pairwise similarity scores between all submissions for a given problem using both AST-level structural diffing and surface-level token matching. Results are surfaced in the educator dashboard.' },
    { q: 'Is this a final-year project or a production SaaS?', a: 'Jasoos AI was developed as a final-year B.Tech project. It demonstrates real-world system design — microservices, containerised code execution, and client-side ML — but is not yet a commercial product.' },
    { q: 'How is student data handled?', a: 'No webcam video is ever stored or transmitted. Only derived proctoring signals (gaze angle, eye-aspect ratio, violation events) are logged. All API communication is encrypted in transit via HTTPS.' },
    { q: 'Can I retake a test?', a: 'By default, each test link is single-use per student. Educators can reset attempts from the dashboard.' },
  ];

  return (
    <div className="bg-gray-950 min-h-screen text-white" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Syne:wght@700;800;900&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .section-fade { opacity: 0; transform: translateY(28px); transition: opacity 0.65s ease, transform 0.65s ease; }
        .section-fade.visible { opacity: 1; transform: translateY(0); }
        .card-hover { transition: transform 0.22s ease, box-shadow 0.22s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 24px 48px rgba(0,0,0,0.4); }
        .gradient-text { background: linear-gradient(135deg, #34d399 0%, #06b6d4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .float { animation: float 6s ease-in-out infinite; }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.4} 100%{transform:scale(1.6);opacity:0} }
        .pulse-ring { animation: pulse-ring 2.2s ease-out infinite; }
        .shimmer-card { position: relative; overflow: hidden; }
        .shimmer-card::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.03),transparent); background-size:200% 100%; animation:shimmer 3.5s infinite; pointer-events:none; }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      `}</style>

      <Nav onNavigate={onNavigate} />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Ambient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] bg-emerald-500/7 rounded-full blur-[130px]" />
          <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[110px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/3 rounded-full blur-[140px]" />
        </div>

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px)', backgroundSize: '80px 80px' }} />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — copy */}
            <div className={`transition-all duration-1000 delay-100 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {/* Project badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/25 bg-emerald-500/8 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-400 tracking-widest uppercase">Final Year B.Tech Project — CSE</span>
              </div>

              <h1 className="font-display text-5xl lg:text-[4.25rem] font-black leading-[1.05] mb-6 tracking-tight">
                Academic Integrity<br />
                <span className="gradient-text">Powered by AI</span>
              </h1>

              <p className="text-[1.05rem] text-gray-400 leading-[1.75] mb-10 max-w-lg font-light">
                Jasoos AI is an end-to-end online examination platform combining real-time face-mesh proctoring,
                containerised code evaluation, and AI-assisted test generation — designed to make academic
                assessments more reliable and transparent.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <button onClick={() => onNavigate('/signup')}
                  className="group flex items-center gap-2 px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/25 text-sm">
                  Educator Sign Up
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => onNavigate('/login')}
                  className="flex items-center gap-2 px-7 py-3.5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white font-medium rounded-xl transition-all duration-200 text-sm hover:bg-white/5">
                  <Play className="w-4 h-4" />
                  Educator Login
                </button>
              </div>

              {/* Honest sub-claims */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                {['No video stored — privacy first', 'Browser-native, no plugins', 'Open source on GitHub'].map(t => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — UI mockup */}
            <div className={`transition-all duration-1000 delay-300 ${heroVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div className="relative float">
                <div className="bg-gray-900 border border-white/8 rounded-2xl p-6 shadow-2xl shimmer-card">
                  {/* Window chrome */}
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                    <span className="ml-3 text-xs text-gray-600 font-mono">jasoos.ai / exam / cs301-endsem</span>
                  </div>

                  {/* Proctoring feed */}
                  <div className="relative bg-gray-950 rounded-xl overflow-hidden mb-4 h-40">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 to-teal-950/10" />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs text-red-400 font-mono font-bold tracking-widest">LIVE PROCTORING</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-2 border-emerald-400/70 flex items-center justify-center">
                          <Users className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div className="absolute inset-0 rounded-full border-2 border-emerald-400/50 pulse-ring" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between text-xs font-mono text-emerald-400/80">
                      <span>✓ FACE DETECTED</span>
                      <span>EAR: 0.31</span>
                      <span>YAW: 2.1°</span>
                    </div>
                  </div>

                  {/* Violation counters */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Tab Switches', val: '0', color: 'text-emerald-400' },
                      { label: 'Paste Attempts', val: '1', color: 'text-amber-400' },
                      { label: 'Time Left', val: '34:12', color: 'text-blue-400' },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-800/50 rounded-lg p-3 text-center">
                        <div className={`text-xl font-black font-display ${s.color}`}>{s.val}</div>
                        <div className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Code snippet */}
                  <div className="bg-gray-950 rounded-lg p-4 font-mono text-xs leading-relaxed">
                    <div className="text-gray-600 mb-1.5"> Q2 — Two Sum (C++)</div>
                    <div>
                      <span className="text-blue-400">vector</span>
                      <span className="text-white">&lt;</span>
                      <span className="text-blue-400">int</span>
                      <span className="text-white">&gt; twoSum(</span>
                      <span className="text-blue-400">vector</span>
                      <span className="text-white">&lt;</span>
                      <span className="text-blue-400">int</span>
                      <span className="text-white">&gt;&amp; nums, </span>
                      <span className="text-blue-400">int</span>
                      <span className="text-white"> target) {'{'}</span>
                    </div>
                    <div className="ml-4">
                      <span className="text-purple-400">unordered_map</span>
                      <span className="text-white">&lt;</span>
                      <span className="text-blue-400">int</span>
                      <span className="text-white">, </span>
                      <span className="text-blue-400">int</span>
                      <span className="text-white">&gt; mp;</span>
                    </div>
                    <div className="ml-4 text-gray-600">... 4 / 5 test cases passing</div>
                    <div className="text-white">{'}'}</div>
                  </div>
                </div>

                {/* Floating: violation badge */}
                <div className="absolute -top-3 -right-3 bg-amber-500 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  ⚠ Paste Attempt Logged
                </div>

                {/* Floating: score */}
                <div className="absolute -bottom-4 -left-4 bg-gray-800 border border-white/10 rounded-xl p-3 shadow-xl">
                  <div className="text-xs text-gray-400 mb-0.5">Score</div>
                  <div className="text-2xl font-black text-emerald-400 font-display">80</div>
                  <div className="text-xs text-gray-500">/ 100 pts</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-gray-600" />
        </div>
      </section>

      {/* ── WHAT IT DOES (replaces fake stats) ──────────────────────────────── */}
      <section className="py-16 border-y border-white/5 bg-gray-900/30">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-bold tracking-widest text-gray-500 uppercase mb-10">
            Core Capabilities
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {capabilities.map((cap, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-gray-300 font-light leading-snug">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                {cap}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="features" ref={featuresRef} className="py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className={`text-center mb-20 section-fade ${featuresInView ? 'visible' : ''}`}>
            <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-4 block">Platform Features</span>
            <h2 className="font-display text-5xl lg:text-[3.5rem] font-black mb-5 tracking-tight leading-tight">
              Built for Academic Integrity.<br />
              <span className="gradient-text">Not as an Afterthought.</span>
            </h2>
            <p className="text-gray-400 text-base max-w-2xl mx-auto font-light leading-relaxed">
              Every component was designed from the ground up to address the specific challenges of conducting fair, online coding assessments.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              const c = colorMap[f.color];
              return (
                <div key={i}
                  className={`card-hover relative bg-gray-900 border border-white/5 hover:border-white/10 rounded-2xl p-8 section-fade ${featuresInView ? 'visible' : ''}`}
                  style={{ transitionDelay: `${i * 75}ms` }}>
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold mb-5 ${c.tag}`}>
                    {f.tag}
                  </div>
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.icon} flex items-center justify-center mb-5 shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-3 leading-snug">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed font-light">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how-it-works" ref={howRef} className="py-32 bg-gray-900/35 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className={`text-center mb-20 section-fade ${howInView ? 'visible' : ''}`}>
            <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-4 block">Workflow</span>
            <h2 className="font-display text-5xl font-black mb-5 tracking-tight leading-tight">
              From Setup to<br /><span className="gradient-text">Proctored Exam</span> in Minutes
            </h2>
            <p className="text-gray-400 text-base max-w-xl mx-auto font-light leading-relaxed">
              The complete examination flow — from test creation to result review — is consolidated into four straightforward steps.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className={`relative section-fade ${howInView ? 'visible' : ''}`} style={{ transitionDelay: `${i * 110}ms` }}>
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-emerald-500/30 to-transparent z-10" />
                  )}
                  <div className="bg-gray-900 border border-white/5 rounded-2xl p-7 h-full">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="text-5xl font-black text-white/5 font-display leading-none select-none">{s.n}</div>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <h3 className="font-bold text-white text-base mb-3 leading-snug">{s.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed font-light">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ──────────────────────────────────────────────────────── */}
      <section id="tech-stack" ref={techRef} className="py-32">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className={`text-center mb-16 section-fade ${techInView ? 'visible' : ''}`}>
            <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-4 block">Technology</span>
            <h2 className="font-display text-5xl font-black mb-5 tracking-tight">
              The Stack Behind <span className="gradient-text">Jasoos AI</span>
            </h2>
            <p className="text-gray-400 text-base font-light leading-relaxed max-w-xl mx-auto">
              A carefully chosen combination of proven open-source technologies, selected to demonstrate full-stack system design with real-world constraints.
            </p>
          </div>

          <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-5 section-fade ${techInView ? 'visible' : ''}`}>
            {techStack.map((layer, i) => (
              <div key={i} className="card-hover bg-gray-900 border border-white/5 hover:border-emerald-500/20 rounded-2xl p-6" style={{ transitionDelay: `${i * 70}ms` }}>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">{layer.label}</div>
                <ul className="space-y-2">
                  {layer.items.map(item => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-gray-300 font-light">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* GitHub CTA */}
          
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section className="py-32 bg-gray-900/35 border-y border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-4 block">FAQ</span>
            <h2 className="font-display text-5xl font-black tracking-tight">Common Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-gray-900 border border-white/5 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left group"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-medium text-white text-sm group-hover:text-emerald-400 transition-colors pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 flex-shrink-0 ${openFaq === i ? 'rotate-180 text-emerald-400' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4 font-light">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ─────────────────────────────────────────────────────────── */}
      <section id="contact" className="py-32">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-4 block">Contact</span>
              <h2 className="font-display text-5xl font-black mb-6 tracking-tight leading-tight">
                Get in Touch<br /><span className="gradient-text">About the Project</span>
              </h2>
              <p className="text-gray-400 mb-10 leading-relaxed text-[0.95rem] font-light">
                Interested in a demo, collaboration, or feedback? We're happy to connect with educators,
                developers, or anyone curious about what we've built.
              </p>
              <div className="space-y-5">
                {[
                  { icon: Mail,      label: 'Email',   val: 'pragun2424@gmail.com' },
                ].map(c => {
                  const Icon = c.icon;
                  return (
                    <div key={c.label} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center">
                        <Icon className="w-4.5 h-4.5 text-emerald-400" style={{ width: '1.1rem', height: '1.1rem' }} />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">{c.label}</div>
                        <div className="text-white font-medium text-sm">{c.val}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contact form — no <form> tag per guidelines; use div + handlers */}
            <div className="bg-gray-900 border border-white/5 rounded-2xl p-8 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                {['First Name', 'Last Name'].map(f => (
                  <div key={f}>
                    <label className="text-xs text-gray-400 mb-1.5 block font-medium">{f}</label>
                    <input className="w-full bg-gray-800 border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/40 transition-colors" placeholder={f} />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Email Address</label>
                <input type="email" className="w-full bg-gray-800 border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/40 transition-colors" placeholder="you@example.com" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Institution or Organisation</label>
                <input className="w-full bg-gray-800 border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/40 transition-colors" placeholder="e.g. JIIT Noida, IIT Delhi" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Message</label>
                <textarea rows={4} className="w-full bg-gray-800 border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/40 transition-colors resize-none" placeholder="What would you like to discuss?" />
              </div>
              <button
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25 text-sm">
                Send Message
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-700" />
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <div className="relative max-w-3xl mx-auto text-center px-6">
          <h2 className="font-display text-5xl lg:text-[3.25rem] font-black text-white mb-5 tracking-tight leading-tight">
            Conduct Your First<br />Proctored Exam Today
          </h2>
          <p className="text-emerald-100/80 text-lg mb-10 max-w-lg mx-auto leading-relaxed font-light">
            No installation required. Create an educator account, set up a test, and share a single link — proctoring begins automatically.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button onClick={() => onNavigate('/signup')}
              className="group flex items-center gap-2 bg-white text-emerald-700 hover:bg-gray-50 font-bold px-9 py-3.5 rounded-xl transition-all hover:shadow-xl text-sm">
              Create Educator Account
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => onNavigate('/login')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/18 text-white font-medium px-9 py-3.5 rounded-xl border border-white/25 transition-all text-sm">
              <Lock className="w-4 h-4" />
              Educator Login
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-950 border-t border-white/5 pt-16 pb-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mb-14">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-black text-xl text-white tracking-tight">
                  JASOOS<span className="text-emerald-400">.</span>AI
                </span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed max-w-xs mb-2 font-light">
                A final-year B.Tech CSE project exploring AI-assisted exam integrity.
              </p>
              <p className="text-gray-700 text-xs mb-6">
                Built with Spring Boot · React · MediaPipe · Docker
              </p>
            </div>

            {[
              { title: 'Project',   links: ['Features', 'How It Works', 'Tech Stack', 'GitHub'] },
              { title: 'Legal',     links: ['Privacy Policy', 'Terms of Use', 'Cookie Policy'] },
            ].map(col => (
              <div key={col.title}>
                <div className="text-xs font-bold text-white/60 uppercase tracking-widest mb-5">{col.title}</div>
                <ul className="space-y-3">
                  {col.links.map(link => (
                    <li key={link}>
                     <button type="button" className="text-gray-600 hover:text-white text-sm transition-colors font-light">{link}</button> 
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-700 text-xs font-light">
              © 2025 Jasoos AI — Final Year B.Tech Project. All rights reserved.
            </p>
            <div className="flex items-center gap-5 text-xs text-gray-700">
            <button type="button" className="hover:text-white transition-colors">Privacy</button>
            <button type="button" className="hover:text-white transition-colors">Terms</button>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;