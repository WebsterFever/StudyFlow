import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStudyNotes1788561347894 implements MigrationInterface {
    name = 'AddStudyNotes1788561347894'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "study_notes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "goalId" uuid NOT NULL,
                "studyItemId" uuid NOT NULL,
                "type" character varying(16) NOT NULL,
                "title" character varying(255),
                "content" text,
                "fileName" character varying(500),
                "codeLanguage" character varying(32),
                "url" character varying(2048),
                "sortOrder" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_study_notes_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_study_notes_userId" ON "study_notes" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_study_notes_goalId" ON "study_notes" ("goalId")`);
        await queryRunner.query(`CREATE INDEX "IDX_study_notes_studyItemId" ON "study_notes" ("studyItemId")`);
        await queryRunner.query(`
            ALTER TABLE "study_notes"
            ADD CONSTRAINT "FK_study_notes_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "study_notes"
            ADD CONSTRAINT "FK_study_notes_goalId" FOREIGN KEY ("goalId") REFERENCES "study_goals"("id") ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "study_notes"
            ADD CONSTRAINT "FK_study_notes_studyItemId" FOREIGN KEY ("studyItemId") REFERENCES "study_items"("id") ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "study_notes"`);
    }

}
