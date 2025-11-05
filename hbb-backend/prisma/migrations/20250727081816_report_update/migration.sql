/*
  Warnings:

  - You are about to drop the column `reportedUser` on the `Report` table. All the data in the column will be lost.
  - Added the required column `reportedUserId` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reporterId` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Changed the column `category` on the `Report` table from a scalar field to a list field. If there are non-null values in that column, this step will fail.

*/
-- AlterTable
ALTER TABLE "Report" DROP COLUMN "reportedUser",
ADD COLUMN     "reportedUserId" TEXT NOT NULL,
ADD COLUMN     "reporterId" TEXT NOT NULL,
ALTER COLUMN "category" SET DATA TYPE "ReportReason"[] USING ARRAY["category"]::"ReportReason"[];

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;