-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_channelId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_dmchannelId_fkey";

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "channelId" DROP NOT NULL,
ALTER COLUMN "dmchannelId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_dmchannelId_fkey" FOREIGN KEY ("dmchannelId") REFERENCES "DMChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
