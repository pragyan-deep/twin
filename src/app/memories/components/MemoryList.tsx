'use client';

import { useState } from 'react';

interface Memory {
  id: string;
  content: string;
  type: 'fact' | 'diary' | 'preference';
  visibility: 'public' | 'close_friends' | 'private';
  mood?: string;
  tags: string[];
  created_at: string;
}

interface MemoryListProps {
  className?: string;
}

// Mock data for demonstration
const mockMemories: Memory[] = [
  {
    id: '1',
    content: 'Discovered a new coffee shop called Ritual today - their oat milk cortado was perfect. The barista was really knowledgeable about single-origin beans.',
    type: 'diary',
    visibility: 'public',
    mood: 'happy',
    tags: ['coffee', 'discovery', 'food'],
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    content: 'I prefer dark roast coffee over light roast. The bold, rich flavor really energizes me in the morning.',
    type: 'preference',
    visibility: 'public',
    mood: 'energized',
    tags: ['coffee', 'morning', 'preferences'],
    created_at: '2024-01-14T08:15:00Z'
  },
  {
    id: '3',
    content: 'I have a cat named Pixel who loves to interrupt my video calls by walking across the keyboard.',
    type: 'fact',
    visibility: 'close_friends',
    tags: ['pets', 'work', 'personal'],
    created_at: '2024-01-13T14:20:00Z'
  }
];

export function MemoryList({ className = '' }: MemoryListProps) {
  const [memories] = useState<Memory[]>(mockMemories);
  const [filterType, setFilterType] = useState<'all' | 'fact' | 'diary' | 'preference'>('all');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'close_friends' | 'private'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMemories = memories.filter(memory => {
    const matchesType = filterType === 'all' || memory.type === filterType;
    const matchesVisibility = filterVisibility === 'all' || memory.visibility === filterVisibility;
    const matchesSearch = searchQuery === '' || 
      memory.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesType && matchesVisibility && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    const icons = {
      diary: '📔',
      fact: '💡', 
      preference: '❤️'
    };
    return icons[type as keyof typeof icons] || '📝';
  };

  const getVisibilityIcon = (visibility: string) => {
    const icons = {
      public: '🌍',
      close_friends: '👥',
      private: '🔒'
    };
    return icons[visibility as keyof typeof icons] || '🌍';
  };

  const getMoodEmoji = (mood?: string) => {
    if (!mood) return '';
    const moodEmojis: Record<string, string> = {
      happy: '😊',
      excited: '🎉',
      thoughtful: '🤔',
      nostalgic: '😌',
      frustrated: '😤',
      curious: '🧐',
      energized: '⚡',
      calm: '😌',
      anxious: '😰',
      grateful: '🙏',
    };
    return moodEmojis[mood.toLowerCase()] || '';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Your Memories ({filteredMemories.length})
          </h2>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories or tags..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Types</option>
                <option value="diary">📔 Diary</option>
                <option value="fact">💡 Facts</option>
                <option value="preference">❤️ Preferences</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Visibility
              </label>
              <select
                value={filterVisibility}
                onChange={(e) => setFilterVisibility(e.target.value as typeof filterVisibility)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Visibility</option>
                <option value="public">🌍 Public</option>
                <option value="close_friends">👥 Close Friends</option>
                <option value="private">🔒 Private</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Memory Cards */}
      <div className="space-y-4">
        {filteredMemories.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No memories found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery || filterType !== 'all' || filterVisibility !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first memory'}
            </p>
          </div>
        ) : (
          filteredMemories.map((memory) => (
            <div
              key={memory.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getTypeIcon(memory.type)}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {memory.type}
                  </span>
                  {memory.mood && (
                    <span className="text-sm">{getMoodEmoji(memory.mood)}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{getVisibilityIcon(memory.visibility)}</span>
                  <span>{formatDate(memory.created_at)}</span>
                </div>
              </div>

              {/* Content */}
              <p className="text-gray-900 dark:text-gray-100 mb-4 leading-relaxed">
                {memory.content}
              </p>

              {/* Tags */}
              {memory.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {memory.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 