import { memo, useMemo } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import ListHeader from '../../../../../shared/components/content/ListHeader';
import { colors } from '../../../../../shared/styles/color';
import { gap, padding } from '../../../../../shared/styles/token';

import ShortPostCard from '../../../components/ShortPostCard';
import { toShortPost } from '../../../utils/postCardProps';

// 오른쪽에 다음 카드가 이만큼 보이게 해서 옆으로 넘길 수 있다는 걸 알려준다
const NEXT_CARD_PEEK = 32;

const RecentFeedList = ({ feeds, playingFeedId, onPressPlayback, onPressFeed }) => {
  const { width: screenWidth } = useWindowDimensions();

  // 화면 폭에서 왼쪽 패딩, 카드 사이 간격, 다음 카드 보이는 폭을 뺀 만큼 (375 화면이면 323)
  const cardWidth = screenWidth - padding.L - gap.M - NEXT_CARD_PEEK;
  const cardStyle = useMemo(() => ({ width: cardWidth }), [cardWidth]);

  // 카드 한 장(+ 사이 간격)씩 딱 맞춰 멈추게 한다. 왼쪽 패딩이 있어서 이 간격의 배수 위치에서 카드가 화면 왼쪽 패딩에 맞는다
  const snapInterval = cardWidth + gap.M;

  return (
    <View style={styles.wrapper}>
      <ListHeader size="M" title="최근 기록" style={styles.listHeader} textStyle={styles.listHeaderText} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        snapToAlignment="start"
        decelerationRate="fast"
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
            style={cardStyle}
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
});

export default memo(RecentFeedList);
