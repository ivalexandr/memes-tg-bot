import { injectable } from 'inversify';
import OpenAI from 'openai';

type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string };

@injectable()
export class LlmService {
  private client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY!,
    baseURL: process.env.DEEPSEEK_BASE_URL,
  });
  private model = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat';

  async chat(messages: ChatMsg[]) {
    const resp = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.7,
    });
    const content = resp.choices?.[0]?.message?.content ?? '';
    return content;
  }
}
