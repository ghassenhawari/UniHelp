import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
    ) { }

    async sendVerificationEmail(email: string, token: string) {
        const url = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;

        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Vérifiez votre adresse email - UniHelp',
                template: './verification',
                context: { url },
            });
            this.logger.log(`Verification email sent to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send verification email to ${email}`, error.stack);
        }
    }

    async sendPasswordResetEmail(email: string, token: string) {
        const url = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Réinitialisation de mot de passe - UniHelp',
                template: './reset-password',
                context: { url },
            });
            this.logger.log(`Password reset email sent to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send password reset email to ${email}`, error.stack);
        }
    }

    async sendCustomEmail(to: string, subject: string, body: string) {
        try {
            await this.mailerService.sendMail({
                to,
                subject,
                text: body,
            });
            this.logger.log(`Custom email sent to ${to}: ${subject}`);
        } catch (error) {
            this.logger.error(`Failed to send custom email to ${to}`, error.stack);
            throw error;
        }
    }
}
