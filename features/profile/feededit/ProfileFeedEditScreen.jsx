import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import IcArrowLeft from '../../../assets/icons/ic_arrow_left.svg';
import IcArrowUpRight from '../../../assets/icons/ic_arrow_up_right.svg';

import TopSubNavigation from '../../../shared/components/navigation/topnavigation/TopSubNavigation';
import IconButton from '../../../shared/components/action/IconButton';
import useCurrentUser from '../../../shared/hooks/useCurrentUser';
import { colors } from '../../../shared/styles/color';
import { gap, padding, radius } from '../../../shared/styles/token';
import { chunk } from '../../../shared/utils/arrayUtils';

import CheckButton from '../components/CheckButton';
import ProfileMusicCard, { ProfileMusicCardSpacer } from '../components/ProfileMusicCard';

import useProfileFeedEditCovers from './hooks/useProfileFeedEditCovers';
import useUpdateProfileFeeds from './hooks/useUpdateProfileFeeds';

const HEADER_TEXT = '게시글 편집';
const NEXT_TEXT = '확인';

const COLUMN_COUNT = 2;
const END_REACHED_THRESHOLD = 0.5;

const keyExtractor = row => String(row[0].feedId);

const RowSeparator = () => <View style={styles.rowSeparator} />;

// 저장된 값(프로필에 보이는지)에 이번에 바꾼 값을 덮어 체크 여부를 정한다
const isCoverSelected = (cover, changedSelections) =>
  changedSelections.has(cover.feedId)
    ? changedSelections.get(cover.feedId)
    : !cover.profileHidden;

// 프로필에 보일 내 게시글을 고르는 화면. ProfileScreen 과 같이 한 줄에 두 개씩 보여준다.
// 따로 빼지 않은 글은 모두 프로필에 보이므로 처음에는 체크된 상태로 시작한다
const ProfileFeedEditScreen = () => {
  const navigation = useNavigation();
  const { userId } = useCurrentUser();
  const { covers, hasNextPage, isFetchingNextPage, fetchNextPage } = useProfileFeedEditCovers({ userId });
  const { updateProfileFeeds, isUpdatingProfileFeeds } = useUpdateProfileFeeds({
    userId,
    onSuccess: navigation.goBack,
  });

  const coverRows = useMemo(() => chunk(covers, COLUMN_COUNT), [covers]);

  // 저장된 값과 다르게 바꾼 글만 담는다 (feedId → 체크 여부).
  // 목록을 끝까지 불러오지 않아도 바꾼 글만 보내면 되도록 전체 선택 목록 대신 바뀐 것만 둔다
  const [changedSelections, setChangedSelections] = useState(() => new Map());

  // 바꾼 게시글이 있을 때만 확인을 누를 수 있다
  const canSubmit = changedSelections.size > 0 && !isUpdatingProfileFeeds;

  const handleToggleSelect = useCallback(cover => {
    setChangedSelections(prev => {
      const next = new Map(prev);
      const nextSelected = !isCoverSelected(cover, prev);

      // 저장된 값으로 되돌렸으면 바꾼 목록에서 뺀다
      if (nextSelected === !cover.profileHidden) {
        next.delete(cover.feedId);
      } else {
        next.set(cover.feedId, nextSelected);
      }
      return next;
    });
  }, []);

  const handlePressNext = useCallback(() => {
    if (!canSubmit) return;

    const showFeedIds = [];
    const hideFeedIds = [];

    changedSelections.forEach((selected, feedId) => {
      (selected ? showFeedIds : hideFeedIds).push(feedId);
    });

    updateProfileFeeds({ showFeedIds, hideFeedIds });
  }, [canSubmit, changedSelections, updateProfileFeeds]);

  // 카드 우하단 버튼: 그 게시글 상세로 간다
  const handlePressFeed = useCallback(
    feedId => navigation.navigate('FeedDetail', { feedId }),
    [navigation],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderRow = useCallback(({ item: row }) => (
    <View style={styles.coverRow}>
      {row.map(cover => {
        const selected = isCoverSelected(cover, changedSelections);

        return (
          <ProfileMusicCard
            key={cover.feedId}
            imageSource={cover.imageSource}
            title={cover.title}
            style={styles.card}
          >
            {/* 카드 어디를 눌러도 체크가 바뀐다. 위에 올라간 CheckButton·IconButton 은 자기 터치를 먼저 받는다.
                스크린리더는 CheckButton 으로 체크하므로 이 영역은 읽지 않는다 */}
            <Pressable
              accessible={false}
              onPress={() => handleToggleSelect(cover)}
              style={styles.cardPressArea}
            />

            {/* 테두리를 카드에 직접 주면 체크할 때마다 커버 크기가 바뀌어 다시 그려지므로, 커버 위에 겹쳐 그린다 */}
            {selected && <View pointerEvents="none" style={styles.selectedBorder} />}

            <CheckButton
              selected={selected}
              onPress={() => handleToggleSelect(cover)}
              accessibilityLabel={`${cover.title || '게시글'} 선택`}
            />

            <IconButton
              icon={IcArrowUpRight}
              size="M"
              color={colors.fgNeutralInverted}
              accessibilityLabel={`${cover.title || '게시글'} 보러 가기`}
              style={styles.arrowUpButton}
              onPress={() => handlePressFeed(cover.feedId)}
            />
          </ProfileMusicCard>
        );
      })}
      {/* 마지막 줄이 한 개뿐이어도 카드가 반 폭을 유지하도록 빈 칸을 채운다 */}
      {row.length < COLUMN_COUNT && <ProfileMusicCardSpacer />}
    </View>
  ), [changedSelections, handleToggleSelect, handlePressFeed]);

  return (
    <SafeAreaView style={styles.screen}>
      <TopSubNavigation
        type="text"
        leftIcon={IcArrowLeft}
        leftAccessibilityLabel="뒤로가기"
        headerText={HEADER_TEXT}
        nextText={NEXT_TEXT}
        onPressClose={navigation.goBack}
        onPressNext={handlePressNext}
        nextTextStyle={{
          color: canSubmit ? colors.fgNeutralSecondary : colors.fgDisabled,
        }}
      />

      <FlatList
        data={coverRows}
        keyExtractor={keyExtractor}
        renderItem={renderRow}
        extraData={changedSelections}
        ItemSeparatorComponent={RowSeparator}
        onEndReached={handleEndReached}
        onEndReachedThreshold={END_REACHED_THRESHOLD}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgSurface,
  },

  // alignItems: 'flex-start'를 주면 FlatList 셀이 내용 폭으로 줄어 카드 폭이 0이 되므로 기본값(stretch)을 쓴다 (ProfileScreen 과 동일)
  container: {
    paddingHorizontal: padding.L,
    paddingTop: padding.M,
    paddingBottom: padding.XXL,
    flexDirection: 'column',
    borderRadius: radius.S,
  },

  coverRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: gap.M,
    alignSelf: 'stretch',
  },

  // CheckButton 은 우상단, 위로 버튼은 우하단
  card: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  // 카드 전체를 덮는 체크 터치 영역
  cardPressArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // 체크된 카드에만 테두리. 카드(ProfileMusicCard)와 같은 radius 로 카드 전체를 덮는다
  selectedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.M,
    borderWidth: 1.5,
    borderColor: colors.strokeNeutralTertiary,
  },

  arrowUpButton: {
    borderRadius: radius.S,
    backgroundColor: colors.bgDimmed,
  },

  rowSeparator: {
    height: gap.M,
  },
});

export default ProfileFeedEditScreen;
