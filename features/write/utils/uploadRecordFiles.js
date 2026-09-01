import axios from 'axios';

import {
  compressImageFile,
} from './compressImageFile';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL
    ?.replace(/\/+$/, '');

/**
 * 새로 선택된 레코드 파일(이미지 등)을
 * 업로드 직전에 압축한 뒤,
 * presigned URL을 통해 Cloudflare R2에 업로드하고,
 * 업로드가 끝난 파일을 레코드에 첨부합니다.
 *
 * 이미 서버에 저장되어 있는 파일(isRemote)은
 * 다시 업로드하지 않습니다.
 */
export const uploadRecordFiles = async ({
  userId,
  recordId,
  files,
}) => {
  const filesToUpload =
    (files ?? []).filter(
      file => file?.uri && !file.isRemote,
    );

  if (filesToUpload.length === 0) {
    return;
  }

  const uploadableFiles = await Promise.all(
    filesToUpload.map(compressImageFile),
  );

  const { data: uploadUrlsData } =
    await axios.post(
      `${API_BASE_URL}/record/${recordId}/upload-urls`,
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

  await axios.post(
    `${API_BASE_URL}/record/${recordId}/files`,
    {
      userId: String(userId),
      files: attachedFiles,
    },
  );
};
