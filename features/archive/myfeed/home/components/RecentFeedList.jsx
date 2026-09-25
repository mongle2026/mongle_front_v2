import { memo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import ListHeader from '../../../../../shared/components/content/ListHeader';
import { colors } from '../../../../../shared/styles/color';
import { gap, padding } from '../../../../../shared/styles/token';

import ShortPostCard from '../../../components/ShortPostCard';
import { toShortPost } from '../../utils/toShortPost';

const RecentFeedList = ({ feeds, playingFeedId, onPressPlayback, onPressFeed }) => {
  return (
    <>
      <ListHeader size="M" title="최근 기록" style={styles.listHeader} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
        contentContainerStyle={styles.section}
      >
        {feeds.map(toShortPost).map(post => (
          <ShortPostCard
            key={post.feedId}
            feedId={post.feedId}
            onPress={() => onPressFeed?.(post.feedId)}
            music={post.music}
            isPlaying={playingFeedId === String(post.feedId)}
            onPressPlayback={onPressPlayback}
            font={post.font}
            content={post.content}
            imageSources={post.imageSources}
            date={post.date}
            style={styles.card}
          />
        ))}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  listHeader: {
    backgroundColor: colors.bgLayerBasement,
  },
  horizontalScroll: {
    alignSelf: 'stretch',
  },
  section: {
    flexDirection: 'row',
    paddingHorizontal: padding.L,
    alignItems: 'flex-start',
    gap: gap.M,
  },
  card: {
    width: 320,
  },
});

export default memo(RecentFeedList);
