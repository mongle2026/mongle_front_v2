import {
  useCallback,
  useEffect,
} from 'react';

import useFeedMusicPlayback from '../../../../shared/hooks/useFeedMusicPlayback';
import { resolveMediaUri } from '../../../../shared/utils/media';

const useRecordMusicPlayback = ({
  music,
  navigation,
}) => {
  /*
   * Record에는 feedId가 없기 때문에
   * 선택한 음악의 externalId를
   * playback 식별자로 사용합니다.
   */
  const musicId =
    music?.externalId != null
      ? String(music.externalId)
      : null;

  const musicArtworkUri =
    resolveMediaUri(
      music?.musicArtwork,
    );

  const musicPreviewUri =
    resolveMediaUri(
      music?.previewUrl,
    );

  const {
    playingFeedId,
    playbackProgress,
    handlePressPlayback,
    handleSeekPlayback,
    handleVisibleFeedChange,
    resetPlayback,
  } = useFeedMusicPlayback({
    navigation,
  });

  /*
   * 선택된 음악이 변경되면
   * 이전 음악 재생을 종료합니다.
   */
  useEffect(() => {
    if (!musicId) {
      resetPlayback();
      return;
    }

    handleVisibleFeedChange(
      musicId,
    );
  }, [
    handleVisibleFeedChange,
    musicId,
    resetPlayback,
  ]);

  /*
   * 재생 / 일시정지
   */
  const handlePlayback =
    useCallback(() => {
      if (
        !musicId ||
        !musicPreviewUri
      ) {
        return;
      }

      handlePressPlayback({
        feedId: musicId,
        previewUrl:
          musicPreviewUri,
      });
    }, [
      handlePressPlayback,
      musicId,
      musicPreviewUri,
    ]);

  /*
   * 파형 Seek
   */
  const handleSeek =
    useCallback(
      progress => {
        if (
          !musicId ||
          !musicPreviewUri
        ) {
          return;
        }

        handleSeekPlayback({
          feedId: musicId,
          progress,
        });
      },
      [
        handleSeekPlayback,
        musicId,
        musicPreviewUri,
      ],
    );

  const isMusicPlaying =
    Boolean(musicId) &&
    playingFeedId === musicId;

  return {
    musicArtworkUri,
    musicPreviewUri,

    isMusicPlaying,
    playbackProgress,

    handlePlayback,
    handleSeek,
  };
};

export default useRecordMusicPlayback;