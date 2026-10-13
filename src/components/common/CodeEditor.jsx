import React, { useRef } from "react";
import Editor from "@monaco-editor/react";
import { RefreshCw } from "lucide-react";

const LANGUAGE_MAP = {
  python: "python",
  cpp: "cpp",
  c: "c",
  java: "java",
  javascript: "javascript",
  js: "javascript",
  typescript: "typescript",
  ts: "typescript"
};

/**
 * Modern Monaco Code Editor Wrapper
 */
export function CodeEditor({
  value = "",
  onChange,
  language = "python",
  theme = "vs-dark",
  height = "100%",
  minHeight = "420px",
  readOnly = false,
  disableCopyPaste = false,
  onClipboardBlocked = null,
  options = {},
  onMount
}) {
  const editorRef = useRef(null);

  const monacoLanguage = LANGUAGE_MAP[language.toLowerCase()] || "plaintext";

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define custom dark theme matching the platform slate-950 UI
    monaco.editor.defineTheme("sips-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "64748b", fontStyle: "italic" },
        { token: "keyword", foreground: "818cf8", fontStyle: "bold" },
        { token: "identifier", foreground: "f1f5f9" },
        { token: "string", foreground: "34d399" },
        { token: "number", foreground: "f59e0b" },
        { token: "type", foreground: "38bdf8" },
        { token: "delimiter", foreground: "94a3b8" }
      ],
      colors: {
        "editor.background": "#020617", // slate-950
        "editor.foreground": "#f8fafc",
        "editor.lineHighlightBackground": "#0f172a80",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#cbd5e1",
        "editorGutter.background": "#020617",
        "editorCursor.foreground": "#818cf8",
        "editor.selectionBackground": "#312e8166",
        "editor.inactiveSelectionBackground": "#1e1b4b44",
        "editorBracketMatch.background": "#4338ca55",
        "editorBracketMatch.border": "#6366f1"
      }
    });

    monaco.editor.setTheme("sips-dark");

    // Intercept copy/paste/cut inside Monaco if strict exam lockdown is enabled
    if (disableCopyPaste) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
        if (typeof onClipboardBlocked === "function") {
          onClipboardBlocked("Pasting code is disabled in this exam.");
        }
      });
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
        if (typeof onClipboardBlocked === "function") {
          onClipboardBlocked("Copying code is disabled in this exam.");
        }
      });
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, () => {
        if (typeof onClipboardBlocked === "function") {
          onClipboardBlocked("Cutting code is disabled in this exam.");
        }
      });
    }

    if (onMount) {
      onMount(editor, monaco);
    }
  };

  const defaultOptions = {
    contextmenu: !disableCopyPaste,
    selectOnLineNumbers: true,
    roundedSelection: true,
    readOnly,
    cursorStyle: "line",
    automaticLayout: true,
    fontSize: 13.5,
    lineHeight: 22,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
    fontLigatures: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    tabSize: 4,
    insertSpaces: true,
    autoClosingBrackets: "always",
    autoClosingQuotes: "always",
    autoClosingDelete: "always",
    autoClosingOvertype: "always",
    autoIndent: "full",
    formatOnType: true,
    formatOnPaste: true,
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true
    },
    suggestOnTriggerCharacters: true,
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true
    },
    acceptSuggestionOnEnter: "on",
    lineNumbersMinChars: 3,
    padding: { top: 12, bottom: 12 },
    wordWrap: "on",
    smoothScrolling: true,
    ...options
  };

  return (
    <div style={{ height, minHeight }} className="w-full relative overflow-hidden rounded-b-2xl bg-slate-950">
      <Editor
        height={height}
        language={monacoLanguage}
        value={value}
        theme="vs-dark"
        options={defaultOptions}
        onChange={(val) => {
          if (onChange) onChange(val || "");
        }}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 p-8 bg-slate-950">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="text-xs font-semibold">Loading Monaco Code Engine...</span>
          </div>
        }
      />
    </div>
  );
}

export default CodeEditor;
