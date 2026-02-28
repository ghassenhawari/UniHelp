import axios from 'axios';
import type { AskResponse, EmailGenerateResponse, StatsSnapshot, DocumentInfo, HealthStatus, User, AuthResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── JWT Handling ────────────────────────────────────────────────
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('unihelp_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Admin secret from localStorage for simplicity in this version
const getAdminSecret = () => localStorage.getItem('unihelp_admin_secret') || '';

export const api = {
    // ── Auth ───────────────────────────────────────────────────────
    login: async (email: string, password: string): Promise<AuthResponse> => {
        const response = await client.post<AuthResponse>('/auth/login', { email, password });
        localStorage.setItem('unihelp_token', response.data.accessToken);
        localStorage.setItem('unihelp_refresh_token', response.data.refreshToken);
        localStorage.setItem('unihelp_user', JSON.stringify(response.data.user));
        return response.data;
    },

    register: async (data: any): Promise<any> => {
        const response = await client.post('/auth/register', data);
        return response.data;
    },

    logoutLocal: () => {
        localStorage.removeItem('unihelp_token');
        localStorage.removeItem('unihelp_refresh_token');
        localStorage.removeItem('unihelp_user');
    },

    getCurrentUser: (): User | null => {
        const user = localStorage.getItem('unihelp_user');
        return user ? JSON.parse(user) : null;
    },
    // ── Q&A ────────────────────────────────────────────────────────
    ask: async (question: string, topK: number = 5): Promise<AskResponse> => {
        const response = await client.post<AskResponse>('/qa/ask', { question, topK });
        return response.data;
    },

    // ── Emails ──────────────────────────────────────────────────────
    generateEmail: async (data: {
        emailType: string;
        studentInfo: any;
        extra?: any;
        lang?: string;
    }): Promise<EmailGenerateResponse> => {
        const response = await client.post<EmailGenerateResponse>('/emails/generate', data);
        return response.data;
    },

    getEmailTypes: async () => {
        const response = await client.get('/emails/types');
        return response.data;
    },

    // ── Health ──────────────────────────────────────────────────────
    checkHealth: async (): Promise<HealthStatus> => {
        const response = await client.get<HealthStatus>('/health');
        return response.data;
    },

    // ── Docs (Admin) ────────────────────────────────────────────────
    uploadDocs: async (files: File[]): Promise<any> => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        const response = await client.post('/docs/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'X-Admin-Secret': getAdminSecret(),
            },
        });
        return response.data;
    },

    listDocs: async (): Promise<DocumentInfo[]> => {
        const response = await client.get<DocumentInfo[]>('/docs', {
            headers: { 'X-Admin-Secret': getAdminSecret() },
        });
        return response.data;
    },

    deleteDoc: async (name: string): Promise<any> => {
        const response = await client.delete(`/docs/${encodeURIComponent(name)}`, {
            headers: { 'X-Admin-Secret': getAdminSecret() },
        });
        return response.data;
    },

    reindex: async (): Promise<any> => {
        const response = await client.post('/docs/reindex', {}, {
            headers: { 'X-Admin-Secret': getAdminSecret() },
        });
        return response.data;
    },

    // ── Stats ───────────────────────────────────────────────────────
    getStats: async (): Promise<StatsSnapshot> => {
        const response = await client.get<StatsSnapshot>('/stats', {
            headers: { 'X-Admin-Secret': getAdminSecret() },
        });
        return response.data;
    },
};
