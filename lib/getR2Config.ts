import { getEnvR2Config, R2Config } from './r2';
import { prisma } from './prisma';

/** Resolves R2 config: env vars take precedence, then falls back to DB settings. */
export async function getR2Config(): Promise<R2Config | null> {
  const envCfg = getEnvR2Config();
  if (envCfg) return envCfg;

  try {
    const row = await prisma.content.findUnique({ where: { id: 1 } });
    if (!row) return null;
    const s = (row.data as any)?.settings ?? {};
    const { r2AccountId, r2AccessKeyId, r2SecretAccessKey, r2BucketName, r2PublicUrl } = s;
    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2BucketName || !r2PublicUrl) return null;
    return {
      accountId:       r2AccountId,
      accessKeyId:     r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
      bucketName:      r2BucketName,
      publicUrl:       (r2PublicUrl as string).replace(/\/$/, ''),
    };
  } catch {
    return null;
  }
}
