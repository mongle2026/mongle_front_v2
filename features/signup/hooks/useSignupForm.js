import { useCallback, useState } from 'react';

export const ID_MAX_LENGTH = 12;
export const NICKNAME_MAX_LENGTH = 8;

// 아이디: 영어 소문자, 숫자, _ 5~12자 / 닉네임: 띄어쓰기 없이 2~8자
const ID_PATTERN = /^[a-z0-9_]{5,12}$/;
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
 * idStatus / nicknameStatus: 입력값이 규칙(글자 종류 · 글자 수)에 어긋나면 'error', 아니면 undefined
 * canSubmit: 아이디 · 닉네임이 모두 규칙을 만족하면 true
 */
const useSignupForm = () => {
  const [id, setId] = useState('');
  const [nickname, setNickname] = useState('');

  const changeId = useCallback(text => {
    setId(text.toLowerCase());
  }, []);

  const idStatus = getStatus(id, ID_PATTERN);
  const nicknameStatus = getStatus(nickname, NICKNAME_PATTERN);

  const canSubmit = ID_PATTERN.test(id) && NICKNAME_PATTERN.test(nickname);

  return {
    id,
    changeId,
    idStatus,
    nickname,
    setNickname,
    nicknameStatus,
    canSubmit,
  };
};

export default useSignupForm;
