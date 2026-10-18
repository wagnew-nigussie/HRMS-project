import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';

export const s3 = new S3Client({
  region: env.S3_REGION || 'us-east-1',
  endpoint: env.S3_ENDPOINT || 'http://localhost:9000',
  forcePathStyle: true,
  credentials: { accessKeyId: env.S3_ACCESS_KEY || 'minio', secretAccessKey: env.S3_SECRET_KEY || 'minio12345' },
});

export async function putObject(key: string, body: Buffer, contentType: string) {
  await s3.send(new PutObjectCommand({ Bucket: env.S3_BUCKET || 'hrms-docs', Key: key, Body: body, ContentType: contentType, ServerSideEncryption: 'AES256' }));
  return key;
}

export async function getSignedDownloadUrl(key: string, ttlSec = 900) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: env.S3_BUCKET || 'hrms-docs', Key: key }), { expiresIn: ttlSec });
}

export function buildDocKey(orgId: string, employeeId: string, uuid: string, filename: string) {
  const safe = filename.replace(/[^\w.\-]/g, '_');
  return `org/${orgId}/employee/${employeeId}/${uuid}/${safe}`;
}
