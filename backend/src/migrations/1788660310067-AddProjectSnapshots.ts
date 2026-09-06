import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjectSnapshots1788660310067 implements MigrationInterface {
    name = 'AddProjectSnapshots1788660310067'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "study_notes" ADD "projectSnapshotId" uuid`);

        await queryRunner.query(`
            CREATE TABLE "project_snapshots" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "goalId" uuid NOT NULL,
                "studyItemId" uuid NOT NULL,
                "noteId" uuid NOT NULL,
                "name" character varying(255) NOT NULL,
                "fileCount" integer NOT NULL,
                "totalSize" integer NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_project_snapshots_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_project_snapshots_userId" ON "project_snapshots" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_project_snapshots_goalId" ON "project_snapshots" ("goalId")`);
        await queryRunner.query(`CREATE INDEX "IDX_project_snapshots_studyItemId" ON "project_snapshots" ("studyItemId")`);
        await queryRunner.query(`CREATE INDEX "IDX_project_snapshots_noteId" ON "project_snapshots" ("noteId")`);
        await queryRunner.query(`
            ALTER TABLE "project_snapshots" ADD CONSTRAINT "FK_project_snapshots_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "project_snapshots" ADD CONSTRAINT "FK_project_snapshots_goalId" FOREIGN KEY ("goalId") REFERENCES "study_goals"("id") ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "project_snapshots" ADD CONSTRAINT "FK_project_snapshots_studyItemId" FOREIGN KEY ("studyItemId") REFERENCES "study_items"("id") ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "project_snapshots" ADD CONSTRAINT "FK_project_snapshots_noteId" FOREIGN KEY ("noteId") REFERENCES "study_notes"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            CREATE TABLE "project_files" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "projectSnapshotId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "path" character varying(1024) NOT NULL,
                "name" character varying(255) NOT NULL,
                "extension" character varying(32),
                "mimeType" character varying(128),
                "size" integer NOT NULL,
                "isDirectory" boolean NOT NULL DEFAULT false,
                "content" text,
                "storageKey" character varying(255),
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_project_files_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_project_files_projectSnapshotId" ON "project_files" ("projectSnapshotId")`);
        await queryRunner.query(`CREATE INDEX "IDX_project_files_userId" ON "project_files" ("userId")`);
        await queryRunner.query(`
            ALTER TABLE "project_files" ADD CONSTRAINT "FK_project_files_projectSnapshotId" FOREIGN KEY ("projectSnapshotId") REFERENCES "project_snapshots"("id") ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "project_files"`);
        await queryRunner.query(`DROP TABLE "project_snapshots"`);
        await queryRunner.query(`ALTER TABLE "study_notes" DROP COLUMN "projectSnapshotId"`);
    }

}
