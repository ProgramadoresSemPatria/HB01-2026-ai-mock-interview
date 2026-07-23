-- AlterTable
ALTER TABLE "users" ADD COLUMN "external_id" TEXT;
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_external_id_key" ON "users"("external_id");

-- DropTable
DROP TABLE IF EXISTS "refresh_tokens";
