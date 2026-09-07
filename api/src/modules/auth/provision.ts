import { sql } from 'drizzle-orm';
import type { Database } from '../../db/client';
import { organisationMemberships, organisations } from '../../db/schema/identity';

export async function provisionOrganisationForUser(
  db: Database,
  user: { id: string; name: string },
): Promise<{ organisationId: string }> {
  const organisationId = crypto.randomUUID();
  const name = user.name.trim().length > 0 ? `${user.name.trim()}'s organisation` : 'Organisation';

  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.user_id', ${user.id}, true)`);
    await tx.execute(sql`SELECT set_config('app.organisation_id', ${organisationId}, true)`);
    await tx.insert(organisations).values({ id: organisationId, name });
    await tx.insert(organisationMemberships).values({
      organisationId,
      userId: user.id,
      role: 'owner',
    });
  });

  return { organisationId };
}
