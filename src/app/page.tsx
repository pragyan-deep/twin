import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Twin Chat Application
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            A modern chat application with AI-powered embeddings generation. 
            Chat with AI or generate semantic embeddings for text analysis.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Chat Feature */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">💬</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  AI Chat
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Interactive conversations
                </p>
              </div>
            </div>
            
            <ul className="space-y-3 mb-6 text-gray-600 dark:text-gray-300">
              <li className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Real-time streaming responses</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Message reactions and management</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Dark/light theme support</span>
              </li>
            </ul>

            <Link 
              href="/chat"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Start Chatting
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Memory System Feature */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🧠</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Memory System
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Store personal memories
                </p>
              </div>
            </div>
            
            <ul className="space-y-3 mb-6 text-gray-600 dark:text-gray-300">
              <li className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Diary entries & personal facts</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Mood tracking and tagging</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Privacy controls & analytics</span>
              </li>
            </ul>

            <Link 
              href="/memories"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Manage Memories
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Embeddings Feature */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🔍</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Text Embeddings
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Semantic text analysis
                </p>
              </div>
            </div>
            
            <ul className="space-y-3 mb-6 text-gray-600 dark:text-gray-300">
              <li className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>OpenAI text-embedding-3-small</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>1536-dimensional vectors</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>REST API endpoint</span>
              </li>
            </ul>

            <Link 
              href="/chat"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Generate Embeddings
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* API Information */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              🚀 API Documentation
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              The embeddings API is available at <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">/api/embeddings</code>
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Example Request:</h4>
              <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
{`POST /api/embeddings
Content-Type: application/json

{
  "text": "Your text to generate embeddings for"
}`}
              </pre>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Example Response:</h4>
              <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
{`{
  "success": true,
  "data": {
    "text": "Your input text",
    "embeddings": [0.123, -0.456, ...],
    "model": "text-embedding-3-small",
    "usage": {
      "prompt_tokens": 4,
      "total_tokens": 4
    },
    "dimensions": 1536
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
