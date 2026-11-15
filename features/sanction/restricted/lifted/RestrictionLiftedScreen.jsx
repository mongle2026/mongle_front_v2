import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Empty from '../../../../shared/components/content/Empty';
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../../../../shared/components/action/Button';
import apiClient, { getApiErrorDetail } from '../../../../shared/api/client';
import { useAuthStore } from '../../../../shared/auth/useAuthStore';

import { RESTRICTION_LIFT_REASON } from '../constants';
import { colors } from '../../../../shared/styles/color';
import { FONT } from '../../../../shared/styles/fontType';
import { padding } from '../../../../shared/styles/token';

const APPEAL_ACCEPTED_CONTENT = {
  title: '이의 신청이 받아들여졌어요',
  body: '검토 결과 이용 정지가 해제되고\n숨겨졌던 게시물이 복구됐어요.',
};

// 기간이 끝났을 때. 운영자가 신고 처리를 되돌렸을 때(REVOKED)도 같은 문구를 쓴다
const LIFTED_CONTENT = {
  title: '서비스 이용 정지가 풀렸어요',
  body: '지금부터 다시 몽글을 이용할 수 있어요.\n우리 함께 깨끗한 커뮤니티를 만들어 가요.',
};

/**
 * 이용 제한이 풀린 계정. 풀린 뒤 앱에 처음 들어올 때 홈으로 들어가기 전에 한 번 보여준다
 *
 * 풀린 이유는 useAuthStore.restrictionLifted 에서 읽는다
 * (useRestrictionLiftCheck · useRestrictionRecheck 가 서버 응답으로 채운다)
 * - APPEAL_ACCEPTED: 이의 신청이 받아들여졌다
 * - REVOKED: 운영자가 신고 처리를 되돌렸다
 * - EXPIRED: 제한 기간이 끝났다
 *
 * 몽글 시작하기를 누르면 restrictionLifted 를 지워서 원래 앱(홈)으로 들여보내고, 서버에 확인했다고 남긴다.
 * 남기지 못하면 다음에 앱으로 돌아올 때 다시 보인다
 */
const RestrictionLiftedScreen = () => {
  const reason = useAuthStore(state => state.restrictionLifted?.reason);
  const setRestrictionLifted = useAuthStore(
    state => state.setRestrictionLifted,
  );

  const { title, body } =
    reason === RESTRICTION_LIFT_REASON.APPEAL_ACCEPTED
      ? APPEAL_ACCEPTED_CONTENT
      : LIFTED_CONTENT;

  const handleStart = () => {
    setRestrictionLifted(null);

    apiClient.post('/sanction/restriction-lift/acknowledge').catch(error => {
      console.warn(
        '이용 제한 해제 안내 확인을 저장하지 못했습니다.',
        getApiErrorDetail(error),
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Empty
          type="positive"
          title={title}
          body={body}
        />
      </View>

      <View style={styles.footer}>
        <Button
          variant={BUTTON_VARIANT.SOLID}
          size={BUTTON_SIZE.XL}
          font={FONT.SUIT}
          style={styles.startButton}
          onPress={handleStart}
        >
          몽글 시작하기
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
  },

  // 화면 맨 아래에 붙인다
  footer: {
    paddingHorizontal: padding.L,
    paddingBottom: padding.L,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // Button은 기본이 alignSelf: 'flex-start'라서 가로로 꽉 채운다
  startButton: {
    flex: 1,
  },
});

export default RestrictionLiftedScreen;
