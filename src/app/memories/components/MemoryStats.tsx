'use client';

import { useState } from 'react';

interface MemoryStatsProps {
  className?: string;
}

// Mock stats data for demonstration
const mockStats = {
  total_memories: 47,
  by_type: {
    diary: 23,
    fact: 15,
    preference: 9
  },
  by_visibility: {
    public: 28,
    close_friends: 12,
    private: 7
  },
  by_mood: {
    happy: 12,
    excited: 8,
    thoughtful: 7,
    energized: 5,
    curious: 4,
    nostalgic: 3,
    calm: 3,
    frustrated: 2,
    grateful: 2,
    anxious: 1
  },
  recent_activity: {
    last_7_days: 5,
    last_30_days: 18,
    this_month: 18,
    this_year: 47
  },
  most_used_tags: [
    { tag: 'coffee', count: 8 },
    { tag: 'work', count: 7 },
    { tag: 'music', count: 6 },
    { tag: 'food', count: 5 },
    { tag: 'friends', count: 4 },
    { tag: 'learning', count: 3 },
    { tag: 'travel', count: 3 },
    { tag: 'technology', count: 2 }
  ]
};

export function MemoryStats({ className = '' }: MemoryStatsProps) {
  const [stats] = useState(mockStats);

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

  const getMoodEmoji = (mood: string) => {
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
    return moodEmojis[mood.toLowerCase()] || '😐';
  };

  const getPercentage = (value: number, total: number) => {
    return Math.round((value / total) * 100);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Memory Analytics
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Insights into your memory collection and patterns
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">📊</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.total_memories}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Memories
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">📅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.recent_activity.last_7_days}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This Week
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🗓️</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.recent_activity.last_30_days}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This Month
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🏷️</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.most_used_tags.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Unique Tags
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Memory Types */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Memory Types
        </h3>
        <div className="space-y-4">
          {Object.entries(stats.by_type).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getTypeIcon(type)}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {type}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getPercentage(count, stats.total_memories)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[3rem] text-right">
                  {count} ({getPercentage(count, stats.total_memories)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visibility Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Visibility Distribution
        </h3>
        <div className="space-y-4">
          {Object.entries(stats.by_visibility).map(([visibility, count]) => (
            <div key={visibility} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getVisibilityIcon(visibility)}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {visibility.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getPercentage(count, stats.total_memories)}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[3rem] text-right">
                  {count} ({getPercentage(count, stats.total_memories)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mood Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Mood Distribution
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(stats.by_mood).map(([mood, count]) => (
            <div key={mood} className="text-center">
              <div className="text-2xl mb-2">{getMoodEmoji(mood)}</div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize mb-1">
                {mood}
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Tags */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Most Used Tags
        </h3>
        <div className="space-y-3">
          {stats.most_used_tags.map(({ tag, count }, index) => (
            <div key={tag} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">
                  #{index + 1}
                </span>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm rounded-full">
                  #{tag}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(count / stats.most_used_tags[0].count) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[2rem] text-right">
                  {count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 