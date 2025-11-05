/*
  Warnings:

  - The `status` column on the `StreamSession` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "StreamStatus" AS ENUM ('PENDING', 'LIVE', 'ENDED');

-- AlterTable
ALTER TABLE "StreamSession" ALTER COLUMN "currentExplorerId" SET DEFAULT '',
DROP COLUMN "status",
ADD COLUMN     "status" "StreamStatus" NOT NULL DEFAULT 'PENDING';
