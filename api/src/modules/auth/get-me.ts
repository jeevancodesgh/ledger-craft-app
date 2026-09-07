import { meResponseSchema, type MeResponse } from '@ledgercraft/contracts';
import { eq, sql } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import type { Database } from '../../db/client';
import { organisationMemberships, organisations } from '../../db/schema/identity';

export async function getMe(
  db: Database,
  user: { id: string; email: string; name: string },
): Promise<MeResponse> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.user_id', ${user.id}, true)`);

    const memberships = await tx
      .select()
      .from(organisationMemberships)
      .where(eq(organisationMemberships.userId, user.id));
    const membership = memberships[0];
    if (!membership) {
      throw new HTTPException(403, { message: 'No organisation membership' });
    }

    await tx.execute(sql`SELECT set_config('app.organisation_id', ${membership.organisationId}, true)`);

    const [organisation] = await tx
      .select()
      .from(organisations)
      .where(eq(organisations.id, membership.organisationId));
    if (!organisation) {
      throw new HTTPException(403, { message: 'Organisation not found' });
    }

    return meResponseSchema.parse({
      user: { id: user.id, email: user.email, name: user.name },
      organisation: { id: organisation.id, name: organisation.name },
      membership: { role: membership.role },
    });
  });
}
