import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Shield, 
  Eye, 
  Settings, 
  Monitor, 
  AlertTriangle,
  MessageCircle,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';

const HelpPage = ({ onNavigate }) =>{
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqData = [
    {
      category: 'Getting Started',
      icon: Shield,
      color: 'bg-blue-500',
      questions: [
        {
          id: 1,
          question: 'How do I set up my first proctored exam?',
          answer: 'To create your first proctored exam: 1) Log into your teacher dashboard 2) Click "Create New Exam" 3) Configure exam settings including duration, questions, and proctoring level 4) Set up AI monitoring preferences 5) Generate student access codes 6) Launch the exam when ready.'
        },
        {
          id: 2,
          question: 'What are the system requirements for Jasoos:AI?',
          answer: 'Students need: Chrome/Firefox browser (latest version), webcam and microphone access, stable internet connection (5+ Mbps), and screen sharing permissions. For teachers: Modern web browser, reliable internet, and administrative access to create/monitor exams.'
        },
        {
          id: 3,
          question: 'How do students join a proctored exam?',
          answer: 'Students receive a unique exam code from their teacher. They visit the student portal, enter the code, complete system checks (camera, microphone, screen share), accept proctoring terms, and begin the exam under AI supervision.'
        }
      ]
    },
    {
      category: 'AI Proctoring Features',
      icon: Eye,
      color: 'bg-green-500',
      questions: [
        {
          id: 4,
          question: 'What suspicious activities can Jasoos:AI detect?',
          answer: 'Our AI monitors: eye movement patterns (looking away from screen), multiple faces in frame, suspicious objects, unusual audio activity, tab switching/window changes, copy-paste attempts, mobile device usage, and behavioral anomalies during the exam.'
        },
        {
          id: 5,
          question: 'How accurate is the AI detection system?',
          answer: 'Jasoos:AI achieves 94%+ accuracy in detecting suspicious behavior. The system uses advanced computer vision and machine learning algorithms, continuously learning from global exam data while maintaining strict privacy standards.'
        },
        {
          id: 6,
          question: 'Can the AI system give false positives?',
          answer: 'While rare, false positives may occur (< 6% of cases). Common causes include poor lighting, technical issues, or natural movements. Teachers can review flagged incidents with video evidence and override false alerts.'
        },
        {
          id: 7,
          question: 'What happens when suspicious activity is detected?',
          answer: 'The system immediately alerts teachers via dashboard notifications, timestamps and records the incident with video evidence, may pause the exam for severe violations, and generates detailed reports for review after exam completion.'
        }
      ]
    },
    {
      category: 'Technical Support',
      icon: Settings,
      color: 'bg-yellow-500',
      questions: [
        {
          id: 8,
          question: 'Student camera or microphone not working?',
          answer: 'Troubleshooting steps: 1) Check browser permissions for camera/microphone 2) Ensure no other applications are using the devices 3) Try refreshing the page 4) Clear browser cache and cookies 5) Test with another browser 6) Contact support if issues persist.'
        },
        {
          id: 9,
          question: 'What if a student loses internet connection during exam?',
          answer: 'Jasoos:AI has connection recovery features: automatic progress saving every 30 seconds, grace period for reconnection (5 minutes), ability to resume where left off, and teacher notifications of disconnections with timestamps.'
        },
        {
          id: 10,
          question: 'How do I troubleshoot screen sharing issues?',
          answer: 'Common solutions: enable screen sharing in browser settings, restart browser if sharing stops, check for browser extensions blocking access, ensure students aren\'t using incognito mode, and update to latest browser version.'
        },
        {
          id: 11,
          question: 'Why is the exam running slowly?',
          answer: 'Performance issues may be due to: insufficient internet bandwidth (need 5+ Mbps), too many browser tabs open, outdated browser version, or high system resource usage. Close unnecessary programs and tabs, update browser, or use a different device.'
        }
      ]
    },
    {
      category: 'Privacy & Security',
      icon: Monitor,
      color: 'bg-emerald-500',
      questions: [
        {
          id: 12,
          question: 'How is student data protected?',
          answer: 'We use enterprise-grade encryption (AES-256), data stored in secure cloud infrastructure, GDPR/FERPA compliant processing, automatic data deletion after configurable periods, and no sharing of personal data with third parties.'
        },
        {
          id: 13,
          question: 'Can teachers see students outside of exam time?',
          answer: 'No. Camera and screen monitoring are only active during scheduled exam periods. Teachers cannot access student devices or data outside of proctored exam sessions. All monitoring is clearly disclosed to students.'
        },
        {
          id: 14,
          question: 'Where are exam recordings stored?',
          answer: 'Recordings are stored in encrypted cloud servers with geographical data residency options. Access is restricted to authorized teachers only. Data retention policies can be customized (30-365 days) and automatic deletion ensures compliance.'
        }
      ]
    },
    {
      category: 'Exam Management',
      icon: AlertTriangle,
      color: 'bg-red-500',
      questions: [
        {
          id: 15,
          question: 'How do I review flagged incidents?',
          answer: 'Access your teacher dashboard, go to "Exam Reports", select the specific exam, review incident timeline with timestamps, watch video evidence for each alert, and mark incidents as valid or false positive.'
        },
        {
          id: 16,
          question: 'Can I customize proctoring sensitivity?',
          answer: 'Yes, you can adjust: detection sensitivity levels (low, medium, high), specific monitoring features to enable/disable, alert frequency settings, and automatic vs manual intervention preferences for different violation types.'
        },
        {
          id: 17,
          question: 'How do I handle student complaints about proctoring?',
          answer: 'Best practices: review incident evidence thoroughly, consider student\'s explanation and circumstances, check for technical issues during exam time, document decision rationale, and provide clear communication about the resolution.'
        }
      ]
    }
  ];

  const filteredFaqs = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
           q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

 
  const handleContactSupport = () => {
    console.log('Contact support clicked');
    alert('Redirecting to support chat...');
  };

  const handleQuickLink = (title) => {
    console.log(`${title} clicked`);
    alert(`Opening ${title}...`);
  };

  const handleLiveChat = () => {
    console.log('Live chat support clicked');
    alert('Opening live chat support...');
  };

  const handleSubmitTicket = () => {
    console.log('Submit ticket clicked');
    alert('Opening support ticket form...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-black">
      {/* Header */}
      <div className="bg-white/50 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                 onClick={() => onNavigate('home')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                  <HelpCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
                  <p className="text-gray-600">Find answers to common questions about Jasoos:AI</p>
                </div>
              </div>
            </div>
            <button 
              onClick={handleContactSupport}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-white px-6 py-2 rounded-lg font-medium transition-all hover:scale-105 flex items-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contact Support</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help topics, features, or issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              title: 'Video Tutorials',
              description: 'Step-by-step guides for common tasks',
              icon: Monitor,
              color: 'bg-blue-500'
            },
            {
              title: 'System Status',
              description: 'Check current service availability',
              icon: Shield,
              color: 'bg-green-500'
            },
            {
              title: 'Contact Support',
              description: '24/7 technical assistance available',
              icon: MessageCircle,
              color: 'bg-purple-500'
            }
          ].map((item, index) => (
            <div 
              key={index} 
              onClick={() => handleQuickLink(item.title)}
              className="bg-gradient-to-br from-white to-gray-50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl p-6 border border-gray-200/50 cursor-pointer group"
            >
              <div className={`${item.color} p-3 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 mb-4">{item.description}</p>
              <div className="flex items-center text-blue-500 hover:text-blue-600 transition-colors">
                <span className="text-sm font-medium">Learn more</span>
                <ExternalLink className="w-4 h-4 ml-2" />
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {filteredFaqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-gradient-to-br from-white to-gray-50 shadow-lg rounded-xl border border-gray-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className={`${category.color} p-2 rounded-lg`}>
                    <category.icon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{category.category}</h2>
                  <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-sm">
                    {category.questions.length} questions
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {category.questions.map((faq) => (
                  <div key={faq.id} className="transition-all duration-200">
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full text-left p-6 hover:bg-gray-50 transition-colors flex items-center justify-between group"
                    >
                      <span className="text-gray-900 font-medium pr-4 group-hover:text-blue-500 transition-colors">
                        {faq.question}
                      </span>
                      {expandedFaq === faq.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                      )}
                    </button>
                    
                    {expandedFaq === faq.id && (
                      <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200">
                        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                          <p className="text-gray-700 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Support Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Still need help?</h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Our support team is available 24/7 to assist you with any questions about Jasoos:AI proctoring system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleLiveChat}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-3 rounded-lg transition-all hover:scale-105 flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Live Chat Support</span>
            </button>
            <button 
              onClick={handleSubmitTicket}
              className="bg-white text-blue-500 font-semibold px-6 py-3 rounded-lg transition-all hover:scale-105 flex items-center justify-center space-x-2"
            >
              <HelpCircle className="w-5 h-5" />
              <span>Submit Ticket</span>
            </button>
          </div>
        </div>

        {/* Search Results Empty State */}
        {searchTerm && filteredFaqs.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any help articles matching "{searchTerm}"
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              Clear search and view all topics
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
export default HelpPage;
