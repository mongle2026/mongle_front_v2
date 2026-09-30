import { useEffect } from 'react';

import { useDialog } from '../providers/DialogProvider';

// 상세 API가 404면 이미 삭제된 글이다 (피드는 soft delete, 편지는 내 편지함에서 삭제)
export const isDeletedContentError = error => error?.response?.status === 404;

/*
 * 알림 등으로 삭제된 편지/피드 상세에 들어왔을 때 Dim과 함께 안내 Dialog를 띄운다.
 *
 * 화면을 벗어나지 않으면 빈 화면만 남으므로 Dim/하드웨어 뒤로가기로는 닫지 않는다.
 * 하드웨어 뒤로가기는 화면이 그대로 뒤로 가고, 화면이 빠질 때 Dialog도 함께 닫는다.
 */
export default function useDeletedContentDialog({
  navigation,
  isDeleted,
  id,
  accessibilityLabel,
  renderContent,
}) {
  const { openDialog, closeDialog } = useDialog();

  useEffect(() => {
    if (!isDeleted) return undefined;

    openDialog({
      id,
      closeOnDimPress: false,
      closeOnBackPress: false,
      accessibilityLabel,
      renderContent,
    });

    // 전환 애니메이션 동안 Dialog가 남아있지 않게 화면이 빠지기 시작할 때 닫는다
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      closeDialog(id);
    });

    return () => {
      unsubscribe();
      closeDialog(id);
    };
    // renderContent는 매 렌더마다 새로 만들어지므로 열리는 시점의 것만 쓴다
  },[closeDialog, id, isDeleted, navigation, openDialog]);
}
