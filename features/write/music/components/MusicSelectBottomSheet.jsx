import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import BottomSheet, {
  BottomSheetFlatList,
} from '../../../../shared/components/overlay/BottomSheet';
import SearchField from '../../../../shared/components/action/Searchfield';
import ListHeader from '../../../../shared/components/content/ListHeader';
import Empty from '../../../../shared/components/content/Empty';

import { colors } from '../../../../shared/styles/color';
import { padding } from '../../../../shared/styles/token';

import ListRow, {
  LIST_ROW_TYPE,
} from '../../components/ListRow';

import useSelectMusic from '../../music/hooks/useSelectMusic';

const MusicSelectBottomSheet = ({
  onClose,
}) => {
  const {
    keyword,
    musicList,

    loading,
    loadingMore,
    hasNextPage,

    selectedMusicId,

    handleChangeKeyword,
    handleSelectMusic,
    handleLoadMore,
  } = useSelectMusic(onClose);

  const isSearching =
    keyword.trim().length > 0;

  const renderItem = ({
    item,
  }) => {
    const isSelected =
      String(selectedMusicId) ===
      String(item.externalId);

    return (
      <ListRow
        type={LIST_ROW_TYPE.MUSIC}
        imageUri={item.musicArtwork}
        title={item.musicTitle}
        artist={item.musicArtist}
        isPressed={isSelected}
        onPress={() =>
          handleSelectMusic(
            item.externalId,
          )
        }
      />
    );
  };

  const renderFooter = () => {
    if (!loadingMore) {
      return null;
    }

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator
          color={colors.fgNeutralMuted}
        />
      </View>
    );
  };

  return (
    <BottomSheet
      onClose={onClose}
    >
      <SearchField
        value={keyword}
        onChangeText={handleChangeKeyword}
        placeholder="기록할 음악을 검색해 주세요."
        returnKeyType="search"
        autoCorrect={false}
      />

      {!isSearching && (
        <ListHeader
          size="S"
          title="Apple Music 인기곡 Top 10"
        />
      )}

      <BottomSheetFlatList
        data={musicList}
        keyExtractor={(item) =>
          String(item.externalId)
        }
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (
            isSearching &&
            hasNextPage &&
            !loadingMore
          ) {
            handleLoadMore();
          }
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                color={colors.fgNeutralMuted}
              />
            </View>
          ) : isSearching ? (
            <Empty
              type="music"
              title="일치하는 음악이 없습니다."
              body="노래 제목이나 가수를 다시 확인해 주세요."
            />
          ) : null
        }
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
      />
    </BottomSheet>
  );
};

export default MusicSelectBottomSheet;

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },

  loadingContainer: {
    flex: 1,
    paddingVertical: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingMore: {
    width: '100%',
    paddingVertical: padding.XL,
    justifyContent: 'center',
    alignItems: 'center',
  },
});