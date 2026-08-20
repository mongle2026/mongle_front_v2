import React, { memo } from 'react';
import {
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import {
  FullWindowOverlay,
} from 'react-native-screens';

const WindowOverlay = ({
  children,
  pointerEvents = 'box-none',
}) => {
  const content = (
    <View
      pointerEvents={pointerEvents}
      style={[
        styles.container,
        Platform.OS !== 'ios' &&
          styles.absoluteContainer,
      ]}
    >
      {children}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <FullWindowOverlay>
        {content}
      </FullWindowOverlay>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  absoluteContainer: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default memo(WindowOverlay);