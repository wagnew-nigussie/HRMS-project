import { createHash, randomUUID } from 'crypto';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { putObject, getSignedDownloadUrl, buildDocKey } from '../../utils/s3';

export async function upload(employeeId: string, file: Express.Multer.File, category: string) {
  if (!file) throw new AppError(400, 'NO_FILE', 'No file uploaded');
  const checksum = createHash('sha256').update(file.buffer).digest('hex');
  const key = buildDocKey('default', employeeId, randomUUID(), file.originalname);
  await putObject(key, file.buffer, file.mimetype);
  
  return prisma.document.create({
    data: { employeeId, category, filename: file.originalname, mimeType: file.mimetype, sizeBytes: file.size, storageKey: key, checksum, status: 'CLEAN' },
  });
}

export async function listMine(employeeId: string) {
  return prisma.document.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' } });
}

export async function getDownloadUrl(docId: string, requester: any) {
  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc) throw new AppError(404, 'NOT_FOUND', 'Document not found');
  return { url: await getSignedDownloadUrl(doc.storageKey), expiresIn: 900 };
}
