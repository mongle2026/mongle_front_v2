import { useQuery } from '@tanstack/react-query';

import apiClient, { isApiConfigured } from '../../../shared/api/client';
import useDebouncedValue from '../../../shared/hooks/useDebouncedValue';

// 아이디: 영어 소문자, 숫자, _ 5~12자
export const ID_PATTERN = /^[a-z0-9_]{5,12}$/;

// 입력을 멈추고 이만큼 지나면 중복 확인을 보낸다
const CHECK_DEBOUNCE_MS = 500;
// 같은 아이디로 다시 돌아왔을 때 바로 보여줄 수 있게 잠깐 들고 있는다
const CHECK_STALE_TIME = 30 * 1000;

export const USER_CODE_AVAILABILITY = {
  IDLE: 'idle',
  CHECKING: 'checking',
  AVAILABLE: 'available',
  TAKEN: 'taken',
  ERROR: 'error',
};

/**
 * 아이디(userCode) 중복 확인.
 * 입력을 멈추고 CHECK_DEBOUNCE_MS가 지나면 백엔드에 물어본다.
 *
 * 규칙(영어 소문자 · 숫자 · _ 5~12자)에 맞지 않으면 요청하지 않는다.
 * 백엔드도 규칙에 어긋나면 400으로 돌려보내기 때문에 보내 봐야 의미가 없다.
 *
 * availability
 *  - idle: 비어 있거나 규칙에 어긋나서 확인하지 않음
 *  - checking: 입력을 기다리는 중이거나 확인 요청 중
 *  - available: 사용 가능
 *  - taken: 이미 사용 중
 *  - error: 확인 요청 실패
 */
const useUserCodeAvailability = userCode => {
  const debouncedUserCode = useDebouncedValue(userCode, CHECK_DEBOUNCE_MS);

  const isValid = ID_PATTERN.test(userCode);
  // 입력이 멈춘 뒤의 값일 때만 확인한다. 이전 아이디의 결과가 보이지 않게 한다
  const isSettled = debouncedUserCode === userCode;

  const { data, isError } = useQuery({
    queryKey: ['user-code-availability', debouncedUserCode],

    queryFn: async ({ signal }) => {
      const response = await apiClient.get('/auth/user-code/availability', {
        params: { userCode: debouncedUserCode },
        signal,
      });

      return Boolean(response.data?.available);
    },

    enabled: isApiConfigured && isValid && isSettled,

    staleTime: CHECK_STALE_TIME,
    retry: false,
  });

  let availability = USER_CODE_AVAILABILITY.CHECKING;

  if (!isValid || !isApiConfigured) {
    availability = USER_CODE_AVAILABILITY.IDLE;
  } else if (!isSettled) {
    availability = USER_CODE_AVAILABILITY.CHECKING;
  } else if (isError) {
    availability = USER_CODE_AVAILABILITY.ERROR;
  } else if (data !== undefined) {
    availability = data
      ? USER_CODE_AVAILABILITY.AVAILABLE
      : USER_CODE_AVAILABILITY.TAKEN;
  }

  return { availability };
};

export default useUserCodeAvailability;
