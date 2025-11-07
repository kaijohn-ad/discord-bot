// LLMプロバイダの抽象化と実装

export type LLMProvider = 'openrouter' | 'google';

export interface LLMResponse {
  content: string;
  error?: string;
}

export interface LLMProviderInterface {
  generate(prompt: string, systemPrompt?: string): Promise<LLMResponse>;
}

// OpenRouter APIレスポンス型
interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

// OpenRouter実装（Grok 4 Fast, MiniMax-M2, gpt-oss-20B等に対応）
class OpenRouterProvider implements LLMProviderInterface {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/discord-bot',
          'X-Title': 'Discord Reminder Bot',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt },
          ],
          temperature: 0.3, // より一貫性のある出力のため
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          content: '',
          error: `OpenRouter API error: ${response.status} ${errorText}`,
        };
      }

      const data = await response.json() as OpenRouterResponse;
      const content = data.choices?.[0]?.message?.content || '';

      if (!content) {
        return {
          content: '',
          error: 'Empty response from LLM',
        };
      }

      return { content };
    } catch (error) {
      return {
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Google Gemini実装（Gemini 2.5 Flash (Sep)等に対応）
class GoogleProvider implements LLMProviderInterface {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    try {
      // @google/generative-ai を使用
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: this.model });

      const fullPrompt = systemPrompt
        ? `${systemPrompt}\n\n${prompt}`
        : prompt;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const content = response.text();

      if (!content) {
        return {
          content: '',
          error: 'Empty response from LLM',
        };
      }

      return { content };
    } catch (error) {
      return {
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// プロバイダファクトリー
export function createLLMProvider(): LLMProviderInterface | null {
  const provider = (process.env.LLM_PROVIDER || 'openrouter') as LLMProvider;
  const apiKey = process.env.LLM_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  LLM_API_KEY が設定されていません。自然言語リマインド機能は使用できません。');
    return null;
  }

  const model = process.env.LLM_MODEL || (provider === 'openrouter' ? 'x-ai/grok-beta' : 'gemini-2.5-flash-sep');

  switch (provider) {
    case 'openrouter':
      return new OpenRouterProvider(apiKey, model);
    case 'google':
      return new GoogleProvider(apiKey, model);
    default:
      console.warn(`⚠️  不明なLLMプロバイダ: ${provider}。OpenRouterを使用します。`);
      return new OpenRouterProvider(apiKey, model);
  }
}

// シングルトンインスタンス
let llmProviderInstance: LLMProviderInterface | null = null;

export function getLLMProvider(): LLMProviderInterface | null {
  if (!llmProviderInstance) {
    llmProviderInstance = createLLMProvider();
  }
  return llmProviderInstance;
}

