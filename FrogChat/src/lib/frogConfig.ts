export type FrogConfig = {
  bodyColor: string;
  eyeColor: string;
  bellyColor: string;
  accessory: 'none' | 'hat' | 'glasses' | 'bow' | 'crown';
  expression: 'happy' | 'cool' | 'surprised' | 'wink';
  spotColor: string;
};

const bodyColors = ['#4CAF50', '#2E7D32', '#66BB6A', '#1B5E20', '#81C784', '#00897B', '#26A69A'];
const eyeColors = ['#FFD700', '#FF6B35', '#FFFFFF', '#FFE082', '#B2EBF2'];
const bellyColors = ['#A5D6A7', '#C8E6C9', '#DCEDC8', '#B2DFDB', '#E0F2F1'];
const spotColors = ['#388E3C', '#1B5E20', '#2E7D32', '#004D40', '#00695C'];
const accessories: FrogConfig['accessory'][] = ['none', 'hat', 'glasses', 'bow', 'crown'];
const expressions: FrogConfig['expression'][] = ['happy', 'cool', 'surprised', 'wink'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(s) / 0xffffffff;
  };
}

export function frogConfigFromId(userId: string): FrogConfig {
  let hash = 5381;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) + hash + userId.charCodeAt(i)) & 0xffffffff;
  }
  const rng = seededRandom(Math.abs(hash));

  return {
    bodyColor: bodyColors[Math.floor(rng() * bodyColors.length)],
    eyeColor: eyeColors[Math.floor(rng() * eyeColors.length)],
    bellyColor: bellyColors[Math.floor(rng() * bellyColors.length)],
    spotColor: spotColors[Math.floor(rng() * spotColors.length)],
    accessory: accessories[Math.floor(rng() * accessories.length)],
    expression: expressions[Math.floor(rng() * expressions.length)],
  };
}
