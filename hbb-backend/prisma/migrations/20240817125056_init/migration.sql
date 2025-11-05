/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Interest` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Interest` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Interest` table. All the data in the column will be lost.
  - You are about to drop the column `zodiacSignId` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the `ZodiacSign` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProfileInterests` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_zodiacSignId_fkey";

-- DropForeignKey
ALTER TABLE "_ProfileInterests" DROP CONSTRAINT "_ProfileInterests_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProfileInterests" DROP CONSTRAINT "_ProfileInterests_B_fkey";

-- AlterTable
ALTER TABLE "Interest" DROP COLUMN "createdAt",
DROP COLUMN "image",
DROP COLUMN "updatedAt",
ALTER COLUMN "isDeleted" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "zodiacSignId",
ADD COLUMN     "interests" TEXT[],
ADD COLUMN     "zodiacSign" TEXT;

-- DropTable
DROP TABLE "ZodiacSign";

-- DropTable
DROP TABLE "_ProfileInterests";
