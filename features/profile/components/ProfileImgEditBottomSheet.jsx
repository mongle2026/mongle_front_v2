import { memo } from 'react';

import ContainerButton from '../../../shared/components/action/ContainerButton';
import BottomSheet from '../../../shared/components/overlay/BottomSheet';

/**
 * 프로필 사진 편집 BottomSheet. 사진 보관함 / 파일 선택 / 기본 이미지로 변경 순으로 보여준다.
 *
 * @param {() => void} onPressAlbum
 * @param {() => void} onPressFile
 * @param {() => void} onPressDelete
 * @param {() => void} onClose
 */
const ProfileImgEditBottomSheet = ({ onPressAlbum, onPressFile, onPressDelete, onClose }) => (
  <BottomSheet fitContent onClose={onClose}>
    <ContainerButton label="사진 보관함" onPress={onPressAlbum} accessibilityRole="button" />
    <ContainerButton label="파일 선택" onPress={onPressFile} accessibilityRole="button" />
    <ContainerButton label="기본 이미지로 변경" onPress={onPressDelete} accessibilityRole="button" />
  </BottomSheet>
);

export default memo(ProfileImgEditBottomSheet);
