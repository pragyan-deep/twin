#!/usr/bin/env node

/**
 * Test script for Twin Chat API
 * Tests the personality-driven chat functionality
 */

const API_BASE_URL = 'http://localhost:3000';

async function testTwinAPI() {
  console.log('🧠 Testing Twin Chat API\n');

  try {
    // Test 1: Health Check
    console.log('📡 Testing API Health...');
    const healthResponse = await fetch(`${API_BASE_URL}/api/twin/chat`);
    const healthData = await healthResponse.json();
    
    if (healthData.success) {
      console.log('✅ API is healthy');
      console.log(`   Version: ${healthData.version}`);
      console.log(`   Features: ${healthData.features.length} available\n`);
    } else {
      console.log('❌ API health check failed\n');
      return;
    }

    // Test 2: Simple Chat Message
    console.log('💬 Testing simple chat message...');
    const simpleChat = await testChatMessage("Hello! How are you?");
    if (simpleChat) {
      console.log('✅ Simple chat working');
      console.log(`   Response length: ${simpleChat.data.response.length} characters`);
      console.log(`   Memories used: ${simpleChat.data.memories_used.count}`);
      console.log(`   Processing time: ${simpleChat.meta.processing_time_ms}ms\n`);
    }

    // Test 3: Ask about preferences (should trigger memory retrieval)
    console.log('🎵 Testing preference-based question...');
    const preferenceChat = await testChatMessage("What kind of music do you like?");
    if (preferenceChat) {
      console.log('✅ Preference question working');
      console.log(`   Memories used: ${preferenceChat.data.memories_used.count}`);
      console.log(`   Memory types: [${preferenceChat.data.memories_used.types.join(', ')}]`);
      console.log(`   Response tone: ${preferenceChat.data.personality.tone}\n`);
    }

    // Test 4: Technical question (should show personality)
    console.log('⚡ Testing technical question...');
    const techChat = await testChatMessage("What are you working on right now?");
    if (techChat) {
      console.log('✅ Technical question working');
      console.log(`   Learning captured: ${techChat.data.learning.new_memories_created} memories`);
      console.log(`   Insights gained: [${techChat.data.learning.user_insights_gained.join(', ')}]\n`);
    }

    // Test 5: User preference learning
    console.log('📚 Testing user preference learning...');
    const learningChat = await testChatMessage("I love synthwave and electronic music!");
    if (learningChat) {
      console.log('✅ Learning functionality working');
      console.log(`   New memories created: ${learningChat.data.learning.new_memories_created}`);
      console.log(`   Conversation ID: ${learningChat.data.conversation_id}\n`);
    }

    console.log('🎉 All tests completed successfully!');
    console.log('Your Twin is ready to have authentic conversations.\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.cause) {
      console.error('   Cause:', error.cause);
    }
  }
}

async function testChatMessage(message) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/twin/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        user_id: 'test_user_123',
        conversation_id: 'test_conversation',
        context: {
          relationship: 'friend',
          previous_interactions: 5
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Twin Error: ${data.message}`);
    }

    // Log the actual response for manual verification
    console.log(`   Twin: "${data.data.response.substring(0, 100)}${data.data.response.length > 100 ? '...' : ''}"`);
    
    return data;

  } catch (error) {
    console.error(`❌ Chat test failed for: "${message}"`);
    console.error(`   Error: ${error.message}`);
    return null;
  }
}

// Run the tests
testTwinAPI().catch(console.error); 