import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../../users/user.entity';

export class RegisterDto {
    @IsEmail({}, { message: 'Email invalide' })
    email: string;

    @IsString()
    @MinLength(8, { message: 'Le mot de passe doit faire au moins 8 caractères' })
    password: string;

    @IsString()
    @IsNotEmpty({ message: 'Le nom complet est requis' })
    fullName: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

export class RefreshDto {
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}

export class ForgotPasswordDto {
    @IsEmail()
    email: string;
}

export class ResetPasswordDto {
    @IsString()
    @IsNotEmpty()
    token: string;

    @IsString()
    @MinLength(8)
    newPassword: string;
}
