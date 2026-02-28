import { Injectable, UnauthorizedException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly mailService: MailService,
    ) { }

    private hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    async register(dto: RegisterDto) {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing) throw new ConflictException('Email déjà utilisé');

        const passwordHash = await bcrypt.hash(dto.password, 12);
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(token);

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await this.usersService.create({
            ...dto,
            passwordHash,
            emailVerificationTokenHash: tokenHash,
            emailVerificationExpiresAt: expiresAt,
            isEmailVerified: true, // Auto-verify for development
            role: dto.role || UserRole.STUDENT,
        });

        await this.mailService.sendVerificationEmail(dto.email, token);
        return { message: 'Verify email sent' };
    }

    async verifyEmail(token: string) {
        const hash = this.hashToken(token);
        const user = await this.usersService.findByToken('email', hash);

        if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
            throw new BadRequestException('Token invalide ou expiré');
        }

        await this.usersService.update(user.id, {
            isEmailVerified: true,
            emailVerificationTokenHash: null,
            emailVerificationExpiresAt: null,
        });

        return { message: 'Email verified' };
    }

    async forceVerifyEmail(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) throw new BadRequestException('Utilisateur non trouvé');

        await this.usersService.update(user.id, {
            isEmailVerified: true,
            emailVerificationTokenHash: null,
            emailVerificationExpiresAt: null,
        });

        return { message: `L'utilisateur ${email} a été vérifié manuellement.` };
    }

    async forceResetPassword(email: string, pass: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) throw new BadRequestException('Utilisateur non trouvé');

        const passwordHash = await bcrypt.hash(pass, 12);
        await this.usersService.update(user.id, {
            passwordHash,
            isEmailVerified: true,
        });

        return { message: `Mot de passe réinitialisé pour ${email}` };
    }

    async login(dto: LoginDto) {
        const user = await this.usersService.findByEmail(dto.email);

        if (!user) {
            this.logger.warn(`Échec de connexion : Utilisateur non trouvé (${dto.email})`);
            throw new UnauthorizedException('Identifiants invalides');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            this.logger.warn(`Échec de connexion : Mot de passe incorrect pour ${dto.email}`);
            throw new UnauthorizedException('Identifiants invalides');
        }

        if (!user.isEmailVerified) {
            this.logger.error(`Tentative de connexion : Email non vérifié pour ${dto.email}`);
            throw new UnauthorizedException('Email non vérifié');
        }

        return this.generateAuthTokens(user);
    }

    async refresh(refreshToken: string) {
        const hash = this.hashToken(refreshToken);
        const user = await this.usersService.findByToken('refresh', hash);

        if (!user) {
            throw new UnauthorizedException('Session expirée');
        }

        return this.generateAuthTokens(user);
    }

    async logout(refreshToken: string) {
        const hash = this.hashToken(refreshToken);
        const user = await this.usersService.findByToken('refresh', hash);
        if (user) {
            await this.usersService.update(user.id, { refreshTokenHash: null });
        }
        return { message: 'Logged out' };
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findByEmail(email);
        // Anti-leak: always return OK
        if (!user) return { message: 'OK' };

        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(token);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        await this.usersService.update(user.id, {
            resetPasswordTokenHash: tokenHash,
            resetPasswordExpiresAt: expiresAt,
        });

        await this.mailService.sendPasswordResetEmail(email, token);
        return { message: 'OK' };
    }

    async resetPassword(token: string, newPassword: string) {
        const hash = this.hashToken(token);
        const user = await this.usersService.findByToken('reset', hash);

        if (!user || !user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
            throw new BadRequestException('Token invalide ou expiré');
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);
        await this.usersService.update(user.id, {
            passwordHash,
            resetPasswordTokenHash: null,
            resetPasswordExpiresAt: null,
        });

        return { message: 'Password reset successful' };
    }

    private async generateAuthTokens(user: User) {
        const payload = { sub: user.id, email: user.email, role: user.role };

        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.get('JWT_ACCESS_TTL'),
        });

        const refreshToken = crypto.randomBytes(64).toString('hex');
        const refreshTokenHash = this.hashToken(refreshToken);

        await this.usersService.update(user.id, { refreshTokenHash });

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                isEmailVerified: user.isEmailVerified,
            },
        };
    }
}
