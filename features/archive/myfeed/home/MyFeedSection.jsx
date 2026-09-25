import { memo, useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import Empty from '../../../../shared/components/content/Empty';
import useFeedMusicPlayback from '../../../../shared/hooks/useFeedMusicPlayback';
import { padding } from '../../../../shared/styles/token';
import { resolveMediaUri } from '../../../../shared/utils/media';

import useMyFeedGenres from '../genre/hooks/useMyFeedGenres';
import useMyFeedMonths from '../all/hooks/useMyFeedMonths';
import useRecentMyFeeds from './hooks/useRecentMyFeeds';
import AllFeedPreview from './components/AllFeedPreview';
import GenrePreview from './components/GenrePreview';
import RecentFeedList from './components/RecentFeedList';

const MAX_RECENT_FEEDS = 5;
const MAX_GENRES = 8;
// 모든 기록은 '전체' 포함 6칸 → 월은 5개까지
const MAX_MONTHS = 5;

// 보관함 - 내 기록. 편지는 들어가지 않고 내가 쓴 피드만 보여준다.
const MyFeedSection = ({ navigation, userId, onPressWriteFeed, onPressGenreMore, onPressGenre }) => {
  const { recentFeeds, isRecentFeedsLoading } = useRecentMyFeeds({ userId, limit: MAX_RECENT_FEEDS });
  const { genres } = useMyFeedGenres({ userId, limit: MAX_GENRES });
  const { months } = useMyFeedMonths({ userId, limit: MAX_MONTHS });
  const { playingFeedId, handlePressPlayback } = useFeedMusicPlayback({ navigation });

  const handlePressFeed = useCallback(
    feedId => navigation.navigate('FeedDetail', { feedId }),
    [navigation],
  );

  // 전체 카드 커버 = 가장 최신 글의 앨범 커버
  const latestArtworkUri = resolveMediaUri(recentFeeds[0]?.music?.musicArtwork);
  const allImageSource = useMemo(
    () => (latestArtworkUri ? { uri: latestArtworkUri } : undefined),
    [latestArtworkUri],
  );

  // 불러오는 중에는 빈 화면 안내를 띄우지 않는다
  if (isRecentFeedsLoading) return null;

  const isEmpty = recentFeeds.length === 0;

  return (
    <ScrollView contentContainerStyle={[styles.container, isEmpty && styles.emptyContainer]}>
      {isEmpty ? (
        <Empty
          type="archive"
          title="보관하고 있는 기록이 없어요."
          body="피드에 기록을 작성해 보세요."
          buttonLabel="피드 작성"
          onButtonPress={onPressWriteFeed}
        />
      ) : (
        <>
          <RecentFeedList
            feeds={recentFeeds}
            playingFeedId={playingFeedId}
            onPressPlayback={handlePressPlayback}
            onPressFeed={handlePressFeed}
          />
          <GenrePreview genres={genres} onPressMore={onPressGenreMore} onPressGenre={onPressGenre} />
          <AllFeedPreview allImageSource={allImageSource} months={months} />
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: padding.M,
    paddingBottom: padding.XXL,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
  },
});

export default memo(MyFeedSection);
