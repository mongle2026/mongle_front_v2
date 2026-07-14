import {
  createBaseRecordFormData,
} from './createBaseRecordFormData';

export const createFeedFormData = ({
  userId,
  recordForm,
}) => {
  const formData =
    createBaseRecordFormData({
      userId,
      recordForm,
    });

  formData.append(
    'visibility',
    recordForm.visibility ??
      'PUBLIC',
  );

  return formData;
};