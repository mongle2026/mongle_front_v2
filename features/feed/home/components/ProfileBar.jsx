import React, { memo, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import Profile from '../../../../shared/components/content/profile/Profile';
import { TextButton } from '../../../../shared/components/action/TextButton';
import { DividerLine } from '../../../../shared/components/atomic/DividerLine';

import { colors } from '../../../../shared/styles/color';
import { gap, padding } from '../../../../shared/styles/token';

const ProfileBar = ({
  imageUri,
  imageSize = 'M',
  username,

  showFollowButton = true,
  followLabel = '팔로우',
  followVariant = 'Solid',
  followDisabled = false,

  onPressProfile,
  onPressFollow,

  style,
  containerStyle,
  followButtonStyle,
  followTextStyle,
  dividerStyle,
}) => {
  const [dividerWidth, setDividerWidth] = useState(0);

  const handleContainerLayout = useCallback(event => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);

    setDividerWidth(currentWidth => {
      if (currentWidth === nextWidth) return currentWidth;
      return nextWidth;
    });
  }, []);

  return (
    <View style={[styles.profileBar, style]}>
      <View
        onLayout={handleContainerLayout}
        style={[styles.container, containerStyle]}
      >
        <Profile
          imageUri={imageUri}
          imageSize={imageSize}
          username={username}
          onPress={onPressProfile}
        />

        {showFollowButton && (
          <TextButton
            variant={followVariant}
            disabled={followDisabled}
            showDisabledStyle={false}
            onPress={onPressFollow}
            accessibilityLabel={`${username ?? '사용자'} ${followLabel}`}
            style={[styles.followButton, followButtonStyle]}
            textStyle={followTextStyle}
          >
            {followLabel}
          </TextButton>
        )}
      </View>

      <View style={styles.dividerArea}>
        {dividerWidth > 0 && (
          <DividerLine
            width={dividerWidth}
            style={dividerStyle}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileBar: {
    width: '100%',
    minWidth: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    flexShrink: 0,
    paddingHorizontal: padding.L,
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: colors.bgLayerDefault,
  },

  container: {
    width: '100%',
    minWidth: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    flexShrink: 0,
    paddingTop: padding.M,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  followButton: {
    width: 'auto',
    alignSelf: 'flex-end',
    flexShrink: 0,
  },

  dividerArea: {
    width: '100%',
    minWidth: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    flexShrink: 0,
    height: 1,
    marginTop: gap.M,
  },
});

export default memo(ProfileBar);