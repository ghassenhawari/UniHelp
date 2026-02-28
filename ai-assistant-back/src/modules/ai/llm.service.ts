import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class LlmService {
    private readonly logger = new Logger(LlmService.name);
    private readonly ollamaUrl: string;
    private readonly modelName: string;

    constructor(private readonly config: ConfigService) {
        this.ollamaUrl = this.config.get<string>('OLLAMA_BASE_URL', 'http://localhost:11434');
        this.modelName = this.config.get<string>('OLLAMA_MODEL', 'llama3.2');
    }

    /**
     * Appelle Ollama pour générer une réponse à partir d'un prompt
     */
    async generateAnswer(prompt: string, systemPrompt?: string): Promise<string> {
        try {
            this.logger.debug(`Génération avec le modèle: ${this.modelName}`);

            const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
                model: this.modelName,
                prompt: prompt,
                system: systemPrompt,
                stream: false,
                options: {
                    temperature: 0.1, // Réduction de la créativité pour limiter les hallucinations
                    num_ctx: 4096,   // Fenêtre de contexte
                }
            }, {
                timeout: 60000 // 60s timeout
            });

            return response.data.response;
        } catch (err) {
            this.logger.error(`Erreur lors de l'appel LLM (Ollama): ${err.message}`);
            throw new Error('Le moteur d\'intelligence artificielle est temporairement indisponible.');
        }
    }
}
