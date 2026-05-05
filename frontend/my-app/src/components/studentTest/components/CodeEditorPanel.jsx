import React, { useRef, useEffect, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { Play, RotateCcw, Loader2 } from "lucide-react";
import { getDefaultCode } from "../utils/codeTemplates";

const CodeEditorPanel = ({
  code,
  setCode,
  language = "cpp",
  onRun,
  onReset,
  isRunning = false,
  isTransitioning = false,
  editorTheme = "vs-dark",
}) => {
  const editorRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  // ── When question switches, push new code into editor imperatively ────────
  // This is the fix for "default code not appearing until refresh":
  // Monaco's `value` prop is uncontrolled after mount — we must call setValue.
  useEffect(() => {
    if (!editorRef.current || !isEditorReady) return;
    if (code === undefined || code === null) return;

    const currentValue = editorRef.current.getValue();
    if (currentValue !== code) {
      editorRef.current.setValue(code);
    }
  }, [code, isEditorReady]);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    setIsEditorReady(true);

    // Set initial value immediately on mount (fixes first-load blank editor)
    if (code !== undefined && code !== null) {
      editor.setValue(code);
    }

    // Editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontLigatures: true,
      lineHeight: 22,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      padding: { top: 12, bottom: 12 },
      renderLineHighlight: "gutter",
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: "on",
      smoothScrolling: true,
      tabSize: 4,
      wordWrap: "off",
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      scrollbar: {
        vertical: "auto",
        horizontal: "auto",
        verticalScrollbarSize: 6,
        horizontalScrollbarSize: 6,
      },
    });
  };

  const handleReset = () => {
    const defaultCode = getDefaultCode(language);
    setCode(defaultCode);
    editorRef.current?.setValue(defaultCode);
    editorRef.current?.focus();
    if (onReset) onReset(defaultCode);
  };

  const languageLabel = {
    cpp:    "C++17",
    c:      "C",
    python: "Python 3",
    java:   "Java",
    js:     "JavaScript",
  }[language] || language.toUpperCase();

  return (
    <div
      className={`
        flex flex-col h-full bg-gray-900
        transition-opacity duration-150
        ${isTransitioning ? "opacity-0" : "opacity-100"}
      `}
    >
      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between
                      px-4 py-2 border-b border-gray-700/60 bg-gray-900">

        {/* Language badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md
                          bg-gray-800 border border-gray-700/60 text-xs font-semibold
                          text-gray-300 cursor-default select-none">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            {languageLabel}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Reset */}
          <button
            onClick={handleReset}
            disabled={isRunning}
            title="Reset to default template"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md
                       text-xs font-medium text-gray-400
                       bg-gray-800 border border-gray-700/60
                       hover:text-white hover:border-gray-600
                       transition-all duration-150
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw size={12} />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Run */}
          <button
            onClick={onRun}
            disabled={isRunning || !isEditorReady}
            className="flex items-center gap-2 px-4 py-1.5 rounded-md
                       text-sm font-semibold text-white
                       bg-emerald-600 hover:bg-emerald-500
                       border border-emerald-500/50
                       shadow-lg shadow-emerald-900/30
                       transition-all duration-150 active:scale-95
                       disabled:opacity-50 disabled:cursor-not-allowed
                       disabled:shadow-none disabled:scale-100"
          >
            {isRunning ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Play size={14} className="fill-current" />
                Run
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Editor ────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {/* Loading shimmer shown until editor + code are both ready */}
        {!isEditorReady && (
          <div className="absolute inset-0 z-10 bg-gray-900 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-gray-600" />
          </div>
        )}

        <Editor
          height="100%"
          language={language}
          // Pass null as defaultValue — we set value imperatively in onMount
          // This prevents the "blank until refresh" race condition
          defaultValue={null}
          theme={editorTheme}
          onMount={handleEditorDidMount}
          onChange={(value) => {
            // Only propagate if editor is ready (ignores the initial setValue call)
            if (isEditorReady) setCode(value ?? "");
          }}
          loading={null} // suppress Monaco's own loading spinner
          options={{
            // These are baseline options; handleEditorDidMount refines them
            fontSize: 14,
            minimap: { enabled: false },
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditorPanel;