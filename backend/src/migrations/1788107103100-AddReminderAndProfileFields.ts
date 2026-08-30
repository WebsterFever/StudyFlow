import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReminderAndProfileFields1788107103100 implements MigrationInterface {
    name = 'AddReminderAndProfileFields1788107103100'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "timezone" character varying(64) NOT NULL DEFAULT 'UTC'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "quietHoursEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "quietHoursStart" character varying(5)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "quietHoursEnd" character varying(5)`);
        await queryRunner.query(`ALTER TABLE "study_goals" ADD "reminderEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "study_goals" ADD "reminderIntervalHours" integer NOT NULL DEFAULT '2'`);
        await queryRunner.query(`ALTER TABLE "study_goals" ADD "lastReminderSentAt" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "study_goals" DROP COLUMN "lastReminderSentAt"`);
        await queryRunner.query(`ALTER TABLE "study_goals" DROP COLUMN "reminderIntervalHours"`);
        await queryRunner.query(`ALTER TABLE "study_goals" DROP COLUMN "reminderEnabled"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "quietHoursEnd"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "quietHoursStart"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "quietHoursEnabled"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "timezone"`);
    }

}
