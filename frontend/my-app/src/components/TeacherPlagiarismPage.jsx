import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

import {
  Search,
  CheckCircle,
  Users,
  FileText,
  ArrowLeft,
  Loader,
  Code,
  ChevronDown,
  ChevronUp,
  Brain,
  Clock,
  Calendar,
  Hash,
  TrendingUp,
  AlertTriangle,
  Shield,
  Filter,
  Download,
  Eye,
  BarChart3,
  Zap
} from "lucide-react";

const TeacherPlagiarismPage = () => {
  const { user } = useAuth();
  const token = user?.token;
  const teacherId = user?.id;

  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [students, setStudents] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [filterRisk, setFilterRisk] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [animateCards, setAnimateCards] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const API_BASE_URL = "http://localhost:8081/api";

  useEffect(() => {
    if (teacherId && token) fetchTests();
  }, [teacherId, token]);

  useEffect(() => {
    setAnimateCards(true);
    const timer = setTimeout(() => setAnimateCards(false), 1000);
    return () => clearTimeout(timer);
  }, [tests]);

  const fetchTests = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/tests/teacher/${teacherId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to load tests");

      const data = await res.json();
      setTests(data);

    } catch (e) {
      setError("Failed to fetch tests");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlagiarismData = async (testId) => {
    try {
      setResultsLoading(true);

      const res = await fetch(`${API_BASE_URL}/tests/${testId}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error fetching results");

      const data = await res.json();
      setStudents(data);
      setShowStats(true);

    } catch (e) {
      setError("Failed to fetch results");
    } finally {
      setResultsLoading(false);
    }
  };

  // AI Risk Badge with animation
  const getBadge = (score) => {
    if (score >= 90)
      return {
        label: "AI Generated (High Risk)",
        color: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300",
        icon: AlertTriangle,
        pulse: true
      };
    if (score >= 70)
      return {
        label: "High AI Similarity",
        color: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-300",
        icon: TrendingUp,
        pulse: false
      };
    if (score >= 60)
      return {
        label: "Moderate AI Similarity",
        color: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300",
        icon: Eye,
        pulse: false
      };
    return {
      label: "Likely Human Written",
      color: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300",
      icon: Shield,
      pulse: false
    };
  };

  // Calculate statistics
  const getStatistics = () => {
    if (!students.length) return null;

    const allScores = students.flatMap(s => 
      (s.questionResults || []).map(q => q.plagiarismScore || 0)
    );

    const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length || 0;
    const highRisk = allScores.filter(s => s >= 90).length;
    const moderate = allScores.filter(s => s >= 60 && s < 90).length;
    const low = allScores.filter(s => s < 60).length;

    return { avgScore, highRisk, moderate, low, total: allScores.length };
  };

  const stats = getStatistics();

  // Filter and sort students
  const getFilteredAndSortedStudents = () => {
    let filtered = students.filter((stu) =>
      `${stu.name} ${stu.email}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply risk filter
    if (filterRisk !== "all") {
      filtered = filtered.filter(stu => {
        const maxScore = Math.max(...(stu.questionResults || []).map(q => q.plagiarismScore || 0));
        if (filterRisk === "high") return maxScore >= 90;
        if (filterRisk === "moderate") return maxScore >= 60 && maxScore < 90;
        if (filterRisk === "low") return maxScore < 60;
        return true;
      });
    }

    // Sort students
    filtered.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "email") return a.email.localeCompare(b.email);
      if (sortBy === "risk") {
        const aMax = Math.max(...(a.questionResults || []).map(q => q.plagiarismScore || 0));
        const bMax = Math.max(...(b.questionResults || []).map(q => q.plagiarismScore || 0));
        return bMax - aMax;
      }
      return 0;
    });

    return filtered;
  };

  const filteredStudents = getFilteredAndSortedStudents();

  // Get risk level for student
  const getStudentRiskLevel = (student) => {
    const maxScore = Math.max(...(student.questionResults || []).map(q => q.plagiarismScore || 0));
    if (maxScore >= 90) return "high";
    if (maxScore >= 60) return "moderate";
    return "low";
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
        <div className="text-center">
          <Loader className="w-12 h-12 mx-auto animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">

        {/* Error Toast */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in-right z-50 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-2 hover:text-gray-200">×</button>
          </div>
        )}

        {/* ---------------- TEST LIST PAGE ---------------- */}
        {!selectedTest && (
          <>
            <div className="mb-8 animate-fade-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  AI Code Detection Dashboard
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Analyze student submissions for AI-generated similarity
              </p>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <Loader className="w-10 h-10 mx-auto animate-spin text-blue-400" />
                <p className="text-gray-600 dark:text-gray-400 mt-4">Loading tests...</p>
              </div>
            ) : (
              <>
                {tests.length === 0 ? (
                  <div className="text-center py-20 animate-fade-in">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No tests available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {tests.map((test, index) => (
                      <div
                        key={test.id}
                        className={`group bg-gradient-to-br ${
                            [
                              "from-green-50 to-blue-50",
                              "from-blue-50 to-purple-50",
                              "from-purple-50 to-pink-50",
                              "from-orange-50 to-red-50",
                              "from-teal-50 to-cyan-50",
                            ][index % 5]
                          }
                          dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg border border-gray-300 dark:border-gray-700 p-6 
                          hover:shadow-2xl hover:scale-[1.02] cursor-pointer transition-all duration-300 
                          ${animateCards ? 'animate-slide-up' : ''}`}
                        style={{ animationDelay: `${index * 100}ms` }}
                        onClick={() => {
                          setSelectedTest(test);
                          fetchPlagiarismData(test.id);
                        }}
                      >
                        <div className="flex justify-between mb-4">
                          <div className="p-3 bg-blue-500 rounded-xl group-hover:bg-blue-600 transition-colors duration-300 group-hover:scale-110 transform">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 rounded-full text-sm font-medium">
                            ID: {test.id}
                          </span>
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {test.title}
                        </h2>

                        <div className="text-gray-600 dark:text-gray-400 text-sm space-y-2">
                          <p className="flex items-center hover:text-blue-500 transition-colors">
                            <Clock className="w-4 h-4 mr-2" />
                            {test.duration} minutes
                          </p>
                          <p className="flex items-center hover:text-blue-500 transition-colors">
                            <Hash className="w-4 h-4 mr-2" />
                            {test.questions?.length || 0} questions
                          </p>
                          <p className="flex items-center hover:text-blue-500 transition-colors">
                            <Calendar className="w-4 h-4 mr-2" />
                            {test.createdDate
                              ? new Date(test.createdDate).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">View Results</span>
                          <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ---------------- TEST DETAIL PAGE ---------------- */}
        {selectedTest && (
          <>
            <div className="mb-6 animate-fade-in">
              <button
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 mb-4 transition-all hover:translate-x-[-4px]"
                onClick={() => {
                  setSelectedTest(null);
                  setStudents([]);
                  setExpandedStudent(null);
                  setShowStats(false);
                }}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Tests
              </button>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    {selectedTest.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Plagiarism Analysis Results
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            {showStats && stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 animate-fade-in">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgScore.toFixed(1)}%</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-red-200 dark:border-red-900 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">High Risk</p>
                      <p className="text-2xl font-bold text-red-600">{stats.highRisk}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-yellow-200 dark:border-yellow-900 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Moderate</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.moderate}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-green-200 dark:border-green-900 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Low Risk</p>
                      <p className="text-2xl font-bold text-green-600">{stats.low}</p>
                    </div>
                    <Shield className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Search and Filter Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-200 dark:border-gray-700 mb-6 animate-fade-in">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Risk Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={filterRisk}
                    onChange={(e) => setFilterRisk(e.target.value)}
                    className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="high">High Risk (90+)</option>
                    <option value="moderate">Moderate (60-89)</option>
                    <option value="low">Low (&lt;60)</option>
                  </select>
                </div>

                {/* Sort By */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="name">Sort by Name</option>
                  <option value="email">Sort by Email</option>
                  <option value="risk">Sort by Risk</option>
                </select>
              </div>
            </div>

            {resultsLoading ? (
              <div className="text-center py-20">
                <Loader className="w-10 h-10 mx-auto animate-spin text-blue-400" />
                <p className="text-gray-600 dark:text-gray-400 mt-4">Loading results...</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800">
                    <tr>
                      <th className="p-4 text-left text-xs font-medium uppercase text-gray-700 dark:text-gray-300">Student</th>
                      <th className="p-4 text-left text-xs font-medium uppercase text-gray-700 dark:text-gray-300">Email</th>
                      <th className="p-4 text-left text-xs font-medium uppercase text-gray-700 dark:text-gray-300">Risk Level</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map((stu, idx) => {
                      const riskLevel = getStudentRiskLevel(stu);
                      const maxScore = Math.max(...(stu.questionResults || []).map(q => q.plagiarismScore || 0));
                      const riskBadge = getBadge(maxScore);

                      return (
                        <React.Fragment key={stu.studentId}>
                          <tr className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ${
                            expandedStudent === stu.studentId ? 'bg-blue-50 dark:bg-gray-900' : ''
                          }`}
                          style={{ animationDelay: `${idx * 50}ms` }}>
                            <td className="p-4 font-medium text-gray-900 dark:text-gray-100">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {stu.name.charAt(0).toUpperCase()}
                                </div>
                                {stu.name}
                              </div>
                            </td>
                            <td className="p-4 text-gray-600 dark:text-gray-300">
                              {stu.email}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${riskBadge.color} ${riskBadge.pulse ? 'animate-pulse' : ''}`}>
                                <riskBadge.icon className="w-3 h-3" />
                                {maxScore}%
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() =>
                                  setExpandedStudent(
                                    expandedStudent === stu.studentId
                                      ? null
                                      : stu.studentId
                                  )
                                }
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900 p-2 rounded-lg transition-all"
                              >
                                {expandedStudent === stu.studentId ? (
                                  <ChevronUp className="w-5 h-5" />
                                ) : (
                                  <ChevronDown className="w-5 h-5" />
                                )}
                              </button>
                            </td>
                          </tr>

                          {expandedStudent === stu.studentId && (
                            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b dark:border-gray-700 animate-slide-down">
                              <td colSpan="4" className="p-6">
                                <div className="space-y-6">

                                  {(stu.questionResults || []).map((question, index) => {
                                    const badge = getBadge(question.plagiarismScore || 0);

                                    return (
                                      <div key={index} 
                                        className="border rounded-xl p-6 bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 animate-fade-in"
                                        style={{ animationDelay: `${index * 100}ms` }}>

                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                                          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                                              {index + 1}
                                            </div>
                                            Question {index + 1}
                                          </h3>

                                          <span
                                            className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full border font-medium ${badge.color} ${badge.pulse ? 'animate-pulse' : ''}`}
                                          >
                                            <badge.icon className="w-5 h-5" />
                                            {badge.label} ({question.plagiarismScore || 0}%)
                                          </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-6">
                                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            <span>Similarity Score</span>
                                            <span className="font-bold">{question.plagiarismScore || 0}%</span>
                                          </div>
                                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                            <div 
                                              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                                question.plagiarismScore >= 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                                question.plagiarismScore >= 70 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                                                question.plagiarismScore >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                                'bg-gradient-to-r from-green-500 to-green-600'
                                              }`}
                                              style={{ width: `${question.plagiarismScore || 0}%` }}
                                            />
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-xl border-2 border-blue-200 dark:border-blue-900 p-5 shadow-md hover:shadow-lg transition-all">
                                            <h3 className="flex items-center text-lg font-bold mb-4 text-blue-600 dark:text-blue-400">
                                              <Code className="w-6 h-6 mr-2" />
                                              Student Code
                                            </h3>
                                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto max-h-80 hover:max-h-96 transition-all duration-300 border border-gray-700">
{question.submittedCode || "No code provided"}
                                            </pre>
                                          </div>

                                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 rounded-xl border-2 border-green-200 dark:border-green-900 p-5 shadow-md hover:shadow-lg transition-all">
                                            <h3 className="flex items-center text-lg font-bold mb-4 text-green-600 dark:text-green-400">
                                              <Brain className="w-6 h-6 mr-2" />
                                              AI Generated Code
                                            </h3>
                                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto max-h-80 hover:max-h-96 transition-all duration-300 border border-gray-700">
{question.aiGeneratedSolution || "No AI code found"}
                                            </pre>
                                          </div>

                                        </div>
                                      </div>
                                    );
                                  })}

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>

                {filteredStudents.length === 0 && (
                  <div className="text-center py-20 animate-fade-in">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No students found</p>
                    <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search terms</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 2000px;
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-slide-up {
          animation: slideUp 0.5s ease-out forwards;
        }

        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }

        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default TeacherPlagiarismPage;