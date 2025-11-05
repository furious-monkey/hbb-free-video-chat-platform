-- CreateTable
CREATE TABLE "UserGuide" (
    "id" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "fix" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGuide_pkey" PRIMARY KEY ("id")
);
