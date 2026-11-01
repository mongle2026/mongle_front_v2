import { Asset } from 'expo-asset';

const DEFAULT_PROFILE_IMG_MODULES = [
  require('../../../assets/illustrations/il_profile_1.png'),
  require('../../../assets/illustrations/il_profile_2.png'),
  require('../../../assets/illustrations/il_profile_3.png'),
  require('../../../assets/illustrations/il_profile_4.png'),
  require('../../../assets/illustrations/il_profile_5.png'),
];

/**
 * 기본 프로필 사진 5장 중 한 장을 랜덤으로 고른다.
 * useProfileImgPicker 의 profileImg 와 같은 모양에, 업로드할 때 파일로 꺼낼 asset 을 함께 담는다
 */
const pickDefaultProfileImg = () => {
  const index = Math.floor(Math.random() * DEFAULT_PROFILE_IMG_MODULES.length);
  const asset = Asset.fromModule(DEFAULT_PROFILE_IMG_MODULES[index]);

  return {
    uri: asset.uri,
    name: `il_profile_${index + 1}.png`,
    type: 'image/png',
    width: asset.width,
    height: asset.height,
    asset,
  };
};

export default pickDefaultProfileImg;
