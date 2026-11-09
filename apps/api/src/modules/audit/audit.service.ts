import { AuditEvent } from './audit.model';
import { redactSecrets } from '../../utils/secrets';

export async function recordAudit(entry: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await AuditEvent.create({
      actorId: entry.actorId || null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? '',
      metadata: entry.metadata ?? {},
    });
  } catch (error) {
    const message = error instanceof Error ? redactSecrets(error.message) : 'Unknown audit error';
    console.error('[practicebridge] Audit write failed.', message);
  }
}
