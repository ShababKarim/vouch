import { env } from '@/lib/env';
import { MockStorageService } from './mock';
import { S3StorageService } from './s3';

export interface StorageService {
  uploadFile(file: Buffer, filename: string, contentType: string): Promise<string>;
  deleteFile(url: string): Promise<void>;
}

export function createStorageService(): StorageService {
  if (env.APP_ENV === 'local') {
    return new MockStorageService();
  }

  return new S3StorageService();
}
