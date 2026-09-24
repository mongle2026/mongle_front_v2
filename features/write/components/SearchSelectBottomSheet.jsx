import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import BottomSheet, {
  BottomSheetFlatList,
} from '../../../shared/components/overlay/BottomSheet';
import SearchField, {
  SEARCH_FIELD_BOTTOM_FADE_HEIGHT,
} from '../../../shared/components/action/SearchField';
import Empty from '../../../shared/components/content/Empty';
import useCollapseOnScroll from '../../../shared/hooks/useCollapseOnScroll';

import { colors } from '../../../shared/styles/color';
import { padding } from '../../../shared/styles/token';

/**
 * 검색해서 하나를 고르는 BottomSheet (음악 선택 / 수신인 선택).
 * 검색창 · 목록 · 로딩 · 검색 결과 없음 · 무한 스크롤을 그리고,
 * 목록 한 줄(renderItem)과 데이터는 쓰는 쪽에서 넘긴다.
 *
 * @param {string} keyword
 * @param {(text: string) => void} onChangeKeyword
 * @param {string} placeholder 검색창 placeholder
 * @param {React.ReactNode} [header] 검색어가 없을 때 목록 위에 보여줄 영역
 * @param {object} empty 검색 결과가 없을 때 Empty 에 넘길 { type, title, body }
 */
const SearchSelectBottomSheet = ({
  onClose,

  keyword,
  onChangeKeyword,
  placeholder,
  header = null,

  data,
  keyExtractor,
  renderItem,

  loading,
  loadingMore,
  hasNextPage,
  onLoadMore,

  empty,
}) => {
  const isSearching = keyword.trim().length > 0;
  const showHeader = !isSearching && !!header;

  // 검색어가 없을 때만 아래로 스크롤하면 검색창을 접습니다.
  const {
    collapsed: isSearchFieldCollapsed,
    scrollEventsHandlersHook,
  } = useCollapseOnScroll({
    enabled: keyword.length === 0,
  });

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator color={colors.fgNeutralMuted} />
      </View>
    );
  };

  return (
    <BottomSheet onClose={onClose}>
      <SearchField
        value={keyword}
        onChangeText={onChangeKeyword}
        placeholder={placeholder}
        collapsed={isSearchFieldCollapsed}
        returnKeyType="search"
        autoCorrect={false}
      />

      {showHeader && (
        <View
          style={[
            styles.underSearchFieldFade,
            styles.fadeInset,
          ]}
        >
          {header}
        </View>
      )}

      <BottomSheetFlatList
        style={!showHeader && styles.underSearchFieldFade}
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        scrollEventsHandlersHook={scrollEventsHandlersHook}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (isSearching && hasNextPage && !loadingMore) {
            onLoadMore();
          }
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.fgNeutralMuted} />
            </View>
          ) : isSearching ? (
            <Empty
              type={empty.type}
              title={empty.title}
              body={empty.body}
            />
          ) : null
        }
        ListFooterComponent={renderFooter}
        contentContainerStyle={[
          styles.listContent,
          !showHeader && styles.fadeInset,
        ]}
      />
    </BottomSheet>
  );
};

export default SearchSelectBottomSheet;

const styles = StyleSheet.create({
  // 검색창 바로 아래 요소는 검색창 하단 그라데이션 밑으로 들어가도록
  // 그 높이만큼 끌어올리고, 처음 위치는 같은 만큼의 안쪽 여백으로 되돌린다
  underSearchFieldFade: {
    marginTop: -SEARCH_FIELD_BOTTOM_FADE_HEIGHT,
  },
  fadeInset: {
    paddingTop: SEARCH_FIELD_BOTTOM_FADE_HEIGHT,
  },
  listContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    paddingVertical: padding.XL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMore: {
    width: '100%',
    paddingVertical: padding.L,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
