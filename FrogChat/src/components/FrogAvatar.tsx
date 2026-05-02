import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect, G, Polygon } from 'react-native-svg';
import { frogConfigFromId, FrogConfig } from '../lib/frogConfig';

type Props = {
  userId: string;
  size?: number;
};

export default function FrogAvatar({ userId, size = 48 }: Props) {
  const cfg = frogConfigFromId(userId);
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  return (
    <Svg width={s} height={s} viewBox="0 0 100 100">
      {/* Body */}
      <Ellipse cx="50" cy="58" rx="32" ry="26" fill={cfg.bodyColor} />

      {/* Belly */}
      <Ellipse cx="50" cy="62" rx="20" ry="16" fill={cfg.bellyColor} />

      {/* Head */}
      <Circle cx="50" cy="42" r="28" fill={cfg.bodyColor} />

      {/* Eye bulges */}
      <Circle cx="32" cy="28" r="12" fill={cfg.bodyColor} />
      <Circle cx="68" cy="28" r="12" fill={cfg.bodyColor} />

      {/* Eyes */}
      <Circle cx="32" cy="27" r="8" fill="white" />
      <Circle cx="68" cy="27" r="8" fill="white" />
      <Circle cx="33" cy="26" r="5" fill={cfg.eyeColor} />
      <Circle cx="69" cy="26" r="5" fill={cfg.eyeColor} />
      <Circle cx="34" cy="25" r="2.5" fill="#111" />
      <Circle cx="70" cy="25" r="2.5" fill="#111" />
      {/* Eye shine */}
      <Circle cx="36" cy="23" r="1.2" fill="white" />
      <Circle cx="72" cy="23" r="1.2" fill="white" />

      {/* Nostrils */}
      <Circle cx="44" cy="42" r="2" fill={cfg.spotColor} />
      <Circle cx="56" cy="42" r="2" fill={cfg.spotColor} />

      {/* Mouth — varies by expression */}
      {cfg.expression === 'happy' && (
        <Path d="M 38 52 Q 50 62 62 52" stroke={cfg.spotColor} strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      {cfg.expression === 'cool' && (
        <Path d="M 38 54 Q 50 58 62 54" stroke={cfg.spotColor} strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      {cfg.expression === 'surprised' && (
        <Ellipse cx="50" cy="55" rx="8" ry="6" fill={cfg.spotColor} />
      )}
      {cfg.expression === 'wink' && (
        <>
          <Path d="M 38 52 Q 50 62 62 52" stroke={cfg.spotColor} strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Wink — close left eye */}
          <Path d="M 26 27 Q 32 23 38 27" stroke={cfg.spotColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* Spots on body */}
      <Circle cx="38" cy="68" r="4" fill={cfg.spotColor} opacity={0.5} />
      <Circle cx="62" cy="70" r="3" fill={cfg.spotColor} opacity={0.5} />
      <Circle cx="50" cy="74" r="2.5" fill={cfg.spotColor} opacity={0.5} />

      {/* Accessories */}
      {cfg.accessory === 'hat' && (
        <G>
          <Rect x="32" y="10" width="36" height="6" rx="2" fill="#222" />
          <Rect x="38" y="0" width="24" height="12" rx="3" fill="#222" />
        </G>
      )}
      {cfg.accessory === 'glasses' && (
        <G>
          <Circle cx="32" cy="27" r="9" fill="none" stroke="#555" strokeWidth="2.5" />
          <Circle cx="68" cy="27" r="9" fill="none" stroke="#555" strokeWidth="2.5" />
          <Path d="M 41 27 L 59 27" stroke="#555" strokeWidth="2" />
        </G>
      )}
      {cfg.accessory === 'bow' && (
        <G>
          {/* Bow tie on top of head */}
          <Polygon points="38,14 50,20 38,26" fill="#E91E63" />
          <Polygon points="62,14 50,20 62,26" fill="#E91E63" />
          <Circle cx="50" cy="20" r="4" fill="#C2185B" />
        </G>
      )}
      {cfg.accessory === 'crown' && (
        <G>
          <Polygon points="24,18 32,6 40,16 50,4 60,16 68,6 76,18" fill="#FFD700" />
          <Rect x="24" y="16" width="52" height="6" rx="2" fill="#FFD700" />
        </G>
      )}
    </Svg>
  );
}
