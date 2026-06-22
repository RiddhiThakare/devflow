-- CreateEnum
CREATE TYPE "public"."RunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "public"."pipeline_runs" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "status" "public"."RunStatus" NOT NULL DEFAULT 'PENDING',
    "logs" TEXT NOT NULL DEFAULT '',
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "pipeline_runs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."pipeline_runs" ADD CONSTRAINT "pipeline_runs_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "public"."pipelines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
