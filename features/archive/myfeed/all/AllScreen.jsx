import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import IcArrowLeft from '../../../../assets/icons/ic_arrow_left.svg';

import SearchField, { SEARCH_FIELD_BOTTOM_FADE_HEIGHT } from '../../../../shared/components/action/SearchField';
import TopIconNavigation from '../../../../shared/components/navigation/topnavigation/TopIconNavigation';
import useCollapseOnScroll from '../../../../shared/hooks/useCollapseOnScroll';
import useCurrentUser from '../../../../shared/hooks/useCurrentUser';
import useFeedMusicPlayback from '../../../../shared/hooks/useFeedMusicPlayback';
import { useGlobalOverlay } from '../../../../shared/providers/GlobalOverlayProvider';
import { colors } from '../../../../shared/styles/color';
import { gap, padding } from '../../../../shared/styles/token';

import { archiveKeys } from '../../api/archiveKeys';
import ShortPostCard from '../../components/ShortPostCard';
import { formatMonthLabel } from '../utils/formatMonthLabel';
import { toKstMonth } from '../utils/toKstMonth';
import { toShortPost } from '../utils/toShortPost';
import MonthSelectBottomSheet from './components/MonthSelectBottomSheet';
import useAllMyFeeds from './hooks/useAllMyFeeds';
import useMyFeedMonths from './hooks/useMyFeedMonths';

const SEARCH_PLACEHOLDER = '음악, 제목, 아티스트를 검색해 보세요.';
const MONTH_SELECT_OVERLAY_ID = 'archive-month-select';

// 스크롤이 목록 끝(위/아래)에서 화면 높이의 이 비율 안으로 들어오면 다음 페이지를 불러온다
const END_REACHED_THRESHOLD = 0.5;

// 위에 더 최근 글이 붙어도 보고 있던 카드가 그 자리에 있도록
const MAINTAIN_VISIBLE_CONTENT_POSITION = { minIndexForVisible: 0 };

// 절반 이상 보이는 첫 카드의 달을 제목으로
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 50 };

// 글 목록 → 카드 한 장씩 (최신순, 한국 시간 기준 달).
// 달이 바뀌는 자리는 카드 아래 간격을 넓혀 달을 구분한다.
// 간격을 아래쪽에 두어야 위에 페이지가 붙을 때 보고 있던 카드의 위치가 바뀌지 않는다
const toRows = feeds => {
  const months = feeds.map(feed => toKstMonth(feed.createdAt));

  return feeds.map((feed, index) => ({
    key: String(feed.feedId),
    month: months[index],
    isLast: index === feeds.length - 1,
    isMonthEnd: index < feeds.length - 1 && months[index + 1] !== months[index],
    post: toShortPost(feed),
  }));
};

const rowKeyExtractor = row => row.key;

// 모든 기록. 최신 달부터 카드를 나열하고, 달이 바뀌는 곳은 간격을 넓혀 구분한다.
// route.params.month('YYYY-MM')로 들어오거나 BottomSheet에서 달을 고르면 중간 글을 건너뛰고 그 달부터 새로 불러온다
// (그 달이 맨 위, 위로 스크롤하면 더 최근 글, 아래로 스크롤하면 더 오래된 글).
// 제목은 화면 맨 위에 보이는 카드의 달 (전체로 들어오면 가장 최근에 글을 쓴 달). 제목을 누르면 달을 고르는 BottomSheet가 뜬다
const AllScreen = ({ navigation, route }) => {
  const { userId } = useCurrentUser();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');

  // 검색어가 없을 때만 아래로 스크롤하면 검색창을 접습니다.
  const {
    collapsed: isSearchFieldCollapsed,
    scrollHandler,
  } = useCollapseOnScroll({
    enabled: keyword.length === 0,
  });

  const { months, isMonthsLoading } = useMyFeedMonths({ userId });

  // 이동한 달. null 이면 가장 최근 글부터
  const [selectedMonth, setSelectedMonth] = useState(route?.params?.month ?? null);

  // 목록을 시작할 달과 커서. 가장 최근 달이거나 목록에 없는 달(그 사이 글이 지워짐 등)이면 처음부터
  const anchor = useMemo(() => {
    if (!selectedMonth) return { month: null, isReady: true };
    if (isMonthsLoading) return { month: null, isReady: false };

    const index = months.findIndex(item => item.month === selectedMonth);
    const latestFeedId = months[index]?.latestFeedId;
    if (index <= 0 || !Number.isInteger(latestFeedId)) return { month: null, isReady: true };

    return { month: selectedMonth, cursor: latestFeedId + 1, isReady: true };
  }, [selectedMonth, isMonthsLoading, months]);

  const {
    feeds,
    isFetchingNextPage,
    isFetchingPreviousPage,
    hasNextPage,
    hasPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
  } = useAllMyFeeds({
    userId,
    anchorMonth: anchor.month,
    anchorCursor: anchor.cursor,
    enabled: anchor.isReady,
  });

  const rows = useMemo(() => toRows(feeds), [feeds]);

  const listRef = useRef(null);

  // 화면 맨 위에 보이는 카드의 달
  const [visibleMonth, setVisibleMonth] = useState(null);

  // FlatList 는 onViewableItemsChanged 가 바뀌는 걸 허용하지 않아 처음 만든 함수를 계속 쓴다
  const handleViewableItemsChanged = useRef(({ viewableItems }) => {
    const topMonth = viewableItems[0]?.item?.month;
    if (topMonth) setVisibleMonth(topMonth);
  }).current;

  // 달을 새로 고를 때마다 올려서 목록을 맨 위로 돌린다
  const [jumpVersion, setJumpVersion] = useState(0);

  useEffect(() => {
    if (jumpVersion === 0) return;
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [jumpVersion]);

  const headerMonth = visibleMonth ?? selectedMonth ?? rows[0]?.month;
  const headerText = headerMonth ? formatMonthLabel(headerMonth) : '';

  const { openOverlay } = useGlobalOverlay();

  const handleSelectMonth = useCallback(month => {
    const nextAnchorMonth = month === months[0]?.month ? null : month;

    // 같은 달을 다시 고르면 key 가 그대로라 캐시(위로 불러온 페이지 포함)를 비우고 그 달부터 다시 불러온다
    if (nextAnchorMonth === anchor.month) {
      queryClient.resetQueries({
        queryKey: archiveKeys.allMyFeeds(userId, nextAnchorMonth ?? 'all'),
        exact: true,
      });
    }

    setSelectedMonth(month);
    setVisibleMonth(null);
    setJumpVersion(version => version + 1);
  }, [months, anchor.month, queryClient, userId]);

  const handlePressHeader = useCallback(() => {
    if (months.length === 0) return;

    openOverlay({
      id: MONTH_SELECT_OVERLAY_ID,
      accessibilityLabel: '달 선택 닫기',
      contentContainerStyle: styles.monthSelectOverlay,
      renderContent: ({ close }) => (
        <MonthSelectBottomSheet
          months={months.map(item => item.month)}
          onSelectMonth={month => {
            close();
            handleSelectMonth(month);
          }}
          onClose={close}
        />
      ),
    });
  }, [months, openOverlay, handleSelectMonth]);

  const { playingFeedId, handlePressPlayback } = useFeedMusicPlayback({ navigation });

  const handlePressPost = useCallback(
    feedId => navigation.navigate('FeedDetail', { feedId }),
    [navigation],
  );

  const renderRow = useCallback(({ item: row }) => {
    const { post } = row;

    return (
      <ShortPostCard
        feedId={post.feedId}
        onPress={() => handlePressPost(post.feedId)}
        music={post.music}
        isPlaying={playingFeedId === String(post.feedId)}
        onPressPlayback={handlePressPlayback}
        font={post.font}
        content={post.content}
        imageSources={post.imageSources}
        date={post.date}
        style={[styles.card, !row.isLast && (row.isMonthEnd ? styles.monthEndCard : styles.cardSpacing)]}
      />
    );
  }, [playingFeedId, handlePressPlayback, handlePressPost]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleStartReached = useCallback(() => {
    if (hasPreviousPage && !isFetchingPreviousPage) {
      fetchPreviousPage();
    }
  }, [hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage]);

  const handlePressBack = useCallback(() => navigation?.goBack(), [navigation]);

  // 하단 edge는 SafeAreaView에서 빼두었으니 마지막 카드가 Android 내비게이션 바에 가리지 않게 inset만큼 더 띄운다
  const containerStyle = useMemo(
    () => [styles.container, { paddingBottom: padding.XXL + insets.bottom }],
    [insets.bottom],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopIconNavigation
        type="text"
        leftIcon={IcArrowLeft}
        leftAccessibilityLabel="뒤로가기"
        headerText={headerText}
        showChevron
        showNext={false}
        onPressClose={handlePressBack}
        onPressHeader={handlePressHeader}
        style={styles.topNavigation}
      />

      <SearchField
        value={keyword}
        onChangeText={setKeyword}
        placeholder={SEARCH_PLACEHOLDER}
        backgroundColor={colors.bgLayerBasement}
        fieldBackgroundColor={colors.bgNeutralFaintPressed}
        collapsed={isSearchFieldCollapsed}
        returnKeyType="search"
        autoCorrect={false}
      />

      <Animated.FlatList
        ref={listRef}
        data={rows}
        keyExtractor={rowKeyExtractor}
        renderItem={renderRow}
        extraData={playingFeedId}
        onEndReached={handleEndReached}
        onEndReachedThreshold={END_REACHED_THRESHOLD}
        onStartReached={handleStartReached}
        onStartReachedThreshold={END_REACHED_THRESHOLD}
        maintainVisibleContentPosition={anchor.month ? MAINTAIN_VISIBLE_CONTENT_POSITION : undefined}
        onScroll={scrollHandler}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        initialNumToRender={8}
        windowSize={11}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={styles.list}
        contentContainerStyle={containerStyle}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgLayerBasement,
  },
  // BottomSheet를 화면 전체 위에 띄운다
  monthSelectOverlay: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
  },
  topNavigation: {
    backgroundColor: colors.bgLayerBasement,
  },
  // 목록이 검색창 하단 그라데이션 밑으로 들어가도록 그 높이만큼 끌어올린다 (패딩으로 처음 위치는 되돌림)
  list: {
    marginTop: -SEARCH_FIELD_BOTTOM_FADE_HEIGHT,
  },
  container: {
    paddingTop: SEARCH_FIELD_BOTTOM_FADE_HEIGHT + padding.L,
    paddingHorizontal: padding.L,
    paddingBottom: padding.XXL,
  },
  card: {
    // ShortPostCard 기본 폭(320)을 풀어 화면 폭에 맞춘다
    width: 'auto',
    alignSelf: 'stretch',
  },
  // 같은 달 카드 사이
  cardSpacing: {
    marginBottom: gap.M,
  },
  // 달 구분
  monthEndCard: {
    marginBottom: gap.XXL,
  },
});

export default memo(AllScreen);
