import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import IcPencil from '../../../assets/icons/ic_pencil.svg';

import { gap } from '../../../shared/styles/token';
import { FONT } from '../../../shared/styles/fontType';
import { PATTERNS, STAMPS } from '../../../shared/data/envelopeData';

// feed
import ProfileBar from '../../feed/components/ProfileBar';
import PostCard from '../../feed/home/components/PostCard';
import FeedListState from '../../feed/home/components/FeedListState';
import Comment from '../../feed/detail/components/Comment';
import CommentBar from '../../feed/detail/components/CommentBar';
import FeedDetailContent from '../../feed/detail/components/FeedDetailContent';

// archive
import GenreCard from '../../archive/components/GenreCard';
import GridCard from '../../archive/components/GridCard';
import ShortPostCard from '../../archive/components/ShortPostCard';
import OthersPostCard from '../../archive/components/OthersPostCard';
import GenrePreview from '../../archive/myfeed/home/components/GenrePreview';
import AllFeedPreview from '../../archive/myfeed/home/components/AllFeedPreview';

// letterbox
import LetterCard from '../../letterbox/components/Card';
import FlippableLetter from '../../letterbox/components/FlippableLetter';
import LetterProfile from '../../letterbox/components/Profile';
import LetterDetailContent from '../../letterbox/letter/detail/components/LetterDetailContent';
import StampBoxItem from '../../letterbox/stamp/home/components/StampBoxItem';

// notification
import InfoBanner from '../../notification/components/InfoBanner';
import NotificationListItem from '../../notification/components/NotificationListItem';
import { NOTIFICATION_STATUS, NOTIFICATION_TYPE } from '../../notification/constants';

// write
import WriteLabeledButton from '../../write/components/LabeledButton';
import ListRow, { LIST_ROW_TYPE } from '../../write/components/ListRow';
import ColorItem from '../../write/components/ColorItem';
import PatternItem from '../../write/components/PatternItem';
import StampItem from '../../write/components/StampItem';
import Templete from '../../write/components/Templete';
import BottomBar from '../../write/components/bottombar/BottomBar';
import BottomBarItem from '../../write/components/bottombar/Item';
import Calendar from '../../write/components/calendar/Calendar';
import CalendarItem from '../../write/components/calendar/Item';
import SelectedImageList from '../../write/record/components/SelectedImageList';

import { CatalogSection, Specimen } from '../components/Specimen';

// 바텀시트 · 전역 store · 화면 단위 목록(UnreadLetterStack 등)에 묶인 컴포넌트는
// 단독으로 그리기 어려워 제외한다

const noop = () => {};

const sampleUri = seed => `https://picsum.photos/seed/${seed}/400/400`;
const SAMPLE_IMAGE_URI = sampleUri('mongle');
const SampleCover = { uri: SAMPLE_IMAGE_URI };

// 카탈로그용 고정 날짜 (상대 시간 표시가 매번 바뀌지 않도록 과거로 둔다)
const HOURS_AGO = hours => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
const SAMPLE_DATE = HOURS_AGO(24);

const SAMPLE_CONTENT = '오늘 하루 종일 이 노래만 들었다.\n가사가 꼭 지금 내 이야기 같아서 자꾸 돌려 듣게 된다.';

const SAMPLE_MUSIC = {
  imageSource: SampleCover,
  title: '노래 제목',
  artist: '아티스트',
  previewUrl: 'https://example.com/preview.mp3',
};

const SAMPLE_ENVELOPE = { pattern: PATTERNS[0].id, color: PATTERNS[0].colors[1].id, stamp: STAMPS[0].id };

const SAMPLE_LETTER = {
  profileImageUri: SAMPLE_IMAGE_URI,
  nickname: '몽글',
  receivedAt: SAMPLE_DATE,
  createdAt: HOURS_AGO(72),
  music: { title: '노래 제목', singer: '아티스트', artworkUri: SAMPLE_IMAGE_URI },
  envelope: SAMPLE_ENVELOPE,
};

const NOTIFICATION_SAMPLES = [
  { type: NOTIFICATION_TYPE.LETTER, status: NOTIFICATION_STATUS.SEND, name: '동글' },
  { type: NOTIFICATION_TYPE.LETTER, status: NOTIFICATION_STATUS.RECEIVE, name: '몽글', isToSelf: true },
  { type: NOTIFICATION_TYPE.FEED, status: NOTIFICATION_STATUS.COMMENT, name: 'user_001', content: '이 노래 저도 정말 좋아해요! 추천 감사합니다' },
  { type: NOTIFICATION_TYPE.FEED, status: NOTIFICATION_STATUS.REPLY, name: 'user_002', content: '그쵸 ㅎㅎ' },
  { type: NOTIFICATION_TYPE.NEWS, status: NOTIFICATION_STATUS.SYSTEM },
  { type: NOTIFICATION_TYPE.NEWS, status: NOTIFICATION_STATUS.EVENT, eventTitle: '가을 우표' },
];

const SAMPLE_SELECTED_IMAGES = [
  { uri: sampleUri('img1'), width: 400, height: 300 },
  { uri: sampleUri('img2'), width: 500, height: 600 },
];

const stretch = { alignItems: 'stretch' };

// ── Feed ──────────────────────────────────────────────────
const FeedSection = () => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [comment, setComment] = useState('');

  return (
    <CatalogSection title="Feed">
      <Specimen name="ProfileBar" note="팔로우 전 / 팔로잉 / 팔로우 버튼 없음 · font kyobo / suit" contentStyle={stretch}>
        <ProfileBar
          imageUri={SAMPLE_IMAGE_URI}
          username="mongle"
          isFollowing={isFollowing}
          onPressProfile={noop}
          onPressFollow={() => setIsFollowing(value => !value)}
        />
        <ProfileBar imageUri={SAMPLE_IMAGE_URI} username="mongle" isFollowing onPressFollow={noop} />
        <ProfileBar imageUri={SAMPLE_IMAGE_URI} username="mongle" font={FONT.SUIT} showFollowButton={false} />
      </Specimen>

      <Specimen name="PostCard" note="텍스트 / 이미지 2장" contentStyle={stretch} dark>
        <PostCard
          style={styles.postCard}
          profileProps={{ imageUri: SAMPLE_IMAGE_URI, username: 'mongle', isFollowing, onPressFollow: () => setIsFollowing(value => !value) }}
          musicProps={{ ...SAMPLE_MUSIC, isPlaying, onPressPlayback: () => setIsPlaying(value => !value) }}
          actionProps={{
            createdAt: SAMPLE_DATE,
            isLiked,
            isBookmarked,
            onLikePress: () => setIsLiked(value => !value),
            onBookmarkPress: () => setIsBookmarked(value => !value),
            onCommentPress: noop,
          }}
          content={SAMPLE_CONTENT}
          onPress={noop}
        />
        <PostCard
          style={styles.postCard}
          profileProps={{ imageUri: SAMPLE_IMAGE_URI, username: 'dongle', showFollowButton: false }}
          musicProps={SAMPLE_MUSIC}
          actionProps={{ createdAt: SAMPLE_DATE }}
          imageSources={[{ uri: sampleUri('post1') }, { uri: sampleUri('post2') }]}
          font={FONT.SUIT}
          onPress={noop}
        />
      </Specimen>

      <Specimen name="FeedDetailContent" note="텍스트 + 이미지" contentStyle={stretch}>
        <FeedDetailContent content={SAMPLE_CONTENT} imageSources={[{ uri: sampleUri('detail') }]} />
      </Specimen>

      <Specimen name="Comment" note="depth 0 / 1(답글) · 메뉴 열림" contentStyle={stretch}>
        <Comment
          userCode="user_001"
          comment="이 노래 저도 정말 좋아해요!"
          createdAt={HOURS_AGO(2)}
          profileImageUrl={SAMPLE_IMAGE_URI}
          onPressMenu={noop}
          onPressReply={noop}
        />
        <Comment
          userCode="mongle"
          comment="그쵸 ㅎㅎ 추천 감사해요"
          createdAt={HOURS_AGO(1)}
          profileImageUrl={SAMPLE_IMAGE_URI}
          depth={1}
          isMenuOpen
          onPressMenu={noop}
        />
      </Specimen>

      <Specimen name="CommentBar" note="댓글 / 답글 / disabled" contentStyle={stretch}>
        <CommentBar value={comment} onChangeText={setComment} onSubmit={() => setComment('')} profileImageUri={SAMPLE_IMAGE_URI} />
        <CommentBar profileImageUri={SAMPLE_IMAGE_URI} isReply targetUsername="user_001" onClose={noop} />
        <CommentBar profileImageUri={SAMPLE_IMAGE_URI} disabled />
      </Specimen>

      <Specimen name="FeedListState" note="loading / message" contentStyle={stretch}>
        <FeedListState loading />
        <FeedListState message="피드를 불러오지 못했어요" />
      </Specimen>
    </CatalogSection>
  );
};

// ── Archive ───────────────────────────────────────────────
const ArchiveSection = () => {
  const [playingFeedId, setPlayingFeedId] = useState(null);

  return (
    <CatalogSection title="Archive">
      <Specimen name="GenreCard / GridCard">
        <View style={styles.row}>
          <GenreCard genre="K-Pop" imageSource={SampleCover} onPress={noop} style={styles.genreCard} />
          <GridCard title="26년 10월" imageSource={SampleCover} onPress={noop} style={styles.gridCard} />
        </View>
      </Specimen>

      <Specimen name="ShortPostCard" note="텍스트 / 이미지만 · 재생 토글" contentStyle={stretch} dark>
        <ShortPostCard
          feedId="1"
          music={SAMPLE_MUSIC}
          isPlaying={playingFeedId === '1'}
          onPressPlayback={() => setPlayingFeedId(id => (id === '1' ? null : '1'))}
          content={SAMPLE_CONTENT}
          date={SAMPLE_DATE}
          onPress={noop}
        />
        <ShortPostCard
          feedId="2"
          music={SAMPLE_MUSIC}
          imageSources={[{ uri: sampleUri('short1') }, { uri: sampleUri('short2') }]}
          date={SAMPLE_DATE}
          font={FONT.SUIT}
          onPress={noop}
        />
      </Specimen>

      <Specimen name="OthersPostCard" note="북마크 탭 · 팔로우 전 / 팔로잉" contentStyle={stretch} dark>
        <OthersPostCard
          profile={{ imageUri: SAMPLE_IMAGE_URI, username: 'dongle' }}
          music={SAMPLE_MUSIC}
          content={SAMPLE_CONTENT}
          date={SAMPLE_DATE}
          onPress={noop}
        />
        <OthersPostCard
          profile={{ imageUri: SAMPLE_IMAGE_URI, username: 'mongle', isFollowing: true }}
          music={SAMPLE_MUSIC}
          imageSources={[{ uri: sampleUri('others1') }]}
          date={SAMPLE_DATE}
          onPress={noop}
        />
      </Specimen>

      <Specimen name="GenrePreview" contentStyle={styles.flush} dark>
        <GenrePreview
          genres={['K-Pop', '팝', '록', '힙합'].map(genre => ({ genre, imageSource: { uri: sampleUri(genre) } }))}
          onPressMore={noop}
          onPressGenre={noop}
        />
      </Specimen>

      <Specimen name="AllFeedPreview" contentStyle={styles.flush} dark>
        <AllFeedPreview
          allImageSource={SampleCover}
          months={['2026-10', '2026-09', '2026-08'].map(month => ({ month, imageSource: { uri: sampleUri(month) } }))}
          onPressCard={noop}
        />
      </Specimen>
    </CatalogSection>
  );
};

// ── Letterbox ─────────────────────────────────────────────
const LetterboxSection = () => {
  const isFlipping = useSharedValue(false);

  return (
    <CatalogSection title="Letterbox">
      <Specimen name="Card" note="unread / read / 보낸 편지" contentStyle={stretch} dark>
        <LetterCard letter={SAMPLE_LETTER} type="unread" onPress={noop} />
        <LetterCard letter={SAMPLE_LETTER} type="read" onPress={noop} />
        <LetterCard letter={{ ...SAMPLE_LETTER, nickname: '동글', isSent: true }} onPress={noop} />
      </Specimen>

      <Specimen name="FlippableLetter" note="눌러서 뒤집기" dark>
        <FlippableLetter
          letter={{ envelope: SAMPLE_ENVELOPE, recipientName: '몽글', senderName: '동글' }}
          isFlipping={isFlipping}
        />
      </Specimen>

      <Specimen name="Profile" note="isMe: false / true">
        <View style={styles.row}>
          <LetterProfile imageUri={SAMPLE_IMAGE_URI} name="동글" />
          <LetterProfile imageUri={SAMPLE_IMAGE_URI} name="몽글" isMe />
        </View>
      </Specimen>

      <Specimen name="LetterDetailContent" note="텍스트 + 이미지" contentStyle={stretch}>
        <LetterDetailContent text={SAMPLE_CONTENT} imageSources={[{ uri: sampleUri('letter') }]} />
      </Specimen>

      <Specimen name="StampBoxItem" note="받지 않음(회색) / 받은 횟수 배지">
        <View style={styles.row}>
          <StampBoxItem stampCode={STAMPS[0].id} width={72} />
          <StampBoxItem stampCode={STAMPS[1].id} count={3} width={72} onPress={noop} />
          <StampBoxItem stampCode={STAMPS[2].id} count={12} width={72} onPress={noop} />
        </View>
      </Specimen>
    </CatalogSection>
  );
};

// ── Notification ──────────────────────────────────────────
const NotificationSection = () => (
  <CatalogSection title="Notification">
    <Specimen name="InfoBanner" contentStyle={stretch}>
      <InfoBanner />
    </Specimen>

    <Specimen name="NotificationListItem" note="letter send / receive · feed comment / reply · news system / event" contentStyle={stretch} dark>
      {NOTIFICATION_SAMPLES.map(sample => (
        <NotificationListItem
          key={`${sample.type}-${sample.status}`}
          {...sample}
          profileImageUrl={SAMPLE_IMAGE_URI}
          createdAt={HOURS_AGO(3)}
          onPress={noop}
        />
      ))}
    </Specimen>
  </CatalogSection>
);

// ── Write ─────────────────────────────────────────────────
const WriteSection = () => {
  const [colorIndex, setColorIndex] = useState(0);
  const [patternIndex, setPatternIndex] = useState(0);
  const [stampIndex, setStampIndex] = useState(0);
  const [templateIndex, setTemplateIndex] = useState(0);
  const [font, setFont] = useState(FONT.KYOBO);
  const [selectedDate, setSelectedDate] = useState(null);
  const [images, setImages] = useState(SAMPLE_SELECTED_IMAGES);

  return (
    <CatalogSection title="Write">
      <Specimen name="LabeledButton (write)" note="기본 / disabled">
        <View style={styles.row}>
          <WriteLabeledButton icon={IcPencil} label="수정" onPress={noop} />
          <WriteLabeledButton icon={IcPencil} label="수정" disabled />
        </View>
      </Specimen>

      <Specimen name="ListRow" note="recipient / recipient(나) / music · pressed" contentStyle={stretch}>
        <ListRow imageUri={SAMPLE_IMAGE_URI} nickname="동글" userId="dongle" onPress={noop} />
        <ListRow imageUri={SAMPLE_IMAGE_URI} nickname="몽글" userId="mongle" isMe isPressed onPress={noop} />
        <ListRow type={LIST_ROW_TYPE.MUSIC} imageUri={SAMPLE_IMAGE_URI} title="노래 제목" artist="아티스트" onPress={noop} />
      </Specimen>

      <Specimen name="ColorItem" note="isActive">
        <View style={styles.row}>
          {PATTERNS[0].colors.map((item, index) => (
            <ColorItem
              key={item.id}
              color={item.color}
              isActive={index === colorIndex}
              onPress={() => setColorIndex(index)}
              style={styles.colorItem}
            />
          ))}
        </View>
      </Specimen>

      <Specimen name="PatternItem" note="isActive">
        <View style={styles.row}>
          {PATTERNS.slice(0, 4).map((pattern, index) => (
            <PatternItem
              key={pattern.id}
              Svg={pattern.thumbnail}
              isActive={index === patternIndex}
              onPress={() => setPatternIndex(index)}
              style={styles.patternItem}
            />
          ))}
        </View>
      </Specimen>

      <Specimen name="StampItem" note="isActive · 행 안에서 폭을 나눠 가진다" contentStyle={stretch}>
        <View style={styles.gridRow}>
          {STAMPS.slice(0, 4).map((stamp, index) => (
            <StampItem
              key={stamp.id}
              Svg={stamp.SvgComponent}
              isActive={index === stampIndex}
              onPress={() => setStampIndex(index)}
            />
          ))}
        </View>
      </Specimen>

      <Specimen name="Templete" note="isActive">
        <View style={styles.row}>
          {[0, 1].map(index => (
            <Templete
              key={index}
              label={`템플릿 ${index + 1}`}
              PatternSvg={PATTERNS[index].thumbnail}
              StampSvg={STAMPS[index].SvgComponent}
              isActive={index === templateIndex}
              onPress={() => setTemplateIndex(index)}
            />
          ))}
        </View>
      </Specimen>

      <Specimen name="BottomBar" note="mode: actions / font · 키보드 열림" contentStyle={stretch}>
        <BottomBar onPressImage={noop} onPressFont={noop} />
        <BottomBar keyboardVisible imageDisabled onPressFont={noop} onPressHideKeyboard={noop} />
        <BottomBar mode="font" selectedFont={font} onSelectFont={setFont} onPressBack={noop} />
      </Specimen>

      <Specimen name="BottomBar Item" note="font · selected">
        <View style={styles.row}>
          <BottomBarItem text="SUIT" font={FONT.SUIT} selected={font === FONT.SUIT} onPress={() => setFont(FONT.SUIT)} />
          <BottomBarItem text="교보" font={FONT.KYOBO} selected={font === FONT.KYOBO} onPress={() => setFont(FONT.KYOBO)} />
        </View>
      </Specimen>

      <Specimen name="Calendar Item" note="state: default / current / disabled">
        <View style={styles.row}>
          <CalendarItem onPress={noop}>7</CalendarItem>
          <CalendarItem state="current" onPress={noop}>8</CalendarItem>
          <CalendarItem state="disabled">9</CalendarItem>
        </View>
      </Specimen>

      <Specimen name="Calendar" note="allowToday: false" contentStyle={stretch}>
        <Calendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </Specimen>

      <Specimen name="SelectedImageList" note="x 로 삭제" contentStyle={stretch}>
        <SelectedImageList
          images={images}
          onRemove={target => setImages(list => list.filter(image => image.uri !== target.uri))}
        />
      </Specimen>
    </CatalogSection>
  );
};

export const DOMAIN_SECTIONS = [
  { key: 'feed', label: 'Feed', Component: FeedSection },
  { key: 'archive', label: 'Archive', Component: ArchiveSection },
  { key: 'letterbox', label: 'Letterbox', Component: LetterboxSection },
  { key: 'notification', label: 'Notification', Component: NotificationSection },
  { key: 'write', label: 'Write', Component: WriteSection },
];

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: gap.L,
  },

  flush: {
    alignItems: 'stretch',
    paddingHorizontal: 0,
  },

  postCard: {
    height: 520,
  },

  genreCard: {
    width: 140,
  },

  gridCard: {
    width: 160,
  },

  colorItem: {
    width: 32,
  },

  patternItem: {
    width: 56,
    height: 56,
  },

  gridRow: {
    flexDirection: 'row',
    gap: gap.M,
  },
});
