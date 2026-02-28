import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum IngestionStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

@Entity('documents')
export class DocumentEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    filename: string;

    @Column()
    originalName: string;

    @Column({ nullable: true })
    mimeType: string;

    @Column({ nullable: true })
    size: number;

    @Column({
        type: 'enum',
        enum: IngestionStatus,
        default: IngestionStatus.PENDING,
    })
    status: IngestionStatus;

    @Column({ type: 'text', nullable: true })
    error?: string;

    @Column({ default: 0 })
    chunkCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
