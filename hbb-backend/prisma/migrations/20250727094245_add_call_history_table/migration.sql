-- CreateTable
CREATE TABLE "CallHistory" (
    "id" TEXT NOT NULL,
    "streamSessionId" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "explorerId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "earnings" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CallHistory" ADD CONSTRAINT "CallHistory_streamSessionId_fkey" FOREIGN KEY ("streamSessionId") REFERENCES "StreamSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallHistory" ADD CONSTRAINT "CallHistory_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallHistory" ADD CONSTRAINT "CallHistory_explorerId_fkey" FOREIGN KEY ("explorerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
