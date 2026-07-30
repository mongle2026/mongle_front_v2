import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import ProfileImg from '../../atomic/ProfileImg';
import { TextButton } from '../../action/TextButton';

import { colors } from '../../../styles/color';
import { gap } from '../../../styles/token';
import { typo } from '../../../styles/typo';

const Profile = ({
  imageUri,
  imageSize = 'M',
  username,
  onPress,
  style,
  buttonStyle,
  textStyle,
}) => {
  // username에 이미 @가 들어와도 중복되지 않도록 제거합니다.
  const normalizedUsername = String(username ?? '').replace(/^@+/, '');
  const profileId = `@${normalizedUsername}`;

  return (
    <View style={[styles.container, style]}>
      <ProfileImg
        imageUri={imageUri}
        size={imageSize}
      />

      <TextButton
        variant="Ghost"
        typography={typo.kyoboLabelLarge}
        onPress={onPress}
        accessibilityLabel={`${profileId} 프로필 보기`}
        style={[styles.usernameButton, buttonStyle]}
        textStyle={textStyle}
      >
        {profileId}
      </TextButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: gap.S,

    backgroundColor: colors.bgLayerDefault,
  },

  usernameButton: {
    // TextButton의 기본 width: '100%'를 덮어씁니다.
    width: 'auto',
    alignSelf: 'flex-end',

    transform: [{ rotate: '-4deg' }],
  },
});

export default memo(Profile);