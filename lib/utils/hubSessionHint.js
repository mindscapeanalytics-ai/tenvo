/**
 * Serializable hub session hint for Server → Client hydration.
 * Keep this module free of 'use client' so Server Components can call it.
 */

/**
 * @param {{ user?: Record<string, unknown>, session?: Record<string, unknown> } | null | undefined} session
 * @returns {{ user: { id: string, email: string | null, name: string | null, image: string | null, role: string | null }, session: { id: string | null, userId: string, expiresAt: string | null } } | null}
 */
export function toHubSessionHint(session) {
  try {
    if (!session?.user?.id) return null;

    const user = session.user;
    const rawSession = session.session;

    let expiresAt = null;
    if (rawSession?.expiresAt != null) {
      if (typeof rawSession.expiresAt === 'string') {
        expiresAt = rawSession.expiresAt;
      } else {
        try {
          const d = new Date(rawSession.expiresAt);
          expiresAt = Number.isNaN(d.getTime()) ? null : d.toISOString();
        } catch {
          expiresAt = null;
        }
      }
    }

    return {
      user: {
        id: String(user.id),
        email: user.email != null ? String(user.email) : null,
        name: user.name != null ? String(user.name) : null,
        image: user.image != null ? String(user.image) : null,
        role: user.role != null ? String(user.role) : null,
      },
      session: {
        id: rawSession?.id != null ? String(rawSession.id) : null,
        userId: String(rawSession?.userId || user.id),
        expiresAt,
      },
    };
  } catch (error) {
    console.error('[toHubSessionHint] Failed to serialize session hint:', error);
    return null;
  }
}
