import { memo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import ListHeader from '../../../../../shared/components/content/ListHeader';
import { colors } from '../../../../../shared/styles/color';
import { gap, padding } from '../../../../../shared/styles/token';

import ShortPostCard from '../../../components/ShortPostCard';
import { toShortPost } from '../../../utils/postCardProps';

const RecentFeedList = ({ feeds, playingFeedId, onPressPlayback, onPressFeed }) => {
  return (
    <View style={styles.wrapper}>
      <ListHeader size="M" title="최근 기록" style={styles.listHeader} textStyle={styles.listHeaderText} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  // ListHeader + 목록을 한 묶음으로 (MyFeedSection 의 섹션 간격이 이 사이에만 들어가도록)
  wrapper: {
    alignSelf: 'stretch',
  },
  listHeader: {
    backgroundColor: colors.bgBase,
  },
  listHeaderText: {
    color: colors.fgNeutralPrimary,
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
