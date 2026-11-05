import { memo } from 'react';
import { StyleSheet } from 'react-native';

import ContainerButton from '../../../../shared/components/action/ContainerButton';
import BottomSheet from '../../../../shared/components/overlay/BottomSheet';
import { colors } from '../../../../shared/styles/color';

/**
 * 다른 사람 프로필 더보기 BottomSheet. 신고 / 차단 순으로 보여준다.
 *
 * @param {() => void} onPressReport
 * @param {() => void} onPressBlock
 * @param {() => void} onClose
 */
const UserProfileMoreBottomSheet = ({ onPressReport, onPressBlock, onClose }) => (
  <BottomSheet fitContent onClose={onClose}>
    <ContainerButton label="신고" onPress={onPressReport} accessibilityRole="button" />
    <ContainerButton
      label="차단"
      onPress={onPressBlock}
      accessibilityRole="button"
      textStyle={styles.blockLabel}
    />
  </BottomSheet>
);

const styles = StyleSheet.create({
  blockLabel: {
    color: colors.fgCritical,
  },
});

export default memo(UserProfileMoreBottomSheet);
