/*
  Warnings:

  - You are about to alter the column `experience` on the `User` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "experience" SET DEFAULT 0,
ALTER COLUMN "experience" SET DATA TYPE INTEGER;
