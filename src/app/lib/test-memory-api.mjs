import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000';

// Test data
const testMemories = [
  {
    content: "Discovered a new coffee shop called Blue Bottle today - their Gibraltar was amazing!",
    type: "diary",
    visibility: "public",
    mood: "excited",
    tags: ["coffee", "discovery", "san-francisco"]
  },
  {
    content: "I prefer dark roast coffee over light roast because it has a bolder flavor profile.",
    type: "preference", 
    visibility: "public",
    mood: "confident",
    tags: ["coffee", "taste", "preferences"]
  },
  {
    content: "I'm a software engineer with 5 years of experience in full-stack development.",
    type: "fact",
    visibility: "close_friends",
    tags: ["career", "skills", "technology"]
  }
];

async function testCreateMemory(memoryData) {
  try {
    console.log('\n📝 Testing memory creation...');
    console.log('Memory data:', JSON.stringify(memoryData, null, 2));
    
    const response = await fetch(`${API_BASE}/api/memories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(memoryData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Memory created successfully!');
      console.log('Memory ID:', result.data.memory.id);
      console.log('Processing time:', result.meta.processing_time_ms + 'ms');
      console.log('Tokens used:', result.meta.tokens_used);
      console.log('Embedding dimensions:', result.data.embedding.dimensions);
      return result;
    } else {
      console.log('❌ Memory creation failed!');
      console.log('Status:', response.status);
      console.log('Error code:', result.error);
      console.log('Message:', result.message);
      if (result.details) {
        console.log('Details:', JSON.stringify(result.details, null, 2));
      }
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

async function testInvalidInput() {
  console.log('\n🧪 Testing validation with invalid input...');
  
  const invalidMemory = {
    content: "", // Empty content should fail
    type: "invalid_type",
    visibility: "public"
  };

  await testCreateMemory(invalidMemory);
}

async function testLongContent() {
  console.log('\n🧪 Testing validation with too long content...');
  
  const longMemory = {
    content: "A".repeat(2001), // Exceeds max length
    type: "diary", 
    visibility: "public"
  };

  await testCreateMemory(longMemory);
}

async function runAllTests() {
  console.log('🚀 Starting Memory API Tests...');
  
  // Test valid memories
  for (let i = 0; i < testMemories.length; i++) {
    console.log(`\n--- Test ${i + 1}/${testMemories.length} ---`);
    await testCreateMemory(testMemories[i]);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test invalid inputs
  await testInvalidInput();
  await testLongContent();
  
  console.log('\n✨ All tests completed!');
}

// Run tests
runAllTests().catch(console.error); 