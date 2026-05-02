import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1746000000000 implements MigrationInterface {
    name = 'InitialSchema1746000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM ('admin', 'user')
    `);

        await queryRunner.query(`
      CREATE TABLE "users" (
        "id"          UUID NOT NULL DEFAULT uuid_generate_v4(),
        "email"       VARCHAR(100) NOT NULL,
        "firstName"   VARCHAR(100) NOT NULL,
        "lastName"    VARCHAR(100) NOT NULL,
        "password"    VARCHAR NOT NULL,
        "role"        "users_role_enum" NOT NULL DEFAULT 'user',
        "isActive"    BOOLEAN NOT NULL DEFAULT true,
        "createdAt"   TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

        // Create refresh_tokens table
        await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id"         UUID NOT NULL DEFAULT uuid_generate_v4(),
        "token"      VARCHAR NOT NULL,
        "userId"     UUID NOT NULL,
        "expiresAt"  TIMESTAMP NOT NULL,
        "isRevoked"  BOOLEAN NOT NULL DEFAULT false,
        "createdAt"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_refresh_tokens_token" UNIQUE ("token"),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id")
      )
    `);

        // Foreign key
        await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
        ADD CONSTRAINT "FK_refresh_tokens_userId"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

        // Index for token lookup
        await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_token" ON "refresh_tokens" ("token")
    `);

        // Enable uuid-ossp extension if not already enabled
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_refresh_tokens_userId"`);
        await queryRunner.query(`DROP INDEX "IDX_refresh_tokens_token"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "users_role_enum"`);
    }
}
