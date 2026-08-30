import { MigrationInterface, QueryRunner } from "typeorm";

// Reminder interval was hour-granularity only (2/4/6/12/24). Renaming +
// reinterpreting the column as minutes so sub-hour options (5/10/30 min) can
// be offered for verifying the pipeline without waiting hours for a send.
export class RenameReminderIntervalToMinutes1788114725305 implements MigrationInterface {
    name = 'RenameReminderIntervalToMinutes1788114725305'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "study_goals" ADD "reminderIntervalMinutes" integer NOT NULL DEFAULT '120'`);
        await queryRunner.query(`UPDATE "study_goals" SET "reminderIntervalMinutes" = "reminderIntervalHours" * 60`);
        await queryRunner.query(`ALTER TABLE "study_goals" DROP COLUMN "reminderIntervalHours"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "study_goals" ADD "reminderIntervalHours" integer NOT NULL DEFAULT '2'`);
        await queryRunner.query(`UPDATE "study_goals" SET "reminderIntervalHours" = "reminderIntervalMinutes" / 60`);
        await queryRunner.query(`ALTER TABLE "study_goals" DROP COLUMN "reminderIntervalMinutes"`);
    }

}
