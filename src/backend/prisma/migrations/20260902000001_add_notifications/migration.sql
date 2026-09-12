-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION_SUBMITTED', 'APPLICATION_STATUS_CHANGED', 'APPLICATION_SHORTLISTED', 'APPLICATION_SELECTED', 'APPLICATION_REJECTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_UPDATED', 'OPPORTUNITY_PUBLISHED', 'COLLABORATION_PARTICIPATION_REQUESTED', 'COLLABORATION_PARTICIPATION_APPROVED', 'COLLABORATION_PARTICIPATION_REJECTED', 'COLLABORATION_STATUS_CHANGED', 'LEARNING_PATH_ENROLLED', 'LEARNING_PATH_COMPLETED', 'SKILL_GAP_REMEDIATION_AVAILABLE', 'PLACEMENT_OFFER_ISSUED', 'PLACEMENT_OFFER_ACCEPTED', 'PLACEMENT_OFFER_DECLINED', 'PLACEMENT_VERIFICATION_REQUIRED', 'PLACEMENT_VERIFIED', 'PLACEMENT_CONFIRMED', 'PLACEMENT_JOINED', 'PLACEMENT_REVOKED', 'MENTOR_REQUEST_RECEIVED', 'MENTOR_REQUEST_ACCEPTED', 'MENTOR_REQUEST_REJECTED', 'MENTORSHIP_STARTED', 'MENTORSHIP_SESSION_SCHEDULED', 'MENTORSHIP_SESSION_RESCHEDULED', 'MENTORSHIP_SESSION_CANCELLED', 'MENTORSHIP_SESSION_COMPLETED', 'SYSTEM_ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notifications_idempotencyKey_key" ON "notifications"("idempotencyKey");

-- CreateIndex
CREATE INDEX "notifications_recipientUserId_isRead_idx" ON "notifications"("recipientUserId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_recipientUserId_createdAt_idx" ON "notifications"("recipientUserId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_notificationType_key" ON "notification_preferences"("userId", "notificationType");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
