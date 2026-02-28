import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
    STUDENT = 'STUDENT',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ select: false }) // Ne pas retourner le hash par défaut
    passwordHash: string;

    @Column()
    fullName: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.STUDENT,
    })
    role: UserRole;

    @Column({ default: false })
    isEmailVerified: boolean;

    // Verification Email
    @Column({ type: 'text', nullable: true, select: false })
    emailVerificationTokenHash: string | null;

    @Column({ type: 'timestamp', nullable: true, select: false })
    emailVerificationExpiresAt: Date | null;

    // Reset Password
    @Column({ type: 'text', nullable: true, select: false })
    resetPasswordTokenHash: string | null;

    @Column({ type: 'timestamp', nullable: true, select: false })
    resetPasswordExpiresAt: Date | null;

    // Refresh Token Rotation
    @Column({ type: 'text', nullable: true, select: false })
    refreshTokenHash: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
