import axios from 'axios';

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

apiClient.interceptors.request.use(config => {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다.');
  }

  return config;
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
