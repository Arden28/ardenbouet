-- CreateEnum
CREATE TYPE "GrantScope" AS ENUM ('UNLIMITED', 'LIMITED', 'SPECIFIC');

-- CreateEnum
CREATE TYPE "WriterRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "MeetingLocation" AS ENUM ('GOOGLE_MEET', 'CUSTOM_LINK', 'PHONE', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "PostStatus" ADD VALUE 'REVIEW';

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "donationsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "translationOfId" TEXT;

-- AlterTable
ALTER TABLE "Reader" ADD COLUMN     "bio" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "handle" TEXT,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "location" TEXT,
ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "WriterGrant" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "readerId" TEXT NOT NULL,
    "scope" "GrantScope" NOT NULL DEFAULT 'UNLIMITED',
    "maxPosts" INTEGER,
    "postIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "canPublish" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "note" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "WriterGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WriterInvite" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "scope" "GrantScope" NOT NULL DEFAULT 'UNLIMITED',
    "maxPosts" INTEGER,
    "postIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "canPublish" BOOLEAN NOT NULL DEFAULT true,
    "grantExpiresAt" TIMESTAMP(3),
    "inviteExpiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "acceptedById" TEXT,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "WriterInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WriterRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readerId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sampleUrl" TEXT,
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "WriterRequestStatus" NOT NULL DEFAULT 'PENDING',
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "WriterRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "postId" TEXT,
    "recipientId" TEXT,
    "donorId" TEXT,
    "donorName" TEXT NOT NULL DEFAULT '',
    "donorEmail" TEXT,
    "message" TEXT NOT NULL DEFAULT '',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "feeAmount" INTEGER NOT NULL DEFAULT 0,
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "stripePaymentIntentId" TEXT NOT NULL,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingType" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleFr" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "descriptionFr" TEXT NOT NULL DEFAULT '',
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "bufferMin" INTEGER NOT NULL DEFAULT 10,
    "location" "MeetingLocation" NOT NULL DEFAULT 'GOOGLE_MEET',
    "locationDetail" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MeetingType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Nairobi',
    "rules" JSONB NOT NULL DEFAULT '[]',
    "minNoticeMin" INTEGER NOT NULL DEFAULT 240,
    "maxDaysAhead" INTEGER NOT NULL DEFAULT 30,
    "slotStepMin" INTEGER NOT NULL DEFAULT 30,
    "googleRefreshToken" TEXT,
    "googleEmail" TEXT,
    "googleCalendarId" TEXT NOT NULL DEFAULT 'primary',

    CONSTRAINT "BookingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "meetingTypeId" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "guestTimezone" TEXT NOT NULL DEFAULT 'UTC',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "googleEventId" TEXT,
    "meetLink" TEXT,
    "cancelToken" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT NOT NULL DEFAULT '',
    "crmClientId" TEXT,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WriterGrant_readerId_key" ON "WriterGrant"("readerId");

-- CreateIndex
CREATE UNIQUE INDEX "WriterInvite_token_key" ON "WriterInvite"("token");

-- CreateIndex
CREATE INDEX "WriterRequest_status_createdAt_idx" ON "WriterRequest"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_stripePaymentIntentId_key" ON "Donation"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Donation_recipientId_status_idx" ON "Donation"("recipientId", "status");

-- CreateIndex
CREATE INDEX "Donation_postId_status_idx" ON "Donation"("postId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingType_slug_key" ON "MeetingType"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_cancelToken_key" ON "Booking"("cancelToken");

-- CreateIndex
CREATE INDEX "Booking_start_status_idx" ON "Booking"("start", "status");

-- CreateIndex
CREATE INDEX "Post_authorId_status_idx" ON "Post"("authorId", "status");

-- CreateIndex
CREATE INDEX "Post_translationOfId_idx" ON "Post"("translationOfId");

-- CreateIndex
CREATE UNIQUE INDEX "Reader_handle_key" ON "Reader"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "Reader_stripeAccountId_key" ON "Reader"("stripeAccountId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Reader"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_translationOfId_fkey" FOREIGN KEY ("translationOfId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WriterGrant" ADD CONSTRAINT "WriterGrant_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "Reader"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WriterInvite" ADD CONSTRAINT "WriterInvite_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "Reader"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WriterRequest" ADD CONSTRAINT "WriterRequest_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "Reader"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Reader"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "Reader"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_meetingTypeId_fkey" FOREIGN KEY ("meetingTypeId") REFERENCES "MeetingType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

