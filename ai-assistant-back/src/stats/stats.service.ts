import { Injectable, Logger } from '@nestjs/common';

export interface QuestionRecord {
    question: string;
    found: boolean;
    confidence: number;
    durationMs: number;
    requestId?: string;
    sourceDocuments?: string[];
    timestamp?: string;
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
    recentQuestions: QuestionRecord[];
}

@Injectable()
export class StatsService {
    private readonly logger = new Logger(StatsService.name);
    private readonly records: QuestionRecord[] = [];
    private readonly MAX_RECORDS = 1000; // In-memory cap

    async recordQuestion(record: QuestionRecord): Promise<void> {
        const entry: QuestionRecord = {
            ...record,
            timestamp: new Date().toISOString(),
        };

        this.records.push(entry);

        // Rolling window: drop oldest if over cap
        if (this.records.length > this.MAX_RECORDS) {
            this.records.shift();
        }
    }

    getSnapshot(limit = 10): StatsSnapshot {
        const total = this.records.length;
        const found = this.records.filter((r) => r.found);
        const notFound = this.records.filter((r) => !r.found);

        const avgConfidence =
            found.length > 0
                ? found.reduce((s, r) => s + r.confidence, 0) / found.length
                : 0;

        const avgDuration =
            total > 0
                ? this.records.reduce((s, r) => s + r.durationMs, 0) / total
                : 0;

        // Top questions (simple frequency count)
        const qMap = new Map<string, { count: number; totalConf: number }>();
        for (const r of this.records) {
            const key = r.question.toLowerCase().slice(0, 80);
            const existing = qMap.get(key) || { count: 0, totalConf: 0 };
            qMap.set(key, {
                count: existing.count + 1,
                totalConf: existing.totalConf + r.confidence,
            });
        }

        const topQuestions = Array.from(qMap.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, limit)
            .map(([question, { count, totalConf }]) => ({
                question,
                count,
                avgConfidence: Math.round((totalConf / count) * 100) / 100,
            }));

        // Top source documents
        const docMap = new Map<string, number>();
        for (const r of this.records) {
            for (const doc of r.sourceDocuments || []) {
                docMap.set(doc, (docMap.get(doc) || 0) + 1);
            }
        }

        const topDocuments = Array.from(docMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([document, hitCount]) => ({ document, hitCount }));

        // Recent questions (last N)
        const recentQuestions = [...this.records]
            .reverse()
            .slice(0, 20)
            .map(({ question, found, confidence, durationMs, timestamp }) => ({
                question: question.slice(0, 100),
                found,
                confidence,
                durationMs,
                timestamp,
            }));

        return {
            totalQuestions: total,
            foundCount: found.length,
            notFoundCount: notFound.length,
            foundRate: total > 0 ? Math.round((found.length / total) * 100) / 100 : 0,
            avgConfidence: Math.round(avgConfidence * 100) / 100,
            avgDurationMs: Math.round(avgDuration),
            topQuestions,
            topDocuments,
            recentQuestions,
        };
    }

    clearStats(): void {
        this.records.length = 0;
        this.logger.log('Statistics cleared');
    }

    getRecordCount(): number {
        return this.records.length;
    }
}
