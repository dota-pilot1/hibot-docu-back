-- Make assignee_id nullable in tasks table
ALTER TABLE "tasks" ALTER COLUMN "assignee_id" DROP NOT NULL;
