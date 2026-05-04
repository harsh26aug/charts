import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index, JoinColumn } from 'typeorm';
import { User } from "@entities/User";

@Entity('refresh_tokens')
export class RefreshToken {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    @Index()
    token!: string;

    @Column()
    userId!: string;

    @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({ type: 'timestamp' })
    expiresAt!: Date;

    @Column({ default: false })
    isRevoked!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}
