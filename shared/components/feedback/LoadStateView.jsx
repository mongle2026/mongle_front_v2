import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../styles/color';

/**
 * 상세 데이터를 아직 못 받았을 때 본문 자리에 보이는 화면.
 * 로딩 중이면 스피너, API 주소가 없으면 안내, 불러오기에 실패하면 errorMessage 를 가운데에 보여준다.
 *
 * @param {boolean} [isLoading]
 * @param {boolean} [isConfigured] false 면 EXPO_PUBLIC_API_BASE_URL 안내를 보여준다
 * @param {string|null} [errorMessage] 실패 문구. 없으면(null) 보여주지 않는다
 */
const LoadStateView = ({
  isLoading = false,
  isConfigured = true,
  errorMessage = null,
  style,
}) => (
  <View style={[styles.state, style]}>
    {isLoading && <ActivityIndicator />}

    {!isConfigured && (
      <Text style={styles.stateText}>EXPO_PUBLIC_API_BASE_URL을 확인해 주세요.</Text>
    )}

    {Boolean(errorMessage) && (
      <Text style={styles.stateText}>{errorMessage}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    color: colors.fgNeutralSecondary,
  },
});

export default LoadStateView;
