'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';

interface OutputViewerProps {
  code: string;
}

export default function OutputViewer({ code }: OutputViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swagger-types-${Date.now()}.ts`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!code) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-white ml-2 sm:ml-4">
            💎 Generated TypeScript
          </h2>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 min-w-[80px] sm:min-w-0 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-all duration-200 border border-gray-600 flex-1 sm:flex-initial"
          >
            {copied ? (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="hidden sm:inline">Copied!</span>
                <span className="inline sm:hidden">✓</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span className="hidden sm:inline">Copy</span>
                <span className="inline sm:hidden text-xs">Copy</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 min-w-[100px] sm:min-w-0 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex-1 sm:flex-initial"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span className="hidden sm:inline">Download .ts</span>
            <span className="inline sm:hidden text-xs">Download</span>
          </button>
        </div>
      </div>

      <div className="h-[400px] sm:h-[500px] md:h-[600px]">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          value={code}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineNumbers: 'on',
            renderWhitespace: 'none',
            folding: true,
            automaticLayout: true,
            wordWrap: 'on',
            wrappingIndent: 'indent',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: true,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
            contextmenu: true,
            selectOnLineNumbers: true,
            roundedSelection: true,
            cursorStyle: 'line',
            glyphMargin: false,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'line',
            quickSuggestions: false,
            suggest: { enabled: false },
            parameterHints: { enabled: false },
            hover: { enabled: true },
            links: false,
            colorDecorators: false,
          }}
          loading={
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <svg
                    className="animate-spin h-10 w-10 text-primary-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-gray-300 font-medium text-sm">Loading Editor...</p>
                  <p className="text-gray-500 text-xs mt-1">Initializing Monaco</p>
                </div>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
