import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Inscription étudiant' })
    @ApiResponse({ status: 201, description: 'Utilisateur créé, email de vérification envoyé' })
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Get('verify-email')
    @ApiOperation({ summary: 'Vérification de l\'adresse email' })
    verifyEmail(@Query('token') token: string) {
        return this.authService.verifyEmail(token);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // Max 5 tentatives par minute
    @ApiOperation({ summary: 'Connexion (JWT Access + Refresh)' })
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Rotation du refreshToken' })
    refresh(@Body() dto: RefreshDto) {
        return this.authService.refresh(dto.refreshToken);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Déconnexion' })
    logout(@Body() dto: RefreshDto) {
        return this.authService.logout(dto.refreshToken);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // Max 3 par minute
    @ApiOperation({ summary: 'Demande de réinitialisation' })
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Nouveau mot de passe avec token' })
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto.token, dto.newPassword);
    }

    @Post('debug/verify-by-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'FORCER la vérification (DEBUG UNIQUEMENT)' })
    async debugVerify(@Body('email') email: string) {
        return this.authService.forceVerifyEmail(email);
    }

    @Post('debug/reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'FORCER le mot de passe (DEBUG UNIQUEMENT)' })
    async debugReset(@Body() dto: { email: string, password: 'password123' }) {
        return this.authService.forceResetPassword(dto.email, dto.password);
    }
}
