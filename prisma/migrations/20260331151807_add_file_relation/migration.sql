-- AlterTable
ALTER TABLE "Entry" ADD COLUMN     "projectFileId" TEXT;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_projectFileId_fkey" FOREIGN KEY ("projectFileId") REFERENCES "ProjectFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
