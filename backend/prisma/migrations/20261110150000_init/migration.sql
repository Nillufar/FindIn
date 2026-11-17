-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('OPEN_SOURCE', 'PRIVATE_SOURCE', 'PROPRIETARY');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TimelineClass" AS ENUM ('SHORT', 'MEDIUM', 'LONG');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "skills" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "repositoryUrl" TEXT,
    "fieldOfStudy" TEXT NOT NULL,
    "minWeeklyHours" INTEGER NOT NULL,
    "timeline" "TimelineClass" NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectRequiredSkill" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,

    CONSTRAINT "ProjectRequiredSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Project_ownerId_idx" ON "Project"("ownerId");

-- CreateIndex
CREATE INDEX "Project_fieldOfStudy_idx" ON "Project"("fieldOfStudy");

-- CreateIndex
CREATE INDEX "Project_sourceType_idx" ON "Project"("sourceType");

-- CreateIndex
CREATE INDEX "Project_minWeeklyHours_idx" ON "Project"("minWeeklyHours");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_status_fieldOfStudy_sourceType_minWeeklyHours_idx"
  ON "Project"("status", "fieldOfStudy", "sourceType", "minWeeklyHours");

-- CreateIndex
CREATE INDEX "ProjectRequiredSkill_skill_idx" ON "ProjectRequiredSkill"("skill");

-- CreateIndex
CREATE INDEX "ProjectRequiredSkill_skill_projectId_idx" ON "ProjectRequiredSkill"("skill", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRequiredSkill_projectId_skill_key" ON "ProjectRequiredSkill"("projectId", "skill");

-- CreateIndex
CREATE INDEX "Invitation_status_idx" ON "Invitation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_projectId_applicantId_key" ON "Invitation"("projectId", "applicantId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRequiredSkill" ADD CONSTRAINT "ProjectRequiredSkill_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_applicantId_fkey"
  FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_inviterId_fkey"
  FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
