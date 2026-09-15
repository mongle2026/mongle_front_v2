import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TopIconNavigation from '../../../shared/components/navigation/topnavigation/TopIconNavigation';
import { colors } from '../../../shared/styles/color';
import { padding } from '../../../shared/styles/token';

import Stamp from '../components/Stamp';
import useStampDetail from './hooks/useStampDetail';

const STAMP_DETAIL_WIDTH = 160;

// route.params: { stampCode }
const StampDetailScreen = ({ navigation, route }) => {
  const stampCode = route?.params?.stampCode;
  const { stamp } = useStampDetail({ stampCode });

  const handlePressClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.topSafeArea}>
        <TopIconNavigation onPressClose={handlePressClose} />
      </SafeAreaView>

      {!stamp ? (
        <View style={styles.state}>
          <Text style={styles.stateText}>우표를 찾을 수 없습니다.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Stamp stampCode={stamp.id} width={STAMP_DETAIL_WIDTH} />

          {/* TODO: 이 우표가 붙은 편지 목록 (누르면 navigation.navigate('LetterDetail', { letterId })) */}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgLayerDefault,
  },
  topSafeArea: {
    width: '100%',
    backgroundColor: colors.bgLayerDefault,
  },
  scrollContent: {
    width: '100%',
    paddingVertical: padding.XL,
    alignItems: 'center',
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    color: colors.fgNeutralMuted,
  },
});

export default StampDetailScreen;
