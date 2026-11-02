import { Asset } from 'expo-asset';

// 서버의 기본 프로필 사진 번호(1~5)와 순서가 같다. R2 defaults/profile_{번호}.png 와 같은 사진
const DEFAULT_PROFILE_IMG_MODULES = [
  require('../../../assets/illustrations/il_profile_1.png'),
  require('../../../assets/illustrations/il_profile_2.png'),
  require('../../../assets/illustrations/il_profile_3.png'),
  require('../../../assets/illustrations/il_profile_4.png'),
  require('../../../assets/illustrations/il_profile_5.png'),
];

/**
 * 가입 화면의 기본 프로필 사진 5장 중 한 장을 랜덤으로 고른다.
 * 사진은 올리지 않고 번호(defaultProfileImgNo)만 가입 요청에 실어 보낸다
 */
const pickDefaultProfileImg = () => {
  const index = Math.floor(Math.random() * DEFAULT_PROFILE_IMG_MODULES.length);

  return {
    uri: Asset.fromModule(DEFAULT_PROFILE_IMG_MODULES[index]).uri,
    defaultProfileImgNo: index + 1,
  };
};

export default pickDefaultProfileImg;
