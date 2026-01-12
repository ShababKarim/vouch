import { StorageService } from './index';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export class MockStorageService implements StorageService {
    private uploadsDir = join(process.cwd(), 'uploads');

    async uploadFile(file: Buffer, filename: string, contentType: string): Promise<string> {
        console.log(`💾 MOCK: Uploading file ${filename} (${contentType})`);

        // Ensure uploads directory exists
        await mkdir(this.uploadsDir, { recursive: true });

        // Write file to local uploads directory
        const filePath = join(this.uploadsDir, filename);
        await writeFile(filePath, file);

        // Return mock URL
        const url = `http://localhost:3000/uploads/${filename}`;
        console.log(`💾 MOCK: File uploaded to ${url}`);

        return url;
    }

    async deleteFile(url: string): Promise<void> {
        console.log(`💾 MOCK: Deleting file ${url}`);

        // Extract filename from URL
        const filename = url.split('/').pop();
        if (!filename) return;

        const filePath = join(this.uploadsDir, filename);

        try {
            await import('fs/promises').then((fs) => fs.unlink(filePath));
            console.log(`💾 MOCK: File deleted successfully`);
        } catch (error) {
            console.log(`💾 MOCK: File deletion failed (file may not exist)`);
        }
    }
}
