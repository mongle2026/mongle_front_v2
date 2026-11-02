import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';

import { Dialog } from '../components/feedback/Dialog';
import { BUTTON_VARIANT } from '../components/action/Button';
import { useDialog } from '../providers/DialogProvider';
import { useIsSignedIn } from '../auth/useAuthStore';

// 로그인하지 않고 로그인이 필요한 동작을 하려 할 때 Dialog 에 보여줄 설명
export const LOGIN_DIALOG_DESCRIPTION = Object.freeze({
  LIKE: '로그인해서 마음에 드는 기록에 좋아요를 남겨 보세요.',
  BOOKMARK: '로그인해서 마음에 드는 기록을 보관함에 담아 보세요.',
  COMMENT: '로그인해서 댓글을 남겨 이야기를 나눠 보세요.',
  WRITE_FEED: '로그인해서 피드에 새로운 기록을 남겨 보세요.',
  WRITE_LETTER: '로그인해서 음악을 담은 편지를 보내 보세요.',
  FOLLOW: '로그인해서 팔로우하고 새 기록을 받아 보세요.',
});

const LOGIN_DIALOG_ID = 'login-required-dialog';

/*
 * 로그인이 필요한 동작(좋아요 · 북마크 · 댓글 · 작성 · 팔로우) 앞에서 확인한다.
 * requireLogin(description): 로그인했으면 true, 아니면 로그인 안내 Dialog 를 띄우고 false.
 * Dialog 의 '로그인'을 누르면 Welcome 으로 가고, 로그인하면 Welcome 이 빠지면서 보던 화면으로 돌아온다.
 */
export default function useLoginDialog() {
  const navigation = useNavigation();
  const { openDialog } = useDialog();
  const isSignedIn = useIsSignedIn();

  const requireLogin = useCallback(description => {
    if (isSignedIn) return true;

    openDialog({
      id: LOGIN_DIALOG_ID,
      accessibilityLabel: '로그인 안내 닫기',
      renderContent: ({ close }) => (
        <Dialog
          illustration={null}
          title="로그인이 필요해요"
          description={description}
          cancelText="닫기"
          confirmText="로그인"
          confirmVariant={BUTTON_VARIANT.SOLID}
          onCancel={close}
          onConfirm={() => {
            close();
            navigation.navigate('Welcome');
          }}
        />
      ),
    });

    return false;
  }, [isSignedIn, navigation, openDialog]);

  return {
    isSignedIn,
    requireLogin,
  };
}
