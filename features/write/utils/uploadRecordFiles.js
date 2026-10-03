import axios from 'axios';

import apiClient from '../../../shared/api/client';

import {
  compressImageFile,
} from './compressImageFile';
import { isSameId } from '../../../shared/utils/id';

/*
 * 서버의 업로드 대기표(pending)는 발급 후 24시간이 지나면 정리됩니다.
 * 그보다 넉넉히 앞서 다시 올려서, 오래 열어 둔 작성 화면에서도
 * 정리된 키로 저장하다 실패하지 않게 합니다.
 */
const UPLOAD_REUSE_LIMIT_MS = 20 * 60 * 60 * 1000;

/*
 * 사진을 고른 순간 시작한 업로드를 원본 uri 기준으로 기억해 둡니다.
 * 저장할 때는 여기서 꺼내 기다리기만 하면 되므로
 * 글을 쓰는 동안 업로드가 끝나 있으면 바로 저장됩니다.
 *
 * 지우거나 작성을 그만둬서 쓰이지 않은 업로드는
 * 서버 크론이 대기표를 보고 R2에서 지웁니다.
 */
const uploadTasks = new Map();

const isUploadTarget = file =>
  Boolean(file?.uri) && !file.isRemote;

/**
 * 파일 하나를 압축하고 presigned URL로 R2에 올립니다.
 * 저장 요청에 실을 첨부 정보와, 화면에 바로 보여 줄 압축본 uri를 돌려줍니다.
 */
const uploadRecordFile = async ({ userId, file, index }) => {
  const preparedFile =
    await compressImageFile(file);

  const mimeType =
    preparedFile.mimeType ??
    preparedFile.type ??
    'application/octet-stream';

  const { data: uploadUrlsData } =
    await apiClient.post(
      '/record/upload-urls',
      {
        userId: String(userId),
        files: [{ mimeType }],
      },
    );

  const [upload] = uploadUrlsData.uploads;

  const fileResponse =
    await fetch(preparedFile.uri);

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
    payload: {
      key: upload.key,
      size: fileBlob.size,

      originalName:
        preparedFile.name ??
        preparedFile.originalName ??
        `record-file-${index}`,
    },

    localUri: preparedFile.uri,
  };
};

const getOrStartUpload = ({ userId, file, index }) => {
  const task = uploadTasks.get(file.uri);

  if (
    task &&
    isSameId(task.userId, userId) &&
    Date.now() - task.startedAt < UPLOAD_REUSE_LIMIT_MS
  ) {
    return task.promise;
  }

  const promise =
    uploadRecordFile({ userId, file, index });

  uploadTasks.set(file.uri, {
    userId,
    startedAt: Date.now(),
    promise,
  });

  /*
   * 실패한 업로드는 지워 두고 저장할 때 다시 시도합니다.
   * 사진을 고를 때는 실패를 따로 알리지 않습니다.
   */
  promise.catch(() => {
    if (uploadTasks.get(file.uri)?.promise === promise) {
      uploadTasks.delete(file.uri);
    }
  });

  return promise;
};

/**
 * 사진을 고른 순간 호출해서 업로드를 미리 시작합니다.
 * 결과는 기다리지 않습니다.
 */
export const startRecordFileUploads = ({
  userId,
  files,
}) => {
  if (!userId) return;

  (files ?? [])
    .filter(isUploadTarget)
    .forEach((file, index) => {
      getOrStartUpload({ userId, file, index });
    });
};

/**
 * 저장 직전에 호출해서 새로 첨부한 파일의 업로드를 마무리합니다.
 * 미리 시작한 업로드는 기다리기만 하고, 없거나 실패했던 파일은 여기서 올립니다.
 * 이미 서버에 저장되어 있는 파일(isRemote)은 제외합니다.
 *
 * 레코드가 만들어지기 전에 호출합니다.
 * 업로드가 실패하면 서버에는 아무것도 만들어지지 않으므로,
 * 화면에서는 그냥 저장 실패로 안내하고 다시 시도하면 됩니다.
 *
 * files    : 저장 요청에 실어 보낼 첨부 정보
 * localUris: 같은 순서의 압축본 로컬 uri (새 글 카드에 바로 보여 줄 때 사용)
 */
export const uploadRecordFiles = async ({
  userId,
  files,
}) => {
  const results = await Promise.all(
    (files ?? [])
      .filter(isUploadTarget)
      .map((file, index) =>
        getOrStartUpload({ userId, file, index }),
      ),
  );

  return {
    files: results.map(result => result.payload),
    localUris: results.map(result => result.localUri),
  };
};

/**
 * 작성 상태를 초기화할 때 기억해 둔 업로드도 비웁니다.
 * 저장에 쓰인 키는 서버에서 소비되어 다시 쓸 수 없습니다.
 */
export const clearRecordFileUploads = () => {
  uploadTasks.clear();
};
