import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import ListHeader from '../../../../../shared/components/content/ListHeader';
import { colors } from '../../../../../shared/styles/color';
import { gap, padding } from '../../../../../shared/styles/token';

import GridCard from '../../../components/GridCard';
import { formatMonthLabel } from '../../utils/formatMonthLabel';

const COLUMNS = 2;

// 첫 칸은 항상 '전체'(커버 = 가장 최신 글의 앨범 커버), 나머지는 글을 쓴 달 (yy년 m월)
// allImageSource: 전체 카드 커버 / months: useMyFeedMonths 결과
// onPressCard(month): 월 카드면 'YYYY-MM', 전체 카드면 undefined
const AllFeedPreview = ({ allImageSource, months, onPressCard }) => {
  const cards = [
    { key: 'all', title: '전체', imageSource: allImageSource, month: undefined },
    ...months.map(item => ({
      key: item.month,
      month: item.month,
      title: formatMonthLabel(item.month),
      imageSource: item.imageSource,
    })),
  ];

  // 한 줄에 COLUMNS개씩 배치 (마지막 줄이 모자라면 빈 칸으로 채워 너비 유지)
  const rows = [];
  for (let i = 0; i < cards.length; i += COLUMNS) {
    rows.push(cards.slice(i, i + COLUMNS));
  }

  return (
    <>
      <ListHeader
        size="M"
        title="모든 기록"
        showIconButton
        onIconButtonPress={() => onPressCard?.()}
        iconButtonAccessibilityLabel="모든 기록 전체 보기"
        style={styles.listHeader}
      />
      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {/* padding 있는 카드에 바로 flex를 주면 빈 칸보다 넓어지므로 View로 감싸 너비를 맞춤 */}
            {row.map(card => (
              <View key={card.key} style={styles.cell}>
                <GridCard
                  title={card.title}
                  imageSource={card.imageSource}
                  onPress={() => onPressCard?.(card.month)}
                />
              </View>
            ))}
            {row.length < COLUMNS && <View style={styles.cell} />}
          </View>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  listHeader: {
    backgroundColor: colors.bgLayerBasement,
  },
  grid: {
    alignSelf: 'stretch',
    paddingHorizontal: padding.L,
    gap: gap.M,
  },
  row: {
    flexDirection: 'row',
    gap: gap.M,
  },
  cell: {
    flex: 1,
  },
});

export default memo(AllFeedPreview);
