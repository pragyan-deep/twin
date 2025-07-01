'use client';

import { useState } from 'react';
import { useEmbeddings } from '../hooks/useEmbeddings';

interface EmbeddingsPanelProps {
  className?: string;
}

export function EmbeddingsPanel({ className = '' }: EmbeddingsPanelProps) {
  const [inputText, setInputText] = useState('');
  const { isLoading, error, lastEmbedding, generateEmbeddings, clearError } = useEmbeddings();

  const handleGenerateEmbeddings = async () => {
    if (!inputText.trim()) return;
    await generateEmbeddings(inputText);
  };

  const handleClearError = () => {
    clearError();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Text Embeddings Generator
        </h2>
      </div>

      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <label htmlFor="embedding-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter text to generate embeddings:
          </label>
          <textarea
            id="embedding-text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your text here..."
            className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
            maxLength={8000}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {inputText.length}/8000 characters
            </span>
            <button
              onClick={handleGenerateEmbeddings}
              disabled={!inputText.trim() || isLoading}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                !inputText.trim() || isLoading
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </div>
              ) : (
                'Generate Embeddings'
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              </div>
              <button
                onClick={handleClearError}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Results Display */}
        {lastEmbedding && (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                ✅ Embeddings Generated Successfully
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Model:</span>
                  <span className="ml-2 font-mono text-green-700 dark:text-green-300">
                    {lastEmbedding.data.model}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Dimensions:</span>
                  <span className="ml-2 font-mono text-green-700 dark:text-green-300">
                    {lastEmbedding.data.dimensions}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Tokens Used:</span>
                  <span className="ml-2 font-mono text-green-700 dark:text-green-300">
                    {lastEmbedding.data.usage.total_tokens}
                  </span>
                </div>
              </div>
            </div>

            {/* Embeddings Vector Display */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Embedding Vector (first 10 values):
                </h4>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(lastEmbedding.data.embeddings))}
                  className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center space-x-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy Full Vector</span>
                </button>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded border p-3 font-mono text-xs">
                <div className="text-gray-600 dark:text-gray-400 mb-1">
                  [{lastEmbedding.data.embeddings.slice(0, 10).map(val => val.toFixed(6)).join(', ')}
                  {lastEmbedding.data.embeddings.length > 10 && ', ...'}]
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Showing first 10 of {lastEmbedding.data.embeddings.length} dimensions
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 