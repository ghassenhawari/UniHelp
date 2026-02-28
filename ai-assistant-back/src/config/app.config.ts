import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    appName: process.env.APP_NAME || 'UniHelp Backend',
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map((o) => o.trim()),

    ollama: {
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'llama3.2',
        timeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS || '60000', 10),
    },

    chroma: {
        host: process.env.CHROMA_HOST || 'localhost',
        port: parseInt(process.env.CHROMA_PORT || '8000', 10),
        collection: process.env.CHROMA_COLLECTION || 'unihelp_docs',
    },

    rag: {
        chunkSize: parseInt(process.env.CHUNK_SIZE || '500', 10),
        chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '80', 10),
        topKDefault: parseInt(process.env.TOP_K_DEFAULT || '5', 10),
        similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD || '0.35'),
        temperature: parseFloat(process.env.RAG_TEMPERATURE || '0.1'),
    },

    upload: {
        dir: process.env.UPLOAD_DIR || './uploads',
        maxFileMb: parseInt(process.env.MAX_FILE_MB || '20', 10),
    },

    admin: {
        secret: process.env.ADMIN_SECRET || 'change_me_in_production',
    },

    throttle: {
        ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT || '20', 10),
    },
}));
