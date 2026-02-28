export interface Source {
    document: string;
    page?: number;
    chunkId?: string;
    similarity: number;
}

export interface AskResponse {
    answer: string;
    sources: Source[];
    confidence: number;
    found: boolean;
    requestId?: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    answer?: AskResponse;
    status: 'sending' | 'success' | 'error';
}

export interface StudentInfo {
    fullName: string;
    studentId: string;
    department: string;
    level: string;
    email?: string;
}

export type EmailType = 'attestation' | 'reclamation' | 'stage' | 'absence' | 'report_card' | 'interruption';

export interface EmailGenerateResponse {
    subject: string;
    body: string;
    emailType: string;
    generatedAt: string;
}

export interface DocumentInfo {
    name: string;
    chunkCount: number;
    uploadedAt?: string;
}

export interface StatsSnapshot {
    totalQuestions: number;
    foundCount: number;
    notFoundCount: number;
    foundRate: number;
    avgConfidence: number;
    avgDurationMs: number;
    topQuestions: Array<{ question: string; count: number; avgConfidence: number }>;
    topDocuments: Array<{ document: string; hitCount: number }>;
    recentQuestions: any[];
}

export interface HealthStatus {
    status: 'ok' | 'degraded' | 'error';
    timestamp: string;
    version: string;
    services: {
        api: { status: string; port: number };
        ollama: { status: string; url: string; model: string; availableModels: string[] };
        chromadb: { status: string; totalChunks: number };
    };
}

// ── Auth Types ──────────────────────────────────────────────────
export interface User {
    id: string;
    email: string;
    fullName: string;
    role: 'student' | 'admin';
    isVerified: boolean;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}
