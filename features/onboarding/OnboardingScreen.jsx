import { useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import IlEmptyMusic from '../../assets/illustrations/il_empty_music.svg';
import IlEmptySuccessletter from '../../assets/illustrations/il_empty_successletter.svg';
import IlEmptyArchive from '../../assets/illustrations/il_empty_archive.svg';

import PageIndicator from './components/PageIndicator';
import { useOnboardingStore } from './useOnboardingStore';
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from '../../shared/components/action/Button';
import { MAIN_TAB_ROUTES } from '../../shared/components/navigation/bottomnavigation/routeNames';

import { colors } from '../../shared/styles/color';
import { typo } from '../../shared/styles/typo';
import { FONT } from '../../shared/styles/fontType';
import { gap, padding } from '../../shared/styles/token';

const ILLUSTRATION_SIZE = 200;

// XL 버튼 높이 (위아래 padding.XL + suitLabelXLargeStrong 줄 높이)
const BUTTON_XL_HEIGHT = padding.XL * 2 + typo.suitLabelXLargeStrong.lineHeight;

// 버튼이 하나인 페이지도 마지막 페이지처럼 버튼 두 개 높이를 차지해서, 페이지를 넘겨도 content 영역 높이가 그대로다
const BUTTON_CONTAINER_HEIGHT = BUTTON_XL_HEIGHT * 2 + gap.M + padding.L;

const PAGES = [
  {
    Illustration: IlEmptyMusic,
    title: '노래 한 곡에 오늘을 담아요',
    body: '그날 듣던 음악과 함께 기록을 남기면\n다시 들을 때마다 그때가 떠올라요.',
  },
  {
    Illustration: IlEmptySuccessletter,
    title: '편지가 도착할 날을 정할 수 있어요',
    body: '작성한 마음을 원하는 날에 전해요.\n미래의 나에게 보낼 수도 있어요.',
  },
  {
    Illustration: IlEmptyArchive,
    title: '주고받은 마음은 차곡차곡 모여요',
    body: '받은 편지와 남긴 기록을\n편지함과 보관함에서 언제든 다시 꺼내봐요',
  },
];

const LAST_PAGE_INDEX = PAGES.length - 1;

const OnboardingScreen = () => {
  const navigation = useNavigation();
  const { width: pageWidth } = useWindowDimensions();
  const scrollRef = useRef(null);
  const [pageIndex, setPageIndex] = useState(0);
  const completeOnboarding = useOnboardingStore(state => state.complete);

  const isLastPage = pageIndex === LAST_PAGE_INDEX;

  // 넘기는 도중에도 절반을 지나면 인디케이터 · 버튼이 다음 페이지 것으로 바뀐다
  const handleScroll = event => {
    const index = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    setPageIndex(Math.min(Math.max(index, 0), LAST_PAGE_INDEX));
  };

  const handlePressNext = () => {
    scrollRef.current?.scrollTo({ x: (pageIndex + 1) * pageWidth, animated: true });
  };

  // 마지막 페이지의 두 버튼 중 하나를 누르면 다 본 것으로 저장해서, 다음 실행부터는 바로 피드 홈이 뜬다
  // 온보딩을 빼고 피드 홈 위에 Welcome을 올려서, Welcome에서 닫거나 뒤로 가면 피드 홈으로 간다
  // 온보딩에서 바로 가입하면 가입 완료 Toast 를 띄우지 않도록 표시해 둔다
  const handlePressLogin = () => {
    void completeOnboarding();
    navigation.reset({
      index: 1,
      routes: [
        { name: 'MainTabs', params: { screen: MAIN_TAB_ROUTES.FEED } },
        { name: 'Welcome', params: { isFromOnboarding: true } },
      ],
    });
  };

  // 로그인하지 않은 상태로 피드 홈으로 간다. 온보딩이 첫 화면이면 온보딩 자리를 MainTabs로 바꾼다
  const handlePressBrowse = () => {
    void completeOnboarding();
    navigation.popTo('MainTabs', { screen: MAIN_TAB_ROUTES.FEED });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          scrollEventThrottle={16}
          onScroll={handleScroll}
          style={styles.pager}
        >
          {PAGES.map(({ Illustration, title, body }) => (
            <View key={title} style={[styles.page, { width: pageWidth }]}>
              <Illustration width={ILLUSTRATION_SIZE} height={ILLUSTRATION_SIZE} />

              <View style={styles.textContainer}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.body}>{body}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <PageIndicator
          total={PAGES.length}
          activeIndex={pageIndex}
          style={styles.pageIndicator}
        />
      </View>

      <View style={styles.buttonContainer}>
        {isLastPage ? (
          <>
            <Button
              variant={BUTTON_VARIANT.GHOST}
              size={BUTTON_SIZE.XL}
              font={FONT.SUIT}
              onPress={handlePressLogin}
              style={styles.button}
            >
              로그인하기
            </Button>
            <Button
              variant={BUTTON_VARIANT.SOLID}
              size={BUTTON_SIZE.XL}
              font={FONT.SUIT}
              onPress={handlePressBrowse}
              style={styles.button}
            >
              로그인 없이 이용하기
            </Button>
          </>
        ) : (
          <Button
            variant={BUTTON_VARIANT.SOLID}
            size={BUTTON_SIZE.XL}
            font={FONT.SUIT}
            onPress={handlePressNext}
            style={styles.button}
          >
            다음
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },

  // buttonContainer를 뺀 나머지 높이를 채우고 그 가운데에 내용을 둔다
  content: {
    width: '100%',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap.XL,
  },

  // ScrollView 기본 flexGrow를 꺼서 높이는 페이지 내용만큼만, 너비는 화면 끝까지 넘어가게 채운다
  pager: {
    flexGrow: 0,
    alignSelf: 'stretch',
  },

  // 좌우 padding은 페이지마다 둔다 (content에 두면 넘기는 페이지가 양옆에서 잘린다)
  page: {
    paddingHorizontal: padding.XXL,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap.XL,
  },

  textContainer: {
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'center',
    gap: gap.M,
  },

  title: {
    ...typo.suitTitleXLargeStrong,
    alignSelf: 'stretch',
    color: colors.fgNeutralPrimary,
    textAlign: 'center',
  },

  body: {
    ...typo.suitBodyXLarge,
    alignSelf: 'stretch',
    color: colors.fgNeutralTertiary,
    textAlign: 'center',
  },

  // PageIndicator 기본 alignSelf(flex-start)를 덮어써 가운데에 둔다
  pageIndicator: {
    alignSelf: 'center',
  },

  // 버튼이 하나일 때는 justifyContent: 'flex-end'로 아래에 붙는다
  buttonContainer: {
    width: '100%',
    height: BUTTON_CONTAINER_HEIGHT,
    flexShrink: 0,
    paddingHorizontal: padding.L,
    paddingBottom: padding.L,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: gap.M,
  },

  // Button 기본 alignSelf(flex-start)를 덮어써 가로로 꽉 채운다
  button: {
    alignSelf: 'stretch',
  },
});

export default OnboardingScreen;
