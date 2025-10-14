import React, { useState, useEffect } from 'react';
import { Shield, Eye, Code,ShieldCheck, Play, Users, BarChart3, Zap, CheckCircle, ArrowRight, Globe, Clock, Layers } from 'lucide-react';

const HomePage = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 6);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  const features = [
    {
      icon: Eye,
      title: "AI-Powered Proctoring",
      description: "Integrated OpenCV and PyTorch models continuously monitor the student's face, gaze, and environment to detect suspicious activity in real time.",
      gradient: "from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700",
      iconBg: "bg-gradient-to-br from-emerald-400 to-teal-500",
      iconColor: "text-white"
    },
    {
      icon: Code,
      title: "Automated Test Evaluation",
      description: "Spring Boot backend and containerized code execution automatically compile and evaluate student code against real test cases — no manual checking needed.",
      gradient: "from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700",
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      iconColor: "text-white"
    },
    {
      icon: Shield,
      title: "Cheating Prevention",
      description: "Real-time browser monitoring detects tab switches, copy-paste attempts, and unusual webcam behavior to ensure a cheating-free test environment.",
      gradient: "from-violet-50 to-purple-50 dark:from-gray-800 dark:to-gray-700",
      iconBg: "bg-gradient-to-br from-violet-500 to-purple-600",
      iconColor: "text-white"
    },
    {
      icon: Users,
      title: "Teacher Dashboard",
      description: "Teachers can easily create, assign, and review coding tests with detailed analytics, submission history, and AI-evaluated student performance.",
      gradient: "from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-700",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
      iconColor: "text-white"
    },
    {
      icon: BarChart3,
      title: "Detailed Analytics",
      description: "Comprehensive result dashboards visualize each student’s code accuracy, efficiency, and test behavior for transparent evaluation.",
      gradient: "from-cyan-50 to-sky-50 dark:from-gray-800 dark:to-gray-700",
      iconBg: "bg-gradient-to-br from-cyan-500 to-sky-600",
      iconColor: "text-white"
    },
    {
      icon: Zap,
      title: "Seamless Integration",
      description: "Built with a modular MERN + Spring Boot architecture, easily extendable for LMS systems or institutional portals through RESTful APIs.",
      gradient: "from-pink-50 to-rose-50 dark:from-gray-800 dark:to-gray-700",
      iconBg: "bg-gradient-to-br from-pink-500 to-rose-600",
      iconColor: "text-white"
    }
  ];
  
  const capabilities = [
    {
      icon: Globe,
      title: "Scalable Infrastructure",
      description: "Microservice-based Spring Boot backend with concurrent code evaluation supporting 1,000+ active students in real time."
    },
    {
      icon: Clock,
      title: "Real-Time Feedback",
      description: "Instant code execution results and AI-based behavior monitoring ensure quick feedback for students and teachers."
    },
    {
      icon: ShieldCheck,
      title: "Secure and Reliable",
      description: "JWT authentication, HTTPS, and role-based access control ensure data integrity and secure exam management."
    },
    {
      icon: Layers,
      title: "Modular and Extensible",
      description: "Easily customizable modules for test creation, student management, and AI proctoring to adapt to any institution’s needs."
    }
  ];
  
  const techStack = [
    { name: "Frontend", tech: "React + Tailwind CSS" },
    { name: "Backend", tech: "Spring Boot + RESTful APIs" },
    { name: "AI/Proctoring", tech: "OpenCV + PyTorch" },
    { name: "Code Execution", tech: "Dockerized Runner Environment" },
    { name: "Database", tech: "MySQL + Hibernate ORM" },
    { name: "Security", tech: "JWT Authentication + HTTPS" }
  ];
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-400/20 via-teal-400/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-0 -left-40 w-96 h-96 bg-gradient-to-br from-violet-400/20 via-purple-400/20 to-fuchsia-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
        <div className="absolute top-1/3 left-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/10 via-indigo-400/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }}></div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="mb-8">
              <img 
                src="/Your paragraph text (1).png" 
                alt="Jasoos Logo" 
                className="h-20 w-auto mx-auto mb-6 hover:scale-110 transition-transform duration-500"
              />
            </div>
            
            <div className="inline-block mb-6">
              <span className="px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-full text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Next-Generation Proctoring Technology
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
              <span className="inline-block animate-fade-in-up">Intelligent Exam</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent inline-block animate-fade-in-up delay-200">
                Proctoring System
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto animate-fade-in-up delay-400 leading-relaxed">
              Enterprise-grade AI monitoring platform delivering real-time behavioral analysis, 
              comprehensive security controls, and actionable insights for academic institutions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-600">
              <button
                onClick={() => onNavigate('/login')}
                className="group relative bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold px-10 py-5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/50 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <Play className="w-5 h-5 mr-2" />
                  Access Platform
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Capabilities Grid */}
      <div className="py-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Enterprise-Grade Infrastructure
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Built on modern cloud architecture with industry-leading performance and reliability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {capabilities.map((capability, index) => {
              const IconComponent = capability.icon;
              return (
                <div 
                  key={index}
                  className="group bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1"
                >
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {capability.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {capability.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Core Features */}
      <div className="py-24 bg-white dark:bg-gray-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Advanced Monitoring Capabilities
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Comprehensive suite of AI-powered tools for maintaining examination integrity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              const isActive = activeFeature === index;
              
              return (
                <div 
                  key={index}
                  className={`relative bg-gradient-to-br ${feature.gradient} p-8 rounded-2xl transition-all duration-500 cursor-pointer group hover:shadow-2xl ${
                    isActive ? 'ring-2 ring-emerald-500 scale-105 shadow-2xl' : 'hover:scale-105'
                  }`}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <div className={`${feature.iconBg} p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <IconComponent className={`w-8 h-8 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className={`mt-6 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transform origin-left transition-transform duration-500 ${
                    isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`}></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Powered by Advanced Technology
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Industry-leading tools and frameworks for optimal performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {techStack.map((item, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300 hover:shadow-lg group"
              >
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                  {item.name}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                  {item.tech}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-32 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2djhoOHYtOGgtOHptMTQgMHY4aDh2LThoLTh6TTIyIDMwdjhoOHYtOGgtOHptMTQgMHY4aDh2LThoLTh6bTE0IDB2OGg4di04aC04ek0zNiA0NHY4aDh2LThoLTh6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Examination Process?
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed">
            Join forward-thinking institutions leveraging AI-powered proctoring for secure, scalable online assessments
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('/signup')}
              className="group bg-white hover:bg-gray-100 text-gray-900 font-semibold px-10 py-5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <span className="flex items-center justify-center">
                <CheckCircle className="w-5 h-5 mr-2 group-hover:text-emerald-600 transition-colors" />
                Get Started
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            
            <button
              onClick={() => onNavigate('/login')}
              className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold px-10 py-5 rounded-xl transition-all duration-300 hover:scale-105 border-2 border-white/30 hover:border-white/50"
            >
              <span className="flex items-center justify-center">
                <Users className="w-5 h-5 mr-2" />
                Educator Login
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-950 text-white py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-transparent to-teal-950/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <img 
              src="/Your paragraph text (1).png" 
              alt="Jasoos Logo" 
              className="h-14 w-auto mx-auto mb-6 hover:scale-110 transition-transform duration-300 opacity-90"
            />
            <p className="text-gray-400 mb-6 text-lg">
              Enterprise AI Proctoring Platform
            </p>
            <div className="flex justify-center space-x-3 mb-8">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-gray-500">
              © 2025 Jasoos:AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-400 {
          animation-delay: 0.4s;
        }
        
        .delay-600 {
          animation-delay: 0.6s;
        }
      `}</style>
    </div>
  );
};

export default HomePage;