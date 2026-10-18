-- CreateEnum
CREATE TYPE "ScreeningJobStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ScreeningDecision" AS ENUM ('PENDING', 'SHORTLIST', 'REJECT', 'HOLD');

-- CreateTable
CREATE TABLE "ResumeScreeningJob" (
    "id" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "status" "ScreeningJobStatus" NOT NULL DEFAULT 'PROCESSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeScreeningJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeScreeningResult" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "score" DECIMAL(4,3) NOT NULL,
    "skillsMatched" JSONB NOT NULL,
    "gaps" JSONB NOT NULL,
    "rationale" TEXT NOT NULL,
    "decision" "ScreeningDecision" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeScreeningResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResumeScreeningJob_createdById_createdAt_idx" ON "ResumeScreeningJob"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "ResumeScreeningResult_jobId_idx" ON "ResumeScreeningResult"("jobId");

-- CreateIndex
CREATE INDEX "ResumeScreeningResult_decision_idx" ON "ResumeScreeningResult"("decision");

-- AddForeignKey
ALTER TABLE "ResumeScreeningJob" ADD CONSTRAINT "ResumeScreeningJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeScreeningResult" ADD CONSTRAINT "ResumeScreeningResult_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ResumeScreeningJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
