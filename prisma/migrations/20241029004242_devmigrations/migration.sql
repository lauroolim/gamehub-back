/*
  Warnings:

  - Added the required column `expiresAt` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripeSessionId` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "stripeId" TEXT,
ADD COLUMN     "stripeSessionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stamp" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PlanChange" (
    "id" SERIAL NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "oldPlan" TEXT NOT NULL,
    "newPlan" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanChange_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlanChange" ADD CONSTRAINT "PlanChange_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
