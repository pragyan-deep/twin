
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

console.log("OPENAI_API_KEY", process.env.OPENAI_API_KEY);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export const createEmbeddings = async (text) => {
    return openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float",
    });
}

const embedding = await createEmbeddings("Hello, world!");
console.log(embedding);