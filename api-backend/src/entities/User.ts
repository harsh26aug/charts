import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { RefreshToken } from "@entities/RefreshToken";

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true, length: 100 })
    email!: string;

    @Column({ length: 100 })
    firstName!: string;

    @Column({ length: 100 })
    lastName!: string;

    @Column({ select: false })
    password!: string;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
    role!: UserRole;

    @Column({ default: true })
    isActive!: boolean;

    @OneToMany(() => RefreshToken, (token) => token.user, { cascade: true })
    refreshTokens!: RefreshToken[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
