import {
  createBaseRecordFormData,
} from './createBaseRecordFormData';

export const createFeedFormData = ({
  userId,
  recordForm,
  feedForm,
}) => {
  const formData =
    createBaseRecordFormData({
      userId,
      recordForm,
    });

  formData.append(
    'visibility',
    feedForm.visibility ?? 'PUBLIC',
  );

  return formData;
};