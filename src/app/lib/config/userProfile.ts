// User Profile Configuration
// Update these details to personalize your chat interface

export const USER_PROFILE = {
  name: "Pragyan", // Replace with your name
  title: "AI Twin", // Your title or description
  subtitle: "Digital twin of Pragyan Deep", // Subtitle to explain AI nature
  avatar: "/images/profile-avatar.jpg", // Replace with your actual image path
  greeting: "Hey there! 👋 I'm Pragyan Deep's AI twin - I think and respond just like him. What's your name?",
  
  // Chat personality
  personality: {
    greeting_style: "friendly",
    ask_for_name: true,
    show_typing_indicator: true,
    show_ai_badge: true,
  },

  // AI Twin specific settings
  ai_context: {
    description: "I'm an AI version of Pragyan Deep. I can help with coding, answer questions about his work, or just chat!",
    capabilities: [
      "💻 Coding & Development",
      "🎯 Project Guidance", 
      "💬 General Conversation"
    ]
  }
};

// Sample avatar paths you can use:
// - "/images/profile-avatar.jpg"
// - "/images/my-photo.png" 
// - "/avatars/profile.jpeg"
// Just place your image in the public folder and update the path above 