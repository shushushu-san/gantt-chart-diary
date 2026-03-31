-- DropForeignKey
ALTER TABLE "Entry" DROP CONSTRAINT "Entry_projectId_fkey";

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
