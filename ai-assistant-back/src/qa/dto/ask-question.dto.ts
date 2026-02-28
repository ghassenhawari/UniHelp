import { IsString, IsOptional, IsInt, Min, Max, MaxLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AskQuestionDto {
    @ApiProperty({
        description: 'La question administrative de l\'étudiant',
        example: 'Comment obtenir une attestation de scolarité ?',
        maxLength: 1000,
    })
    @IsString()
    @MaxLength(1000)
    question: string;

    @ApiPropertyOptional({
        description: 'Nombre maximum de chunks de contexte à récupérer',
        default: 5,
        minimum: 1,
        maximum: 15,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(15)
    topK?: number = 5;

    @ApiPropertyOptional({
        description: 'Langue de la réponse',
        enum: ['fr', 'en', 'ar'],
        default: 'fr',
    })
    @IsOptional()
    @IsIn(['fr', 'en', 'ar'])
    lang?: string = 'fr';
}
