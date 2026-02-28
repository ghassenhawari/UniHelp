import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AiAskDto {
    @ApiProperty({ example: 'Comment se réinscrire ?', description: 'La question de l\'utilisateur' })
    @IsString()
    question: string;

    @ApiProperty({ example: 5, description: 'Nombre de chunks à récupérer', required: false, default: 5 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(10)
    topK?: number = 5;

    @ApiProperty({ example: 'fr', description: 'Langue de réponse', required: false, default: 'fr' })
    @IsOptional()
    @IsString()
    lang?: string = 'fr';
}

export class AiSourceDto {
    @ApiProperty()
    documentName: string;

    @ApiProperty()
    text: string;

    @ApiProperty({ required: false })
    pageNumber?: number;

    @ApiProperty()
    similarity: number;
}

export class AiAskResponseDto {
    @ApiProperty({ description: 'Réponse générée par le LLM' })
    answer: string;

    @ApiProperty({ type: [AiSourceDto], description: 'Sources utilisées' })
    sources: AiSourceDto[];

    @ApiProperty({ description: 'Score de confiance moyen (0-1)' })
    confidence: number;
}
