export const createFeedUpdateFormData = ({
  recordForm,
  originalFileIds = [],
}) => {
  if (!recordForm.music) {
    throw new Error('음악은 필수입니다.');
  }

  const formData = new FormData();
  const files = recordForm.files ?? [];

  // 글 내용
  formData.append(
    'text',
    recordForm.text ?? '',
  );

  // 음악은 필수
  formData.append(
    'music',
    JSON.stringify(recordForm.music),
  );

  // 공개 범위
  formData.append(
    'visibility',
    recordForm.visibility ?? 'PUBLIC',
  );

  /*
   * 현재 화면에 남아 있는 기존 서버 파일 ID
   */
  const currentRemoteFileIds = files
    .filter(
      (file) =>
        file.isRemote &&
        file.serverFileId != null,
    )
    .map((file) =>
      String(file.serverFileId),
    );

  /*
   * 기존 파일 중 사용자가 제거한 파일 ID
   */
  const deleteFileIds = originalFileIds
    .map((id) => String(id))
    .filter(
      (id) =>
        !currentRemoteFileIds.includes(id),
    );

  formData.append(
    'deleteFileIds',
    JSON.stringify(deleteFileIds),
  );

  /*
   * 새로 추가한 로컬 파일만 서버에 전송
   */
  const newFiles = files.filter(
    (file) => !file.isRemote,
  );

  const createdAt = Date.now();

  newFiles.forEach((file, index) => {
    if (!file?.uri) {
      return;
    }

    if (!file.fileType) {
      throw new Error(
        `추가한 파일의 fileType이 없습니다: ${file.name ?? file.uri}`,
      );
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

    /*
     * files에 추가한 순서와 동일한 순서로 추가해야 합니다.
     */
    formData.append(
      'fileTypes',
      String(file.fileType),
    );
  });

  return formData;
};