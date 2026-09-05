import React, { memo } from 'react';
import {
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import {
  FullWindowOverlay,
} from 'react-native-screens';
import {
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

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
        <GestureHandlerRootView
          style={styles.container}
        >
          {content}
        </GestureHandlerRootView>
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
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
});

export default memo(WindowOverlay);