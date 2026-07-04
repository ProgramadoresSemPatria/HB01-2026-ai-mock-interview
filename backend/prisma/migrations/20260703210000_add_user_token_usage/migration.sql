-- CreateTable
CREATE TABLE "user_token_usage" (
    "userId" INTEGER NOT NULL,
    "periodKey" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_token_usage_pkey" PRIMARY KEY ("userId","periodKey")
);

-- AddForeignKey
ALTER TABLE "user_token_usage" ADD CONSTRAINT "user_token_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
