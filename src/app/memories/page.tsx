'use client';

import { useState } from 'react';
import { MemoryInput } from './components/MemoryInput';
import { MemoryList } from './components/MemoryList';
import { MemoryStats } from './components/MemoryStats';
import { ProtectedRoute } from '../lib/components/ProtectedRoute';

export default function MemoriesPage() {
  const [activeTab, setActiveTab] = useState<'input' | 'list' | 'stats'>('input');

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Memory System
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Store and manage your personal memories
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-1 p-1">
          <button
            onClick={() => setActiveTab('input')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'input'
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            ✍️ Add Memory
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'list'
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            📚 Browse Memories
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'stats'
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            📊 Stats
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'input' && (
          <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
              <MemoryInput />
            </div>
          </div>
        )}
        
        {activeTab === 'list' && (
          <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-6xl mx-auto">
              <MemoryList />
            </div>
          </div>
        )}
        
        {activeTab === 'stats' && (
          <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
              <MemoryStats />
            </div>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
} 