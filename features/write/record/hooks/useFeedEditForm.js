// React
import { useEffect, useState, } from 'react';

// 서드파티
import axios from 'axios';

// 스토어
import { useRecordFormStore, } from '../../record/store/useRecordFormStore.js';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL;

/**
 * 서버에서 받은 파일 URL을
 * 화면에서 사용할 수 있는 전체 URL로 변환합니다.
 */
const createFileUri = (url) => {
  if (!url) {
    return null;
  }

  if (
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
};

/**
 * 서버 파일 데이터를
 * recordFormStore에서 사용하는 파일 구조로 변환합니다.
 */
const toEditFiles = (files = []) => {
  return files
    .filter(
      (file) =>
        file.fileId != null &&
        file.url &&
        file.fileType,
    )
    .map((file, index) => ({
      uri: createFileUri(file.url),

      // 기존 서버 파일을 식별하기 위한 값
      serverFileId: file.fileId,
      isRemote: true,

      // 백엔드의 file_type 컬럼에 대응하는 값
      fileType: file.fileType,

      type:
        file.mimeType ??
        'application/octet-stream',

      mimeType:
        file.mimeType ??
        'application/octet-stream',

      name:
        file.originalName ??
        `record-file-${file.fileId ?? index}`,

      originalName:
        file.originalName ?? null,

      fileSize:
        file.fileSize ?? null,
    }));
};

export function useFeedEditForm({
  feedId,
  userId,
}) {
  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  /*
   * 수정 전 서버에 존재하던 파일 ID입니다.
   * 수정 요청 시 삭제된 파일을 계산하는 데 사용합니다.
   */
  const [
    originalFileIds,
    setOriginalFileIds,
  ] = useState([]);

  const resetRecordForm =
    useRecordFormStore(
      (state) => state.resetRecordForm,
    );

  const setRecordType =
    useRecordFormStore(
      (state) => state.setRecordType,
    );

  const setText =
    useRecordFormStore(
      (state) => state.setText,
    );

  const setMusic =
    useRecordFormStore(
      (state) => state.setMusic,
    );

  const setFiles =
    useRecordFormStore(
      (state) => state.setFiles,
    );

  const setVisibility =
    useRecordFormStore(
      (state) => state.setVisibility,
    );

  useEffect(() => {
    if (!feedId || !userId) {
      setLoading(false);
      return;
    }

    let ignore = false;

    const fetchEditFeed = async () => {
      try {
        setLoading(true);
        setError(null);

        /*
         * 이전 작성 또는 수정 데이터가 남아 있지 않도록
         * 조회 전에 store를 초기화합니다.
         */
        resetRecordForm();

        const response = await axios.get(
          `${API_BASE_URL}/feed/${feedId}`,
          {
            params: {
              userId,
            },
          },
        );

        if (ignore) {
          return;
        }

        const feed = response.data;

        /*
         * 음악은 필수값이므로
         * 서버 응답에 음악이 없다면 정상적으로 수정할 수 없습니다.
         */
        if (!feed.music) {
          throw new Error(
            '수정할 피드의 음악 정보가 없습니다.',
          );
        }

        const editFiles = toEditFiles(
          feed.files ?? [],
        );

        setRecordType('FEED');

        setText(
          feed.record?.text ?? '',
        );

        setMusic(feed.music);

        setVisibility(
          feed.visibility ?? 'PUBLIC',
        );

        setFiles(editFiles);

        /*
         * store에 넣은 기존 서버 파일을 기준으로
         * 최초 파일 ID를 저장합니다.
         */
        setOriginalFileIds(
          editFiles.map(
            (file) => file.serverFileId,
          ),
        );
      } catch (fetchError) {
        if (ignore) {
          return;
        }

        console.log(
          '수정할 피드 조회 실패:',
          fetchError,
        );

        setError(fetchError);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchEditFeed();

    return () => {
      /*
       * 요청 중 화면이 사라지면
       * 이후 응답으로 상태가 변경되지 않도록 합니다.
       *
       * 여기서 resetRecordForm()은 호출하지 않습니다.
       * 음악이나 파일 선택 화면으로 이동할 때
       * 수정 내용이 사라질 수 있기 때문입니다.
       */
      ignore = true;
    };
  }, [
    feedId,
    userId,
    resetRecordForm,
    setRecordType,
    setText,
    setMusic,
    setFiles,
    setVisibility,
  ]);

  return {
    loading,
    error,
    originalFileIds,
    resetEditForm: resetRecordForm,
  };
}