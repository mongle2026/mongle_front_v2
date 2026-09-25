import { memo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import ListHeader from '../../../../../shared/components/content/ListHeader';
import { colors } from '../../../../../shared/styles/color';
import { gap, padding } from '../../../../../shared/styles/token';

import GenreCard from '../../../components/GenreCard';

// genres: useMyFeedGenres 결과 (장르 + 앱 실행 동안 고정된 랜덤 커버)
const GenrePreview = ({ genres, onPressMore, onPressGenre }) => {
  return (
    <>
      <ListHeader
        size="M"
        title="장르별 기록"
        showIconButton
        onIconButtonPress={onPressMore}
        iconButtonAccessibilityLabel="장르별 기록 전체 보기"
        style={styles.listHeader}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
        contentContainerStyle={styles.section}
      >
        {genres.map(item => (
          <GenreCard
            key={item.genre}
            genre={item.genre}
            imageSource={item.imageSource}
            onPress={() => onPressGenre?.(item.genre)}
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
    width: 144,
  },
});

export default memo(GenrePreview);
