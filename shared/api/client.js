import axios from 'axios';

import { useAuthStore } from '../auth/useAuthStore';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

export const isApiConfigured = Boolean(API_BASE_URL);

const REQUEST_TIMEOUT = 15_000;

/**
 * 백엔드 API 요청용 axios 인스턴스.
 * 경로만 넘기면 된다. 예) apiClient.get(`/feed/${feedId}`)
 *
 * R2 presigned URL처럼 외부 주소로 보내는 요청은 axios를 직접 쓴다.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
});

// 로그인했으면 accessToken 을 붙인다. 가입 중 signupToken 처럼 직접 지정한 Authorization 은 그대로 둔다
apiClient.interceptors.request.use(config => {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다.');
  }

  const accessToken = useAuthStore.getState().session?.accessToken;

  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// 동시에 여러 요청이 401 을 받아도 refresh 는 한 번만 한다.
// refresh token 은 한 번 쓰면 바뀌어서(rotation) 두 번 보내면 두 번째는 실패한다
let refreshPromise = null;

const refreshTokens = refreshToken => {
  refreshPromise ??= axios
    // interceptor 를 타지 않도록 axios 를 직접 쓴다
    .post(`${API_BASE_URL}/auth/refresh`, { refreshToken }, { timeout: REQUEST_TIMEOUT })
    .then(async ({ data }) => {
      await useAuthStore.getState().updateTokens(data);
      return data.accessToken;
    })
    .catch(async error => {
      // refresh token 이 만료 · 무효(다른 기기에서 로그인 등)면 다시 로그인해야 한다.
      // 네트워크 에러는 로그인을 유지한다
      if (error?.response?.status === 401) {
        await useAuthStore.getState().signOut();
      }

      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

// accessToken 이 만료되어 401 을 받으면 새로 받아서 한 번만 다시 보낸다.
// signupToken 처럼 로그인 토큰이 아닌 것으로 보낸 요청은 config.skipAuthRefresh 로 뺀다
apiClient.interceptors.response.use(undefined, async error => {
  const { config, response } = error;
  const session = useAuthStore.getState().session;

  if (
    response?.status !== 401 ||
    !config ||
    config.skipAuthRefresh ||
    config.didRetryAuth ||
    !session?.refreshToken
  ) {
    throw error;
  }

  const sentToken = config.headers.Authorization?.replace(/^Bearer /, '');

  // 이 요청을 보낸 뒤 다른 요청이 이미 새 토큰을 받았으면 그 토큰으로 다시 보내기만 한다
  const accessToken = sentToken && sentToken !== session.accessToken
    ? session.accessToken
    : await refreshTokens(session.refreshToken);

  config.didRetryAuth = true;
  config.headers.Authorization = `Bearer ${accessToken}`;

  return apiClient(config);
});

/**
 * 사용자에게 보여줄 에러 메시지.
 * 백엔드 validation 에러는 message가 배열이라 첫 번째만 쓴다.
 */
export const getApiErrorMessage = (error, fallbackMessage) => {
  const message = error?.response?.data?.message;
  const firstMessage = Array.isArray(message) ? message[0] : message;

  return firstMessage || fallbackMessage;
};

/**
 * console.warn용 에러 내용. 서버 응답이 있으면 응답 body, 없으면 에러 메시지.
 */
export const getApiErrorDetail = error =>
  error?.response?.data ?? error?.message;

export default apiClient;
