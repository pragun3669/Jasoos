import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Eye,
  Search,
  Clock,
  Hash,
  Trash2,
  Users,
  Trophy,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Calendar,
  Target,
  Code,
  AlertTriangle,
  Award,
  Shield
} from 'lucide-react';

const TeacherTestResultsPage = () => {
  const { user } = useAuth();
  const token = user?.token;
  const teacherId = user?.id;

  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDuration, setFilterDuration] = useState("all");
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [expandedCode, setExpandedCode] = useState([]);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://localhost:8081/api';

  useEffect(() => {
    fetchTeacherTests();
  }, [teacherId, token]);

  const normalizeDate = (value) => {
    if (!value) return null;
    try {
      let str = value.toString().trim().replace(" ", "T");
      if (str.includes(".")) {
        const [datePart, msPart] = str.split(".");
        str = `${datePart}.${msPart.substring(0, 3)}`;
      }
      const date = new Date(str);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  const formatDate = (value) => {
    const date = normalizeDate(value);
    return date ? date.toLocaleDateString() : "N/A";
  };

  const formatDateTime = (value) => {
    const date = normalizeDate(value);
    return date
      ? date.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      : "Not submitted";
  };

  // ✅ Uses /summary — lightweight endpoint, does NOT trigger plagiarism service.
  // /results is only ever called when teacher explicitly clicks "View Results".
  const fetchTeacherTests = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!teacherId || !token) throw new Error('Missing authentication.');
      const response = await fetch(`${API_BASE_URL}/tests/teacher/${teacherId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch tests');
      const data = await response.json();

      console.log('Fetched tests:', data);

      const testsWithCounts = await Promise.all(
        data.map(async (test) => {
          try {
            const summaryRes = await fetch(`${API_BASE_URL}/tests/${test.id}/summary`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const summary = summaryRes.ok ? await summaryRes.json() : {};

            return {
              id: test.id,
              title: test.title,
              duration: test.duration,
              numberOfQuestions: test.questions?.length || 0,
              createdDate: test.createdDate,
              totalStudents: summary.totalStudents ?? 0,
              submittedCount: summary.submittedCount ?? 0
            };
          } catch {
            return {
              id: test.id,
              title: test.title,
              duration: test.duration,
              numberOfQuestions: test.questions?.length || 0,
              createdDate: test.createdDate,
              totalStudents: 0,
              submittedCount: 0
            };
          }
        })
      );

      setTests(testsWithCounts);
    } catch (err) {
      setError('Failed to fetch tests. Please ensure the backend is running and you are logged in.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ /results is ONLY called here — when the teacher explicitly clicks "View Results".
  // This is the only place plagiarism detection may be triggered.
  const fetchTestResults = async (testId) => {
    try {
      setResultsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/tests/${testId}/results`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch test results');

      const data = await response.json();
      console.log("🔥 RAW RESULT:", data);

      const processedData = data.map(result => {
        const questionResults = result.questionResults || [];
        const numQuestions = questionResults.length;

        // ─────────────────────────────────────────────────────────────────
        // SCORE RECOMPUTED FRESH ON THE FRONTEND — never trust stored values.
        //
        // WHY: backend's stored earnedPoints / result.score may reflect old
        // scoring logic (flat credit for attempting) for students who submitted
        // before a scoring fix, causing identical test-case results to show
        // different scores for different students.
        //
        // FORMULA (mirrors fixed ScoreCalculationService):
        //   Each question contributes equally: 100 / numQuestions points max.
        //   Points earned = maxPerQ × (passedTestCases / totalTestCases).
        //   Total = sum of per-question points, clamped to 100.
        // ─────────────────────────────────────────────────────────────────
        const maxPerQuestion = numQuestions > 0 ? 100 / numQuestions : 0;

        const processedQuestionResults = questionResults.map(q => {
          const passedTestCases = q.passedTestCases ?? 0;
          const totalTestCases  = q.totalTestCases  ?? 0;

          // Correct = ALL test cases passed (never compare earnedPoints to 100)
          const isCorrect = totalTestCases > 0 && passedTestCases === totalTestCases;

          // This question's contribution to the total score (0 to maxPerQuestion)
          const ratio = totalTestCases > 0 ? passedTestCases / totalTestCases : 0;
          const computedEarned = parseFloat((maxPerQuestion * ratio).toFixed(2));

          // Pass % for the progress bar (0-100)
          const passPercentage = totalTestCases > 0 ? Math.round(ratio * 100) : 0;

          return {
            ...q,
            passedTestCases,
            totalTestCases,
            earnedPoints:  computedEarned,
            questionMarks: parseFloat(maxPerQuestion.toFixed(2)),
            correct:       isCorrect,
            percentage:    passPercentage
          };
        });

        // Total score = sum of all question contributions (consistent for all students)
        const totalScore = processedQuestionResults.reduce(
          (sum, q) => sum + q.earnedPoints, 0
        );

        return {
          ...result,
          score:             parseFloat(Math.min(100, totalScore).toFixed(1)),
          totalMarks:        100,
          tabSwitchCount:    result.tabSwitchCount    ?? 0,
          copyPasteAttempts: result.copyPasteAttempts ?? 0,
          questionResults:   processedQuestionResults
        };
      });


      console.log("✅ PROCESSED RESULTS:", processedData);
      setTestResults(processedData);
    } catch (err) {
      setError('Failed to fetch test results. Please try again.');
      console.error(err);
    } finally {
      setResultsLoading(false);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm("Are you sure you want to delete this test? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/tests/${testId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete test");
      setTests((prev) => prev.filter((t) => t.id !== testId));
      if (selectedTest && selectedTest.id === testId) handleBackToTests();
    } catch (err) {
      console.error(err);
      setError("Error deleting test. Please try again.");
    }
  };

  const handleViewResults = (test) => {
    setSelectedTest(test);
    fetchTestResults(test.id); // ✅ Only /results call — happens on explicit user action
  };

  const handleBackToTests = () => {
    setSelectedTest(null);
    setTestResults([]);
    setExpandedStudent(null);
    setExpandedCode([]);
  };

  const getScoreColor = (score, totalMarks) => {
    if (totalMarks === 0) return 'text-gray-500';
    const percentage = (score / totalMarks) * 100;
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadgeColor = (score, totalMarks) => {
    if (totalMarks === 0) return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    const percentage = (score / totalMarks) * 100;
    if (percentage >= 80) return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    if (percentage >= 60) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
    return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDuration =
      filterDuration === 'all' ||
      (filterDuration === 'short' && test.duration <= 60) ||
      (filterDuration === 'medium' && test.duration > 60 && test.duration <= 120) ||
      (filterDuration === 'long' && test.duration > 120);
    return matchesSearch && matchesDuration;
  });

  const getGradientClass = (index) => {
    const gradients = [
      'from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700',
      'from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700',
      'from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700',
      'from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700',
      'from-teal-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700',
      'from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700'
    ];
    return gradients[index % gradients.length];
  };

  const getIconColor = (index) => {
    const colors = ['bg-green-400', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500'];
    return colors[index % colors.length];
  };

  // ── Summary stats derived from testResults (only available after View Results) ──
  const getSummaryStats = () => {
    if (!testResults.length) return null;
    const submitted = testResults.filter(r => r.status === 'Submitted');
    if (!submitted.length) return { avg: 0, highest: 0, lowest: 0, passRate: 0, submitted: 0, total: testResults.length };
    const scores = submitted.map(r => r.score || 0);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const passRate = (scores.filter(s => s >= 60).length / scores.length) * 100;
    return { avg: avg.toFixed(1), highest: highest.toFixed(1), lowest: lowest.toFixed(1), passRate: Math.round(passRate), submitted: submitted.length, total: testResults.length };
  };

  const exportToCSV = () => {
    if (!selectedTest || testResults.length === 0) return;
    const headers = ['Name', 'Email', 'Batch', 'Status', 'Score', 'Total Marks', 'Percentage', 'Submission Time', 'Tab Switches', 'Copy/Paste Attempts'];
    const rows = testResults.map(result => [
      result.name, result.email, result.batch || 'N/A', result.status,
      result.score || 0, result.totalMarks || 100,
      result.totalMarks ? Math.round((result.score / result.totalMarks) * 100) + '%' : '0%',
      formatDateTime(result.submittedAt), result.tabSwitchCount || 0, result.copyPasteAttempts || 0
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTest.title}_results.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {!selectedTest ? (
          <>
            {/* ── Header ── */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    Test Results Dashboard
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    View and analyze student performance across all your tests
                  </p>
                </div>
                <button
                  onClick={fetchTeacherTests}
                  className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-all hover:scale-105 flex items-center"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Refresh
                </button>
              </div>
            </div>

            {/* ── Search & Filter ── */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-8 p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search tests by title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['all', 'short', 'medium', 'long'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilterDuration(f)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                        filterDuration === f
                          ? 'bg-green-400 text-black'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {f === 'all' ? 'All Tests' : f === 'short' ? '≤60 min' : f === 'medium' ? '60-120 min' : '>120 min'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            )}

            {/* ── Test Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTests.map((test, index) => (
                <div
                  key={test.id}
                  className={`bg-gradient-to-br ${getGradientClass(index)} rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group border border-gray-200 dark:border-gray-700`}
                >
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg w-fit mb-3 ${getIconColor(index)}`}>
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                        ID: {test.id}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-green-400 transition-colors mb-2">
                      {test.title}
                    </h3>
                  </div>

                  <div className="px-6 pb-6">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 mr-2" /><span>{test.duration} minutes</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Hash className="w-4 h-4 mr-2" /><span>{test.numberOfQuestions} questions</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4 mr-2" /><span>{test.submittedCount}/{test.totalStudents} submitted</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" /><span>Created: {formatDate(test.createdDate)}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Submission Rate</span>
                        <span>{test.totalStudents > 0 ? Math.round((test.submittedCount / test.totalStudents) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${test.totalStudents > 0 ? (test.submittedCount / test.totalStudents) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleViewResults(test)}
                        className="flex-1 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-all hover:scale-105 flex items-center justify-center"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Results
                      </button>
                      <button
                        onClick={() => handleDeleteTest(test.id)}
                        className="flex items-center justify-center border border-red-500 text-red-500 hover:bg-red-500 hover:text-white py-3 px-4 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredTests.length === 0 && !loading && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center py-12 border border-gray-200 dark:border-gray-700">
                <div className="mx-auto w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-6">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No tests found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || filterDuration !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : "You haven't created any tests yet."}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* ── Results View Header ── */}
            <div className="mb-8">
              <button
                onClick={handleBackToTests}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-green-400 transition-colors mb-4"
              >
                ← Back to Tests
              </button>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedTest.title} — Results
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center"><Clock className="w-4 h-4 mr-1" /><span>{selectedTest.duration} minutes</span></div>
                      <div className="flex items-center"><Hash className="w-4 h-4 mr-1" /><span>{selectedTest.numberOfQuestions} questions</span></div>
                      <div className="flex items-center"><Users className="w-4 h-4 mr-1" /><span>{selectedTest.submittedCount}/{selectedTest.totalStudents} submitted</span></div>
                    </div>
                  </div>
                  <button
                    onClick={exportToCSV}
                    className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />Export CSV
                  </button>
                </div>
              </div>
            </div>

            {resultsLoading ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg text-gray-600 dark:text-gray-400">Loading test results...</p>
              </div>
            ) : (
              <>
                {/* ── Summary Stats Panel ── */}
                {(() => {
                  const stats = getSummaryStats();
                  if (!stats) return null;
                  return (
                    <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {[
                        { label: 'Submitted', value: `${stats.submitted}/${stats.total}`, icon: <Users className="w-5 h-5 text-white" />, bg: 'bg-blue-500' },
                        { label: 'Avg Score', value: `${stats.avg}/100`, icon: <Target className="w-5 h-5 text-white" />, bg: 'bg-green-500' },
                        { label: 'Highest', value: `${stats.highest}/100`, icon: <Award className="w-5 h-5 text-white" />, bg: 'bg-emerald-500' },
                        { label: 'Lowest', value: `${stats.lowest}/100`, icon: <AlertTriangle className="w-5 h-5 text-white" />, bg: 'bg-orange-500' },
                        { label: 'Pass Rate', value: `${stats.passRate}%`, icon: <CheckCircle className="w-5 h-5 text-white" />, bg: 'bg-teal-500' },
                        { label: 'Violations', value: testResults.filter(r => r.tabSwitchCount > 0 || r.copyPasteAttempts > 0).length, icon: <Shield className="w-5 h-5 text-white" />, bg: 'bg-red-500' },
                      ].map((s) => (
                        <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${s.bg} shrink-0`}>{s.icon}</div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.label}</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{s.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* ── Results Table ── */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          {['Student', 'Batch', 'Status', 'Score', 'Violations', 'Submitted', 'Details'].map(h => (
                            <th key={h} className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {testResults.map((result) => (
                          <React.Fragment key={result.studentId}>
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{result.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{result.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                                  {result.batch || 'N/A'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  result.status === 'Submitted'
                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                }`}>
                                  {result.status === 'Submitted'
                                    ? <CheckCircle className="w-3 h-3 mr-1" />
                                    : <XCircle className="w-3 h-3 mr-1" />}
                                  {result.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className={`text-sm font-medium ${getScoreColor(result.score, 100)}`}>
                                    {result.score?.toFixed(1) || 0}/100
                                  </span>
                                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getScoreBadgeColor(result.score, 100)}`}>
                                    {Math.round((result.score / 100) * 100)}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  {(result.tabSwitchCount > 0 || result.copyPasteAttempts > 0) ? (
                                    <>
                                      {result.tabSwitchCount > 0 && (
                                        <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
                                          👁️ {result.tabSwitchCount}
                                        </span>
                                      )}
                                      {result.copyPasteAttempts > 0 && (
                                        <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full">
                                          🛡️ {result.copyPasteAttempts}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {formatDateTime(result.submittedAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {result.status === 'Submitted' && (
                                  <button
                                    onClick={() => {
                                      if (expandedStudent === result.studentId) {
                                        setExpandedStudent(null);
                                        setExpandedCode([]);
                                      } else {
                                        setExpandedStudent(result.studentId);
                                      }
                                    }}
                                    className="text-green-400 hover:text-green-600 transition-colors flex items-center"
                                  >
                                    {expandedStudent === result.studentId
                                      ? <ChevronUp className="w-4 h-4" />
                                      : <ChevronDown className="w-4 h-4" />}
                                    <span className="ml-1">View</span>
                                  </button>
                                )}
                              </td>
                            </tr>

                            {expandedStudent === result.studentId && result.questionResults && (
                              <tr>
                                <td colSpan="7" className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                                  <div className="p-8">
                                    <div className="space-y-6">
                                      <div className="flex items-center justify-between pb-4 border-b-2 border-gray-300 dark:border-gray-600">
                                        <h4 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                          <div className="p-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg mr-3">
                                            <Target className="w-6 h-6 text-white" />
                                          </div>
                                          Question-wise Performance Analysis
                                        </h4>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                          {result.questionResults.length} Questions
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                        {result.questionResults.map((qResult, idx) => (
                                          <div
                                            key={idx}
                                            className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700 overflow-hidden"
                                          >
                                            <div className={`p-4 border-b-2 ${
                                              qResult.correct
                                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-700'
                                                : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 border-red-200 dark:border-red-700'
                                            }`}>
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                  <div className={`p-2 rounded-lg ${qResult.correct ? 'bg-green-500' : 'bg-red-500'}`}>
                                                    <span className="text-white font-bold text-lg">Q{idx + 1}</span>
                                                  </div>
                                                  {qResult.correct
                                                    ? <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                                    : <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />}
                                                  <span className={`font-semibold ${qResult.correct ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                                    {qResult.correct ? 'Correct' : 'Incorrect'}
                                                  </span>
                                                </div>
                                                <div className="text-right">
                                                  <div className={`text-2xl font-bold ${qResult.correct ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {qResult.earnedPoints?.toFixed(1) || 0}
                                                  </div>
                                                  <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                                    / {qResult.questionMarks || 100} points
                                                  </div>
                                                </div>
                                              </div>
                                            </div>

                                            <div className="p-5 space-y-4">
                                              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                  {qResult.questionDescription || 'No description available'}
                                                </p>
                                              </div>

                                              {qResult.language && (
                                                <div className="flex items-center space-x-2">
                                                  <Code className="w-4 h-4 text-blue-500" />
                                                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                                                    {qResult.language.toUpperCase()}
                                                  </span>
                                                </div>
                                              )}

                                              <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Test Cases Passed</span>
                                                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {qResult.passedTestCases || 0} / {qResult.totalTestCases || 0}
                                                  </span>
                                                </div>
                                                <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                  <div
                                                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                                                      qResult.correct
                                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                                        : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                                    }`}
                                                    style={{ width: `${qResult.totalTestCases > 0 ? (qResult.passedTestCases / qResult.totalTestCases) * 100 : 0}%` }}
                                                  />
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                  <span className="text-gray-500 dark:text-gray-400">Attempts: {qResult.attempts || 0}</span>
                                                  <span className={`font-semibold ${qResult.correct ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                                    {qResult.totalTestCases > 0 ? Math.round((qResult.passedTestCases / qResult.totalTestCases) * 100) : 0}% Success
                                                  </span>
                                                </div>
                                              </div>

                                              {qResult.submittedCode && (
                                                <button
                                                  onClick={() => {
                                                    const key = `${result.studentId}-q${idx}`;
                                                    setExpandedCode(prev =>
                                                      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
                                                    );
                                                    if (expandedStudent !== result.studentId) setExpandedStudent(result.studentId);
                                                  }}
                                                  className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg font-medium transition-all hover:shadow-lg flex items-center justify-center group"
                                                >
                                                  <Code className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                                  {expandedCode.includes(`${result.studentId}-q${idx}`) ? 'Hide' : 'View'} Code & Test Cases
                                                </button>
                                              )}

                                              {expandedCode.includes(`${result.studentId}-q${idx}`) && (
                                                <div className="mt-4 space-y-4 border-t-2 border-gray-200 dark:border-gray-700 pt-4">
                                                  {qResult.submittedCode && (
                                                    <div className="space-y-2">
                                                      <div className="flex items-center justify-between">
                                                        <h6 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center">
                                                          <Code className="w-4 h-4 mr-2 text-blue-500" />Submitted Code
                                                        </h6>
                                                        <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                                                          {qResult.language || 'Unknown'}
                                                        </span>
                                                      </div>
                                                      <div className="relative rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                                                        <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm leading-relaxed max-h-96">
                                                          <code className="font-mono">{qResult.submittedCode}</code>
                                                        </pre>
                                                      </div>
                                                    </div>
                                                  )}

                                                  {qResult.testCaseResults && qResult.testCaseResults.length > 0 && (
                                                    <div className="space-y-3">
                                                      <h6 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center">
                                                        <Target className="w-4 h-4 mr-2 text-purple-500" />
                                                        Test Case Results ({qResult.testCaseResults.length})
                                                      </h6>
                                                      <div className="space-y-3">
                                                        {qResult.testCaseResults.map((tc, tcIdx) => (
                                                          <div
                                                            key={tcIdx}
                                                            className={`rounded-lg border-2 overflow-hidden transition-all hover:shadow-md ${
                                                              tc.passed
                                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                                                                : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                                                            }`}
                                                          >
                                                            <div className={`px-4 py-2 border-b-2 ${
                                                              tc.passed
                                                                ? 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700'
                                                                : 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700'
                                                            }`}>
                                                              <div className="flex items-center justify-between">
                                                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                                                  Test Case {tcIdx + 1}
                                                                </span>
                                                                <div className="flex items-center space-x-2">
                                                                  {tc.executionTime && (
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                                                      ⏱️ {tc.executionTime}ms
                                                                    </span>
                                                                  )}
                                                                  {tc.passed
                                                                    ? <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                                    : <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                                                                </div>
                                                              </div>
                                                            </div>
                                                            <div className="p-3 space-y-3">
                                                              {tc.input && (
                                                                <div>
                                                                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">📥 Input:</span>
                                                                  <pre className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 p-2 rounded text-xs overflow-x-auto font-mono">{tc.input}</pre>
                                                                </div>
                                                              )}
                                                              <div className="grid grid-cols-2 gap-3">
                                                                {tc.expectedOutput && (
                                                                  <div>
                                                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">✅ Expected:</span>
                                                                    <pre className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 p-2 rounded text-xs overflow-x-auto font-mono text-green-900 dark:text-green-200">{tc.expectedOutput}</pre>
                                                                  </div>
                                                                )}
                                                                {tc.actualOutput && (
                                                                  <div>
                                                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">📤 Got:</span>
                                                                    <pre className={`border p-2 rounded text-xs overflow-x-auto font-mono ${
                                                                      tc.passed
                                                                        ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-900 dark:text-green-200'
                                                                        : 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-900 dark:text-red-200'
                                                                    }`}>{tc.actualOutput}</pre>
                                                                  </div>
                                                                )}
                                                              </div>
                                                              {tc.error && (
                                                                <div>
                                                                  <span className="text-xs font-semibold text-red-700 dark:text-red-300 block mb-1 flex items-center">
                                                                    <AlertTriangle className="w-3 h-3 mr-1" />Error:
                                                                  </span>
                                                                  <pre className="bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-700 p-2 rounded text-xs overflow-x-auto text-red-900 dark:text-red-200 font-mono">{tc.error}</pre>
                                                                </div>
                                                              )}
                                                            </div>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      {(result.tabSwitchCount > 0 || result.copyPasteAttempts > 0) && (
                                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-5 shadow-md">
                                          <h5 className="font-bold text-gray-900 dark:text-white flex items-center mb-4 text-lg">
                                            <div className="p-2 bg-yellow-500 rounded-lg mr-3">
                                              <Shield className="w-5 h-5 text-white" />
                                            </div>
                                            Proctoring Violations Detected
                                          </h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {result.tabSwitchCount > 0 && (
                                              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-yellow-300 dark:border-yellow-700 flex items-center space-x-3">
                                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                                                  <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                                </div>
                                                <div>
                                                  <span className="text-gray-600 dark:text-gray-400 text-sm block">Tab Switches</span>
                                                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{result.tabSwitchCount}</span>
                                                </div>
                                              </div>
                                            )}
                                            {result.copyPasteAttempts > 0 && (
                                              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-red-300 dark:border-red-700 flex items-center space-x-3">
                                                <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                                                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                                </div>
                                                <div>
                                                  <span className="text-gray-600 dark:text-gray-400 text-sm block">Copy/Paste Attempts</span>
                                                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{result.copyPasteAttempts}</span>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-xl p-5 border-2 border-green-300 dark:border-green-700 shadow-md hover:shadow-lg transition-shadow">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">Total Score</p>
                                              <p className="text-3xl font-bold text-green-900 dark:text-green-100">{result.score?.toFixed(1) || 0}</p>
                                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">out of {result.totalMarks || 100}</p>
                                            </div>
                                            <div className="p-3 bg-green-500 rounded-xl"><Award className="w-8 h-8 text-white" /></div>
                                          </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-xl p-5 border-2 border-blue-300 dark:border-blue-700 shadow-md hover:shadow-lg transition-shadow">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Questions Solved</p>
                                              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{result.questionResults?.filter(q => q.correct).length || 0}</p>
                                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">out of {result.questionResults?.length || 0}</p>
                                            </div>
                                            <div className="p-3 bg-blue-500 rounded-xl"><Target className="w-8 h-8 text-white" /></div>
                                          </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-xl p-5 border-2 border-purple-300 dark:border-purple-700 shadow-md hover:shadow-lg transition-shadow">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">Success Rate</p>
                                              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                                                {result.totalMarks ? Math.round((result.score / result.totalMarks) * 100) : 0}%
                                              </p>
                                              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Overall performance</p>
                                            </div>
                                            <div className="p-3 bg-purple-500 rounded-xl"><Trophy className="w-8 h-8 text-white" /></div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>

                    {testResults.length === 0 && !resultsLoading && (
                      <div className="text-center py-12">
                        <div className="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No results found</h3>
                        <p className="text-gray-600 dark:text-gray-400">No students have submitted this test yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherTestResultsPage;