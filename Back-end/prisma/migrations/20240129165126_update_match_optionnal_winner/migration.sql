-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_winnerid_fkey";

-- AlterTable
ALTER TABLE "Match" ALTER COLUMN "winnerid" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerid_fkey" FOREIGN KEY ("winnerid") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
