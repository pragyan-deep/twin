'use client';

import { ChatContainer } from './chat/components/ChatContainer';

export default function Home() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <ChatContainer className="h-full w-full" />
    </div>
  );
}
