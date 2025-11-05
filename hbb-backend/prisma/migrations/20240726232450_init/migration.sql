-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('CATFISHING', 'MISCONDUCT', 'HARASSMENT', 'ILLEGAL_ACTIVITY', 'OTHER');

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "category" "ReportReason",
    "reportMessage" TEXT,
    "reportedUser" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);
