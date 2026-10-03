import { useRecordFormStore } from '../store/useRecordFormStore';
import { uploadRecordFiles } from './uploadRecordFiles';

/*
 * 피드 작성·수정, 편지 작성이 같이 쓰는 저장 준비 단계입니다.
 *
 * 저장 버튼을 누른 순간의 최신 form 값을 가져오고,
 * 업로드를 요청 전에 끝내 둡니다.
 * 사진을 고를 때 미리 시작한 업로드는 기다리기만 합니다.
 * 여기서 실패하면 서버에 아무것도 반영하지 않고 끝납니다.
 *
 * recordBody 에 업로드가 끝난 파일 정보가 같이 들어 있어서
 * 서버가 글과 파일을 한 트랜잭션에서 저장합니다.
 */
export async function prepareRecordSubmission({ userId }) {
  if (!userId) {
    throw new Error('사용자 정보가 없습니다.');
  }

  const recordForm = useRecordFormStore.getState();

  const { files, localUris } = await uploadRecordFiles({
    userId,
    files: recordForm.files,
  });

  return {
    recordForm,
    localUris,
    recordBody: {
      music: JSON.stringify(recordForm.music),
      text: recordForm.text ?? '',
      font: recordForm.font ?? 'KYOBO',
      files,
    },
  };
}
