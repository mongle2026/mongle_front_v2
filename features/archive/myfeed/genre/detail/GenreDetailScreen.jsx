import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import IcArrowLeft from '../../../../../assets/icons/ic_arrow_left.svg';

import ListControlBar from '../../../../../shared/components/action/ListControlBar';
import Menu from '../../../../../shared/components/action/menu/Menu';
import TopIconNavigation from '../../../../../shared/components/navigation/topnavigation/TopIconNavigation';
import useCurrentUser from '../../../../../shared/hooks/useCurrentUser';
import useFeedMusicPlayback from '../../../../../shared/hooks/useFeedMusicPlayback';
import { colors } from '../../../../../shared/styles/color';
import { gap, padding } from '../../../../../shared/styles/token';

import ShortPostCard from '../../../components/ShortPostCard';
import { toShortPost } from '../../utils/toShortPost';
import useGenreFeeds from './hooks/useGenreFeeds';

const SORT_OPTIONS = [
  { key: 'latest', label: '최신순' },
  { key: 'oldest', label: '오래된순' },
  { key: 'title', label: '제목순' },
];

const postKeyExtractor = post => String(post.feedId);

// 선택한 장르의 기록 목록. route.params.genre 로 장르 이름을 받는다.
const GenreDetailScreen = ({ navigation, route }) => {
  const genre = route?.params?.genre ?? '';
  const { userId } = useCurrentUser();
  const insets = useSafeAreaInsets();

  const [sortKey, setSortKey] = useState(SORT_OPTIONS[0].key);
  const { feeds, isFetchingNextPage, hasNextPage, fetchNextPage } = useGenreFeeds({ userId, genre, sort: sortKey });

  const posts = useMemo(() => feeds.map(toShortPost), [feeds]);

  const { playingFeedId, handlePressPlayback } = useFeedMusicPlayback({ navigation });

  const handlePressPost = useCallback(
    feedId => navigation.navigate('FeedDetail', { feedId }),
    [navigation],
  );

  const renderPost = useCallback(({ item: post }) => (
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
      style={styles.card}
    />
  ), [playingFeedId, handlePressPlayback, handlePressPost]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handlePressBack = useCallback(() => navigation?.goBack(), [navigation]);

  // 하단 edge는 SafeAreaView에서 빼두었으니 마지막 카드가 Android 내비게이션 바에 가리지 않게 inset만큼 더 띄운다
  const containerStyle = useMemo(
    () => [styles.container, { paddingBottom: padding.XXL + insets.bottom }],
    [insets.bottom],
  );

  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  // 메뉴를 ListControlBar 바로 밑에 두기 위한 ListControlBar 아래쪽 y
  const [sortMenuTop, setSortMenuTop] = useState(0);

  // ListControlBar가 리스트 헤더로 같이 스크롤되므로, 메뉴를 열 때 리스트 위치·헤더 높이·스크롤 오프셋으로 위치를 계산한다
  const listTopRef = useRef(0);
  const controlBarHeightRef = useRef(0);
  const scrollOffsetRef = useRef(0);

  const sortLabel = SORT_OPTIONS.find(option => option.key === sortKey)?.label ?? '';

  const openSortMenu = useCallback(() => {
    setSortMenuTop(listTopRef.current + controlBarHeightRef.current - scrollOffsetRef.current);
    setIsSortMenuOpen(true);
  }, []);
  const closeSortMenu = useCallback(() => setIsSortMenuOpen(false), []);

  const handleListLayout = useCallback(e => {
    listTopRef.current = e.nativeEvent.layout.y;
  }, []);

  const handleControlBarLayout = useCallback(e => {
    controlBarHeightRef.current = e.nativeEvent.layout.height;
  }, []);

  const handleScroll = useCallback(e => {
    scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  const listHeader = useMemo(() => (
    <View onLayout={handleControlBarLayout}>
      <ListControlBar text={sortLabel} onPress={openSortMenu} />
    </View>
  ), [handleControlBarLayout, sortLabel, openSortMenu]);

  const sortMenuItems = useMemo(
    () => SORT_OPTIONS.map(option => ({
      key: option.key,
      label: option.label,
      onPress: () => {
        setSortKey(option.key);
        setIsSortMenuOpen(false);
      },
    })),
    [],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <TopIconNavigation
          type="text"
          leftIcon={IcArrowLeft}
          leftAccessibilityLabel="뒤로가기"
          headerText={genre}
          showNext={false}
          onPressClose={handlePressBack}
          style={styles.topNavigation}
        />

        <FlatList
          data={posts}
          keyExtractor={postKeyExtractor}
          renderItem={renderPost}
          ListHeaderComponent={listHeader}
          ListHeaderComponentStyle={styles.listHeader}
          onLayout={handleListLayout}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          contentContainerStyle={containerStyle}
        />

        {/* 메뉴가 열리면 화면 전체(헤더·ListControlBar 포함)를 덮는 레이어를 깔아 바깥 어디를 눌러도 닫는다 */}
        {isSortMenuOpen && (
          <>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSortMenu} />
            <Menu items={sortMenuItems} style={[styles.sortMenu, { top: sortMenuTop }]} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgLayerBasement,
  },
  topNavigation: {
    backgroundColor: colors.bgLayerBasement,
  },
  // SafeAreaView의 paddingTop 영향 없이 onLayout y를 그대로 메뉴 top으로 쓰기 위한 래퍼
  content: {
    flex: 1,
  },
  sortMenu: {
    position: 'absolute',
    right: padding.L,
  },
  // ListControlBar는 자체 좌우 패딩이 있어서 컨테이너엔 좌우·상단 패딩을 두지 않고 카드에 좌우 여백을 준다
  container: {
    paddingBottom: padding.XXL,
    flexDirection: 'column',
    // FlatList는 카드마다 셀 View로 감싼다. flex-start면 셀이 카드 폭(320)으로 줄어들어서 stretch로 둔다
    alignItems: 'stretch',
    gap: gap.M,
    alignSelf: 'stretch',
  },
  // 헤더 뒤에도 gap이 붙으므로, ListControlBar와 첫 카드 사이가 기존처럼 padding.L이 되도록 모자란 만큼만 더한다
  listHeader: {
    marginBottom: padding.L - gap.M,
  },
  card: {
    // ShortPostCard 기본 폭(320)을 풀어 화면 폭에 맞춘다
    width: 'auto',
    marginHorizontal: padding.L,
  },
});

export default memo(GenreDetailScreen);
