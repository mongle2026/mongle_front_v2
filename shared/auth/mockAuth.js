// 기기 두 대로 주고받기를 테스트할 때 .env 의 EXPO_PUBLIC_MOCK_USER_ID 로 기기마다 다른 사용자를 쓴다
const MOCK_CURRENT_USER_ID = Number(process.env.EXPO_PUBLIC_MOCK_USER_ID) || 1;

export const mockAuth = Object.freeze({
  isAuthenticated: true,
  userId: MOCK_CURRENT_USER_ID,
});