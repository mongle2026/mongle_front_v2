// 처음 뜬 알림 권한 창에서 거절했는지. 거절했으면 피드 홈에서 Toast로 한 번 안내한다.
// 알림 권한 화면에서 '다음에 할게요'를 누른 것도 거절로 남긴다 (OS 권한 창은 띄우지 않는다).
// 값이 있으면 이 기기에서 이미 답했다는 뜻이라, 로그아웃 후 다시 로그인해도 알림 권한 화면을 띄우지 않는다.
// 거절한 화면(가입 완료 등)에서 바로 띄우지 않고 피드 홈까지 넘겨야 해서, 앱을 다시 켜도 남도록 SecureStore 에 저장한다.
//
// 안드로이드 13 이상은 권한 창을 띄우기 전에도 상태가 'denied' 로 와서 OS 상태만으로는 처음 창인지 알 수 없다.
// 그래서 첫 권한 창의 결과를 직접 남겨 두고, 그 뒤에 다시 뜨는 창(안드로이드는 한 번 거절해도 다시 뜬다)은 무시한다.
// SecureStore 는 iOS 에서 앱을 지웠다 다시 깔아도 남을 수 있어서, 그때는 안내가 다시 보이지 않을 수 있다

import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const NOTIFICATION_DENIED_NOTICE_STORAGE_KEY = 'notification.deniedNotice';

const NOTICE_STATUS = {
  PENDING: 'pending', // 첫 권한 창에서 거절했고 아직 안내하지 않았다
  DONE: 'done', // 첫 권한 창에서 허용했거나 안내를 마쳤다
};

// undefined 면 저장된 값을 아직 읽지 않았고, null 이면 첫 권한 창을 아직 띄우지 않았다
const useNotificationDeniedNoticeStore = create(() => ({
  status: undefined,
}));

export const useIsNotificationDeniedNoticePending = () =>
  useNotificationDeniedNoticeStore(state => state.status === NOTICE_STATUS.PENDING);

export const restoreNotificationDeniedNotice = async () => {
  const { status } = useNotificationDeniedNoticeStore.getState();
  if (status !== undefined) return status;

  let saved = null;

  try {
    saved = await SecureStore.getItemAsync(NOTIFICATION_DENIED_NOTICE_STORAGE_KEY);
  } catch (error) {
    console.warn('알림 거절 안내 여부를 읽지 못했습니다.', error?.message ?? error);
  }

  useNotificationDeniedNoticeStore.setState({ status: saved });

  return saved;
};

const saveStatus = async status => {
  useNotificationDeniedNoticeStore.setState({ status });

  try {
    await SecureStore.setItemAsync(NOTIFICATION_DENIED_NOTICE_STORAGE_KEY, status);
  } catch (error) {
    console.warn('알림 거절 안내 여부를 저장하지 못했습니다.', error?.message ?? error);
  }
};

// 첫 권한 창의 결과만 남긴다. 이미 남겼으면 그대로 둔다
export const saveFirstNotificationPermissionResult = async granted => {
  if ((await restoreNotificationDeniedNotice()) != null) return;

  await saveStatus(granted ? NOTICE_STATUS.DONE : NOTICE_STATUS.PENDING);
};

// 이 기기에서 알림 권한 화면에 이미 답했는지 (허용 · 거절 · 다음에 할게요)
export const hasAnsweredNotificationPermission = async () =>
  (await restoreNotificationDeniedNotice()) != null;

export const completeNotificationDeniedNotice = () => saveStatus(NOTICE_STATUS.DONE);
