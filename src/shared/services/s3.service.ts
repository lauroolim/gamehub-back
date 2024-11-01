import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
    private readonly s3Client: S3Client;
    private readonly bucketName: string;

    constructor(private readonly configService: ConfigService) {
        this.s3Client = new S3Client({
            credentials: {
                accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
            },
            region: this.configService.getOrThrow<string>('AWS_S3_REGION'),
        });

    }

    async uploadFile(fileName: string, file: Buffer): Promise<string> {
        const command = new PutObjectCommand({
            Bucket: 'midias-app-gamehub',
            Key: fileName,
            Body: file,
            ACL: 'public-read',
        });

        await this.s3Client.send(command);

        return `https://midias-app-gamehub.s3.amazonaws.com/${fileName}`;
    }

    async deleteFile(fileKey: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: 'midias-app-gamehub',
            Key: fileKey,
        });

        await this.s3Client.send(command);
    }
}