import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPlannerFlowEntities1788702603721 implements MigrationInterface {
    name = 'AddPlannerFlowEntities1788702603721'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "planner_goals" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "name" character varying(255) NOT NULL,
                "description" text,
                "deadline" date,
                "status" character varying(16) NOT NULL DEFAULT 'active',
                "priority" character varying(16) NOT NULL DEFAULT 'Medium',
                "reminderEnabled" boolean NOT NULL DEFAULT false,
                "reminderIntervalMinutes" integer NOT NULL DEFAULT 1440,
                "lastReminderSentAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_planner_goals_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_planner_goals_userId" ON "planner_goals" ("userId")`);
        await queryRunner.query(`ALTER TABLE "planner_goals" ADD CONSTRAINT "FK_planner_goals_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);

        await queryRunner.query(`
            CREATE TABLE "planner_milestones" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "goalId" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "dueDate" date,
                "completed" boolean NOT NULL DEFAULT false,
                "order" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_planner_milestones_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_planner_milestones_userId" ON "planner_milestones" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_planner_milestones_goalId" ON "planner_milestones" ("goalId")`);
        await queryRunner.query(`ALTER TABLE "planner_milestones" ADD CONSTRAINT "FK_planner_milestones_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "planner_milestones" ADD CONSTRAINT "FK_planner_milestones_goalId" FOREIGN KEY ("goalId") REFERENCES "planner_goals"("id") ON DELETE CASCADE`);

        await queryRunner.query(`
            CREATE TABLE "planner_tasks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "goalId" uuid NOT NULL,
                "milestoneId" uuid,
                "title" character varying(255) NOT NULL,
                "dueDate" date,
                "priority" character varying(16) NOT NULL DEFAULT 'Medium',
                "status" character varying(16) NOT NULL DEFAULT 'not_started',
                "isRecurring" boolean NOT NULL DEFAULT false,
                "recurrenceIntervalDays" integer,
                "reminderEnabled" boolean NOT NULL DEFAULT true,
                "reminderSentAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_planner_tasks_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_planner_tasks_userId" ON "planner_tasks" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_planner_tasks_goalId" ON "planner_tasks" ("goalId")`);
        await queryRunner.query(`CREATE INDEX "IDX_planner_tasks_milestoneId" ON "planner_tasks" ("milestoneId")`);
        await queryRunner.query(`ALTER TABLE "planner_tasks" ADD CONSTRAINT "FK_planner_tasks_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "planner_tasks" ADD CONSTRAINT "FK_planner_tasks_goalId" FOREIGN KEY ("goalId") REFERENCES "planner_goals"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "planner_tasks" ADD CONSTRAINT "FK_planner_tasks_milestoneId" FOREIGN KEY ("milestoneId") REFERENCES "planner_milestones"("id") ON DELETE CASCADE`);

        await queryRunner.query(`
            CREATE TABLE "planner_subtasks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "taskId" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "completed" boolean NOT NULL DEFAULT false,
                "order" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_planner_subtasks_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_planner_subtasks_userId" ON "planner_subtasks" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_planner_subtasks_taskId" ON "planner_subtasks" ("taskId")`);
        await queryRunner.query(`ALTER TABLE "planner_subtasks" ADD CONSTRAINT "FK_planner_subtasks_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "planner_subtasks" ADD CONSTRAINT "FK_planner_subtasks_taskId" FOREIGN KEY ("taskId") REFERENCES "planner_tasks"("id") ON DELETE CASCADE`);

        await queryRunner.query(`
            CREATE TABLE "planner_notes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "goalId" uuid NOT NULL,
                "content" text NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_planner_notes_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_planner_notes_userId" ON "planner_notes" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_planner_notes_goalId" ON "planner_notes" ("goalId")`);
        await queryRunner.query(`ALTER TABLE "planner_notes" ADD CONSTRAINT "FK_planner_notes_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "planner_notes" ADD CONSTRAINT "FK_planner_notes_goalId" FOREIGN KEY ("goalId") REFERENCES "planner_goals"("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "planner_notes"`);
        await queryRunner.query(`DROP TABLE "planner_subtasks"`);
        await queryRunner.query(`DROP TABLE "planner_tasks"`);
        await queryRunner.query(`DROP TABLE "planner_milestones"`);
        await queryRunner.query(`DROP TABLE "planner_goals"`);
    }

}
