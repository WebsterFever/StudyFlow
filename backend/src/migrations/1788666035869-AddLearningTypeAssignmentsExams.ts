import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLearningTypeAssignmentsExams1788666035869 implements MigrationInterface {
    name = 'AddLearningTypeAssignmentsExams1788666035869'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Defaults to 'programming_technology' for EXISTING goals specifically so
        // Code Notes / Project Snapshots already attached to them never become
        // hidden by the learning-type gating this adds — new goals pick a real
        // value at creation and aren't affected by this default.
        await queryRunner.query(`ALTER TABLE "study_goals" ADD "learningType" character varying(32) NOT NULL DEFAULT 'programming_technology'`);

        await queryRunner.query(`
            CREATE TABLE "assignments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "goalId" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "dueDate" date NOT NULL,
                "status" character varying(16) NOT NULL DEFAULT 'not_started',
                "priority" character varying(16) NOT NULL DEFAULT 'Medium',
                "reminderEnabled" boolean NOT NULL DEFAULT true,
                "reminderSentAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_assignments_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_assignments_userId" ON "assignments" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_assignments_goalId" ON "assignments" ("goalId")`);
        await queryRunner.query(`ALTER TABLE "assignments" ADD CONSTRAINT "FK_assignments_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "assignments" ADD CONSTRAINT "FK_assignments_goalId" FOREIGN KEY ("goalId") REFERENCES "study_goals"("id") ON DELETE CASCADE`);

        await queryRunner.query(`
            CREATE TABLE "exams" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "goalId" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "examDate" date NOT NULL,
                "reminderEnabled" boolean NOT NULL DEFAULT true,
                "reminderSentAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_exams_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_exams_userId" ON "exams" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_exams_goalId" ON "exams" ("goalId")`);
        await queryRunner.query(`ALTER TABLE "exams" ADD CONSTRAINT "FK_exams_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "exams" ADD CONSTRAINT "FK_exams_goalId" FOREIGN KEY ("goalId") REFERENCES "study_goals"("id") ON DELETE CASCADE`);

        await queryRunner.query(`
            CREATE TABLE "exam_review_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "examId" uuid NOT NULL,
                "studyItemId" uuid NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_exam_review_items_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_exam_review_items_examId_studyItemId" UNIQUE ("examId", "studyItemId")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_exam_review_items_userId" ON "exam_review_items" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_exam_review_items_examId" ON "exam_review_items" ("examId")`);
        await queryRunner.query(`CREATE INDEX "IDX_exam_review_items_studyItemId" ON "exam_review_items" ("studyItemId")`);
        await queryRunner.query(`ALTER TABLE "exam_review_items" ADD CONSTRAINT "FK_exam_review_items_examId" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "exam_review_items" ADD CONSTRAINT "FK_exam_review_items_studyItemId" FOREIGN KEY ("studyItemId") REFERENCES "study_items"("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "exam_review_items"`);
        await queryRunner.query(`DROP TABLE "exams"`);
        await queryRunner.query(`DROP TABLE "assignments"`);
        await queryRunner.query(`ALTER TABLE "study_goals" DROP COLUMN "learningType"`);
    }

}
