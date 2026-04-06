import fs from "fs";
import path from "path";

export function createStorage(dataDir: string) {
  const attachmentsDir = path.join(dataDir, "attachments");
  fs.mkdirSync(attachmentsDir, { recursive: true });

  return {
    async save(
      emailId: string,
      filename: string,
      content: Buffer,
    ): Promise<string> {
      const dir = path.join(attachmentsDir, emailId);
      fs.mkdirSync(dir, { recursive: true });
      const filePath = path.join(dir, filename);
      fs.writeFileSync(filePath, content);
      return filePath;
    },

    getPath(emailId: string, filename: string): string {
      return path.join(attachmentsDir, emailId, filename);
    },

    attachmentsDir,
  };
}

export type Storage = ReturnType<typeof createStorage>;
