import { env } from '@/lib/env';
import { StorageService } from './index';

export class S3StorageService implements StorageService {
    async uploadFile(file: Buffer, filename: string, contentType: string): Promise<string> {
        if (!env.S3_BUCKET_NAME) {
            throw new Error('S3 bucket name not configured');
        }

        console.log(`☁️ Uploading file ${filename} to S3 bucket ${env.S3_BUCKET_NAME}`);

        // TODO: Implement actual S3 upload
        // const s3Client = new S3Client({
        //   region: env.AWS_REGION,
        //   credentials: {
        //     accessKeyId: env.AWS_ACCESS_KEY_ID!,
        //     secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
        //   },
        // })
        //
        // const command = new PutObjectCommand({
        //   Bucket: env.S3_BUCKET_NAME,
        //   Key: filename,
        //   Body: file,
        //   ContentType: contentType,
        // })
        //
        // await s3Client.send(command)
        //
        // return `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${filename}`

        return `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${filename}`;
    }

    async deleteFile(url: string): Promise<void> {
        console.log(`☁️ Deleting file ${url} from S3`);

        // TODO: Implement actual S3 deletion
        // const filename = url.split('/').pop()
        // if (!filename) return
        //
        // const s3Client = new S3Client({
        //   region: env.AWS_REGION,
        //   credentials: {
        //     accessKeyId: env.AWS_ACCESS_KEY_ID!,
        //     secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
        //   },
        // })
        //
        // const command = new DeleteObjectCommand({
        //   Bucket: env.S3_BUCKET_NAME!,
        //   Key: filename,
        // })
        //
        // await s3Client.send(command)
    }
}
