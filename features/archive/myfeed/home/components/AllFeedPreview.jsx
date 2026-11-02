import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import ListHeader from '../../../../../shared/components/content/ListHeader';
import { colors } from '../../../../../shared/styles/color';
import { gap, padding } from '../../../../../shared/styles/token';

import GridCard from '../../../components/GridCard';
import { formatMonthLabel } from '../../utils/formatMonthLabel';

const COLUMNS = 2;

// 글을 쓴 달 카드 (yy년 m월)
// months: useMyFeedMonths 결과
// onPressCard(month): 월 카드면 'YYYY-MM', 헤더 버튼(전체 보기)이면 undefined
const AllFeedPreview = ({ months, onPressCard }) => {
  const cards = months.map(item => ({
    key: item.month,
    month: item.month,
    title: formatMonthLabel(item.month),
    imageSource: item.imageSource,
  }));

  // 한 줄에 COLUMNS개씩 배치 (마지막 줄이 모자라면 빈 칸으로 채워 너비 유지)
  const rows = [];
  for (let i = 0; i < cards.length; i += COLUMNS) {
    rows.push(cards.slice(i, i + COLUMNS));
  }

  return (
    <View style={styles.wrapper}>
      <ListHeader
        size="M"
        title="모든 기록"
        showIconButton
        onIconButtonPress={() => onPressCard?.()}
        iconButtonAccessibilityLabel="모든 기록 전체 보기"
        style={styles.listHeader}
        textStyle={styles.listHeaderText}
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
