import { useCallback, useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import { useDialog } from '../../../../shared/providers/DialogProvider';
import { Dialog } from '../../../../shared/components/feedback/Dialog';
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
  cancelText,
  onDiscard,
  // 저장 요청 중처럼 화면을 닫으면 안 될 때 X / 뒤로가기를 무시합니다.
  isLeaveBlocked = false,
}) {
  const { openDialog } = useDialog();

  const handleLeave = useCallback(() => {
    onDiscard?.();
    navigation?.goBack();
  }, [navigation, onDiscard]);

  const handleClose = useCallback(() => {
    if (isLeaveBlocked) {
      return;
    }

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
          cancelText={cancelText}
          confirmText="그만두기"
          onCancel={close}
          onConfirm={() => {
            close();
            handleLeave();
          }}
        />
      ),
    });
  }, [cancelText, description, handleLeave, hasChanges, isLeaveBlocked, openDialog, title]);

  /*
   * iOS 스와이프 뒤로가기는 BackHandler로 막히지 않으므로
   * 닫기를 막는 동안에는 제스처 자체를 끕니다.
   */
  useEffect(() => {
    navigation?.setOptions({ gestureEnabled: !isLeaveBlocked });
  }, [isLeaveBlocked, navigation]);

  /*
   * 스택 위에 다른 화면(EnvelopeScreen 등)이 올라가도 이 화면은 마운트된 상태이므로,
   * 포커스된 경우에만 뒤로가기를 가로채야 상위 화면의 뒤로가기가 정상 동작합니다.
   */
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      return undefined;
    }

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
  }, [handleClose, isFocused]);

  return handleClose;
}
