import { Injectable, Logger } from '@nestjs/common';
import { OllamaService } from '../modules/ai/ollama.service';
import { MailService } from '../modules/mail/mail.service';
import { GenerateEmailDto, EmailType, StudentInfoDto } from './dto/generate-email.dto';

export interface GeneratedEmail {
    subject: string;
    body: string;
    emailType: EmailType;
    generatedAt: string;
}

@Injectable()
export class EmailsService {
    private readonly logger = new Logger(EmailsService.name);

    constructor(
        private readonly ollama: OllamaService,
        private readonly mailService: MailService,
    ) { }

    async generate(dto: GenerateEmailDto): Promise<GeneratedEmail> {
        const { emailType, studentInfo, extra = {}, lang = 'fr' } = dto;

        const template = this.getEmailTemplate(emailType, lang);
        const context = this.buildContext(studentInfo, extra, lang);
        const prompt = this.buildEmailPrompt(template, context, lang);

        this.logger.log(`Génération email: type=${emailType}, étudiant=${studentInfo.studentId}`);

        const rawOutput = await this.ollama.chat(
            [
                { role: 'system', content: this.getSystemPrompt(lang) },
                { role: 'user', content: prompt },
            ],
            { temperature: 0.3 },
        );

        return {
            ...this.parseEmailOutput(rawOutput, emailType, studentInfo, lang),
            emailType,
            generatedAt: new Date().toISOString(),
        };
    }

    async send(dto: { to: string; subject: string; body: string }) {
        this.logger.log(`Envoi de l'email généré à ${dto.to}`);
        return this.mailService.sendCustomEmail(dto.to, dto.subject, dto.body);
    }

    private getEmailTemplate(emailType: EmailType, lang: string): string {
        const templates: Record<EmailType, Record<string, string>> = {
            attestation: {
                fr: `Objet : Demande d'attestation de scolarité — Année ${new Date().getFullYear()}`,
                en: `Subject: Request for Enrollment Certificate — Year ${new Date().getFullYear()}`,
                ar: `الموضوع: طلب شهادة تسجيل — سنة ${new Date().getFullYear()}`,
            },
            reclamation: {
                fr: `Objet : Réclamation académique — [Préciser l'objet]`,
                en: `Subject: Academic Complaint — [Specify Subject]`,
                ar: `الموضوع: تظلم أكاديمي — [تحديد الموضوع]`,
            },
            stage: {
                fr: `Objet : Demande de convention de stage — [Entreprise / Période]`,
                en: `Subject: Internship Agreement Request — [Company / Period]`,
                ar: `الموضوع: طلب اتفاقية تدريب — [الشركة / الفترة]`,
            },
            absence: {
                fr: `Objet : Justification d'absence aux examens`,
                en: `Subject: Absence Justification for Examinations`,
                ar: `الموضوع: تبرير الغياب عن الامتحانات`,
            },
            report_card: {
                fr: `Objet : Demande de relevé de notes`,
                en: `Subject: Request for Academic Transcript`,
                ar: `الموضوع: طلب كشف العلامات`,
            },
            interruption: {
                fr: `Objet : Demande d'interruption provisoire des études`,
                en: `Subject: Request for Temporary Study Interruption`,
                ar: `الموضوع: طلب انقطاع مؤقت عن الدراسة`,
            },
        };

        return templates[emailType][lang] || templates[emailType]['fr'];
    }

    private buildContext(student: StudentInfoDto, extra: Record<string, any>, lang: string): string {
        const date = new Date().toLocaleDateString(
            lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-DZ' : 'en-US',
            { day: 'numeric', month: 'long', year: 'numeric' },
        );

        const base = lang === 'fr'
            ? `Étudiant(e): ${student.fullName} | N° Étudiant: ${student.studentId} | Filière: ${student.department} | Niveau: ${student.level} | Date: ${date}`
            : lang === 'ar'
                ? `الطالب: ${student.fullName} | رقم التسجيل: ${student.studentId} | التخصص: ${student.department} | المستوى: ${student.level} | التاريخ: ${date}`
                : `Student: ${student.fullName} | ID: ${student.studentId} | Department: ${student.department} | Level: ${student.level} | Date: ${date}`;

        const extras = Object.entries(extra).map(([k, v]) => `${k}: ${v}`).join(' | ');
        return extras ? `${base} | ${extras}` : base;
    }

    private buildEmailPrompt(template: string, context: string, lang: string): string {
        const instructions: Record<string, string> = {
            fr: `Rédige un email administratif universitaire FORMEL et COMPLET selon le modèle.
CONTEXTE : ${context}
MODÈLE D'OBJET : ${template}

Format EXACT attendu :
OBJET: [l'objet]
---
CORPS:
[corps de l'email]`,
            en: `Write a FORMAL university administrative email.
CONTEXT: ${context}
SUBJECT TEMPLATE: ${template}

Expected format:
SUBJECT: [the subject]
---
BODY:
[email body]`,
            ar: `اكتب بريدًا إلكترونيًا رسميًا.
السياق: ${context}
نموذج الموضوع: ${template}

التنسيق المطلوب:
الموضوع: [الموضوع]
---
المتن:
[النص]`,
        };
        return instructions[lang] || instructions['fr'];
    }

    private parseEmailOutput(raw: string, emailType: EmailType, student: StudentInfoDto, lang: string): { subject: string; body: string } {
        const subjectMatch = raw.match(/(?:OBJET|SUBJECT|الموضوع)\s*:\s*(.+?)(?:\n|$)/i);
        const bodyMatch = raw.match(/(?:CORPS|BODY|المتن)\s*:\s*([\s\S]+)/i);

        if (subjectMatch && bodyMatch) {
            return { subject: subjectMatch[1].trim(), body: bodyMatch[1].trim() };
        }

        const parts = raw.split(/---+/);
        if (parts.length >= 2) {
            return {
                subject: parts[0].replace(/(?:OBJET|SUBJECT|الموضوع)\s*:\s*/i, '').trim(),
                body: parts[1].replace(/(?:CORPS|BODY|المتن)\s*:\s*/i, '').trim(),
            };
        }

        return { subject: this.getEmailTemplate(emailType, lang), body: raw };
    }

    private getSystemPrompt(lang: string): string {
        const prompts: Record<string, string> = {
            fr: `Expert en rédaction administrative universitaire. Ton style est formel et respectueux.`,
            en: `University administrative expert. Formal and professional style.`,
            ar: `خبير كتابة إدارية جامعية. أسلوب رسمي ومهني.`,
        };
        return prompts[lang] || prompts['fr'];
    }
}
