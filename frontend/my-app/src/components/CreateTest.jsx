import React, { useState } from 'react';
import {
  Plus, Save, Code, Trash2, CheckCircle, AlertCircle,
  Sparkles, FileCode, Clock, Hash, Wand2, ChevronDown,
  ChevronUp, RefreshCw, Eye, EyeOff, Terminal, Zap, ArrowRight, Star
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

/* ─────────────────────────────────────────────
   PHASE 1 — AI Generation panel
───────────────────────────────────────────── */
const AIGeneratePanel = ({ onQuestionsGenerated }) => {
  const { user } = useAuth();
  const token = user?.token;

  const [aiConfig, setAiConfig] = useState({
    topic: '',
    difficulty: 'Medium',
    numberOfQuestions: 3,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleGenerate = async () => {
    if (!aiConfig.topic.trim()) {
      setAiError('Please enter a topic.');
      return;
    }
    setAiError('');
    setIsGenerating(true);
    try {
      const response = await axios.post(
        'http://localhost:8081/api/tests/ai-generate',
        {
          topic: aiConfig.topic,
          difficulty: aiConfig.difficulty,
          numberOfQuestions: Number(aiConfig.numberOfQuestions),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onQuestionsGenerated(response.data.questions || []);
    } catch (err) {
      setAiError(err.response?.data?.message || 'AI generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const difficultyColors = {
    Easy: 'from-emerald-400 to-green-500',
    Medium: 'from-amber-400 to-orange-500',
    Hard: 'from-red-400 to-rose-600',
  };

  return (
    <div className="relative bg-gray-900 p-8 rounded-3xl border border-gray-700/50 overflow-hidden shadow-2xl">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      
      {/* Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-violet-500/30">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">AI Question Generator</h2>
            <p className="text-gray-400 text-sm mt-0.5">Generate questions, test cases & reference solutions instantly</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold px-3 py-1.5 rounded-full">
            <Zap className="w-3 h-3" />
            AI Powered
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
          {/* Topic — wide */}
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Topic / Problem Area <span className="text-violet-400">*</span>
            </label>
            <input
              className="w-full px-4 py-3 rounded-xl border border-gray-700 focus:border-violet-500 bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all duration-200 text-sm"
              value={aiConfig.topic}
              onChange={e => setAiConfig(p => ({ ...p, topic: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g., Binary Search Trees, Graph traversal..."
            />
          </div>

          {/* Difficulty */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Difficulty</label>
            <div className="flex gap-2">
              {['Easy', 'Medium', 'Hard'].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setAiConfig(p => ({ ...p, difficulty: d }))}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all duration-200 ${
                    aiConfig.difficulty === d
                      ? `bg-gradient-to-r ${difficultyColors[d]} text-white border-transparent shadow-lg`
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Count</label>
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5">
              <button type="button"
                onClick={() => setAiConfig(p => ({ ...p, numberOfQuestions: Math.max(1, p.numberOfQuestions - 1) }))}
                className="text-gray-400 hover:text-white w-6 h-6 flex items-center justify-center text-lg font-bold transition-colors"
              >−</button>
              <span className="flex-1 text-center text-white font-bold text-lg">{aiConfig.numberOfQuestions}</span>
              <button type="button"
                onClick={() => setAiConfig(p => ({ ...p, numberOfQuestions: Math.min(10, p.numberOfQuestions + 1) }))}
                className="text-gray-400 hover:text-white w-6 h-6 flex items-center justify-center text-lg font-bold transition-colors"
              >+</button>
            </div>
          </div>

          {/* Generate */}
          <div className="md:col-span-2 flex items-end">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-4 py-3 rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? 'Generating' : 'Generate'}
            </button>
          </div>
        </div>

        {aiError && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {aiError}
          </div>
        )}

        {isGenerating && (
          <div className="mt-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {[0,1,2,3,4].map(i => (
                  <div key={i} className="w-1.5 h-6 bg-violet-500 rounded-full animate-bounce opacity-80"
                    style={{ animationDelay: `${i * 0.12}s` }} />
                ))}
              </div>
              <div>
                <p className="text-violet-300 text-sm font-semibold">Generating questions, test cases & solutions</p>
                <p className="text-violet-400/60 text-xs mt-0.5">This may take a few seconds...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   PHASE 2 — Review & select generated questions
───────────────────────────────────────────── */
const AIQuestionCard = ({ question, index, isSelected, onToggleSelect }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
      isSelected
        ? 'border-violet-500/70 bg-violet-500/5 shadow-lg shadow-violet-500/10'
        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
    }`}>
      <div className="p-5 flex items-start gap-4">
        <button type="button" onClick={onToggleSelect}
          className={`flex-shrink-0 w-6 h-6 mt-0.5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
            isSelected ? 'bg-violet-500 border-violet-500 text-white' : 'border-gray-600 hover:border-violet-400'
          }`}
        >
          {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-violet-500/20 text-violet-300 text-xs font-bold px-2 py-0.5 rounded-md border border-violet-500/30">
              Q{index + 1}
            </span>
            {question.testCases?.length > 0 && (
              <span className="text-gray-500 text-xs">{question.testCases.length} test cases</span>
            )}
            {question.aiSolution && (
              <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-md border border-emerald-500/20">
                ✓ Solution included
              </span>
            )}
          </div>
          <p className="text-gray-200 text-sm leading-relaxed line-clamp-2">{question.description}</p>
        </div>

        <button type="button" onClick={() => setExpanded(p => !p)}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-500 hover:text-gray-300"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-700/50 pt-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Full Description</p>
            <p className="text-sm text-gray-300 bg-gray-900/50 p-4 rounded-xl leading-relaxed whitespace-pre-wrap border border-gray-700/50">
              {question.description}
            </p>
          </div>

          {question.testCases?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Test Cases</p>
              <div className="space-y-2">
                {question.testCases.map((tc, i) => (
                  <div key={i} className="bg-gray-950 rounded-xl p-3 text-xs font-mono border border-gray-800">
                    <div className="flex gap-3 mb-1">
                      <span className="text-emerald-400 font-semibold w-14 flex-shrink-0">Input</span>
                      <span className="text-gray-300">{tc.inputData}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-blue-400 font-semibold w-14 flex-shrink-0">Output</span>
                      <span className="text-gray-300">{tc.expectedOutput}</span>
                    </div>
                    {tc.exampleCase && <span className="mt-2 inline-block text-amber-400 text-xs">★ Example</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {question.aiSolution && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Reference Solution</p>
              <pre className="bg-gray-950 text-emerald-400 text-xs p-4 rounded-xl overflow-x-auto whitespace-pre-wrap max-h-52 overflow-y-auto border border-gray-800 font-mono">
                {question.aiSolution}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   PHASE 3 — Editable question in the test form
   NOTE: AI Reference Solution section removed —
         it's already attached from generation.
───────────────────────────────────────────── */
const QuestionEditor = ({ q, qIdx, errors, onQuestionChange, onTestCaseChange, addTestCase, removeTestCase, onRemoveQuestion }) => {
  return (
    <div className="bg-gray-900 border border-gray-700/60 rounded-3xl overflow-hidden shadow-xl">
      {/* Question header bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-700/50 bg-gradient-to-r from-emerald-500/10 to-teal-500/5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl w-9 h-9 flex items-center justify-center font-black text-sm shadow-lg shadow-emerald-500/30">
            {qIdx + 1}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Question {qIdx + 1}</h3>
            {q.aiSolution && (
              <span className="text-xs text-emerald-400/80">✓ AI reference solution attached</span>
            )}
          </div>
        </div>
        <button type="button" onClick={() => onRemoveQuestion(qIdx)}
          className="text-gray-600 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-xl transition-all duration-200"
          title="Remove question"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-8 space-y-6">
        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Problem Description <span className="text-rose-400">*</span>
          </label>
          <textarea
            className={`w-full px-4 py-3 rounded-xl border ${
              errors[`question_${qIdx}_description`]
                ? 'border-red-500/60 focus:border-red-500'
                : 'border-gray-700 focus:border-emerald-500/60'
            } bg-gray-800/60 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 min-h-[120px] resize-y text-sm leading-relaxed`}
            value={q.description}
            onChange={e => onQuestionChange(qIdx, 'description', e.target.value)}
            placeholder="Describe the problem statement, constraints, expected I/O format..."
          />
          {errors[`question_${qIdx}_description`] && (
            <p className="mt-2 flex items-center gap-1.5 text-red-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5" />{errors[`question_${qIdx}_description`]}
            </p>
          )}
        </div>

        {/* Marks + Advanced */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Marks <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              className={`w-full px-4 py-3 rounded-xl border ${
                errors[`question_${qIdx}_marks`] ? 'border-red-500/60' : 'border-gray-700 focus:border-emerald-500/60'
              } bg-gray-800/60 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm`}
              value={q.marks}
              onChange={e => onQuestionChange(qIdx, 'marks', e.target.value)}
              placeholder="100"
              min={1}
            />
            {errors[`question_${qIdx}_marks`] && (
              <p className="mt-1.5 text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors[`question_${qIdx}_marks`]}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Max Input Size</label>
            <input type="number"
              className="w-full px-4 py-3 rounded-xl border border-gray-700 focus:border-emerald-500/60 bg-gray-800/60 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
              value={q.maxInputSize}
              onChange={e => onQuestionChange(qIdx, 'maxInputSize', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Complexity</label>
            <input type="text"
              className="w-full px-4 py-3 rounded-xl border border-gray-700 focus:border-emerald-500/60 bg-gray-800/60 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
              value={q.complexity}
              onChange={e => onQuestionChange(qIdx, 'complexity', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Time Limit (s)</label>
            <input type="number" step="0.1"
              className="w-full px-4 py-3 rounded-xl border border-gray-700 focus:border-emerald-500/60 bg-gray-800/60 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
              value={q.baseTimeLimit}
              onChange={e => onQuestionChange(qIdx, 'baseTimeLimit', e.target.value)}
            />
          </div>
        </div>

        {/* Test Cases */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Test Cases</h4>
            <span className="ml-auto text-xs text-gray-500">{q.testCases.length} case{q.testCases.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="space-y-3">
            {q.testCases.map((tc, tcIdx) => (
              <div key={tcIdx} className="bg-gray-800/40 rounded-2xl border border-gray-700/50 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 bg-gray-700 px-2.5 py-1 rounded-lg">
                      TC {tcIdx + 1}
                    </span>
                    {tc.exampleCase && (
                      <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                        ★ Example
                      </span>
                    )}
                  </div>
                  {q.testCases.length > 1 && (
                    <button type="button" onClick={() => removeTestCase(qIdx, tcIdx)}
                      className="text-gray-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Input <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      className={`w-full px-3 py-2.5 rounded-xl border ${
                        errors[`question_${qIdx}_tc_${tcIdx}_input`] ? 'border-red-500/60' : 'border-gray-700 focus:border-emerald-500/50'
                      } bg-gray-900/70 text-gray-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/15 transition-all min-h-[80px] resize-y`}
                      value={tc.inputData}
                      onChange={e => onTestCaseChange(qIdx, tcIdx, 'inputData', e.target.value)}
                    />
                    {errors[`question_${qIdx}_tc_${tcIdx}_input`] && (
                      <p className="mt-1 text-red-400 text-xs">{errors[`question_${qIdx}_tc_${tcIdx}_input`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Expected Output <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      className={`w-full px-3 py-2.5 rounded-xl border ${
                        errors[`question_${qIdx}_tc_${tcIdx}_output`] ? 'border-red-500/60' : 'border-gray-700 focus:border-emerald-500/50'
                      } bg-gray-900/70 text-gray-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/15 transition-all min-h-[80px] resize-y`}
                      value={tc.expectedOutput}
                      onChange={e => onTestCaseChange(qIdx, tcIdx, 'expectedOutput', e.target.value)}
                    />
                    {errors[`question_${qIdx}_tc_${tcIdx}_output`] && (
                      <p className="mt-1 text-red-400 text-xs">{errors[`question_${qIdx}_tc_${tcIdx}_output`]}</p>
                    )}
                  </div>
                </div>

                <label className="flex items-center gap-2 mt-3 cursor-pointer w-fit group">
                  <input type="checkbox" checked={tc.exampleCase}
                    onChange={e => onTestCaseChange(qIdx, tcIdx, 'exampleCase', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-amber-500 focus:ring-amber-500/30 focus:ring-offset-0"
                  />
                  <span className="text-xs font-medium text-gray-500 group-hover:text-gray-300 transition-colors">
                    Mark as example (visible to students)
                  </span>
                </label>
              </div>
            ))}
          </div>

          {errors[`question_${qIdx}_testcases`] && (
            <p className="mt-2 flex items-center gap-1.5 text-red-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5" />{errors[`question_${qIdx}_testcases`]}
            </p>
          )}

          <button type="button" onClick={() => addTestCase(qIdx)}
            className="mt-3 w-full bg-gray-800/50 hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-400 font-semibold px-4 py-3 rounded-xl border border-dashed border-gray-700 hover:border-emerald-500/40 transition-all duration-200 flex items-center justify-center gap-2 text-sm group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            Add Test Case
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const CreateTest = () => {
  const { user } = useAuth();
  const token = user?.token;

  const [phase, setPhase] = useState('generate');
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState(new Set());

  const [formData, setFormData] = useState({ title: '', duration: '', questions: [] });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleQuestionsGenerated = (questions) => {
    setAiGeneratedQuestions(questions);
    setSelectedIndices(new Set(questions.map((_, i) => i)));
    setPhase('review');
  };

  const toggleSelect = (i) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleAddSelectedToForm = () => {
    const picked = aiGeneratedQuestions
      .filter((_, i) => selectedIndices.has(i))
      .map((q, idx) => ({
        id: Date.now() + idx,
        description: q.description || '',
        marks: 100,
        maxInputSize: 200000,
        complexity: 'O(N)',
        baseTimeLimit: 1.0,
        aiSolution: q.aiSolution || '',
        testCases: (q.testCases || []).length > 0
          ? q.testCases
          : [{ id: 1, inputData: '', expectedOutput: '', exampleCase: true }],
      }));
    setFormData(prev => ({ ...prev, questions: [...prev.questions, ...picked] }));
    setPhase('edit');
  };

  const addBlankQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, {
        id: Date.now(),
        description: '',
        marks: 100,
        maxInputSize: 200000,
        complexity: 'O(N)',
        baseTimeLimit: 1.0,
        aiSolution: '',
        testCases: [{ id: 1, inputData: '', expectedOutput: '', exampleCase: true }],
      }],
    }));
    if (phase !== 'edit') setPhase('edit');
  };

  const handleQuestionChange = (qIdx, field, value) =>
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === qIdx ? { ...q, [field]: value } : q),
    }));

  const handleTestCaseChange = (qIdx, tcIdx, field, value) =>
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIdx
          ? { ...q, testCases: q.testCases.map((tc, j) => j === tcIdx ? { ...tc, [field]: value } : tc) }
          : q
      ),
    }));

  const addTestCase = (qIdx) =>
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIdx
          ? { ...q, testCases: [...q.testCases, { id: Date.now(), inputData: '', expectedOutput: '', exampleCase: false }] }
          : q
      ),
    }));

  const removeTestCase = (qIdx, tcIdx) =>
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIdx ? { ...q, testCases: q.testCases.filter((_, j) => j !== tcIdx) } : q
      ),
    }));

  const removeQuestion = (qIdx) =>
    setFormData(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== qIdx) }));

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Test title is required';
    if (!formData.duration || formData.duration <= 0) newErrors.duration = 'Duration must be greater than 0';
    if (!formData.questions.length) newErrors.questions = 'Add at least one question';
    formData.questions.forEach((q, qIdx) => {
      if (!q.description.trim()) newErrors[`question_${qIdx}_description`] = 'Question description is required';
      if (!q.marks || q.marks <= 0) newErrors[`question_${qIdx}_marks`] = 'Marks must be > 0';
      if (!q.testCases.length) newErrors[`question_${qIdx}_testcases`] = 'At least one test case required';
      q.testCases.forEach((tc, tcIdx) => {
        if (!tc.inputData.trim()) newErrors[`question_${qIdx}_tc_${tcIdx}_input`] = 'Input required';
        if (!tc.expectedOutput.trim()) newErrors[`question_${qIdx}_tc_${tcIdx}_output`] = 'Output required';
      });
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!user || !token) { alert('You must be logged in to create a test'); return; }
    setIsLoading(true);
    const payload = {
      title: formData.title,
      duration: parseInt(formData.duration),
      createdBy: user.id,
      questions: formData.questions.map(q => ({
        description: q.description,
        marks: parseInt(q.marks),
        maxInputSize: q.maxInputSize || 200000,
        complexity: q.complexity || 'O(N)',
        baseTimeLimit: q.baseTimeLimit || 1.0,
        aiSolution: q.aiSolution || "", 
        testCases: q.testCases.map(tc => ({
          inputData: tc.inputData,
          expectedOutput: tc.expectedOutput,
          exampleCase: tc.exampleCase,
        })),
      })),
    };
    try {
      await axios.post('http://localhost:8081/api/tests', payload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      alert('Test created successfully!');
      setFormData({ title: '', duration: '', questions: [] });
      setAiGeneratedQuestions([]);
      setSelectedIndices(new Set());
      setErrors({});
      setPhase('generate');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create test');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { key: 'generate', num: '01', label: 'Generate' },
    { key: 'review',   num: '02', label: 'Review' },
    { key: 'edit',     num: '03', label: 'Finalise' },
  ];
  const phaseOrder = { generate: 0, review: 1, edit: 2 };

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-emerald-950/60 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-gradient-to-tl from-violet-950/40 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative">
        {/* ── PAGE HEADER ── */}
        <div className="mb-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-3">
                <div className="w-4 h-px bg-emerald-400" />
                Test Management
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight leading-none">
                Create New Test
              </h1>
              <p className="text-gray-500 mt-2 text-sm">
                Design coding challenges powered by AI — generate, review, and publish in minutes.
              </p>
            </div>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-0">
            {steps.map((step, i) => {
              const current = phaseOrder[phase];
              const stepIndex = phaseOrder[step.key];
              const done = current > stepIndex;
              const active = current === stepIndex;
              return (
                <React.Fragment key={step.key}>
                  <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    active ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                    : done ? 'text-emerald-500/70'
                    : 'text-gray-600'
                  }`}>
                    <span className={`text-xs font-black ${active ? 'text-emerald-400' : done ? 'text-emerald-600' : 'text-gray-700'}`}>
                      {done ? '✓' : step.num}
                    </span>
                    {step.label}
                  </div>
                  {i < steps.length - 1 && (
                    <ArrowRight className={`w-4 h-4 mx-1 transition-colors ${phaseOrder[phase] > i ? 'text-emerald-600' : 'text-gray-800'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1 */}
          <AIGeneratePanel onQuestionsGenerated={handleQuestionsGenerated} />

          {/* STEP 2 */}
          {phase !== 'generate' && aiGeneratedQuestions.length > 0 && (
            <div className="bg-gray-900 rounded-3xl border border-gray-700/50 overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-700/50">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Review Generated Questions</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {selectedIndices.size} of {aiGeneratedQuestions.length} selected
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <button type="button"
                    onClick={() => setSelectedIndices(new Set(aiGeneratedQuestions.map((_, i) => i)))}
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                  >
                    Select all
                  </button>
                  <button type="button"
                    onClick={() => setSelectedIndices(new Set())}
                    className="text-gray-600 hover:text-gray-400 font-semibold transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-3 mb-2">
                {aiGeneratedQuestions.map((q, i) => (
                  <AIQuestionCard key={i} question={q} index={i}
                    isSelected={selectedIndices.has(i)} onToggleSelect={() => toggleSelect(i)}
                  />
                ))}
              </div>

              <div className="px-8 pb-8">
                <button type="button" onClick={handleAddSelectedToForm}
                  disabled={selectedIndices.size === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold px-8 py-4 rounded-2xl shadow-xl hover:shadow-blue-500/30 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base relative overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <Plus className="w-5 h-5" />
                  Add {selectedIndices.size} Question{selectedIndices.size !== 1 ? 's' : ''} to Test
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {(phase === 'edit' || formData.questions.length > 0) && (
            <>
              {/* Test Config */}
              <div className="bg-gray-900 rounded-3xl border border-gray-700/50 p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-gray-600 to-gray-700 p-2.5 rounded-xl">
                    <FileCode className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Test Configuration</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                      Test Title <span className="text-rose-400">*</span>
                    </label>
                    <input
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.title ? 'border-red-500/60' : 'border-gray-700 focus:border-emerald-500/60'
                      } bg-gray-800/60 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm`}
                      value={formData.title}
                      onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g., Data Structures Mid-Term Exam"
                    />
                    {errors.title && (
                      <p className="mt-1.5 text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />Duration (min) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.duration ? 'border-red-500/60' : 'border-gray-700 focus:border-emerald-500/60'
                      } bg-gray-800/60 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm`}
                      value={formData.duration}
                      onChange={e => setFormData(p => ({ ...p, duration: e.target.value }))}
                      placeholder="60"
                      min={1}
                    />
                    {errors.duration && (
                      <p className="mt-1.5 text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.duration}</p>
                    )}
                  </div>
                </div>
              </div>

              {errors.questions && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-2xl">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{errors.questions}
                </div>
              )}

              {/* Question Editors */}
              {formData.questions.map((q, qIdx) => (
                <QuestionEditor
                  key={q.id || qIdx}
                  q={q} qIdx={qIdx} errors={errors}
                  onQuestionChange={handleQuestionChange}
                  onTestCaseChange={handleTestCaseChange}
                  addTestCase={addTestCase}
                  removeTestCase={removeTestCase}
                  onRemoveQuestion={removeQuestion}
                />
              ))}

              {/* Add blank */}
              <button type="button" onClick={addBlankQuestion}
                className="w-full text-gray-600 hover:text-emerald-400 font-semibold px-6 py-4 rounded-2xl border border-dashed border-gray-800 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all duration-200 flex items-center justify-center gap-2 text-sm group"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                Add Question Manually
              </button>

              {/* Submit */}
              <div className="pb-8">
                <button type="submit" disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-8 py-5 rounded-2xl shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base group relative overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Publishing test...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Publish Test
                      <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {phase !== 'edit' && formData.questions.length === 0 && (
            <div className="text-center py-2">
              <button type="button" onClick={addBlankQuestion}
                className="text-gray-700 hover:text-gray-400 text-xs transition-colors underline underline-offset-4"
              >
                Skip AI — add questions manually
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateTest;