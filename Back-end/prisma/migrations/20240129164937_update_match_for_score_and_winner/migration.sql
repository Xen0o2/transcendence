/*
  Warnings:

  - Added the required column `scoreUser1` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scoreUser2` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `winnerid` to the `Match` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "scoreUser1" INTEGER NOT NULL,
ADD COLUMN     "scoreUser2" INTEGER NOT NULL,
ADD COLUMN     "winnerid" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerid_fkey" FOREIGN KEY ("winnerid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
