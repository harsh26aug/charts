import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../../data-source';
import { User, UserRole } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';
import { RegisterDto, LoginDto } from '../dto/auth.dto';
import { JwtPayload, AuthTokens } from '../types/auth.types';

const SALT_ROUNDS = 12;

export class AuthService {
    private userRepo = AppDataSource.getRepository(User);
    private tokenRepo = AppDataSource.getRepository(RefreshToken);

    async register(dto: RegisterDto): Promise<{ user: Omit<User, 'password'>; tokens: AuthTokens }> {
        const existing = await this.userRepo.findOne({ where: { email: dto.email } });
        if (existing) {
            throw new Error('Email already registered');
        }

        const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);

        const user = this.userRepo.create({
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            password: hashed,
            role: UserRole.USER,
        });

        await this.userRepo.save(user);

        const tokens = await this.generateTokens(user);
        await this.saveRefreshToken(user.id, tokens.refreshToken);

        const { password: _, ...safeUser } = user as User & { password: string };
        return { user: safeUser, tokens };
    }

    async login(dto: LoginDto): Promise<{ user: Omit<User, 'password'>; tokens: AuthTokens }> {
        const user = await this.userRepo
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.email = :email', { email: dto.email })
            .getOne();

        if (!user) {
            throw new Error('Invalid credentials');
        }

        if (!user.isActive) {
            throw new Error('Account is disabled');
        }

        const isValid = await bcrypt.compare(dto.password, user.password);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        const tokens = await this.generateTokens(user);
        await this.saveRefreshToken(user.id, tokens.refreshToken);

        const { password: _, ...safeUser } = user as User & { password: string };
        return { user: safeUser, tokens };
    }

    async refreshTokens(refreshToken: string): Promise<AuthTokens> {
        const stored = await this.tokenRepo.findOne({
            where: { token: refreshToken, isRevoked: false },
            relations: ['user'],
        });

        if (!stored || stored.expiresAt < new Date()) {
            throw new Error('Invalid or expired refresh token');
        }

        let payload: JwtPayload;
        try {
            payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
        } catch {
            throw new Error('Invalid refresh token');
        }

        // Revoke old token (token rotation)
        stored.isRevoked = true;
        await this.tokenRepo.save(stored);

        const tokens = await this.generateTokens(stored.user);
        await this.saveRefreshToken(stored.user.id, tokens.refreshToken);
        return tokens;
    }

    async logout(refreshToken: string): Promise<void> {
        await this.tokenRepo.update({ token: refreshToken }, { isRevoked: true });
    }

    async logoutAll(userId: string): Promise<void> {
        await this.tokenRepo.update({ userId }, { isRevoked: true });
    }

    async getProfile(userId: string): Promise<User> {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    private async generateTokens(user: User): Promise<AuthTokens> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
            expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
        } as jwt.SignOptions);

        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
        } as jwt.SignOptions);

        return { accessToken, refreshToken };
    }

    private async saveRefreshToken(userId: string, token: string): Promise<void> {
        const decoded = jwt.decode(token) as JwtPayload;
        const expiresAt = new Date((decoded.exp || 0) * 1000);

        const entity = this.tokenRepo.create({ userId, token, expiresAt });
        await this.tokenRepo.save(entity);
    }
}
