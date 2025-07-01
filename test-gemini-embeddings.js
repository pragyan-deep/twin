// Test script to verify Google Gemini integration (embeddings + chat)
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testGeminiIntegration() {
    console.log('🧪 Testing Google Gemini Full Integration...');
    
    if (!process.env.GOOGLE_API_KEY) {
        console.error('❌ GOOGLE_API_KEY not found in .env.local');
        return;
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    
    // Test 1: Embeddings
    console.log('\n📐 Testing Embeddings...');
    try {
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const testText = "This is a test for Google Gemini embeddings.";
        console.log('📝 Test text:', testText);
        
        const embeddingResult = await embeddingModel.embedContent(testText);
        
        console.log('✅ Embeddings Success!');
        console.log('🔢 Dimensions:', embeddingResult.embedding.values.length);
        console.log('🎯 First 5 values:', embeddingResult.embedding.values.slice(0, 5));
        
        if (embeddingResult.embedding.values.length === 768) {
            console.log('✅ Correct dimensions (768)');
        }
        
    } catch (error) {
        console.error('❌ Embeddings Error:', error.message);
    }
    
    // Test 2: Chat Generation
    console.log('\n💬 Testing Chat Generation...');
    try {
        const chatModel = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 100,
            }
        });
        
        const testPrompt = "You are Pragyan, a software engineer. Say hello and introduce yourself briefly.";
        console.log('📝 Test prompt:', testPrompt);
        
        const chatResult = await chatModel.generateContent(testPrompt);
        const response = chatResult.response;
        
        console.log('✅ Chat Success!');
        console.log('🤖 Response:', response.text());
        
    } catch (error) {
        console.error('❌ Chat Error:', error.message);
    }
    
    console.log('\n🎉 Gemini integration test complete!');
    console.log('💡 Both embeddings and chat are now FREE with Google Gemini');
    console.log('🔗 Get your API key: https://aistudio.google.com/app/apikey');
}

testGeminiIntegration();

// Rename this file to: test-gemini-integration.js 