/**
 * Server-side Secret Santa generator. Mirrors the mobile app's
 * src/utils/generateAssignments.ts and src/utils/validateAssignments.ts —
 * keep the rules in sync. Self-contained (no Deno APIs) so it can also be
 * exercised from Node tests.
 */

export type Assignment = { giverId: string; recipientId: string };

export type Subgroup = { id: string; participantIds: string[] };

export type GenerateAssignmentsResult =
  | {
    ok: true;
    assignments: Assignment[];
    usedDoubleGifts: boolean;
    doubleRecipientCount: number;
  }
  | {
    ok: false;
    error: string;
    code: "too_few" | "impossible" | "impossible_with_doubles";
  };

type ValidationMode = "standard" | "double";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildMembership(subgroups: Subgroup[]): Map<string, string> {
  const membership = new Map<string, string>();
  for (const subgroup of subgroups) {
    for (const participantId of subgroup.participantIds) {
      membership.set(participantId, subgroup.id);
    }
  }
  return membership;
}

function countBy(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function sameSubgroup(
  giverId: string,
  recipientId: string,
  membership: Map<string, string>,
): boolean {
  const giverSubgroup = membership.get(giverId);
  const recipientSubgroup = membership.get(recipientId);
  return Boolean(
    giverSubgroup && recipientSubgroup && giverSubgroup === recipientSubgroup,
  );
}

export function countDoubleRecipients(assignments: Assignment[]): number {
  let count = 0;
  for (const value of countBy(assignments.map((a) => a.recipientId)).values()) {
    if (value === 2) count += 1;
  }
  return count;
}

export function validateAssignments(
  assignments: Assignment[],
  participantIds: string[],
  subgroups: Subgroup[],
  preventSubgroupMatches: boolean,
  mode: ValidationMode,
): { ok: true } | { ok: false; reason: string } {
  const idSet = new Set(participantIds);
  const membership = buildMembership(subgroups);

  if (assignments.length === 0) {
    return { ok: false, reason: "No assignments." };
  }

  for (const assignment of assignments) {
    if (!idSet.has(assignment.giverId) || !idSet.has(assignment.recipientId)) {
      return { ok: false, reason: "Assignment references an unknown participant." };
    }
    if (assignment.giverId === assignment.recipientId) {
      return { ok: false, reason: "Self assignment is not allowed." };
    }
    if (
      preventSubgroupMatches &&
      sameSubgroup(assignment.giverId, assignment.recipientId, membership)
    ) {
      return { ok: false, reason: "Same-subgroup assignment is not allowed." };
    }
  }

  const giveCounts = countBy(assignments.map((a) => a.giverId));
  const receiveCounts = countBy(assignments.map((a) => a.recipientId));

  if (mode === "standard") {
    if (assignments.length !== participantIds.length) {
      return { ok: false, reason: "Standard exchange must be one-to-one." };
    }
    for (const id of participantIds) {
      if ((giveCounts.get(id) ?? 0) !== 1) {
        return { ok: false, reason: "Every participant must give exactly once." };
      }
      if ((receiveCounts.get(id) ?? 0) !== 1) {
        return { ok: false, reason: "Every participant must receive exactly once." };
      }
    }
    return { ok: true };
  }

  for (const id of participantIds) {
    const given = giveCounts.get(id) ?? 0;
    const received = receiveCounts.get(id) ?? 0;
    if (given < 1 || given > 2) {
      return { ok: false, reason: "Every participant must give one or two gifts." };
    }
    if (received < 1 || received > 2) {
      return { ok: false, reason: "Every participant must receive one or two gifts." };
    }
  }
  return { ok: true };
}

function buildValidRecipients(
  ids: string[],
  membership: Map<string, string>,
  preventSubgroupMatches: boolean,
): Map<string, string[]> {
  const valid = new Map<string, string[]>();
  for (const giverId of ids) {
    valid.set(
      giverId,
      ids.filter((recipientId) =>
        recipientId !== giverId &&
        !(preventSubgroupMatches && sameSubgroup(giverId, recipientId, membership))
      ),
    );
  }
  return valid;
}

/** Perfect one-to-one matching via randomized backtracking. */
function findPerfectAssignment(
  givers: string[],
  validRecipients: Map<string, string[]>,
): Assignment[] | null {
  const orderedGivers = [...givers].sort(
    (a, b) =>
      (validRecipients.get(a)?.length ?? 0) -
      (validRecipients.get(b)?.length ?? 0),
  );
  const usedRecipients = new Set<string>();
  const result: Assignment[] = [];

  function search(index: number): boolean {
    if (index >= orderedGivers.length) return true;
    const giverId = orderedGivers[index];
    for (const recipientId of shuffle(validRecipients.get(giverId) ?? [])) {
      if (usedRecipients.has(recipientId)) continue;
      usedRecipients.add(recipientId);
      result.push({ giverId, recipientId });
      if (search(index + 1)) return true;
      result.pop();
      usedRecipients.delete(recipientId);
    }
    return false;
  }

  return search(0) ? result : null;
}

function searchWithExtras(
  orderedGivers: string[],
  validRecipients: Map<string, string[]>,
  extrasAllowed: number,
): Assignment[] | null {
  const receiveCounts = new Map<string, number>();
  for (const id of orderedGivers) receiveCounts.set(id, 0);

  const result: Assignment[] = [];
  let extrasUsed = 0;

  const canReceive = (id: string) => (receiveCounts.get(id) ?? 0) < 2;
  const addReceive = (id: string) =>
    receiveCounts.set(id, (receiveCounts.get(id) ?? 0) + 1);
  const removeReceive = (id: string) =>
    receiveCounts.set(id, (receiveCounts.get(id) ?? 0) - 1);
  const allReceivedAtLeastOnce = () =>
    orderedGivers.every((id) => (receiveCounts.get(id) ?? 0) >= 1);

  function search(giverIndex: number): boolean {
    if (giverIndex >= orderedGivers.length) {
      return extrasUsed === extrasAllowed && allReceivedAtLeastOnce();
    }
    const giverId = orderedGivers[giverIndex];
    const candidates = shuffle(validRecipients.get(giverId) ?? []);

    for (const first of candidates) {
      if (!canReceive(first)) continue;
      result.push({ giverId, recipientId: first });
      addReceive(first);

      if (search(giverIndex + 1)) return true;

      if (extrasUsed < extrasAllowed) {
        for (const second of candidates) {
          if (second === first || !canReceive(second)) continue;
          extrasUsed += 1;
          result.push({ giverId, recipientId: second });
          addReceive(second);
          if (search(giverIndex + 1)) return true;
          removeReceive(second);
          result.pop();
          extrasUsed -= 1;
        }
      }

      removeReceive(first);
      result.pop();
    }
    return false;
  }

  return search(0) ? result : null;
}

/** Double-gift fallback minimizing the number of people buying a second gift. */
function findDoubleGiftAssignment(
  ids: string[],
  validRecipients: Map<string, string[]>,
): Assignment[] | null {
  if (ids.some((id) => (validRecipients.get(id) ?? []).length === 0)) {
    return null;
  }
  const orderedGivers = [...ids].sort(
    (a, b) =>
      (validRecipients.get(a)?.length ?? 0) -
      (validRecipients.get(b)?.length ?? 0),
  );
  for (let extras = 1; extras <= ids.length; extras += 1) {
    const found = searchWithExtras(orderedGivers, validRecipients, extras);
    if (found) return found;
  }
  return null;
}

export function generateAssignments(
  participantIds: string[],
  subgroups: Subgroup[] = [],
  preventSubgroupMatches = false,
  allowDoubleGifts = false,
): GenerateAssignmentsResult {
  if (participantIds.length < 2) {
    return {
      ok: false,
      code: "too_few",
      error: "At least 2 participants are required to generate assignments.",
    };
  }

  const ids = [...participantIds];
  const membership = buildMembership(subgroups);
  const validRecipients = buildValidRecipients(ids, membership, preventSubgroupMatches);

  if (ids.some((id) => (validRecipients.get(id) ?? []).length === 0)) {
    return {
      ok: false,
      code: allowDoubleGifts ? "impossible_with_doubles" : "impossible",
      error: allowDoubleGifts
        ? "These subgroup rules are too restrictive to create a valid exchange."
        : "SantaSwap couldn't create a valid exchange with these subgroup rules.",
    };
  }

  const perfectAttempts = preventSubgroupMatches ? 40 : 20;
  for (let attempt = 0; attempt < perfectAttempts; attempt += 1) {
    const assignments = findPerfectAssignment(ids, validRecipients);
    if (
      assignments &&
      validateAssignments(assignments, ids, subgroups, preventSubgroupMatches, "standard").ok
    ) {
      return { ok: true, assignments, usedDoubleGifts: false, doubleRecipientCount: 0 };
    }
  }

  if (allowDoubleGifts) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const assignments = findDoubleGiftAssignment(ids, validRecipients);
      if (
        assignments &&
        validateAssignments(assignments, ids, subgroups, preventSubgroupMatches, "double").ok
      ) {
        return {
          ok: true,
          assignments,
          usedDoubleGifts: true,
          doubleRecipientCount: countDoubleRecipients(assignments),
        };
      }
    }
    return {
      ok: false,
      code: "impossible_with_doubles",
      error: "These subgroup rules are too restrictive to create a valid exchange.",
    };
  }

  return {
    ok: false,
    code: "impossible",
    error: preventSubgroupMatches
      ? "SantaSwap couldn't create a valid exchange with these subgroup rules."
      : "Could not generate a valid Secret Santa assignment.",
  };
}
