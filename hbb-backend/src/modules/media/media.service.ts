import { Service } from 'typedi';
import { S3Client, PutObjectCommand, PutObjectCommandOutput } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import { APIError } from '../../middleware/error/appError';
import { ErrorHandler } from '../../middleware/error/errorHandler';
import { logger } from '../../config/logger';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const errorHandler = new ErrorHandler(logger);
const prisma = new PrismaClient();

// Initialize the S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

@Service()
export default class MediaService {

  // Utility function to calculate ETag based on file content
  private async calculateETag(fileBuffer: Buffer): Promise<string> {
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
  }

  // Utility function to upload a file to S3
  private async uploadToS3(key: string, file: Express.Multer.File): Promise<PutObjectCommandOutput> {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    logger.info(`Initiating S3 upload with key: ${key}`);
    const command = new PutObjectCommand(params);
    return s3Client.send(command);
  }

  // Utility function to save file metadata to the database
  private async saveFileMetadata(type: 'image' | 'video', fileUrl: string, ETag: string, key: string, userId: string) {
    if (type === 'image') {
      const imageRecord = await prisma.image.create({
        data: {
          url: fileUrl,
          ETag,
          key,
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          UserId: userId,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { profileImage: ETag },
      });

      logger.info(`Image record created successfully with ID: ${imageRecord.id}`);
      return imageRecord;
    } else if (type === 'video') {
      const videoRecord = await prisma.video.create({
        data: {
          url: fileUrl,
          ETag,
          key,
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          UserId: userId,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          promotionalVideo: {
            push: ETag,
          },
        },
      });

      logger.info(`Video record created successfully with ID: ${videoRecord.id}`);
      return videoRecord;
    }
  }

  // Main function to handle file upload
  async uploadFile(
    file: Express.Multer.File,
    bucketFolder: string,
    type: 'image' | 'video',
    userId: string
  ): Promise<any> {
    // Generate a unique file key
    const randomFileName = `${uuidv4()}_${Date.now()}`;
    const key = `${bucketFolder}/${randomFileName}`;

    try {
      // Calculate the file's ETag
      const fileETag = await this.calculateETag(file.buffer);

      // Upload the file to S3
      const uploadResult = await this.uploadToS3(key, file);

      if (!uploadResult.ETag) {
        throw new APIError('Failed to retrieve ETag from S3', 'uploadFile', 500);
      }

      // Construct the file URL
      const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      // Save file metadata in the database
      const savedRecord = await this.saveFileMetadata(type, fileUrl, uploadResult.ETag, key, userId);

      if (!savedRecord) {
        throw new APIError('Failed to save file metadata', 'uploadFile', 500);
      }

      return {
        id: savedRecord.id,
        url: savedRecord.url,
        ETag: savedRecord.ETag,
      };

    } catch (error) {
      logger.error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await errorHandler.handleError(error as Error);
      throw new APIError('File upload failed', 'uploadFile', 500);
    }
  }
}
