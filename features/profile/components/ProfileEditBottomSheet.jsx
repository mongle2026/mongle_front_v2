import { memo } from 'react';

import ContainerButton from '../../../shared/components/action/ContainerButton';
import BottomSheet from '../../../shared/components/overlay/BottomSheet';

/**
 * 프로필 편집 BottomSheet. 프로필 정보 편집 / 게시글 편집 순으로 보여준다.
 *
 * @param {() => void} onPressProfileInfoEdit
 * @param {() => void} onPressFeedEdit
 * @param {() => void} onClose
 */
const ProfileEditBottomSheet = ({ onPressProfileInfoEdit, onPressFeedEdit, onClose }) => (
  <BottomSheet fitContent onClose={onClose}>
    <ContainerButton
      label="프로필 정보 편집"
      onPress={onPressProfileInfoEdit}
      accessibilityRole="button"
    />
    <ContainerButton label="게시글 편집" onPress={onPressFeedEdit} accessibilityRole="button" />
  </BottomSheet>
);

export default memo(ProfileEditBottomSheet);
