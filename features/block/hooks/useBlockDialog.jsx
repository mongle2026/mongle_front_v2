import { useCallback } from 'react';

import IlDialogBlock from '../../../assets/illustrations/il_dialog_block.svg';

import { Dialog } from '../../../shared/components/feedback/Dialog';
import { BUTTON_VARIANT } from '../../../shared/components/action/Button';
import { useDialog } from '../../../shared/providers/DialogProvider';

import useUserBlock from './useUserBlock';

const BLOCK_DIALOG_ID = 'user-block-dialog';

/*
 * 사용자 차단 확인 Dialog (프로필 · 피드 상세 · 댓글 · 편지 상세 차단 메뉴 공용).
 * openBlockDialog({ targetUserId, userCode, toastBottomOffset }):
 * '[아이디]님을 차단할까요?' Dialog 를 띄우고, '차단'을 누르면 차단한 뒤 토스트를 띄운다.
 * - targetUserId: 차단할 사람의 publicId
 * - toastBottomOffset: 차단 완료 토스트 위치 (화면마다 CommentBar · 하단 안전영역 위)
 */
export default function useBlockDialog() {
  const { openDialog } = useDialog();
  const { blockUser } = useUserBlock();

  const openBlockDialog = useCallback(({ targetUserId, userCode, toastBottomOffset } = {}) => {
    if (!targetUserId) return;

    // userCode 에 @ 가 붙어 와도 '아이디님' 으로 보이게 뗀다
    const normalizedUserCode = String(userCode ?? '').replace(/^@+/, '');

    openDialog({
      id: BLOCK_DIALOG_ID,
      accessibilityLabel: '차단 안내 닫기',
      renderContent: ({ close }) => (
        <Dialog
          illustration={IlDialogBlock}
          title={`${normalizedUserCode}님을 차단할까요?`}
          description={'서로의 피드와 편지를 볼 수 없고,\n팔로우 관계도 해제돼요.\n차단 사실은 상대방에게 알려지지 않아요.'}
          cancelText="닫기"
          confirmText="차단"
          confirmVariant={BUTTON_VARIANT.CRITICAL}
          onCancel={close}
          onConfirm={() => {
            close();
            blockUser({ targetUserId, userCode: normalizedUserCode, toastBottomOffset });
          }}
        />
      ),
    });
  }, [blockUser, openDialog]);

  return { openBlockDialog };
}
