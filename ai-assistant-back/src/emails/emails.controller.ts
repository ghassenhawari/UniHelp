import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { EmailsService } from './emails.service';
import { GenerateEmailDto } from './dto/generate-email.dto';

@ApiTags('Emails')
@Controller('emails')
export class EmailsController {
    constructor(private readonly emailsService: EmailsService) { }

    @Post('generate')
    @HttpCode(HttpStatus.OK)
    @Throttle({ medium: { ttl: 60000, limit: 5 } })
    @ApiOperation({
        summary: 'Générer un email administratif standardisé',
        description: `
      Génère un email administratif universitaire formel à partir des informations étudiant.
      
      **Types disponibles :**
      - \`attestation\` — Demande d'attestation de scolarité
      - \`reclamation\` — Réclamation académique (notes, résultats…)
      - \`stage\` — Demande de convention de stage
      - \`absence\` — Justification d'absence aux examens
      - \`report_card\` — Demande de relevé de notes
      - \`interruption\` — Demande d'interruption provisoire des études
    `,
    })
    @ApiBody({ type: GenerateEmailDto })
    @ApiResponse({
        status: 200,
        description: 'Email généré avec objet et corps',
        schema: {
            type: 'object',
            properties: {
                subject: { type: 'string', example: "Demande d'attestation de scolarité — 2024" },
                body: { type: 'string', example: 'Madame, Monsieur,\n\nJe soussigné...' },
                emailType: { type: 'string' },
                generatedAt: { type: 'string', format: 'date-time' },
            },
        },
    })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
    async generate(@Body() dto: GenerateEmailDto) {
        return this.emailsService.generate(dto);
    }

    @Post('send')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Envoyer un email généré à un destinataire' })
    @ApiResponse({ status: 200, description: 'Email envoyé avec succès' })
    async send(@Body() dto: { to: string; subject: string; body: string }) {
        return this.emailsService.send(dto);
    }

    @Post('test')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Tester la configuration SMTP' })
    async testMail(@Body('to') to: string) {
        return this.emailsService.send({
            to: to || 'test@example.com',
            subject: 'Test de configuration UniHelp',
            body: 'Ceci est un email de test pour vérifier la configuration SMTP de UniHelp.',
        });
    }

    @Get('types')
    @ApiOperation({ summary: 'Lister les types d\'emails disponibles' })
    @ApiResponse({ status: 200, description: 'Liste des types d\'emails' })
    getEmailTypes() {
        return {
            types: [
                {
                    id: 'attestation',
                    label: "Attestation de scolarité",
                    description: "Demande de preuve d'inscription à l'université",
                    requiredExtras: [],
                },
                {
                    id: 'reclamation',
                    label: 'Réclamation académique',
                    description: 'Contestation de note ou de résultat d\'examen',
                    requiredExtras: ['subject', 'grade', 'reason'],
                },
                {
                    id: 'stage',
                    label: 'Convention de stage',
                    description: 'Demande de convention pour effectuer un stage',
                    requiredExtras: ['company', 'startDate', 'endDate', 'supervisor'],
                },
                {
                    id: 'absence',
                    label: 'Justification d\'absence',
                    description: 'Justification d\'absence lors d\'un examen',
                    requiredExtras: ['examDate', 'subject', 'reason'],
                },
                {
                    id: 'report_card',
                    label: 'Relevé de notes',
                    description: 'Demande de relevé de notes officiel',
                    requiredExtras: ['semester', 'year'],
                },
                {
                    id: 'interruption',
                    label: 'Interruption des études',
                    description: "Demande d'interruption provisoire des études",
                    requiredExtras: ['reason', 'expectedReturnDate'],
                },
            ],
        };
    }
}
