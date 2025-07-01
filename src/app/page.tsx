'use client';

import { ChatContainer } from './chat/components/ChatContainer';

export default function Home() {
  return (
    <div className="h-screen">
      <ChatContainer className="h-full" />
    </div>
  );
}
