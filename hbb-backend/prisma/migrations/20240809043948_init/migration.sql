/*
  Warnings:

  - A unique constraint covering the columns `[ETag]` on the table `Image` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Image_ETag_key" ON "Image"("ETag");
