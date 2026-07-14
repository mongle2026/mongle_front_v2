// 실사용은 createRecordFormData만

import { createFeedFormData, } from './createFeedFormData';
import { createLetterFormData, } from './createLetterFormData';

export const createRecordFormData = ({
  userId,
  recordForm,
  letterForm,
}) => {
  if (
    recordForm.recordType === 'FEED'
  ) {
    return createFeedFormData({
      userId,
      recordForm,
    });
  }

  if (
    recordForm.recordType === 'LETTER'
  ) {
    return createLetterFormData({
      userId,
      recordForm,
      letterForm,
    });
  }

  throw new Error(
    '기록 종류가 선택되지 않았습니다.',
  );
};