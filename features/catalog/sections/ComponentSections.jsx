import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import IcBell from '../../../assets/icons/ic_bell.svg';
import IcHeartFill from '../../../assets/icons/ic_heart_fill.svg';
import IcHeartStroke from '../../../assets/icons/ic_heart_stroke.svg';
import IcKebab from '../../../assets/icons/ic_kebab.svg';
import IcPencil from '../../../assets/icons/ic_pencil.svg';
import IcShare from '../../../assets/icons/ic_share.svg';
import IcTrash from '../../../assets/icons/ic_trash.svg';

import { colors } from '../../../shared/styles/color';
import { gap } from '../../../shared/styles/token';
import { FONT } from '../../../shared/styles/fontType';
import { typo } from '../../../shared/styles/typo';
import { STAMPS } from '../../../shared/data/envelopeData';

import AnimatedLabeledButton, { ANIMATION_TYPE } from '../../../shared/components/action/AnimatedLabeledButton';
import ButtonText from '../../../shared/components/action/ButtonText';
import ContainerButton from '../../../shared/components/action/ContainerButton';
import { Dialog } from '../../../shared/components/action/Dialog';
import FAB from '../../../shared/components/action/FAB';
import IconButton from '../../../shared/components/action/IconButton';
import LabeledButton from '../../../shared/components/action/LabeledButton';
import ListControlBar from '../../../shared/components/action/ListControlBar';
import SearchField from '../../../shared/components/action/SearchField';
import { TextButton, TEXT_BUTTON_SIZE, TEXT_BUTTON_VARIANT } from '../../../shared/components/action/TextButton';
import Menu from '../../../shared/components/action/menu/Menu';
import MenuItem from '../../../shared/components/action/menu/Item';

import CdCover from '../../../shared/components/atomic/CdCover';
import { DividerLine } from '../../../shared/components/atomic/DividerLine';
import FontFallbackText from '../../../shared/components/atomic/FontFallbackText';
import MusicCoverImg from '../../../shared/components/atomic/MusicCoverImg';
import ProfileImg from '../../../shared/components/atomic/ProfileImg';
import { WriteImg, WRITE_IMG_RATIO } from '../../../shared/components/atomic/WriteImg';

import ActionBar, { DATE_FORMAT } from '../../../shared/components/content/ActionBar';
import Empty from '../../../shared/components/content/Empty';
import Letter from '../../../shared/components/content/Letter';
import ListHeader from '../../../shared/components/content/ListHeader';
import MusicCard from '../../../shared/components/content/MusicCard';
import Stamp from '../../../shared/components/content/Stamp';
import Profile from '../../../shared/components/content/profile/Profile';

import LoadStateView from '../../../shared/components/feedback/LoadStateView';
import RefreshSpinner from '../../../shared/components/feedback/RefreshSpinner';
import Toast from '../../../shared/components/feedback/Toast';

import TabBar from '../../../shared/components/navigation/tabbar/TabBar';
import Tabs from '../../../shared/components/navigation/tabs/Tabs';
import TopIconNavigation from '../../../shared/components/navigation/topnavigation/TopIconNavigation';
import TopNavigation from '../../../shared/components/navigation/topnavigation/TopNavigation';

import { CatalogSection, Specimen } from '../components/Specimen';

const noop = () => {};

// 하프톤 효과가 보이도록 실제 사진을 쓴다 (assets 의 cover_img.png 는 체크무늬 placeholder)
const SAMPLE_IMAGE_URI = 'https://picsum.photos/seed/mongle/400/400';
const SampleCover = { uri: SAMPLE_IMAGE_URI };

// 카탈로그용 고정 날짜 (상대 시간 표시가 매번 바뀌지 않도록 하루 전으로 둔다)
const SAMPLE_DATE = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const SAMPLE_TOP_TABS = [
  { key: 'feed', label: '피드' },
  { key: 'following', label: '팔로잉' },
];

const EMPTY_TYPES = ['comment', 'recipient', 'music', 'letter', 'archive', 'notification', 'bookmark'];

// variant 마다 허용 사이즈가 다르다 (TextButton.jsx ALLOWED_SIZES)
const TEXT_BUTTON_MATRIX = [
  [TEXT_BUTTON_VARIANT.SOLID, ['S', 'M', 'L', 'XL']],
  [TEXT_BUTTON_VARIANT.GHOST, ['S']],
  [TEXT_BUTTON_VARIANT.NEUTRAL_WEAK, ['M', 'L', 'XL']],
  [TEXT_BUTTON_VARIANT.CRITICAL, ['L', 'XL']],
  [TEXT_BUTTON_VARIANT.BG_INFO_WEAK, ['M']],
  [TEXT_BUTTON_VARIANT.DISABLED, ['L', 'XL']],
];

const stretch = { alignItems: 'stretch' };

// ── Action ────────────────────────────────────────────────
const ActionSection = () => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(true);
  const [search, setSearch] = useState('');

  return (
    <CatalogSection title="Action">
      {TEXT_BUTTON_MATRIX.map(([variant, sizes]) => (
        <Specimen key={variant} name={`TextButton · ${variant}`} note={`size: ${sizes.join(' / ')}`}>
          {sizes.map(size => (
            <View key={size} style={styles.row}>
              <TextButton variant={variant} size={TEXT_BUTTON_SIZE[size]} font={FONT.SUIT} onPress={noop}>
                {`SUIT ${size}`}
              </TextButton>
              <TextButton variant={variant} size={TEXT_BUTTON_SIZE[size]} font={FONT.KYOBO} onPress={noop}>
                {`교보 ${size}`}
              </TextButton>
            </View>
          ))}
        </Specimen>
      ))}

      <Specimen name="IconButton" note="size: S / M · disabled">
        <View style={styles.row}>
          <IconButton icon={IcShare} color={colors.fgNeutralPrimary} size="S" onPress={noop} />
          <IconButton icon={IcShare} color={colors.fgNeutralPrimary} size="M" onPress={noop} />
          <IconButton icon={IcKebab} color={colors.fgNeutralPrimary} size="M" onPress={noop} />
          <IconButton icon={IcBell} color={colors.fgNeutralPrimary} size="M" disabled />
        </View>
      </Specimen>

      <Specimen name="LabeledButton" note="size: S / M · disabled">
        <View style={styles.row}>
          <LabeledButton icon={IcPencil} label="수정" size="S" onPress={noop} />
          <LabeledButton icon={IcPencil} label="수정" size="M" onPress={noop} />
          <LabeledButton icon={IcTrash} label="삭제" size="M" disabled />
        </View>
      </Specimen>

      <Specimen name="AnimatedLabeledButton" note="눌러서 애니메이션 확인 · LIKE / BOOKMARK">
        <View style={styles.row}>
          <AnimatedLabeledButton
            label="12"
            isActive={isLiked}
            activeIcon={IcHeartFill}
            inactiveIcon={IcHeartStroke}
            activeColor={colors.fgLikeActive}
            animationType={ANIMATION_TYPE.LIKE}
            onPress={() => setIsLiked(value => !value)}
          />
        </View>
      </Specimen>

      <Specimen name="ButtonText / ContainerButton" contentStyle={stretch}>
        <ButtonText text="ButtonText" onPress={noop} />
        <ContainerButton label="ContainerButton" onPress={noop} />
      </Specimen>

      <Specimen name="ListControlBar" contentStyle={stretch} dark>
        <ListControlBar text="최신순" onPress={noop} />
      </Specimen>

      <Specimen name="SearchField" contentStyle={stretch}>
        <SearchField value={search} onChangeText={setSearch} placeholder="노래, 아티스트 검색" />
      </Specimen>

      <Specimen name="Menu" note="기본(수정/삭제) · items · disabled" dark>
        <View style={styles.rowTop}>
          <Menu onPressEdit={noop} onPressDelete={noop} />
          <Menu
            items={[
              { key: 'new', label: '최신순', onPress: noop },
              { key: 'old', label: '오래된순', onPress: noop },
            ]}
          />
          <Menu showEdit={false} deleteDisabled />
        </View>
        <MenuItem icon={IcPencil} label="Menu Item 단독" onPress={noop} />
      </Specimen>

      <Specimen name="FAB" note="닫힘 / 열림 (open 고정)" contentStyle={stretch} dark>
        <FAB onFeedPress={noop} onLetterPress={noop} />
        <FAB open onFeedPress={noop} onLetterPress={noop} />
      </Specimen>

      <Specimen name="Dialog" dark>
        <Dialog
          title="게시물을 삭제할까요?"
          description="삭제한 게시물은 되돌릴 수 없어요."
          onCancel={noop}
          onConfirm={noop}
        />
      </Specimen>

      <Specimen name="ActionBar (북마크 토글)" contentStyle={stretch}>
        <ActionBar
          createdAt={SAMPLE_DATE}
          isLiked={isLiked}
          isBookmarked={isBookmarked}
          bookmarkCount={3}
          onLikePress={() => setIsLiked(value => !value)}
          onBookmarkPress={() => setIsBookmarked(value => !value)}
          onCommentPress={noop}
        />
        <ActionBar createdAt={SAMPLE_DATE} dateFormat={DATE_FORMAT.DATETIME} isEdited showCommentButton={false} />
      </Specimen>
    </CatalogSection>
  );
};

// ── Atomic ────────────────────────────────────────────────
const AtomicSection = () => (
  <CatalogSection title="Atomic">
    <Specimen name="ProfileImg" note="size: S / M / L · 마지막은 이미지 없음(기본 이미지)">
      <View style={styles.row}>
        <ProfileImg size="S" imageUri={SAMPLE_IMAGE_URI} />
        <ProfileImg size="M" imageUri={SAMPLE_IMAGE_URI} />
        <ProfileImg size="L" imageUri={SAMPLE_IMAGE_URI} />
        <ProfileImg size="L" />
      </View>
    </Specimen>

    <Specimen name="MusicCoverImg / CdCover" note="Skia 하프톤 효과">
      <View style={styles.row}>
        <MusicCoverImg imageSource={SampleCover} />
        <CdCover size={72} imageUri={SAMPLE_IMAGE_URI} />
      </View>
    </Specimen>

    <Specimen name="WriteImg" note="ratio: 4:3 / 5:6">
      <View style={styles.row}>
        <WriteImg imageSource={SampleCover} ratio={WRITE_IMG_RATIO.FOUR_THREE} style={styles.writeImg} />
        <WriteImg imageSource={SampleCover} ratio={WRITE_IMG_RATIO.FIVE_SIX} style={styles.writeImg} />
      </View>
    </Specimen>

    <Specimen name="DividerLine" contentStyle={stretch}>
      <DividerLine />
    </Specimen>

    <Specimen name="FontFallbackText" note="교보체에 없는 한자는 Kiwi Maru 로 대체">
      <FontFallbackText style={styles.fallbackText}>몽글 夢 편지 書 2026</FontFallbackText>
    </Specimen>
  </CatalogSection>
);

// ── Content ───────────────────────────────────────────────
const ContentSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <CatalogSection title="Content">
      <Specimen name="ListHeader" note="size: S / M" contentStyle={stretch}>
        <ListHeader title="최근 기록" showIconButton onIconButtonPress={noop} />
        <ListHeader size="M" informativeText="몽글님의" title="보관함" />
      </Specimen>

      <Specimen name="Profile · Feed" note="variant: Ghost / Solid">
        <Profile username="mongle" onPress={noop} />
        <Profile username="mongle" variant={TEXT_BUTTON_VARIANT.SOLID} onPress={noop} />
      </Specimen>

      <Specimen name="Profile · Letter" note="nameSuffix: 에게 / 이가">
        <Profile type="Letter" recipientName="몽글" />
        <Profile type="Letter" recipientName="동글" nameSuffix="이가" />
      </Specimen>

      <Specimen name="MusicCard" note="font: KYOBO / SUIT · 재생 토글" contentStyle={stretch}>
        <MusicCard
          imageSource={SampleCover}
          title="노래 제목"
          artist="아티스트"
          isPlaying={isPlaying}
          onPressPlayback={() => setIsPlaying(value => !value)}
        />
        <MusicCard imageSource={SampleCover} title="Song Title" artist="Artist" font={FONT.SUIT} />
      </Specimen>

      <Specimen name="Stamp" note="grayscale">
        <View style={styles.rowWrap}>
          {STAMPS.slice(0, 6).map(stamp => (
            <Stamp key={stamp.id} stampCode={stamp.id} />
          ))}
          <Stamp stampCode={STAMPS[0].id} grayscale />
        </View>
      </Specimen>

      <Specimen name="Letter" note="type: front / back" contentStyle={stretch} dark>
        <Letter type="front" />
        <Letter type="back" StampSvg={STAMPS[0].SvgComponent} recipient="몽글" sender="동글" />
      </Specimen>

      {EMPTY_TYPES.map(type => (
        <Specimen key={type} name={`Empty · ${type}`} contentStyle={stretch}>
          <Empty
            type={type}
            title="아직 아무것도 없어요"
            body="첫 기록을 남겨보세요"
            buttonLabel={type === 'archive' ? '기록하기' : undefined}
            onButtonPress={noop}
          />
        </Specimen>
      ))}
    </CatalogSection>
  );
};

// ── Feedback ──────────────────────────────────────────────
const FeedbackSection = () => {
  const progress = useSharedValue(1);
  const spinning = useSharedValue(true);

  return (
    <CatalogSection title="Feedback">
      <Specimen name="Toast" note="icon: check / alert · buttonText" contentStyle={stretch} dark>
        <Toast contentKey="a" text="저장했어요" />
        <Toast contentKey="b" text="삭제했어요" buttonText="실행 취소" onPressButton={noop} />
        <Toast contentKey="c" text="문제가 생겼어요" icon="alert" iconColor={colors.fgCritical} />
      </Specimen>

      <Specimen name="RefreshSpinner" note="spinning">
        <RefreshSpinner progress={progress} spinning={spinning} />
      </Specimen>

      <Specimen name="LoadStateView" note="loading / error" contentStyle={stretch}>
        <LoadStateView isLoading style={styles.loadState} />
        <LoadStateView errorMessage="불러오지 못했어요" style={styles.loadState} />
      </Specimen>
    </CatalogSection>
  );
};

// ── Navigation ────────────────────────────────────────────
const NavigationSection = () => {
  const [topTab, setTopTab] = useState(SAMPLE_TOP_TABS[0].key);
  const [tabBarIndex, setTabBarIndex] = useState(0);
  const [tabsIndex, setTabsIndex] = useState(0);

  return (
    <CatalogSection title="Navigation">
      <Specimen name="TopNavigation" contentStyle={stretch}>
        <TopNavigation tabs={SAMPLE_TOP_TABS} activeTab={topTab} onChangeTab={setTopTab} onPressBell={noop} />
        <TopNavigation tabs={SAMPLE_TOP_TABS} activeTab={topTab} onChangeTab={setTopTab} showProfile onPressProfile={noop} />
      </Specimen>

      <Specimen name="TopIconNavigation" note="type: icon / text" contentStyle={stretch}>
        <TopIconNavigation onPressClose={noop} onPressShare={noop} onPressMore={noop} />
        <TopIconNavigation type="text" headerText="기록하기" onPressClose={noop} onPressNext={noop} />
        <TopIconNavigation type="text" headerText="장르 선택" showChevron onPressHeader={noop} isNextLoading />
      </Specimen>

      <Specimen name="TabBar" contentStyle={stretch}>
        <TabBar tabs={['기록', '편지']} activeIndex={tabBarIndex} onChange={setTabBarIndex} />
      </Specimen>

      <Specimen name="Tabs" note="넘치면 오른쪽 fade" contentStyle={stretch}>
        <Tabs
          tabs={['전체', '발라드', '힙합', '인디', 'R&B', '록', '재즈', '클래식']}
          activeIndex={tabsIndex}
          onChange={setTabsIndex}
        />
      </Specimen>
    </CatalogSection>
  );
};

export const COMPONENT_SECTIONS = [
  { key: 'action', label: 'Action', Component: ActionSection },
  { key: 'atomic', label: 'Atomic', Component: AtomicSection },
  { key: 'content', label: 'Content', Component: ContentSection },
  { key: 'feedback', label: 'Feedback', Component: FeedbackSection },
  { key: 'navigation', label: 'Navigation', Component: NavigationSection },
];

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.L,
  },

  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: gap.L,
  },

  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: gap.M,
  },

  writeImg: {
    width: 120,
  },

  fallbackText: {
    ...typo.kyoboTitleMedium,
    color: colors.fgNeutralPrimary,
  },

  loadState: {
    flex: 0,
    height: 48,
  },
});
