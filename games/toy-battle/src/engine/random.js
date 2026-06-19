function hashSeed(seed) {
  let hash = 1779033703 ^ String(seed).length;
  for (let i = 0; i < String(seed).length; i += 1) {
    hash = Math.imul(hash ^ String(seed).charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return hash >>> 0;
}

function nextRandomInt(state) {
  let t = (state.value += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function createRandom(seed) {
  return { seed: String(seed), value: hashSeed(seed), drawsUsed: 0, algorithm: "deterministic-seeded" };
}

export function shuffleWithSeed(items, seed) {
  const random = createRandom(seed);
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    random.drawsUsed += 1;
    const j = Math.floor(nextRandomInt(random) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return { items: shuffled, random };
}

export function nextRandomIndex(randomState, length, context = "default") {
  if (length <= 0) throw new Error("Cannot draw a random index from an empty collection.");
  const random = createRandom(`${randomState.seed}:${randomState.drawsUsed}:${context}`);
  randomState.drawsUsed += 1;
  return Math.floor(nextRandomInt(random) * length);
}
