import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

export interface OllamaStatus {
    available: boolean;
    ready: boolean;
    model: string;
    message: string;
    models: string[];
}

export interface OllamaChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

@Injectable()
export class OllamaService implements OnModuleInit {
    private readonly logger = new Logger(OllamaService.name);
    private readonly baseUrl: string;
    private readonly modelName: string;
    private readonly timeout: number;
    private isReady = false;

    constructor(private readonly config: ConfigService) {
        // Support for multiple config structures during transition
        this.baseUrl = this.config.get<string>('OLLAMA_BASE_URL') ||
            this.config.get<string>('app.ollama.baseUrl', 'http://localhost:11434');
        this.modelName = this.config.get<string>('OLLAMA_MODEL') ||
            this.config.get<string>('app.ollama.model', 'llama3.2');
        this.timeout = this.config.get<number>('app.ollama.timeoutMs', 60000);
    }

    async onModuleInit() {
        await this.checkStatus();
    }

    /**
     * Complete health check and readiness probe
     */
    async checkStatus(): Promise<OllamaStatus> {
        try {
            const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 3000 });
            const models = (response.data?.models || []).map((m: any) => m.name);

            const hasModel = models.some((m: string) =>
                m.startsWith(this.modelName)
            );

            this.isReady = hasModel;

            if (!hasModel) {
                return {
                    available: true,
                    ready: false,
                    model: this.modelName,
                    models,
                    message: `Ollama est actif mais le modèle "${this.modelName}" n'est pas encore téléchargé. Exécuter: ollama pull ${this.modelName}`
                };
            }

            return {
                available: true,
                ready: true,
                model: this.modelName,
                models,
                message: 'Le moteur IA est prêt.'
            };
        } catch (err) {
            this.isReady = false;
            return {
                available: false,
                ready: false,
                model: this.modelName,
                models: [],
                message: `Ollama est injoignable sur ${this.baseUrl}. Assurez-vous que Docker ou Ollama Desktop est lancé.`
            };
        }
    }

    /**
     * Generation using chat format (Better for LLama3)
     */
    async chat(messages: OllamaChatMessage[], options: { temperature?: number } = {}): Promise<string> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/chat`,
                {
                    model: this.modelName,
                    messages,
                    stream: false,
                    options: {
                        temperature: options.temperature ?? 0.1,
                    },
                },
                { timeout: this.timeout },
            );

            return response.data.message?.content?.trim() || '';
        } catch (err) {
            if (err.response) {
                this.logger.error(`Erreur Chat Ollama (${err.response.status}): ${JSON.stringify(err.response.data)}`);
            } else {
                this.logger.error(`Erreur Chat Ollama: ${err.message}`);
            }
            throw new Error('Le service de génération IA est momentanément indisponible.');
        }
    }

    /**
     * Simple generate (legacy/fallback support)
     */
    async generate(prompt: string, options: { system?: string; temperature?: number } = {}): Promise<string> {
        try {
            const response = await axios.post(`${this.baseUrl}/api/generate`, {
                model: this.modelName,
                prompt,
                system: options.system,
                stream: false,
                options: {
                    temperature: options.temperature ?? 0.1,
                }
            }, { timeout: this.timeout });

            return response.data.response || '';
        } catch (err) {
            this.logger.error(`Erreur Generate Ollama: ${err.message}`);
            throw new Error('Erreur de communication avec le moteur local Ollama.');
        }
    }
}
