// Pacing guard — fork addition (Mrfentmen/printify-mcp, 2026-10-21).
//
// Account-safety rule set by the account owner: product creation and
// publishing must stay at a human pace — at most 2 creations in any rolling
// 10-minute window. The owner has had marketplace accounts banned for moving
// too fast, so this guard lives IN the server: create_product and
// publish_product calls beyond the limit are refused with an explanation
// instead of reaching the Printify API. Uploads and reads are not throttled.

export const PACING_WINDOW_MS = 10 * 60 * 1000;
export const PACING_MAX_CREATIONS = 2;

const creationTimestamps: number[] = [];

function prune(now: number): void {
  while (
    creationTimestamps.length > 0 &&
    now - creationTimestamps[0] >= PACING_WINDOW_MS
  ) {
    creationTimestamps.shift();
  }
}

/**
 * Returns a refusal message if a creation right now would exceed the pacing
 * limit, or null if the creation may proceed.
 */
export function pacingRefusal(now: number = Date.now()): string | null {
  prune(now);
  if (creationTimestamps.length >= PACING_MAX_CREATIONS) {
    const waitSeconds = Math.ceil(
      (PACING_WINDOW_MS - (now - creationTimestamps[0])) / 1000
    );
    return (
      `Pacing guard: product creation/publishing is limited to ` +
      `${PACING_MAX_CREATIONS} per ${PACING_WINDOW_MS / 60000} minutes ` +
      `(account-safety rule — the owner has had marketplace bans for moving ` +
      `too fast). Limit reached; try again in about ${waitSeconds} seconds. ` +
      `Uploads and reads are not throttled.`
    );
  }
  return null;
}

/** Record a successful creation/publish so the guard counts it. */
export function recordCreation(now: number = Date.now()): void {
  prune(now);
  creationTimestamps.push(now);
}

/** Test helper: clear all recorded creations. */
export function resetPacing(): void {
  creationTimestamps.length = 0;
}
