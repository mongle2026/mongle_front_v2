import apiClient from '../../../shared/api/client';

// 알림 화면을 나가며 보낸 확인 요청. 끝나기 전에 레드닷을 다시 조회하면 확인 전 상태가 와서 레드닷이 다시 뜨므로 기다렸다가 조회한다
let pendingCheck = null;

// 알림 화면을 나갈 때 부른다. 지금까지 온 알림을 모두 확인한 것으로 본다
export const checkNotifications = () => {
  const request = apiClient.post('/notification/check').finally(() => {
    if (pendingCheck === request) pendingCheck = null;
  });

  pendingCheck = request;

  return request;
};

// 알림 화면을 마지막으로 나간 뒤에 새 알림이 있는지
export const fetchHasUnreadNotification = async () => {
  await pendingCheck?.catch(() => {
    /* 확인 요청이 실패해도 레드닷 조회는 그대로 한다 */
  });

  const response = await apiClient.get('/notification/unread');

  return Boolean(response.data?.hasUnread);
};
