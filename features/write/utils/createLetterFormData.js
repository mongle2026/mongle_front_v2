import {
  createBaseRecordFormData,
} from './createBaseRecordFormData';

export const createLetterFormData = ({
  userId,
  recordForm,
  letterForm,
}) => {
  if (!letterForm.receiver?.id) {
    throw new Error(
      '편지 받는 사람이 선택되지 않았습니다.',
    );
  }

  if (
    !letterForm.patternId ||
    !letterForm.colorId ||
    !letterForm.stampId
  ) {
    throw new Error(
      '편지 봉투 정보가 완성되지 않았습니다.',
    );
  }

  const formData =
    createBaseRecordFormData({
      userId,
      recordForm,
    });

  formData.append(
    'receiverId',
    String(letterForm.receiver.id),
  );

  formData.append(
    'pattern',
    letterForm.patternId,
  );

  formData.append(
    'color',
    letterForm.colorId,
  );

  formData.append(
    'stamp',
    letterForm.stampId,
  );

  const isSelfLetter =
    String(userId) ===
    String(letterForm.receiver.id);

  if (
    isSelfLetter &&
    letterForm.deliveryAt
  ) {
    formData.append(
      'deliveryAt',
      letterForm.deliveryAt,
    );
  }

  return formData;
};