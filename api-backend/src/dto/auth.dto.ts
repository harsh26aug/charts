import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../entities/User';

export class RegisterDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(2)
    @MaxLength(100)
    firstName!: string;

    @IsString()
    @MinLength(2)
    @MaxLength(100)
    lastName!: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password!: string;
}

export class LoginDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(1)
    password!: string;
}

export class RefreshTokenDto {
    @IsString()
    refreshToken!: string;
}

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    firstName?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    lastName?: string;
}
