import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Shield,
  Eye,
  Settings,
  Code,
  AlertTriangle,
  MessageCircle,
  ArrowLeft,
  Mail,
  FileText,
  Cpu
} from 'lucide-react';

const HelpPage = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqData = useMemo(() => [
    {
      category: 'Getting Started',
      icon: Shield,
      color: 'emerald',
      questions: [
        {
          id: 1,
          question: 'How do I create my first test?',
          answer: 'After signing in as an educator, go to the dashboard and click "Create Test". You can either build a test manually by adding coding problems one by one, or use the AI generation feature — type a topic (e.g. "Binary Search Trees in C++") and the system will generate problems, hidden test cases, and model solutions automatically. Once created, the test produces a shareable link for students.'
        },
        {
          id: 2,
          question: 'What do students need to take a proctored test?',
          answer: 'Students need a modern Chromium-based browser (Chrome or Edge recommended), a working webcam, and a stable internet connection. No installations, plugins, or extensions are required. The MediaPipe face mesh model runs entirely in the browser via WebAssembly — nothing is downloaded or installed on the student\'s machine.'
        },
        {
          id: 3,
          question: 'How does a student join and start a test?',
          answer: 'The educator shares a unique test link. When the student opens it, they enter their name and roll number, then the system performs a quick webcam check to confirm the camera is accessible. Once that passes, the exam begins and proctoring activates automatically. No account creation is required on the student side.'
        },
        {
          id: 4,
          question: 'Can a student retake a test?',
          answer: 'By default, each test link is single-use per student — once submitted, it cannot be reopened. Educators can reset individual student attempts from the dashboard if a legitimate reason exists (e.g. a genuine technical failure at the start of the exam).'
        }
      ]
    },
    {
      category: 'AI Proctoring',
      icon: Eye,
      color: 'blue',
      questions: [
        {
          id: 5,
          question: 'What exactly does the proctoring system monitor?',
          answer: 'The proctoring system tracks three categories of behaviour in real time. First, face mesh signals derived from the webcam feed: gaze direction (yaw/pitch angles), eye closure (eye aspect ratio), and whether a face is present in frame. Second, browser-level events: tab switches, window focus changes, and visibility API events. Third, clipboard activity: any paste attempt outside the integrated code editor is intercepted and logged with a timestamp.'
        },
        {
          id: 6,
          question: 'Is video of the student ever recorded or stored?',
          answer: 'No. The webcam feed is processed entirely on the client device using MediaPipe WebAssembly. Only the derived numerical signals (gaze angle, eye-aspect ratio, violation events with timestamps) are sent to the server — never any image or video frames. This significantly reduces privacy risk and means no video footage is stored anywhere.'
        },
        {
          id: 7,
          question: 'What triggers a proctoring violation?',
          answer: 'Violations are logged when: the gaze yaw or pitch angle exceeds a configured threshold (indicating the student is looking significantly away from the screen), the eye aspect ratio drops below the eye-closure threshold for a sustained period, no face is detected in frame for more than a few seconds, the browser tab loses focus or a new window is opened, or a clipboard paste event is detected outside the code editor. Each event is timestamped and visible on the educator dashboard.'
        },
        {
          id: 8,
          question: 'Can the proctoring produce false positives?',
          answer: 'Yes, and this is important to understand. The face mesh model works best in good, even lighting and with the webcam at roughly eye level. Poor lighting, extreme camera angles, or wearing glasses can affect gaze angle accuracy. A student thinking while looking slightly away may briefly trigger a gaze violation. Educators should treat the violation log as evidence to review — not as an automatic verdict. Each flagged event includes a timestamp so the educator can cross-reference it with the submitted code and test-case timeline.'
        },
        {
          id: 9,
          question: 'Does the student see any indication that proctoring is active?',
          answer: 'Yes. A clearly visible "LIVE PROCTORING" indicator is shown in the exam interface throughout the session. Students are informed before starting that their gaze, tab activity, and clipboard will be monitored. This transparency is intentional — the goal is deterrence, not surveillance.'
        }
      ]
    },
    {
      category: 'Code Evaluation',
      icon: Code,
      color: 'violet',
      questions: [
        {
          id: 10,
          question: 'Which programming languages does the code runner support?',
          answer: 'The current build supports C, C++17, Python 3, and Java 11. Each language runs inside a dedicated Docker container with a separate base image and compiler/interpreter. Adding new language support requires creating a new Docker image and registering it in the runner configuration.'
        },
        {
          id: 11,
          question: 'How does the code execution work under the hood?',
          answer: 'When a student submits code, it is sent to the backend code-runner service. The service spawns an isolated Docker container with the appropriate language image, compiles (if necessary) and runs the submission against each hidden test case, enforces per-problem time and memory limits, captures stdout, and returns a pass/fail result per test case along with the execution time. The container is destroyed immediately after execution.'
        },
        {
          id: 12,
          question: 'Can student code access the internet or the file system?',
          answer: 'No. Docker containers used for code execution are launched with network access disabled and a read-only filesystem except for a sandboxed temporary directory. This prevents submissions from making network calls, reading other files on the server, or interfering with other running containers.'
        },
        {
          id: 13,
          question: 'How are time limits and memory limits enforced?',
          answer: 'Time limits are enforced using a watchdog timer in the runner service that sends SIGKILL to the container process if execution exceeds the configured duration (default: 2 seconds per test case). Memory limits are enforced via Docker\'s --memory flag. Both limits are configurable per problem when creating a test.'
        },
        {
          id: 14,
          question: 'How does plagiarism detection work?',
          answer: 'After a test closes, the educator can run a plagiarism check from the dashboard. The system computes pairwise similarity scores between all submissions for each problem. Two methods are combined: token-level string matching (similar to MOSS) and an AST-based structural comparison that is more robust to variable renaming and whitespace changes. Results are displayed as a similarity matrix — pairs above a configurable threshold are flagged for review.'
        }
      ]
    },
    {
      category: 'Technical Issues',
      icon: Settings,
      color: 'amber',
      questions: [
        {
          id: 15,
          question: 'The webcam check is failing — what should I do?',
          answer: 'First, confirm that browser permission for the camera has been granted: in Chrome, click the camera icon in the address bar and ensure it is set to "Allow". If another application (e.g. a video call) is using the camera, close it and refresh the page. If the issue persists, try a different browser (Chrome or Edge are best supported). On some systems, antivirus software can block browser camera access — check those settings if all else fails.'
        },
        {
          id: 16,
          question: 'The code editor is not running my submission — what is wrong?',
          answer: 'Check that the correct language is selected in the dropdown before submitting. If the submission appears to hang, the most likely cause is an infinite loop or a submission that exceeds the time limit — the runner will terminate it after the configured limit and report a TLE (Time Limit Exceeded) result. If you are getting a compilation error, read the error output in the results panel carefully; syntax errors are shown there. If submissions are not going through at all, the backend runner service may be unavailable — contact the educator administering the test.'
        },
        {
          id: 17,
          question: 'I switched tabs by accident — will I be disqualified?',
          answer: 'A single accidental tab switch is logged but does not automatically disqualify you. The educator configures the threshold at which an exam is terminated. What matters is the complete violation log visible to the educator after the exam — not a single event in isolation. If you had a genuine technical reason (e.g. needing to check an OS notification), note it and communicate it to your educator after the exam.'
        },
        {
          id: 18,
          question: 'I lost internet connection mid-exam — what happens?',
          answer: 'The code editor retains your written code client-side for the duration of the browser session. If you can reconnect and return to the exam link within the remaining exam window, your written code will still be in the editor. However, connection loss is logged as an event. If a full page reload is required, any code not yet submitted may be lost depending on the browser — this is a known limitation of the current build. Contact your educator immediately if this occurs.'
        }
      ]
    },
    {
      category: 'Privacy & Data',
      icon: AlertTriangle,
      color: 'rose',
      questions: [
        {
          id: 19,
          question: 'What student data is collected and stored?',
          answer: 'The system stores: the student\'s name and roll number (entered at exam start), submitted code, test-case results, and proctoring violation events (each a timestamp plus an event type and associated signal value). No webcam images or video are stored. No biometric data is retained after the session ends — only the derived numerical signals.'
        },
        {
          id: 20,
          question: 'Who can see a student\'s violation log?',
          answer: 'Only the educator who created the test can view the violation log, via their authenticated dashboard. Students do not have access to their own violation log. Access to educator accounts is controlled by JWT-based authentication with role-based access control — no cross-account data access is possible.'
        },
        {
          id: 21,
          question: 'Is this system GDPR or DPDP compliant?',
          answer: 'Jasoos AI is a final-year academic project and has not been independently audited for regulatory compliance. The design choices — no video storage, client-side face processing, minimal data collection — are consistent with privacy-by-design principles. If you are deploying this in an institutional context, consult your institution\'s data protection officer before collecting any student data.'
        }
      ]
    },
    {
      category: 'AI Test Generation',
      icon: Cpu,
      color: 'cyan',
      questions: [
        {
          id: 22,
          question: 'How does AI test generation work?',
          answer: 'When an educator provides a topic prompt (e.g. "Graph traversal algorithms, medium difficulty, C++"), the system sends a structured prompt to the Groq LLM API. The model returns a JSON object containing the problem statement, input/output format, constraints, sample test cases, hidden test cases, and a model solution. The educator can review and edit everything before publishing the test.'
        },
        {
          id: 23,
          question: 'Can I edit the AI-generated problems before publishing?',
          answer: 'Yes. After generation, every field — problem statement, constraints, test cases, time limit, memory limit — is fully editable in the test creation interface before the test is published. The AI output is a starting point, not a final draft.'
        },
        {
          id: 24,
          question: 'What if the AI generates an incorrect model solution?',
          answer: 'This can happen, particularly for problems with non-trivial edge cases. The generated model solution is run against the generated test cases before being saved, but it is not guaranteed to be correct. Educators should review both the problem and the model solution before publishing. The hidden test cases used for student evaluation are independent of the model solution.'
        }
      ]
    }
  ], []);

  const colorMap = {
    emerald: { tag: 'text-emerald-400 bg-emerald-400/10', icon: 'bg-emerald-500/10 text-emerald-400', border: 'border-emerald-500/20', accent: 'border-l-emerald-500' },
    blue:    { tag: 'text-blue-400 bg-blue-400/10',       icon: 'bg-blue-500/10 text-blue-400',       border: 'border-blue-500/20',    accent: 'border-l-blue-500'    },
    violet:  { tag: 'text-violet-400 bg-violet-400/10',   icon: 'bg-violet-500/10 text-violet-400',   border: 'border-violet-500/20',  accent: 'border-l-violet-500'  },
    amber:   { tag: 'text-amber-400 bg-amber-400/10',     icon: 'bg-amber-500/10 text-amber-400',     border: 'border-amber-500/20',   accent: 'border-l-amber-500'   },
    rose:    { tag: 'text-rose-400 bg-rose-400/10',       icon: 'bg-rose-500/10 text-rose-400',       border: 'border-rose-500/20',    accent: 'border-l-rose-500'    },
    cyan:    { tag: 'text-cyan-400 bg-cyan-400/10',       icon: 'bg-cyan-500/10 text-cyan-400',       border: 'border-cyan-500/20',    accent: 'border-l-cyan-500'    },
  };

  const filteredFaqs = useMemo(() =>
    faqData
      .map(cat => ({
        ...cat,
        questions: cat.questions.filter(q =>
          q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }))
      .filter(cat => cat.questions.length > 0),
    [searchTerm, faqData]
  );

  const totalQuestions = faqData.reduce((acc, c) => acc + c.questions.length, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800;900&display=swap');`}</style>

      {/* ── Header ── */}
      <div className="sticky top-0 z-30 border-b border-white/8 bg-gray-950/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-lg hover:bg-white/6 transition-colors text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white leading-none"
                  style={{ fontFamily: "'Syne', sans-serif" }}>Help & Support</h1>
                <p className="text-xs text-gray-500 mt-0.5">{totalQuestions} questions across {faqData.length} topics</p>
              </div>
            </div>
          </div>

          <a
            href="mailto:support@jasoos.ai"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold
              px-4 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-500/25"
          >
            <Mail className="w-4 h-4" />
            Email Support
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-10 space-y-10">

        {/* ── Search ── */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search questions, topics, or keywords…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-gray-900 border border-white/8 rounded-xl text-sm text-white
                placeholder-gray-600 focus:outline-none focus:border-emerald-500/40 transition-colors"
            />
          </div>
          {searchTerm && (
            <p className="text-xs text-gray-600 mt-2 pl-1">
              {filteredFaqs.reduce((a, c) => a + c.questions.length, 0)} result(s) for "{searchTerm}"
              <button onClick={() => setSearchTerm('')} className="ml-2 text-emerald-500 hover:text-emerald-400 transition-colors">
                Clear
              </button>
            </p>
          )}
        </div>

        {/* ── Quick links ── */}
        {!searchTerm && (
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: FileText,    label: 'Documentation',  sub: 'Architecture, API reference, and setup',   href: '#' },
              { icon: MessageCircle, label: 'Report a Bug', sub: 'Open an issue on the GitHub repository',   href: '#' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <a key={i} href={item.href}
                  className="flex items-start gap-4 bg-gray-900 border border-white/6 hover:border-white/12 rounded-2xl p-5
                    transition-all hover:bg-white/3 group">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5
                    group-hover:bg-emerald-500/15 transition-colors">
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-light leading-snug">{item.sub}</p>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* ── FAQ sections ── */}
        {filteredFaqs.length > 0 ? (
          <div className="space-y-5">
            {filteredFaqs.map((cat, ci) => {
              const Icon = cat.icon;
              const c = colorMap[cat.color];
              return (
                <div key={ci} className={`bg-gray-900 border border-white/6 rounded-2xl overflow-hidden`}>
                  {/* Category header */}
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-white/6">
                    <div className={`w-8 h-8 rounded-lg ${c.icon} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold text-white">{cat.category}</h2>
                    <span className={`ml-auto text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${c.tag}`}>
                      {cat.questions.length}
                    </span>
                  </div>

                  {/* Questions */}
                  <div className="divide-y divide-white/5">
                    {cat.questions.map(faq => (
                      <div key={faq.id}>
                        <button
                          onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                          className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left
                            hover:bg-white/3 transition-colors group"
                        >
                          <span className={`text-sm font-medium transition-colors leading-snug
                            ${expandedFaq === faq.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                            {faq.question}
                          </span>
                          <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-all duration-200 text-gray-600
                            ${expandedFaq === faq.id ? 'rotate-180 text-emerald-400' : 'group-hover:text-gray-400'}`} />
                        </button>

                        {expandedFaq === faq.id && (
                          <div className={`px-6 pb-5 border-l-2 mx-6 mb-4 ${c.accent} bg-white/2 rounded-r-xl`}>
                            <p className="text-sm text-gray-400 leading-[1.8] font-light pt-3">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-gray-900 border border-white/8 flex items-center justify-center mx-auto mb-5">
              <Search className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">No results found</h3>
            <p className="text-sm text-gray-500 font-light mb-5">
              No help articles matched "{searchTerm}".
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Clear search and view all topics
            </button>
          </div>
        )}

        {/* ── Footer contact banner ── */}
        {!searchTerm && (
          <div className="bg-gray-900 border border-white/6 rounded-2xl p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-1">
              <h3 className="text-base font-bold text-white mb-1">Couldn't find what you were looking for?</h3>
              <p className="text-sm text-gray-400 font-light leading-relaxed">
                Open a GitHub issue for bug reports, or email us directly for anything else. As this is an academic project, response times may vary.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <a href="mailto:pragun2424@gmail.com"
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400
                  rounded-xl text-sm text-white transition-all font-semibold hover:shadow-lg hover:shadow-emerald-500/25">
                <Mail className="w-4 h-4" />
                Send Email
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpPage;