'use client';

import { useState } from 'react';
import { ChatContainer } from './components/ChatContainer';
import { EmbeddingsPanel } from './components/EmbeddingsPanel';

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'embeddings'>('chat');

  return (
    <div className="h-screen flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-1 p-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'chat'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setActiveTab('embeddings')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'embeddings'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            🔍 Embeddings
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? (
          <ChatContainer className="h-full" />
        ) : (
          <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
              <EmbeddingsPanel />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 