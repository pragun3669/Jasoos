import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

import {
  Search,
  AlertTriangle,
  CheckCircle,
  Shield,
  XCircle,
  Users,
  FileText,
  ArrowLeft,
  Loader,
  Eye,
  Code,
  ChevronDown,
  ChevronUp,
  Brain,
  Clock,
  GitCompare,
  Calendar,
  Hash
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

  const API_BASE_URL = "http://localhost:8081/api";

  // Load tests
  useEffect(() => {
    if (teacherId && token) fetchTests();
  }, [teacherId, token]);

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

  // Load plagiarism results
  const fetchPlagiarismData = async (testId) => {
    try {
      setResultsLoading(true);

      const res = await fetch(`${API_BASE_URL}/tests/${testId}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error fetching plagiarism results");

      const data = await res.json();

      setStudents(
        data.map((s) => ({
          ...s,

          // Backend fields → Frontend fields
          plagiarismScore: s.plagiarismScore ?? 0,
          similaritySource: s.similaritySource ?? "pass",

          studentSubmittedCode: s.studentSubmittedCode,
          aiMatchedCode: s.aiMatchedCode,
          similarStudentCode: s.similarStudentCode
        }))
      );

    } catch (e) {
      setError("Failed to fetch plagiarism data");
    } finally {
      setResultsLoading(false);
    }
  };

  // Score → Label + Color
  const getBadge = (score) => {
    if (score >= 90)
      return {
        label: "Cheating Suspected",
        color: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300"
      };
    if (score >= 70)
      return {
        label: "High Similarity",
        color: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-300"
      };
    if (score >= 60)
      return {
        label: "Moderate Similarity",
        color: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300"
      };
    return {
      label: "Clear (No Plagiarism)",
      color: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300"
    };
  };

  // Similarity Source → UI Label + Icon
  const getSimilaritySourceLabel = (src) => {
    switch (src) {
      case "ai":
        return { text: "Matches AI Code", icon: <Brain className="w-4 h-4" /> };
      case "other_student":
        return { text: "Matches Another Student", icon: <GitCompare className="w-4 h-4" /> };
      case "pass":
        return { text: "No Plagiarism Detected", icon: <CheckCircle className="w-4 h-4" /> };
      case "none":
      default:
        return { text: "No Significant Match", icon: <Shield className="w-4 h-4" /> };
    }
  };

  const filteredStudents = students.filter((stu) =>
    `${stu.name} ${stu.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">

        {/* ----------------------------------------- */}
        {/* TEST LIST PAGE */}
        {/* ----------------------------------------- */}
        {!selectedTest && (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Plagiarism Detection Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Detect similarity across student code submissions
            </p>

            {/* Search Tests */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search tests..."
                  className="pl-12 pr-4 py-3 w-full border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Test Cards Grid */}
            {loading ? (
              <div className="text-center py-20">
                <Loader className="w-10 h-10 mx-auto animate-spin text-blue-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {tests.map((test, index) => (
                  <div
                    key={test.id}
                    className={`bg-gradient-to-br ${
                        [
                          "from-green-50 to-blue-50",
                          "from-blue-50 to-purple-50",
                          "from-purple-50 to-pink-50",
                          "from-orange-50 to-red-50",
                          "from-teal-50 to-cyan-50",
                        ][index % 5]
                      }
                      dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-lg border border-gray-300 dark:border-gray-700 p-6 hover:shadow-2xl hover:scale-[1.02] cursor-pointer transition-all`}
                    onClick={() => {
                      setSelectedTest(test);
                      fetchPlagiarismData(test.id);
                    }}
                  >
                    <div className="flex justify-between mb-4">
                      <div className="p-3 bg-blue-500 rounded-xl">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 rounded-full text-sm font-medium">
                        ID: {test.id}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {test.title}
                    </h2>

                    <div className="text-gray-600 dark:text-gray-400 text-sm space-y-1">
                      <p className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {test.duration} minutes
                      </p>
                      <p className="flex items-center">
                        <Hash className="w-4 h-4 mr-2" />
                        {test.questions?.length || 0} questions
                      </p>
                      <p className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {test.createdDate
                          ? new Date(test.createdDate).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ----------------------------------------- */}
        {/* SELECTED TEST DETAIL PAGE */}
        {/* ----------------------------------------- */}
        {selectedTest && (
          <>
            {/* Back Button */}
            <button
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-400 mb-6"
              onClick={() => {
                setSelectedTest(null);
                setStudents([]);
                setExpandedStudent(null);
              }}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Tests
            </button>

            {/* Test Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedTest.title} - Plagiarism Analysis
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Review similarity scores and flagged code
                  </p>
                </div>

                <div className="relative w-72">
                  <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="pl-12 pr-4 py-3 w-full border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* TABLE */}
            {resultsLoading ? (
              <div className="text-center py-20">
                <Loader className="w-10 h-10 mx-auto animate-spin text-blue-400" />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="p-4 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                        Student
                      </th>
                      <th className="p-4 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                        Email
                      </th>
                      <th className="p-4 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                        Plagiarism %
                      </th>
                      <th className="p-4 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                        Source
                      </th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map((stu) => {
                      const badge = getBadge(stu.plagiarismScore);
                      const src = getSimilaritySourceLabel(stu.similaritySource);

                      return (
                        <React.Fragment key={stu.studentId}>
                          <tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                            <td className="p-4">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                                  {stu.name?.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {stu.name}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="p-4 text-gray-600 dark:text-gray-300">
                              {stu.email}
                            </td>

                            <td className="p-4 text-xl font-bold text-blue-500 dark:text-blue-300">
                              {stu.plagiarismScore}%
                            </td>

                            <td className="p-4">
                              <span
                                className={`inline-flex items-center gap-2 px-3 py-1 text-xs rounded-full border ${badge.color}`}
                              >
                                {src.icon}
                                {src.text}
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
                                className="text-blue-500 hover:text-blue-700"
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
                            <tr className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
                              <td colSpan="5" className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                  {/* Student Code */}
                                  <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 shadow">
                                    <h3 className="flex items-center text-lg font-bold mb-3 text-blue-500">
                                      <Code className="w-5 h-5 mr-2" />
                                      Student Code
                                    </h3>
                                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto max-h-80">
                                    { (stu.questionResults?.[0]?.submittedCode) || "No code provided" }
                                    </pre>
                                    
                                  </div>

                                  {/* AI Code */}
                                  <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 shadow">
                                    <h3 className="flex items-center text-lg font-bold mb-3 text-green-500">
                                      <Brain className="w-5 h-5 mr-2" />
                                      AI Generated Code
                                    </h3>
                                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto max-h-80">
  { (stu.questionResults?.[0]?.aiGeneratedSolution) || "No AI code found" }
</pre>
                                  </div>

                                  {/* Other Student */}
                                  <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 shadow">
                                    <h3 className="flex items-center text-lg font-bold mb-3 text-purple-500">
                                      <GitCompare className="w-5 h-5 mr-2" />
                                      Matching Student Code
                                    </h3>
                                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto max-h-80">
  { stu.similarStudentCode || "No matching student found" }
</pre>
                                  </div>

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
                  <div className="text-center py-20">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No students found</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherPlagiarismPage;
