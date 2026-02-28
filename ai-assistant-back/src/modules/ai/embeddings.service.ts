import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

@Injectable()
export class EmbeddingsService implements OnModuleInit {
    private readonly logger = new Logger(EmbeddingsService.name);
    private extractor: any;
    private readonly modelName = 'Xenova/all-MiniLM-L6-v2';

    async onModuleInit() {
        try {
            // Note: dynamic import to handle ESM module in CJS/TS environment if needed
            const { pipeline } = await (eval(`import('@xenova/transformers')`) as any);

            this.logger.log(`Initialisation du modèle d'embeddings local: ${this.modelName}...`);
            this.extractor = await pipeline('feature-extraction', this.modelName);
            this.logger.log(`✅ Modèle ${this.modelName} prêt pour l'inférence.`);
        } catch (err) {
            this.logger.error(`Impossible de charger le modèle d'embeddings: ${err.message}`);
        }
    }

    /**
     * Génère un vecteur pour un texte unique (MiniLM-L6-v2 -> 384 dimensions)
     */
    async embedText(text: string): Promise<number[]> {
        if (!this.extractor) {
            throw new Error('Le service d\'embeddings n\'est pas encore prêt.');
        }

        const output = await this.extractor(text, {
            pooling: 'mean',
            normalize: true
        });

        return Array.from(output.data);
    }

    /**
     * Génère des vecteurs en batch
     */
    async embedBatch(texts: string[]): Promise<number[][]> {
        const results: number[][] = [];
        for (const text of texts) {
            results.push(await this.embedText(text));
        }
        return results;
    }
}
