import { ApiProperty } from '@nestjs/swagger';

export class SourceDto {
    @ApiProperty({ example: 'Reglement_Examens_2024.pdf' })
    document: string;

    @ApiProperty({ example: 4, nullable: true })
    page?: number;

    @ApiProperty({ example: 'Reglement_Examens_2024_pdf_chunk_3', nullable: true })
    chunkId?: string;

    @ApiProperty({ description: 'Cosine similarity score (0–1)', example: 0.87 })
    similarity: number;
}

export class AskAnswerDto {
    @ApiProperty({ example: 'Pour obtenir une attestation de scolarité, vous devez...' })
    answer: string;

    @ApiProperty({ type: [SourceDto] })
    sources: SourceDto[];

    @ApiProperty({
        description: 'Overall confidence score (0–1) based on retrieval similarity',
        example: 0.83,
    })
    confidence: number;

    @ApiProperty({
        description: 'Whether the answer was found in official documents',
        example: true,
    })
    found: boolean;

    @ApiProperty({ example: 'f7c3a2b1-0001-4abc-8def-000000000001' })
    requestId?: string;
}
