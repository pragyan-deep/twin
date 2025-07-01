
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

console.log("GOOGLE_API_KEY", process.env.GOOGLE_API_KEY ? "Found" : "Missing");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export const createEmbeddings = async (text) => {
    try {
        // Get the embedding model
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
        
        // Generate embeddings
        const result = await model.embedContent(text);
        
        // Return in OpenAI-compatible format
        return {
            data: [{
                embedding: result.embedding.values
            }],
            model: 'text-embedding-004',
            usage: {
                prompt_tokens: Math.ceil(text.length / 4), // Approximate token count
                total_tokens: Math.ceil(text.length / 4)
            }
        };
    } catch (error) {
        console.error('Google Gemini embedding error:', error);
        throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
}

const embedding = await createEmbeddings("Hello, world!");
console.log(embedding);