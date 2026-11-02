import { useCallback, useState } from 'react';

import useUserCodeAvailability, {
  ID_PATTERN,
  USER_CODE_AVAILABILITY,
} from './useUserCodeAvailability';

export const ID_MAX_LENGTH = 12;
export const NICKNAME_MAX_LENGTH = 8;

// 닉네임: 띄어쓰기 없이 2~8자. 아이디 규칙은 useUserCodeAvailability
const NICKNAME_PATTERN = /^\S{2,8}$/;

export const isValidNickname = nickname => NICKNAME_PATTERN.test(nickname ?? '');

// 아직 아무것도 입력하지 않았을 때는 error로 보여주지 않는다
const getStatus = (value, pattern) =>
  value.length > 0 && !pattern.test(value) ? 'error' : undefined;

/**
 * 프로필 입력값(아이디 · 닉네임)과 규칙 검사. 회원가입과 프로필 정보 편집에서 함께 쓴다.
 * 백엔드에서도 같은 규칙을 다시 확인한다.
 *
 * 아이디는 대문자로 입력해도 소문자로 바꿔서 저장한다.
 * 처음 값 그대로인 항목은 이미 서버에 있는 값이라 다시 검사하지 않고 기본 상태로 보여준다.
 * 아이디도 처음 값 그대로면 중복 확인을 보내지 않는다 (내가 쓰고 있는 아이디라서).
 *
 * initialId / initialNickname: 처음 값. 회원가입은 빈 아이디와 소셜 닉네임, 편집은 지금 내 값
 *
 * idStatus: 바꾼 아이디가 규칙(글자 종류 · 글자 수)에 어긋나거나 이미 사용 중이면 'error',
 *           사용할 수 있는 아이디임을 확인했으면 'positive', 아니면 undefined
 * isIdTaken: 이미 사용 중인 아이디면 true
 * isIdAvailable: 사용할 수 있는 아이디임을 확인했으면 true
 * nicknameStatus: 바꾼 닉네임이 규칙에 어긋나면 'error', 아니면 undefined
 * isIdChanged / isNicknameChanged: 처음 값과 달라졌으면 true
 * isValid: 아이디는 처음 값이거나 사용할 수 있음을 확인했고, 닉네임은 처음 값이거나 규칙을 만족하면 true.
 *          비어 있으면 처음 값이어도 false
 */
const useProfileForm = ({ initialId = '', initialNickname = '' } = {}) => {
  const [id, setId] = useState(initialId);
  const [nickname, setNickname] = useState(initialNickname);

  const changeId = useCallback(text => {
    setId(text.toLowerCase());
  }, []);

  const isIdChanged = id !== initialId;
  const isNicknameChanged = nickname !== initialNickname;

  const { availability } = useUserCodeAvailability(isIdChanged ? id : '');
  const isIdTaken = availability === USER_CODE_AVAILABILITY.TAKEN;
  const isIdAvailable = availability === USER_CODE_AVAILABILITY.AVAILABLE;

  let idStatus = isIdChanged ? getStatus(id, ID_PATTERN) : undefined;

  if (isIdTaken) {
    idStatus = 'error';
  } else if (isIdAvailable) {
    idStatus = 'positive';
  }

  const nicknameStatus = isNicknameChanged
    ? getStatus(nickname, NICKNAME_PATTERN)
    : undefined;

  // 중복 확인 중이거나 확인에 실패했을 때도 제출할 수 없다
  const isIdValid = isIdChanged ? isIdAvailable : id.length > 0;
  const isNicknameValid = isNicknameChanged
    ? NICKNAME_PATTERN.test(nickname)
    : nickname.length > 0;

  return {
    id,
    changeId,
    idStatus,
    isIdTaken,
    isIdAvailable,
    isIdChanged,
    nickname,
    setNickname,
    nicknameStatus,
    isNicknameChanged,
    isValid: isIdValid && isNicknameValid,
  };
};

export default useProfileForm;
