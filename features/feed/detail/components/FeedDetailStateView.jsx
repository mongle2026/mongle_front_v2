import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../../../shared/styles/color';

/**
 * 피드를 아직 못 받았을 때 본문 자리에 보이는 화면
 * (로딩 / API 주소 미설정 / 불러오기 실패).
 */
const FeedDetailStateView = ({
  isLoading,
  isConfigured,
  error,
}) => (
  <View style={styles.state}>
    {isLoading && (
      <ActivityIndicator />
    )}

    {!isConfigured && (
      <Text style={styles.stateText}>
        EXPO_PUBLIC_API_BASE_URL을 확인해 주세요.
      </Text>
    )}

    {error && (
      <Text style={styles.stateText}>
        기록을 불러오지 못했습니다.
      </Text>
    )}
  </View>
);

export default FeedDetailStateView;

const styles = StyleSheet.create({
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stateText: {
    color: colors.fgNeutralMuted,
  },
});
