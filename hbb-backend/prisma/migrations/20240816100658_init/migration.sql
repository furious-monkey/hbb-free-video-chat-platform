/*
  Warnings:

  - You are about to drop the column `interests` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `zodiacSign` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the `zodiacSign` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "interests",
DROP COLUMN "zodiacSign",
ADD COLUMN     "zodiacSignId" TEXT;

-- DropTable
DROP TABLE "zodiacSign";

-- CreateTable
CREATE TABLE "ZodiacSign" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZodiacSign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProfileInterests" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ZodiacSign_name_key" ON "ZodiacSign"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_ProfileInterests_AB_unique" ON "_ProfileInterests"("A", "B");

-- CreateIndex
CREATE INDEX "_ProfileInterests_B_index" ON "_ProfileInterests"("B");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_zodiacSignId_fkey" FOREIGN KEY ("zodiacSignId") REFERENCES "ZodiacSign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfileInterests" ADD CONSTRAINT "_ProfileInterests_A_fkey" FOREIGN KEY ("A") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfileInterests" ADD CONSTRAINT "_ProfileInterests_B_fkey" FOREIGN KEY ("B") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
