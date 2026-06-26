export interface MatchPlayer {
  id: string;
  name: string;
}

/**
 * Returns the list of participant user ids for an active match hash,
 * working for both legacy 1v1 matches (requesterId/opponentId) and
 * custom N-player lobby matches (mode === "custom" with a participants JSON).
 */
export function getParticipantIds(raw: Record<string, string>): string[] {
  if (!raw) return [];
  if (raw.mode === "custom") {
    try {
      const players: MatchPlayer[] = JSON.parse(raw.participants || "[]");
      return players.map((p) => p.id).filter(Boolean);
    } catch {
      return [];
    }
  }
  return [raw.requesterId, raw.opponentId].filter(Boolean) as string[];
}

/** Parses the participants array for a custom match hash. */
export function getCustomParticipants(raw: Record<string, string>): MatchPlayer[] {
  try {
    return JSON.parse(raw.participants || "[]");
  } catch {
    return [];
  }
}
