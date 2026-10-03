import { Platform, Share } from 'react-native';

const SHARE_BASE_URL = process.env.EXPO_PUBLIC_SHARE_BASE_URL;

const createFeedShareUrl = feedId => {
  if (!SHARE_BASE_URL) return null;

  const baseUrl = SHARE_BASE_URL.replace(/\/+$/, '');

  return `${baseUrl}/feed/share/${feedId}`;
};

export const shareFeed = async feed => {
  if (!feed?.feedId) {
    console.warn('공유할 피드 정보가 없습니다.');
    return;
  }

  const shareUrl = createFeedShareUrl(feed.feedId);

  if (!shareUrl) {
    console.warn('EXPO_PUBLIC_SHARE_BASE_URL이 설정되어 있지 않습니다.');
    return;
  }

  try {
    if (Platform.OS === 'ios') {
      await Share.share({
        url: shareUrl,
      });

      return;
    }

    await Share.share({
      message: shareUrl,
    });
  } catch (error) {
    console.error('공유 실패', error);
  }
};