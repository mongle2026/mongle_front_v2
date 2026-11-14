import { useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import IlEmptyMusic from '../../assets/illustrations/il_empty_music.svg';
import IlEmptySuccessletter from '../../assets/illustrations/il_empty_successletter.svg';
import IlEmptyArchive from '../../assets/illustrations/il_empty_archive.svg';

import PageIndicator, { PAGE_INDICATOR_HEIGHT } from './components/PageIndicator';
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

// XL 버튼 높이 (위아래 padding.XL + suitBodyLarge600 줄 높이)
const BUTTON_XL_HEIGHT = padding.XL * 2 + typo.suitBodyLarge600.lineHeight;

// 버튼이 하나인 페이지에서 두 번째 버튼이 들어갈 자리. 이만큼은 스크롤 영역이 되어 스와이프가 된다
const SECOND_BUTTON_SPACE = BUTTON_XL_HEIGHT + gap.M;

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
    body: '받은 편지와 남긴 기록을\n편지함과 보관함에서 언제든 다시 꺼내 봐요.',
  },
];

const LAST_PAGE_INDEX = PAGES.length - 1;

const OnboardingScreen = () => {
  const navigation = useNavigation();
  const { width: pageWidth } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [pageIndex, setPageIndex] = useState(0);
  // 페이지마다 일러스트 + 텍스트 묶음의 아래 끝 y. 가장 아래 값 밑에 인디케이터를 둔다
  const [pageBodyBottoms, setPageBodyBottoms] = useState([]);
  const indicatorTop =
    pageBodyBottoms.length === PAGES.length
      ? Math.max(...pageBodyBottoms) + gap.XL
      : null;

  const handlePageBodyLayout = (index, { y, height }) => {
    setPageBodyBottoms(prev => {
      if (prev[index] === y + height) return prev;
      const next = [...prev];
      next[index] = y + height;
      return next;
    });
  };
  const completeOnboarding = useOnboardingStore(state => state.complete);

  const isLastPage = pageIndex === LAST_PAGE_INDEX;

  // 아래 padding으로 인디케이터 자리(gap + 높이)를 비워서 일러스트 · 텍스트 · 인디케이터 묶음이 가운데에 온다.
  // 버튼이 하나일 때는 스크롤 영역이 두 번째 버튼 자리만큼 길어지므로 그만큼 더 비워서, 페이지를 넘겨도 내용 위치가 그대로다
  const pagePaddingBottom =
    gap.XL + PAGE_INDICATOR_HEIGHT + (isLastPage ? 0 : SECOND_BUTTON_SPACE);

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

  // 로그인하지 않은 상태로 피드 홈으로 간다. 온보딩이 첫 화면이면 온보딩 자리를 MainTabs로 바꾼다.
  // 알림 권한 화면 없이 피드 홈에서 OS 알림 권한 창을 바로 띄운다 (useBrowseNotificationPermission)
  const handlePressBrowse = () => {
    void completeOnboarding();
    navigation.popTo('MainTabs', {
      screen: MAIN_TAB_ROUTES.FEED,
      params: { requestNotificationPermission: true },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
          {PAGES.map(({ Illustration, title, body }, index) => (
            <View
              key={title}
              style={[
                styles.page,
                {
                  width: pageWidth,
                  paddingTop: topInset,
                  paddingBottom: pagePaddingBottom,
                },
              ]}
            >
              <View
                style={styles.pageBody}
                onLayout={event => handlePageBodyLayout(index, event.nativeEvent.layout)}
              >
                <Illustration
                  width={ILLUSTRATION_SIZE}
                  height={ILLUSTRATION_SIZE}
                  color={colors.fgNeutralSecondary}
                />

                <View style={styles.textContainer}>
                  <Text style={styles.title}>{title}</Text>
                  <Text style={styles.body}>{body}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {indicatorTop !== null && (
          <PageIndicator
            total={PAGES.length}
            activeIndex={pageIndex}
            style={[styles.pageIndicator, { top: indicatorTop }]}
          />
        )}
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

  // 상태바부터 버튼 바로 위까지 전부. 버튼을 뺀 어디를 밀어도 페이지가 넘어간다
  content: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
  },

  pager: {
    flex: 1,
    alignSelf: 'stretch',
  },

  // 좌우 padding은 페이지마다 둔다 (content에 두면 넘기는 페이지가 양옆에서 잘린다)
  // 아래 padding(pagePaddingBottom)은 인라인으로 준다
  page: {
    paddingHorizontal: padding.XXL,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },

  pageBody: {
    alignSelf: 'stretch',
    flexDirection: 'column',
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
    ...typo.suitTitleLarge,
    alignSelf: 'stretch',
    color: colors.fgNeutralPrimary,
    textAlign: 'center',
  },

  body: {
    ...typo.suitBodyLarge400,
    alignSelf: 'stretch',
    color: colors.fgNeutralTertiary,
    textAlign: 'center',
  },

  // 페이지 위에 고정으로 띄운다. 터치는 통과시켜 인디케이터 위에서도 스와이프가 된다
  // PageIndicator 기본 alignSelf(flex-start)를 덮어써 가운데에 둔다
  pageIndicator: {
    position: 'absolute',
    alignSelf: 'center',
    pointerEvents: 'none',
  },

  // 높이는 실제 버튼만큼만 차지한다. 스크롤 영역과 겹치지 않아 버튼 위에서는 스와이프가 안 된다
  buttonContainer: {
    width: '100%',
    flexShrink: 0,
    paddingHorizontal: padding.L,
    paddingBottom: padding.L,
    flexDirection: 'column',
    alignItems: 'center',
    gap: gap.M,
  },

  // Button 기본 alignSelf(flex-start)를 덮어써 가로로 꽉 채운다
  button: {
    alignSelf: 'stretch',
  },
});

export default OnboardingScreen;
