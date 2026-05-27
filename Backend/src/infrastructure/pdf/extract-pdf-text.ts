import { randomUUID } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const tmpPath = join(tmpdir(), `resume-${randomUUID()}.pdf`);

  await writeFile(tmpPath, buffer);

  try {
    const loader = new PDFLoader(tmpPath);
    const docs = await loader.load();
    return docs.map((doc) => doc.pageContent).join("\n\n").trim();
  } finally {
    await unlink(tmpPath).catch(() => undefined);
  }
}
