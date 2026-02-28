import {
    IsString,
    IsIn,
    IsOptional,
    ValidateNested,
    MaxLength,
    IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StudentInfoDto {
    @ApiProperty({ example: 'Karim Bensalem' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    fullName: string;

    @ApiProperty({ example: '20240123' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(30)
    studentId: string;

    @ApiProperty({ example: 'Informatique' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    department: string;

    @ApiProperty({ example: 'Master 1' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    level: string;

    @ApiPropertyOptional({ example: 'karim.bensalem@etudiant.univ.dz' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    email?: string;
}

export type EmailType = 'attestation' | 'reclamation' | 'stage' | 'absence' | 'report_card' | 'interruption';

export class GenerateEmailDto {
    @ApiProperty({
        description: 'Type d\'email administratif à générer',
        enum: ['attestation', 'reclamation', 'stage', 'absence', 'report_card', 'interruption'],
        example: 'attestation',
    })
    @IsIn(['attestation', 'reclamation', 'stage', 'absence', 'report_card', 'interruption'])
    emailType: EmailType;

    @ApiProperty({ description: 'Informations de l\'étudiant', type: StudentInfoDto })
    @ValidateNested()
    @Type(() => StudentInfoDto)
    studentInfo: StudentInfoDto;

    @ApiPropertyOptional({
        description: 'Données supplémentaires selon le type (ex: motif, période, entreprise…)',
        example: { reason: 'Recherche d\'emploi', urgency: true },
    })
    @IsOptional()
    extra?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'Langue de l\'email',
        enum: ['fr', 'en', 'ar'],
        default: 'fr',
    })
    @IsOptional()
    @IsIn(['fr', 'en', 'ar'])
    lang?: string = 'fr';
}
