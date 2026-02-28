import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

export interface OllamaGenerateResponse {
    model: string;
    response: string;
    done: boolean;
    totalDuration?: number;
    promptEvalCount?: number;
    evalCount?: number;
}

export interface OllamaChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

@Injectable()
export class OllamaService {
    private readonly logger = new Logger(OllamaService.name);
    private readonly baseUrl: string;
    private readonly defaultModel: string;
    private readonly timeout: number;

    constructor(private readonly config: ConfigService) {
        this.baseUrl = this.config.get<string>('app.ollama.baseUrl', 'http://localhost:11434');
        this.defaultModel = this.config.get<string>('app.ollama.model', 'llama3.2');
        this.timeout = this.config.get<number>('app.ollama.timeoutMs', 60000);
    }

    /**
     * Generate a response using Ollama's /api/generate endpoint.
     */
    async generate(
        prompt: string,
        options: {
            model?: string;
            systemPrompt?: string;
            temperature?: number;
            maxTokens?: number;
        } = {},
    ): Promise<string> {
        const model = options.model || this.defaultModel;

        try {
            const response = await axios.post<OllamaGenerateResponse>(
                `${this.baseUrl}/api/generate`,
                {
                    model,
                    prompt,
                    system: options.systemPrompt,
                    stream: false,
                    options: {
                        temperature: options.temperature ?? 0.1, // Low temp for factual RAG
                        num_predict: options.maxTokens ?? 1024,
                        top_p: 0.9,
                        repeat_penalty: 1.1,
                    },
                },
                { timeout: this.timeout },
            );

            return response.data.response.trim();
        } catch (err) {
            return this.handleOllamaError(err, model);
        }
    }

    /**
     * Generate using chat format (recommended for instruction-tuned models).
     */
    async chat(
        messages: OllamaChatMessage[],
        options: { model?: string; temperature?: number } = {},
    ): Promise<string> {
        const model = options.model || this.defaultModel;

        try {
            const response = await axios.post(
                `${this.baseUrl}/api/chat`,
                {
                    model,
                    messages,
                    stream: false,
                    options: {
                        temperature: options.temperature ?? 0.1,
                        num_predict: 1024,
                        top_p: 0.9,
                    },
                },
                { timeout: this.timeout },
            );

            return response.data.message?.content?.trim() || '';
        } catch (err) {
            return this.handleOllamaError(err, model);
        }
    }

    /**
     * Check if Ollama is reachable and the model is available.
     */
    async healthCheck(): Promise<{ available: boolean; models: string[]; error?: string }> {
        try {
            const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
            const models: string[] = (response.data?.models || []).map((m: any) => m.name);
            return { available: true, models };
        } catch (err) {
            return {
                available: false,
                models: [],
                error: err instanceof AxiosError ? err.message : String(err),
            };
        }
    }

    /**
     * Pull a model from Ollama registry.
     */
    async pullModel(modelName: string): Promise<void> {
        this.logger.log(`Pulling Ollama model: ${modelName}`);
        await axios.post(`${this.baseUrl}/api/pull`, { name: modelName, stream: false }, { timeout: 300000 });
    }

    private handleOllamaError(err: unknown, model: string): string {
        if (err instanceof AxiosError) {
            if (err.code === 'ECONNREFUSED') {
                this.logger.error(`Ollama not running at ${this.baseUrl}`);
                return this.getFallbackResponse();
            }
            if (err.response?.status === 404) {
                this.logger.error(`Model "${model}" not found in Ollama. Run: ollama pull ${model}`);
                return this.getFallbackResponse();
            }
            if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
                this.logger.error(`Ollama timeout for model "${model}"`);
                return this.getFallbackResponse('timeout');
            }
            this.logger.error(`Ollama error: ${err.response?.data?.error || err.message}`);
        } else {
            this.logger.error(`Unexpected Ollama error: ${String(err)}`);
        }
        return this.getFallbackResponse();
    }

    private getFallbackResponse(reason?: string): string {
        if (reason === 'timeout') {
            return "Je n'ai pas trouvé cette information dans les documents officiels disponibles. (LLM timeout — Veuillez contacter l'administration.)";
        }
        return "Je n'ai pas trouvé cette information dans les documents officiels disponibles. (Service LLM indisponible — Veuillez contacter l'administration.)";
    }

    getModel(): string {
        return this.defaultModel;
    }

    getBaseUrl(): string {
        return this.baseUrl;
    }
}
