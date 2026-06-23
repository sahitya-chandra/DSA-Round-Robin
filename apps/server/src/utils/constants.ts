export const WAITING_LIST = "waiting_users";
export const USER_MATCH_PREFIX = "user_match:";
export const ACTIVE_MATCH_PREFIX = "active_match:";
export const SUBMISSIONS_PREFIX = "match_submissions:";
export const LOCK_KEY = "matchmaker_lock";
export const MATCH_DURATION_SECONDS = 10 * 60;
export const MATCH_TTL = MATCH_DURATION_SECONDS + 30;
export const MATCH_EXPIRATIONS_KEY = "match_expirations";

// Custom lobby (custom rooms)
export const LOBBY_PREFIX = "lobby:";
export const LOBBY_PLAYERS_SUFFIX = ":players";
export const USER_LOBBY_PREFIX = "user_lobby:";
export const LOBBY_TTL = 60 * 60; // abandoned lobbies auto-expire after 1h
export const LOBBY_MIN_PLAYERS = 2;
export const LOBBY_MAX_PLAYERS = 10;