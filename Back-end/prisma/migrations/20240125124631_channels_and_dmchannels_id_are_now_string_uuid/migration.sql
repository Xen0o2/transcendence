/*
  Warnings:

  - The primary key for the `Channel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `DMChannel` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_channelId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_dmchannelId_fkey";

-- DropForeignKey
ALTER TABLE "Muted" DROP CONSTRAINT "Muted_channelId_fkey";

-- DropForeignKey
ALTER TABLE "_Admins" DROP CONSTRAINT "_Admins_A_fkey";

-- DropForeignKey
ALTER TABLE "_ChannelUsers" DROP CONSTRAINT "_ChannelUsers_A_fkey";

-- DropForeignKey
ALTER TABLE "_bannedUsers" DROP CONSTRAINT "_bannedUsers_A_fkey";

-- AlterTable
ALTER TABLE "Channel" DROP CONSTRAINT "Channel_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Channel_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Channel_id_seq";

-- AlterTable
ALTER TABLE "DMChannel" DROP CONSTRAINT "DMChannel_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "DMChannel_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "DMChannel_id_seq";

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "channelId" SET DATA TYPE TEXT,
ALTER COLUMN "dmchannelId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Muted" ALTER COLUMN "channelId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_Admins" ALTER COLUMN "A" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_ChannelUsers" ALTER COLUMN "A" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "_bannedUsers" ALTER COLUMN "A" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Muted" ADD CONSTRAINT "Muted_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_dmchannelId_fkey" FOREIGN KEY ("dmchannelId") REFERENCES "DMChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Admins" ADD CONSTRAINT "_Admins_A_fkey" FOREIGN KEY ("A") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChannelUsers" ADD CONSTRAINT "_ChannelUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_bannedUsers" ADD CONSTRAINT "_bannedUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
