import { useMemo } from 'react';

import { resolveEnvelope } from '../../../shared/utils/envelopeUtils';

/**
 * 편지의 envelope({ pattern, color, stamp }) 코드로 봉투 SVG를 찾는다.
 *
 * @param {{ pattern?: string, color?: string, stamp?: string } | null | undefined} envelope
 */
export default function useResolvedEnvelope(envelope) {
  const pattern = envelope?.pattern;
  const color = envelope?.color;
  const stamp = envelope?.stamp;

  return useMemo(
    () =>
      resolveEnvelope({
        patternId: pattern,
        colorId: color,
        stampId: stamp,
      }),
    [pattern, color, stamp],
  );
}
