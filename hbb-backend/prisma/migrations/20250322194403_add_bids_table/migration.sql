-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "streamSessionId" TEXT NOT NULL,
    "explorerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_streamSessionId_fkey" FOREIGN KEY ("streamSessionId") REFERENCES "StreamSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_explorerId_fkey" FOREIGN KEY ("explorerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
