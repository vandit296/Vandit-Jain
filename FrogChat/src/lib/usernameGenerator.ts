const adjectives = [
  'Sneaky', 'Mystic', 'Cosmic', 'Silent', 'Neon', 'Fuzzy', 'Jolly',
  'Spooky', 'Radical', 'Wiggly', 'Bouncy', 'Cheeky', 'Groovy', 'Zappy',
  'Glitchy', 'Dopey', 'Breezy', 'Funky', 'Zippy', 'Crunchy',
];

const nouns = [
  'Frog', 'Toad', 'Tadpole', 'Newt', 'Gecko', 'Salamander', 'Bullfrog',
  'Ribbit', 'Swamp', 'Lily', 'Pond', 'Creek', 'Marsh', 'Puddle',
  'Slime', 'Mossback', 'Croaker', 'Jumper', 'Hopper', 'Leaper',
];

export function generateUsername(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}${noun}${num}`;
}

// Stable seed-based variant so the same userId always gets the same username
export function usernameFromId(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) & 0xffffffff;
  }
  const adj = adjectives[Math.abs(hash) % adjectives.length];
  const noun = nouns[Math.abs(hash >> 8) % nouns.length];
  const num = 1000 + (Math.abs(hash >> 16) % 9000);
  return `${adj}${noun}${num}`;
}
