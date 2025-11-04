import React, { useEffect, useState } from 'react';
import {
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Calendar,
  Users,
  Clock,
  MoreHorizontal,
  Play,
  StopCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TestPreviewModal from './TestPreviewModal';
import CodeEditor from './CodeEditor';

const ViewTests = ({ onNavigate }) => {
  const { user } = useAuth();
  const token = user?.token;

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openEditorTest, setOpenEditorTest] = useState(null);

  useEffect(() => {
    const fetchTests = async () => {
      if (!user || !token) return;
      try {
        const res = await fetch(
          `http://localhost:8081/api/tests/teacher/${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error('Failed to fetch tests');
        const data = await res.json();
        setTests(data);
      } catch (err) {
        console.error('Fetch tests error:', err);
        alert('Failed to fetch tests');
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, [user, token]);

  const filteredTests = tests.filter((test) => {
    const searchFields = `${test.title || ''} ${test.subject || ''}`.toLowerCase();
    const matchesSearch = searchFields.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || test.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-400 text-black';
      case 'completed':
        return 'bg-blue-500 text-white';
      case 'draft':
        return 'bg-yellow-500 text-black';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm("Are you sure you want to delete this test?")) return;
  
    try {
      const res = await fetch(`http://localhost:8081/api/tests/${testId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
  
      if (!res.ok) throw new Error("Failed to delete test");
  
      setTests((prev) => prev.filter((t) => t.id !== testId));
      alert("Test deleted successfully");
    } catch (err) {
      console.error(err);
      alert("Error deleting test");
    }
  };

  const handleStartTest = async (testId) => {
    try {
      const res = await fetch(`http://localhost:8081/api/tests/${testId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to start test");

      // Update test status in state
      setTests((prev) => prev.map((t) => 
        t.id === testId ? { ...t, status: 'active' } : t
      ));
      alert("Test started successfully! Students can now access the test.");
    } catch (err) {
      console.error(err);
      alert("Error starting test");
    }
  };

  const handleStopTest = async (testId) => {
    if (!window.confirm("Are you sure you want to stop this test? Students will no longer be able to access it.")) return;

    try {
      const res = await fetch(`http://localhost:8081/api/tests/${testId}/stop`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to stop test");

      // Update test status in state
      setTests((prev) => prev.map((t) => 
        t.id === testId ? { ...t, status: 'completed' } : t
      ));
      alert("Test stopped successfully!");
    } catch (err) {
      console.error(err);
      alert("Error stopping test");
    }
  };

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

  const openEditor = (test) => {
    setOpenEditorTest(test);
  };

  const handleCreateLink = async (test) => {
    if (!test || !test.id) return;
  
    try {
      const res = await fetch(
        `http://localhost:8081/api/tests/${test.id}/generate-link`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!res.ok) throw new Error('Failed to create link');
      
      const link = await res.text();
      navigator.clipboard.writeText(link);
      alert(`Test link created and copied to clipboard:\n${link}\n\nNote: Students can only access this link when you start the test.`);
    } catch (err) {
      console.error('Error creating test link:', err);
      alert('Failed to create test link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">Loading tests...</p>
        </div>
      </div>
    );
  }

  if (openEditorTest) {
    return (
      <CodeEditor
        test={openEditorTest}
        onClose={() => setOpenEditorTest(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              My Tests
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Manage and monitor your created assessments
            </p>
          </div>
          <button
            onClick={() => onNavigate('/create-test')}
            className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-semibold px-8 py-3 rounded-lg transition-all hover:scale-105 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Test
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-8 p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tests by name or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'draft', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-green-400 text-black'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTests.map((test, index) => (
            <div
              key={test.id}
              className={`bg-gradient-to-br ${getGradientClass(
                index
              )} rounded-lg shadow-lg p-6 transition-transform hover:scale-[1.02]`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${getIconColor(index)}`}>
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    test.status
                  )}`}
                >
                  {test.status ? test.status.charAt(0).toUpperCase() + test.status.slice(1) : 'N/A'}
                </span>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                {test.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{test.subject || ''}</p>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {test.duration || 0} minutes
                </div>
                <div className="flex items-center">
                  <MoreHorizontal className="w-4 h-4 mr-2" />
                  {test.questions?.length || 0} questions
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {/* Start/Stop Test Button */}
                {test.status === 'active' ? (
                  <button
                    onClick={() => handleStopTest(test.id)}
                    className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    <StopCircle className="w-4 h-4" />
                    Stop Test
                  </button>
                ) : test.status === 'draft' || test.status === 'completed' ? (
                  <button
                    onClick={() => handleStartTest(test.id)}
                    className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Start Test
                  </button>
                ) : null}

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedTest(test)}
                    className="flex-1 flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleCreateLink(test)}
                    className="flex-1 flex items-center justify-center gap-1 border border-green-400 text-green-500 hover:bg-green-400 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    Link
                  </button>
                  <button
                    onClick={() => handleDeleteTest(test.id)}
                    className="flex items-center justify-center border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTests.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-6">
              <Eye className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No tests found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first test to get started with assessments.'}
            </p>
            <button
              onClick={() => onNavigate('/create-test')}
              className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold px-8 py-3 rounded-lg hover:scale-105 transition-all inline-flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Test
            </button>
          </div>
        )}

        {/* Preview Modal */}
        {selectedTest && (
          <TestPreviewModal
            test={selectedTest}
            onClose={() => setSelectedTest(null)}
            onOpenEditor={openEditor}
          />
        )}
      </div>
    </div>
  );
};

export default ViewTests;