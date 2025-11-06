import AWS from 'aws-sdk'
import config from '@/utils/config'
import logger from '@/utils/logger'

// Configure Cloudflare R2 (S3-compatible)
const s3 = new AWS.S3({
  accessKeyId: config.r2.accessKeyId,
  secretAccessKey: config.r2.secretAccessKey,
  region: 'auto',
  endpoint: config.r2.endpoint,
  signatureVersion: 'v4',
})

export interface UploadResult {
  key: string
  url: string
  signedUrl: string
}

export class StorageService {
  private bucket: string

  constructor() {
    this.bucket = config.r2.bucket
  }

  /**
   * Upload a file to Cloudflare R2
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
    metadata: Record<string, string> = {}
  ): Promise<UploadResult> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
        },
      }

      const result = await s3.upload(params).promise()

      // Generate signed URL for download (7 days expiry)
      const signedUrl = await this.getSignedUrl(key, 7 * 24 * 60 * 60) // 7 days

      logger.info('File uploaded successfully', {
        key,
        location: result.Location,
        contentType,
      })

      return {
        key,
        url: result.Location,
        signedUrl,
      }
    } catch (error) {
      logger.error('Failed to upload file', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw new Error(`Storage upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate a signed URL for file access
   */
  async getSignedUrl(key: string, expiresIn: number = 7 * 24 * 60 * 60): Promise<string> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn,
      }

      return s3.getSignedUrl('getObject', params)
    } catch (error) {
      logger.error('Failed to generate signed URL', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
      }

      await s3.deleteObject(params).promise()

      logger.info('File deleted successfully', { key })
    } catch (error) {
      logger.error('Failed to delete file', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw new Error(`Storage deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
      }

      await s3.headObject(params).promise()
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Generate a unique file key
   */
  generateFileKey(prefix: string, filename: string): string {
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const randomId = Math.random().toString(36).substr(2, 9)
    const extension = filename.split('.').pop()

    return `${prefix}/${timestamp}/${randomId}.${extension}`
  }
}

export default new StorageService()