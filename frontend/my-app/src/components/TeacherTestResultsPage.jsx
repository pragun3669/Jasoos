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
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://localhost:8081/api';

  useEffect(() => {
    fetchTeacherTests();
  }, [teacherId, token]);

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

      // Fetch student counts for each test
      const testsWithCounts = await Promise.all(
        data.map(async (test) => {
          try {
            const studentsResponse = await fetch(`${API_BASE_URL}/tests/${test.id}/students`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const students = studentsResponse.ok ? await studentsResponse.json() : [];

            const submittedCount = students.filter(s => s.submittedAt != null).length;

            return {
              id: test.id,
              title: test.title,
              duration: test.duration,
              numberOfQuestions: test.questions ? test.questions.length : 0,
              createdDate: test.createdDate || new Date().toISOString(),
              totalStudents: students.length,
              submittedCount: submittedCount
            };
          } catch (err) {
            console.error(`Error fetching students for test ${test.id}:`, err);
            return {
              id: test.id,
              title: test.title,
              duration: test.duration,
              numberOfQuestions: test.questions ? test.questions.length : 0,
              createdDate: test.createdDate || new Date().toISOString(),
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
      console.log('Test Results API Response:', data);

      setTestResults(data);
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
  
      // Remove test from state
      setTests((prev) => prev.filter((t) => t.id !== testId));
      
      // If the deleted test is currently selected, go back to tests list
      if (selectedTest && selectedTest.id === testId) {
        handleBackToTests();
      }
    } catch (err) {
      console.error(err);
      setError("Error deleting test. Please try again.");
    }
  };
  const handleViewResults = (test) => {
    setSelectedTest(test);
    fetchTestResults(test.id);
  };

  const handleBackToTests = () => {
    setSelectedTest(null);
    setTestResults([]);
    setExpandedStudent(null);
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
    const matchesDuration = filterDuration === 'all' ||
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
    const colors = [
      'bg-green-400',
      'bg-blue-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-indigo-500'
    ];
    return colors[index % colors.length];
  };

  const exportToCSV = () => {
    if (!selectedTest || testResults.length === 0) return;

    const headers = ['Name', 'Email', 'Batch', 'Status', 'Score', 'Total Marks', 'Percentage', 'Submission Time', 'Tab Switches', 'Copy/Paste Attempts'];
    const rows = testResults.map(result => [
      result.name,
      result.email,
      result.batch || 'N/A',
      result.status,
      result.score || 0,
      result.totalMarks || 0,
      result.totalMarks ? Math.round((result.score / result.totalMarks) * 100) + '%' : '0%',
      result.submissionTime ? new Date(result.submissionTime).toLocaleString() : 'Not submitted',
      result.tabSwitchCount || 0,
      result.copyPasteAttempts || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

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
            {/* Header */}
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

            {/* Search and Filter */}
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
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterDuration('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      filterDuration === 'all'
                        ? 'bg-green-400 text-black'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    All Tests
                  </button>
                  <button
                    onClick={() => setFilterDuration('short')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      filterDuration === 'short'
                        ? 'bg-green-400 text-black'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    ≤60 min
                  </button>
                  <button
                    onClick={() => setFilterDuration('medium')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      filterDuration === 'medium'
                        ? 'bg-green-400 text-black'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    60-120 min
                  </button>
                  <button
                    onClick={() => setFilterDuration('long')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      filterDuration === 'long'
                        ? 'bg-green-400 text-black'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    &gt;120 min
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            )}

            {/* Tests Grid */}
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
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{test.duration} minutes</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Hash className="w-4 h-4 mr-2" />
                        <span>{test.numberOfQuestions} questions</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{test.submittedCount}/{test.totalStudents} submitted</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Created: {new Date(test.createdDate).toLocaleDateString()}</span>
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
                        ></div>
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
    className="flex-1 flex items-center justify-center border border-red-500 text-red-500 hover:bg-red-500 hover:text-white py-3 px-4 rounded-lg text-sm font-medium transition-colors"
  >
    <Trash2 className="w-4 h-4 mr-2" />
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
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No tests found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchTerm || filterDuration !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'You haven\'t created any tests yet.'
                  }
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Results Header */}
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
                      {selectedTest.title} - Results
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{selectedTest.duration} minutes</span>
                      </div>
                      <div className="flex items-center">
                        <Hash className="w-4 h-4 mr-1" />
                        <span>{selectedTest.numberOfQuestions} questions</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{selectedTest.submittedCount}/{selectedTest.totalStudents} submitted</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={exportToCSV}
                      className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {resultsLoading ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg text-gray-600 dark:text-gray-400">Loading test results...</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Batch
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Violations
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {testResults.map((result) => (
                        <React.Fragment key={result.studentId}>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {result.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {result.email}
                                </div>
                              </div>
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
                                {result.status === 'Submitted' ? (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                ) : (
                                  <XCircle className="w-3 h-3 mr-1" />
                                )}
                                {result.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className={`text-sm font-medium ${getScoreColor(result.score, result.totalMarks)}`}>
                                  {result.score || 0}/{result.totalMarks || 0}
                                </span>
                                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getScoreBadgeColor(result.score, result.totalMarks)}`}>
                                  {result.totalMarks ? Math.round((result.score / result.totalMarks) * 100) : 0}%
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
                              {result.submissionTime
                                ? new Date(result.submissionTime).toLocaleString()
                                : 'Not submitted'
                              }
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {result.status === 'Submitted' && (
                                <button
                                  onClick={() => setExpandedStudent(
                                    expandedStudent === result.studentId ? null : result.studentId
                                  )}
                                  className="text-green-400 hover:text-green-600 transition-colors flex items-center"
                                >
                                  {expandedStudent === result.studentId ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                  <span className="ml-1">View</span>
                                </button>
                              )}
                            </td>
                          </tr>

                          {/* Expanded Question Results */}
                          {expandedStudent === result.studentId && result.questionResults && (
                            <tr>
                              <td colSpan="7" className="px-6 py-6 bg-gray-50 dark:bg-gray-700">
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center text-lg mb-4">
                                    <Target className="w-5 h-5 mr-2" />
                                    Question-wise Performance
                                  </h4>
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {result.questionResults.map((qResult, idx) => (
                                      <div
                                        key={idx}
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4"
                                      >
                                        <div className="flex items-start justify-between mb-3">
                                          <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                              <span className="font-medium text-gray-900 dark:text-white">
                                                Question {idx + 1}
                                              </span>
                                              {qResult.correct ? (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                              ) : (
                                                <XCircle className="w-4 h-4 text-red-500" />
                                              )}
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                              {qResult.questionDescription || 'No description'}
                                            </p>
                                          </div>
                                          <div className="ml-3 text-right">
                                            <div className={`text-lg font-bold ${
                                              qResult.correct ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                              {qResult.earnedPoints?.toFixed(1) || 0}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                              / {qResult.questionMarks || 0} pts
                                            </div>
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          {/* Language Badge */}
                                          {qResult.language && (
                                            <div className="flex items-center text-xs mb-2">
                                              <Code className="w-3 h-3 mr-1 text-gray-500 dark:text-gray-400" />
                                              <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                                {qResult.language}
                                              </span>
                                            </div>
                                          )}

                                          <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Test Cases:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                              {qResult.passedTestCases || 0}/{qResult.totalTestCases || 0} passed
                                            </span>
                                          </div>
                                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div
                                              className={`h-2 rounded-full transition-all ${
                                                qResult.correct
                                                  ? 'bg-green-500'
                                                  : 'bg-yellow-500'
                                              }`}
                                              style={{
                                                width: `${qResult.totalTestCases > 0
                                                  ? (qResult.passedTestCases / qResult.totalTestCases) * 100
                                                  : 0}%`
                                              }}
                                            ></div>
                                          </div>

                                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <span>Attempts: {qResult.attempts || 0}</span>
                                            <span>
                                              {qResult.totalTestCases > 0
                                                ? Math.round((qResult.passedTestCases / qResult.totalTestCases) * 100)
                                                : 0}% accuracy
                                            </span>
                                          </div>

                                          {/* View Details Button */}
                                          {qResult.submittedCode && (
                                            <button
                                              onClick={() => setExpandedStudent(
                                                expandedStudent === `${result.studentId}-q${idx}`
                                                  ? result.studentId
                                                  : `${result.studentId}-q${idx}`
                                              )}
                                              className="w-full mt-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center justify-center"
                                            >
                                              <Code className="w-3 h-3 mr-1" />
                                              {expandedStudent === `${result.studentId}-q${idx}` ? 'Hide' : 'View'} Code & Test Cases
                                            </button>
                                          )}

                                          {/* Expanded Code Section */}
                                          {expandedStudent === `${result.studentId}-q${idx}` && (
                                            <div className="mt-4 space-y-3 border-t border-gray-200 dark:border-gray-600 pt-4">
                                              {/* Submitted Code */}
                                              {qResult.submittedCode && (
                                                <div>
                                                  <h6 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                                    <Code className="w-3 h-3 mr-1" />
                                                    Submitted Code ({qResult.language || 'Unknown'})
                                                  </h6>
                                                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto max-h-64 whitespace-pre-wrap">
                                                    <code>{qResult.submittedCode}</code>
                                                  </pre>
                                                </div>
                                              )}

                                              {/* Test Cases Details */}
                                              {qResult.testCaseResults && qResult.testCaseResults.length > 0 && (
                                                <div>
                                                  <h6 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    Test Case Results
                                                  </h6>
                                                  <div className="space-y-2">
                                                    {qResult.testCaseResults.map((tc, tcIdx) => (
                                                      <div
                                                        key={tcIdx}
                                                        className={`p-3 rounded border ${
                                                          tc.passed
                                                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                                        }`}
                                                      >
                                                        <div className="flex items-center justify-between mb-2">
                                                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                                                            Test Case {tcIdx + 1}
                                                          </span>
                                                          {tc.passed ? (
                                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                                          ) : (
                                                            <XCircle className="w-4 h-4 text-red-500" />
                                                          )}
                                                        </div>

                                                        {tc.input && (
                                                          <div className="mb-2">
                                                            <span className="text-xs text-gray-600 dark:text-gray-400">Input:</span>
                                                            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs mt-1 overflow-x-auto">
                                                              {tc.input}
                                                            </pre>
                                                          </div>
                                                        )}

                                                        <div className="grid grid-cols-2 gap-2">
                                                          {tc.expectedOutput && (
                                                            <div>
                                                              <span className="text-xs text-gray-600 dark:text-gray-400">Expected:</span>
                                                              <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs mt-1 overflow-x-auto">
                                                                {tc.expectedOutput}
                                                              </pre>
                                                            </div>
                                                          )}

                                                          {tc.actualOutput && (
                                                            <div>
                                                              <span className="text-xs text-gray-600 dark:text-gray-400">Got:</span>
                                                              <pre className={`p-2 rounded text-xs mt-1 overflow-x-auto ${
                                                                tc.passed
                                                                  ? 'bg-green-100 dark:bg-green-800'
                                                                  : 'bg-red-100 dark:bg-red-800'
                                                              }`}>
                                                                {tc.actualOutput}
                                                              </pre>
                                                            </div>
                                                          )}
                                                        </div>

                                                        {tc.error && (
                                                          <div className="mt-2">
                                                            <span className="text-xs text-red-600 dark:text-red-400">Error:</span>
                                                            <pre className="bg-red-100 dark:bg-red-900 p-2 rounded text-xs mt-1 overflow-x-auto text-red-800 dark:text-red-200">
                                                              {tc.error}
                                                            </pre>
                                                          </div>
                                                        )}

                                                        {tc.executionTime && (
                                                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                                            Execution time: {tc.executionTime}ms
                                                          </div>
                                                        )}
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

                                  {/* Proctoring Information */}
                                  {(result.tabSwitchCount > 0 || result.copyPasteAttempts > 0) && (
                                    <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                      <h5 className="font-medium text-gray-900 dark:text-white flex items-center mb-3">
                                        <Shield className="w-4 h-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                                        Proctoring Violations
                                      </h5>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        {result.tabSwitchCount > 0 && (
                                          <div className="flex items-center">
                                            <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                                            <span className="text-gray-700 dark:text-gray-300">
                                              Tab Switches: <strong>{result.tabSwitchCount}</strong>
                                            </span>
                                          </div>
                                        )}
                                        {result.copyPasteAttempts > 0 && (
                                          <div className="flex items-center">
                                            <AlertTriangle className="w-4 h-4 mr-2 text-red-600 dark:text-red-400" />
                                            <span className="text-gray-700 dark:text-gray-300">
                                              Copy/Paste Attempts: <strong>{result.copyPasteAttempts}</strong>
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Summary Stats */}
                                  <div className="mt-6 grid grid-cols-3 gap-4">
                                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-xs text-green-700 dark:text-green-300 mb-1">Total Score</p>
                                          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                                            {result.score || 0}
                                          </p>
                                        </div>
                                        <Award className="w-8 h-8 text-green-500" />
                                      </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Questions</p>
                                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                            {result.questionResults?.filter(q => q.correct).length || 0}/
                                            {result.questionResults?.length || 0}
                                          </p>
                                        </div>
                                        <Target className="w-8 h-8 text-blue-500" />
                                      </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-xs text-purple-700 dark:text-purple-300 mb-1">Percentage</p>
                                          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                            {result.totalMarks ? Math.round((result.score / result.totalMarks) * 100) : 0}%
                                          </p>
                                        </div>
                                        <Trophy className="w-8 h-8 text-purple-500" />
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
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No results found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        No students have submitted this test yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherTestResultsPage;
