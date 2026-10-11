import { useCallback, useState } from 'react';

import useUserCodeAvailability, {
  ID_PATTERN,
  USER_CODE_AVAILABILITY,
} from './useUserCodeAvailability';

export const ID_MAX_LENGTH = 12;
export const NICKNAME_MAX_LENGTH = 8;

// 닉네임: 띄어쓰기 없이 2~8자. 아이디 규칙은 useUserCodeAvailability
const NICKNAME_PATTERN = /^\S{2,8}$/;

// 아직 아무것도 입력하지 않았을 때는 error로 보여주지 않는다
const getStatus = (value, pattern) =>
  value.length > 0 && !pattern.test(value) ? 'error' : undefined;

/**
 * 회원가입 입력값과 규칙 검사.
 * 백엔드에서도 같은 규칙을 다시 확인한다.
 *
 * 아이디는 대문자로 입력해도 소문자로 바꿔서 저장한다.
 *
 * suggestedNickname: 소셜 계정의 닉네임. 닉네임 규칙에 맞을 때만 처음 값으로 채운다
 *
 * idStatus: 규칙(글자 종류 · 글자 수)에 어긋나거나 이미 사용 중이면 'error',
 *           사용할 수 있는 아이디임을 확인했으면 'positive', 아니면 undefined
 * isIdTaken: 이미 사용 중인 아이디면 true
 * isIdAvailable: 사용할 수 있는 아이디임을 확인했으면 true
 * nicknameStatus: 규칙에 어긋나면 'error', 아니면 undefined
 * canSubmit: 사용할 수 있는 아이디임을 확인했고 닉네임이 규칙을 만족하면 true
 */
const useSignupForm = ({ suggestedNickname } = {}) => {
  const [id, setId] = useState('');
  const [nickname, setNickname] = useState(() =>
    NICKNAME_PATTERN.test(suggestedNickname ?? '') ? suggestedNickname : '',
  );

  const changeId = useCallback(text => {
    setId(text.toLowerCase());
  }, []);

  const { availability } = useUserCodeAvailability(id);
  const isIdTaken = availability === USER_CODE_AVAILABILITY.TAKEN;
  const isIdAvailable = availability === USER_CODE_AVAILABILITY.AVAILABLE;

  let idStatus = getStatus(id, ID_PATTERN);

  if (isIdTaken) {
    idStatus = 'error';
  } else if (isIdAvailable) {
    idStatus = 'positive';
  }

  const nicknameStatus = getStatus(nickname, NICKNAME_PATTERN);

  // 중복 확인 중이거나 확인에 실패했을 때도 가입할 수 없다
  const canSubmit = isIdAvailable && NICKNAME_PATTERN.test(nickname);

  return {
    id,
    changeId,
    idStatus,
    isIdTaken,
    isIdAvailable,
    nickname,
    setNickname,
    nicknameStatus,
    canSubmit,
  };
};

export default useSignupForm;
