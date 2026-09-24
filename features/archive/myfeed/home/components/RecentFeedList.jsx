import { memo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import ListHeader from '../../../../../shared/components/content/ListHeader';
import { colors } from '../../../../../shared/styles/color';
import { gap, padding } from '../../../../../shared/styles/token';
import { getImageSources, resolveMediaUri } from '../../../../../shared/utils/media';

import ShortPostCard from '../../../components/ShortPostCard';

// 피드 응답 → ShortPostCard props
// 텍스트가 있으면 텍스트만, 이미지만 있으면 이미지 개수만큼 보인다 (ShortPostCard 가 텍스트 우선)
const toShortPost = feed => {
  const artworkUri = resolveMediaUri(feed?.music?.musicArtwork);

  return {
    feedId: feed.feedId,
    music: {
      imageSource: artworkUri ? { uri: artworkUri } : undefined,
      title: feed?.music?.musicTitle,
      artist: feed?.music?.musicArtist,
    },
    font: feed?.font,
    content: feed?.record?.text ?? '',
    imageSources: getImageSources(feed?.files),
    date: feed?.createdAt,
  };
};

const RecentFeedList = ({ feeds }) => {
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
            music={post.music}
            font={post.font}
            content={post.content}
            imageSources={post.imageSources}
            date={post.date}
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
});

export default memo(RecentFeedList);
