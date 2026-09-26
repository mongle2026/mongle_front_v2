import { memo, useCallback } from 'react';
import { Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ContainerButton from '../../../../../shared/components/action/ContainerButton';
import BottomSheet, {
  BottomSheetFlatList,
  DRAG_HANDLE_HEIGHT,
} from '../../../../../shared/components/overlay/BottomSheet';
import { padding } from '../../../../../shared/styles/token';

import { formatMonthLabel } from '../../utils/formatMonthLabel';

// ContainerButton 한 줄 높이 (padding XL * 2 + suitLabelXLargeStrong lineHeight 20)
const MONTH_BUTTON_HEIGHT = padding.XL * 2 + 20;

const monthKeyExtractor = month => month;

/**
 * 모든 기록에서 달을 고르는 BottomSheet. 글을 쓴 달만 최신 달부터 보여준다 (yy년 m월).
 * 달이 많으면 화면 높이까지만 열리고 목록이 스크롤된다.
 *
 * @param {string[]} months 'YYYY-MM' 목록
 * @param {(month: string) => void} onSelectMonth
 * @param {() => void} onClose
 */
const MonthSelectBottomSheet = ({ months, onSelectMonth, onClose }) => {
  const insets = useSafeAreaInsets();

  // 목록 높이에 맞춰 열되, 상태바 아래까지만
  const contentHeight = DRAG_HANDLE_HEIGHT + MONTH_BUTTON_HEIGHT * months.length + insets.bottom + padding.XS;
  const maxHeight = Dimensions.get('screen').height - insets.top;
  const height = Math.min(contentHeight, maxHeight);

  const renderMonth = useCallback(({ item: month }) => (
    <ContainerButton
      label={formatMonthLabel(month)}
      onPress={() => onSelectMonth?.(month)}
      accessibilityRole="button"
    />
  ), [onSelectMonth]);

  return (
    <BottomSheet height={height} onClose={onClose}>
      <BottomSheetFlatList
        data={months}
        keyExtractor={monthKeyExtractor}
        renderItem={renderMonth}
        showsVerticalScrollIndicator={false}
      />
    </BottomSheet>
  );
};

export default memo(MonthSelectBottomSheet);
