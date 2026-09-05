import { useCallback } from 'react';

import { typo } from '../../../../shared/styles/typo';
import { FONT, normalizeFont } from '../../../../shared/styles/font';
import { useRecordFormStore } from '../../store/useRecordFormStore';

/*
 * RecordScreen / RecordEditScreen에서 공통으로 사용하는
 * 폰트 정규화, 타이포 선택 및 폰트 변경 로직입니다.
 */
export const useRecordTypography = () => {
  const font = useRecordFormStore(state => state.font);
  const setFont = useRecordFormStore(state => state.setFont);

  const normalizedFont = normalizeFont(font);
  const isSuitFont = normalizedFont === FONT.SUIT;

  const dateTypography = isSuitFont ? typo.suitLabelLarge : typo.kyoboLabelLarge;
  const bodyTypography = isSuitFont ? typo.suitBodyLarge : typo.kyoboBodyLarge;

  const handleSelectFont = useCallback(
    nextFont => {
      const normalized = normalizeFont(nextFont);
      setFont(normalized === FONT.SUIT ? 'SUIT' : 'KYOBO');
    },
    [setFont],
  );

  return {
    normalizedFont,
    isSuitFont,
    dateTypography,
    bodyTypography,
    handleSelectFont,
  };
};
