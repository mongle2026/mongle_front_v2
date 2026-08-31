import {
  createFeedFormData,
} from './createFeedFormData';

import {
  createLetterFormData,
} from './createLetterFormData';

export const createRecordFormData = ({
  type,
  userId,
  recordForm,
  feedForm,
  letterForm,
}) => {
  if (type === 'feed') {
    return createFeedFormData({
      userId,
      recordForm,
      feedForm,
    });
  }

  if (type === 'letter') {
    return createLetterFormData({
      userId,
      recordForm,
      letterForm,
    });
  }

  throw new Error(
    '기록 종류가 올바르지 않습니다.',
  );
};