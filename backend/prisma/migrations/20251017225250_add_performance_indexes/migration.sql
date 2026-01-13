-- CreateIndex
CREATE INDEX "DiagnosticRecord_userId_createdAt_idx" ON "DiagnosticRecord"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DiagnosticRecord_createdAt_idx" ON "DiagnosticRecord"("createdAt");

-- CreateIndex
CREATE INDEX "DiagnosticRecord_systemType_idx" ON "DiagnosticRecord"("systemType");
