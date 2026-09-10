import { useCallback } from 'react';

import { useGlobalOverlay } from '../../../../shared/providers/GlobalOverlayProvider';
import { colors } from '../../../../shared/styles/color';
import { useRecordFormStore } from '../../store/useRecordFormStore';

/*
 * RecordScreen / RecordEditScreen 본문 입력 길이 제한.
 * 2,000자를 넘기면 초과분을 잘라 입력을 막고,
 * 동시에 Toast로 안내합니다.
 */
export const MAX_RECORD_TEXT_LENGTH = 2000;

export const useRecordTextLimit = ({ bottomOffset }) => {
  const setText = useRecordFormStore(state => state.setText);

  const { showToast } = useGlobalOverlay();

  const handleChangeText = useCallback(
    nextText => {
      if (nextText.length > MAX_RECORD_TEXT_LENGTH) {
        setText(nextText.slice(0, MAX_RECORD_TEXT_LENGTH));

        showToast({
          message: '2,000자 이내로 내용을 줄여 주세요.',
          icon: 'alert',
          iconColor: colors.fgCritical,
          bottomOffset,
        });

        return;
      }

      setText(nextText);
    },
    [bottomOffset, setText, showToast],
  );

  return { handleChangeText };
};
