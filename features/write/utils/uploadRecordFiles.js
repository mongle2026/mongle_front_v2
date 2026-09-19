import axios from 'axios';

import apiClient from '../../../shared/api/client';

import {
  compressImageFile,
} from './compressImageFile';

/**
 * 새로 선택된 레코드 파일(이미지 등)만 골라
 * 업로드용으로 압축합니다.
 *
 * 레코드 생성(POST/PATCH) 전에 호출해서,
 * 압축에 실패하면 서버에 아무것도 만들지 않고 끝나게 합니다.
 * 이미 서버에 저장되어 있는 파일(isRemote)은 제외합니다.
 */
export const prepareRecordFiles = async files => {
  const filesToUpload =
    (files ?? []).filter(
      file => file?.uri && !file.isRemote,
    );

  return Promise.all(
    filesToUpload.map(compressImageFile),
  );
};

/**
 * prepareRecordFiles로 준비된 파일을
 * presigned URL을 통해 Cloudflare R2에 업로드하고,
 * 업로드가 끝난 파일을 레코드에 첨부합니다.
 */
export const uploadRecordFiles = async ({
  userId,
  recordId,
  files: uploadableFiles,
}) => {
  if (!uploadableFiles?.length) {
    return;
  }

  const { data: uploadUrlsData } =
    await apiClient.post(
      `/record/${recordId}/upload-urls`,
      {
        userId: String(userId),
        files: uploadableFiles.map(file => ({
          mimeType:
            file.mimeType ??
            file.type ??
            'application/octet-stream',
        })),
      },
    );

  const uploads = uploadUrlsData.uploads;

  const attachedFiles = await Promise.all(
    uploadableFiles.map(async (file, index) => {
      const upload = uploads[index];

      const fileResponse =
        await fetch(file.uri);

      const fileBlob =
        await fileResponse.blob();

      await axios.put(
        upload.uploadUrl,
        fileBlob,
        {
          headers: {
            'Content-Type': upload.mimeType,
          },
          transformRequest: [data => data],
        },
      );

      return {
        key: upload.key,
        mimeType: upload.mimeType,
        size: fileBlob.size,

        originalName:
          file.name ??
          file.originalName ??
          `record-file-${index}`,
      };
    }),
  );

  await apiClient.post(
    `/record/${recordId}/files`,
    {
      userId: String(userId),
      files: attachedFiles,
    },
  );
};
