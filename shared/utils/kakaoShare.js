// import { shareFeedTemplate } from '@react-native-kakao/share';

// const normalizeText = value => {
//   if (typeof value !== 'string') return '';
//   return value.trim().replace(/\s+/g, ' ');
// };

// const getAuthorLabel = user => {
//   const userCode = normalizeText(user?.userCode);

//   if (userCode) {
//     return `@${userCode}`;
//   }

//   const nickname = normalizeText(user?.nickname);

//   return nickname || '사용자';
// };

// const createFeedLink = feed => {
//   const params = {
//     feedId: String(feed.feedId),
//     visibility: String(feed.visibility ?? 'PUBLIC'),
//   };

//   return {
//     androidExecutionParams: params,
//     iosExecutionParams: params,
//   };
// };

// export const shareKakaoFeed = async feed => {
//   if (!feed?.feedId) {
//     console.warn('공유할 피드 정보가 없습니다.');
//     return;
//   }

//   const user = feed.user ?? {};
//   const record = feed.record ?? {};
//   const music = feed.music ?? {};

//   const imageUrl = normalizeText(music.musicArtwork);

//   if (!imageUrl) {
//     console.warn('공유할 앨범 커버 이미지가 없습니다.');
//     return;
//   }

//   const authorLabel = getAuthorLabel(user);
//   const musicTitle = normalizeText(music.musicTitle);
//   const musicArtist = normalizeText(music.musicArtist);
//   const recordText = normalizeText(record.text);

//   const musicText = [
//     musicTitle,
//     musicArtist,
//   ]
//     .filter(Boolean)
//     .join(' - ');

//   const title = musicText
//     ? `[mongle] ${authorLabel}님의 기록\n${musicText}`
//     : `[mongle] ${authorLabel}님의 기록`;

//   const description = recordText
//     ? `“${recordText}”`
//     : '음악과 함께 남긴 기록입니다.';

//   const link = createFeedLink(feed);

//   try {
//     await shareFeedTemplate({
//       template: {
//         content: {
//           title,
//           description,
//           imageUrl,
//           link,
//         },
//         buttons: [
//           {
//             title: '이어서 읽기',
//             link,
//           },
//         ],
//       },
//     });
//   } catch (error) {
//     console.error(
//       '카카오 공유 실패',
//       error,
//     );
//   }
// };