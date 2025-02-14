import { OpenAI } from 'openai';
import { CONFIG } from '../config/constants';
import dotenv from 'dotenv';

dotenv.config();

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OpenAI API key');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: CONFIG.EMBEDDING_MODEL,
      input: text,
    });
    
    return response.data[0].embedding;
  }

  async generateResponse(prompt: string): Promise<string> {
    const completion = await this.openai.chat.completions.create({
      model: CONFIG.OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });
    
    return completion.choices[0].message.content || '';
  }
}