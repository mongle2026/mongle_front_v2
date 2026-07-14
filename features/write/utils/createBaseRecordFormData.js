export const createBaseRecordFormData = ({
  userId,
  recordForm,
}) => {
  const formData = new FormData();

  formData.append(
    'userId',
    String(userId),
  );

  formData.append(
    'music',
    JSON.stringify(recordForm.music),
  );

  formData.append(
    'text',
    recordForm.text ?? '',
  );

  const createdAt = Date.now();

  recordForm.files?.forEach(
    (file, index) => {
      if (!file?.uri) {
        return;
      }

      formData.append('files', {
        uri: file.uri,

        name:
          file.name ??
          file.fileName ??
          file.originalName ??
          `record-file-${createdAt}-${index}`,

        type:
          file.mimeType ??
          file.type ??
          'application/octet-stream',
      });

      if (file.fileType) {
        formData.append(
          'fileTypes',
          String(file.fileType),
        );
      }
    },
  );

  return formData;
};