import { useCallback, useEffect } from 'react';
import { BackHandler } from 'react-native';

import { useDialog } from '../../../../shared/providers/DialogProvider';
import { Dialog } from '../../../../shared/components/action/Dialog';
import IlDialogStopwrite from '../../../../assets/illustrations/il_dialog_stopwrite.svg';

const LEAVE_RECORD_DIALOG_ID = 'record-leave-confirm';

/*
 * RecordScreen / RecordEditScreen에서 X 버튼 또는
 * 안드로이드 하드웨어 뒤로가기를 눌렀을 때
 * 작성/수정 중인 내용이 있으면 확인 Dialog를 띄우고,
 * 없으면 바로 이전 화면으로 돌아갑니다.
 *
 * Dialog가 열려 있는 상태에서 다시 뒤로가기를 누르면
 * DialogProvider의 자체 BackHandler가 Dialog를 닫아
 * "계속 작성하기"와 동일하게 동작합니다.
 */
export function useLeaveRecordConfirm({
  navigation,
  hasChanges,
  title,
  description,
  confirmText,
  onDiscard,
}) {
  const { openDialog } = useDialog();

  const handleLeave = useCallback(() => {
    onDiscard?.();
    navigation?.goBack();
  }, [navigation, onDiscard]);

  const handleClose = useCallback(() => {
    if (!hasChanges) {
      handleLeave();
      return;
    }

    openDialog({
      id: LEAVE_RECORD_DIALOG_ID,
      accessibilityLabel: '작성 종료 확인 닫기',
      renderContent: ({ close }) => (
        <Dialog
          illustration={IlDialogStopwrite}
          title={title}
          description={description}
          cancelText={confirmText}
          confirmText="그만두기"
          onCancel={close}
          onConfirm={() => {
            close();
            handleLeave();
          }}
        />
      ),
    });
  }, [confirmText, description, handleLeave, hasChanges, openDialog, title]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleClose();
        return true;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [handleClose]);

  return handleClose;
}
