-- CreateEnum
CREATE TYPE "DMChannelStatus" AS ENUM ('OPEN', 'BLOCKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" SERIAL NOT NULL,
    "user1id" TEXT NOT NULL,
    "user2id" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "user1id" TEXT NOT NULL,
    "user2id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" SERIAL NOT NULL,
    "type" "ChannelType" NOT NULL DEFAULT 'PUBLIC',
    "name" TEXT NOT NULL,
    "password" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Muted" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Muted_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DMChannel" (
    "id" SERIAL NOT NULL,
    "user1id" TEXT NOT NULL,
    "user2id" TEXT NOT NULL,
    "status" "DMChannelStatus" NOT NULL DEFAULT 'OPEN',
    "blockerid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DMChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "channelId" INTEGER NOT NULL,
    "dmchannelId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Friends" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Blocked" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Admins" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ChannelUsers" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_bannedUsers" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_user1id_user2id_key" ON "Friendship"("user1id", "user2id");

-- CreateIndex
CREATE UNIQUE INDEX "Muted_userId_channelId_key" ON "Muted"("userId", "channelId");

-- CreateIndex
CREATE UNIQUE INDEX "DMChannel_user1id_user2id_key" ON "DMChannel"("user1id", "user2id");

-- CreateIndex
CREATE UNIQUE INDEX "_Friends_AB_unique" ON "_Friends"("A", "B");

-- CreateIndex
CREATE INDEX "_Friends_B_index" ON "_Friends"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Blocked_AB_unique" ON "_Blocked"("A", "B");

-- CreateIndex
CREATE INDEX "_Blocked_B_index" ON "_Blocked"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Admins_AB_unique" ON "_Admins"("A", "B");

-- CreateIndex
CREATE INDEX "_Admins_B_index" ON "_Admins"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ChannelUsers_AB_unique" ON "_ChannelUsers"("A", "B");

-- CreateIndex
CREATE INDEX "_ChannelUsers_B_index" ON "_ChannelUsers"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_bannedUsers_AB_unique" ON "_bannedUsers"("A", "B");

-- CreateIndex
CREATE INDEX "_bannedUsers_B_index" ON "_bannedUsers"("B");

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_user1id_fkey" FOREIGN KEY ("user1id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_user2id_fkey" FOREIGN KEY ("user2id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_user1id_fkey" FOREIGN KEY ("user1id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_user2id_fkey" FOREIGN KEY ("user2id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Muted" ADD CONSTRAINT "Muted_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Muted" ADD CONSTRAINT "Muted_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DMChannel" ADD CONSTRAINT "DMChannel_user1id_fkey" FOREIGN KEY ("user1id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DMChannel" ADD CONSTRAINT "DMChannel_user2id_fkey" FOREIGN KEY ("user2id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DMChannel" ADD CONSTRAINT "DMChannel_blockerid_fkey" FOREIGN KEY ("blockerid") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_dmchannelId_fkey" FOREIGN KEY ("dmchannelId") REFERENCES "DMChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Friends" ADD CONSTRAINT "_Friends_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Friends" ADD CONSTRAINT "_Friends_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Blocked" ADD CONSTRAINT "_Blocked_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Blocked" ADD CONSTRAINT "_Blocked_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Admins" ADD CONSTRAINT "_Admins_A_fkey" FOREIGN KEY ("A") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Admins" ADD CONSTRAINT "_Admins_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChannelUsers" ADD CONSTRAINT "_ChannelUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChannelUsers" ADD CONSTRAINT "_ChannelUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_bannedUsers" ADD CONSTRAINT "_bannedUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_bannedUsers" ADD CONSTRAINT "_bannedUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
