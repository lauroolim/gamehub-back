// file-upload.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class FileUploadService {
    private readonly s3Client: S3Client;

    constructor(private readonly configService: ConfigService) {
        this.s3Client = new S3Client({
            region: this.configService.getOrThrow('AWS_S3_REGION'),
        });
    }

    async uploadFile(bucketName: string, fileName: string, file: Buffer): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: file,
            ACL: 'public-read',
        });
        await this.s3Client.send(command);
        return `https://${bucketName}.s3.amazonaws.com/${fileName}`;
    }

    async uploadImage(fileName: string, file: Buffer): Promise<string> {
        const bucketName = this.configService.get('AWS_S3_IMAGE_BUCKET');
        return this.uploadFile(bucketName, fileName, file);
    }

    async uploadVideo(fileName: string, file: Buffer): Promise<string> {
        const bucketName = this.configService.get('AWS_S3_VIDEO_BUCKET');
        return this.uploadFile(bucketName, fileName, file);
    }
}
