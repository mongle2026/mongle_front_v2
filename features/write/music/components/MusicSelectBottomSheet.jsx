import React from 'react';

import ListHeader from '../../../../shared/components/content/ListHeader';

import ListRow, {
  LIST_ROW_TYPE,
} from '../../components/ListRow';
import SearchSelectBottomSheet from '../../components/SearchSelectBottomSheet';

import useSelectMusic from '../../music/hooks/useSelectMusic';

const EMPTY = {
  type: 'music',
  title: '일치하는 음악이 없습니다.',
  body: '노래 제목이나 가수를 다시 확인해 주세요.',
};

const keyExtractor = item =>
  String(item.externalId);

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

  return (
    <SearchSelectBottomSheet
      onClose={onClose}
      keyword={keyword}
      onChangeKeyword={handleChangeKeyword}
      placeholder="기록할 음악을 검색해 주세요."
      header={
        <ListHeader
          size="S"
          title="Apple Music 인기곡 Top 10"
        />
      }
      data={musicList}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      loading={loading}
      loadingMore={loadingMore}
      hasNextPage={hasNextPage}
      onLoadMore={handleLoadMore}
      empty={EMPTY}
    />
  );
};

export default MusicSelectBottomSheet;
