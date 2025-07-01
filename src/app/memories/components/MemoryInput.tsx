'use client';

import { useState } from 'react';

interface MemoryInputProps {
  className?: string;
}

export function MemoryInput({ className = '' }: MemoryInputProps) {
  const [content, setContent] = useState('');
  const [type, setType] = useState<'fact' | 'diary' | 'preference'>('diary');
  const [visibility, setVisibility] = useState<'public' | 'close_friends' | 'private'>('public');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // TODO: Implement API call to save memory
      console.log('Saving memory:', {
        content,
        type,
        visibility,
        mood,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setContent('');
      setMood('');
      setTags('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save memory. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodEmoji = () => {
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

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Add New Memory
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Memory Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Memory Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'diary', label: 'Diary Entry', icon: '📔', desc: 'Personal experiences & moments' },
              { value: 'fact', label: 'Personal Fact', icon: '💡', desc: 'Facts about yourself' },
              { value: 'preference', label: 'Preference', icon: '❤️', desc: 'Likes, dislikes & opinions' }
            ].map(({ value, label, icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value as typeof type)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  type === value
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-2">{icon}</div>
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Content Input */}
        <div>
          <label htmlFor="memory-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Memory Content
          </label>
          <textarea
            id="memory-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              type === 'diary' ? 'Describe what happened today...' :
              type === 'fact' ? 'Share a fact about yourself...' :
              'What do you like or dislike?...'
            }
            className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
            maxLength={2000}
            required
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {content.length}/2000 characters
            </span>
          </div>
        </div>

        {/* Mood and Tags Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="mood" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mood (optional) {getMoodEmoji()}
            </label>
            <input
              id="mood"
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="happy, excited, thoughtful..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags (optional)
            </label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="music, work, friends..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Separate with commas
            </p>
          </div>
        </div>

        {/* Visibility Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Visibility
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'public', label: 'Public', icon: '🌍', desc: 'Anyone can see' },
              { value: 'close_friends', label: 'Close Friends', icon: '👥', desc: 'Authenticated users only' },
              { value: 'private', label: 'Private', icon: '🔒', desc: 'Only you can see' }
            ].map(({ value, label, icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setVisibility(value as typeof visibility)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  visibility === value
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="text-lg mb-1">{icon}</div>
                <div className="font-medium text-xs text-gray-900 dark:text-gray-100">{label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-green-700 dark:text-green-300">
                Memory saved successfully!
              </span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!content.trim() || isLoading}
            className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
              !content.trim() || isLoading
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Memory'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 