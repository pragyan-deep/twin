import OpenAI from "openai";
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export const createEmbeddings = async (text: string) => {
    return openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float",
    });
}