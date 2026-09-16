import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import Dim from '../../../shared/components/layout/Dim';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';

import StampDetailBottomSheet from './components/StampDetailBottomSheet';
import useStampDetail from './hooks/useStampDetail';

// 편지함 위에 투명 모달(transparentModal)로 떠서 BottomSheet 로 우표 상세를 보여준다.
// 스택 화면이라 편지 카드를 눌러 LetterDetail 로 갔다가 돌아오면 시트가 그대로 남아 있다.
// route.params: { stampCode }
const StampDetailScreen = ({ navigation, route }) => {
  const stampCode = route?.params?.stampCode;
  const { userId } = useCurrentUser();
  const { stamp, detail } = useStampDetail({ stampCode, userId });

  // 시트를 내려 닫을 때와 딤을 눌러 닫을 때가 겹쳐도 한 번만 닫는다
  const handleClose = useCallback(() => {
    if (navigation.isFocused()) navigation.goBack();
  }, [navigation]);

  const handlePressLetter = useCallback(
    letter => {
      navigation.navigate('LetterDetail', { letterId: letter.letterId });
    },
    [navigation],
  );

  return (
    <View style={styles.screen}>
      <Dim onPress={handleClose} accessibilityLabel="우표 상세 닫기" />

      {stamp && (
        <StampDetailBottomSheet
          stampCode={stamp.id}
          detail={detail}
          onPressLetter={handlePressLetter}
          onClose={handleClose}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});

export default StampDetailScreen;
