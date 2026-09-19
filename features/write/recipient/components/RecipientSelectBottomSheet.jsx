import React from 'react';

// Shared Utils & Styles
import { resolveMediaUri } from '../../../../shared/utils/media';

// Feature Components & Hooks
import ListRow, { LIST_ROW_TYPE } from '../../components/ListRow';
import SearchSelectBottomSheet from '../../components/SearchSelectBottomSheet';
import useSelectRecipient from '../hooks/useSelectRecipient';

const EMPTY = {
  type: 'recipient',
  title: '일치하는 사용자가 없습니다.',
  body: '닉네임이나 아이디를 다시 확인해 주세요.',
};

const keyExtractor = item => String(item.id);

const RecipientSelectBottomSheet = ({ onClose, currentUserId }) => {
  const {
    keyword,
    userList,
    loading,
    loadingMore,
    hasNextPage,
    selectedRecipientId,
    handleChangeKeyword,
    handleSelectRecipient,
    handleLoadMore,
  } = useSelectRecipient(onClose, currentUserId);

  const renderItem = ({ item }) => {
    const isSelected = String(selectedRecipientId) === String(item.id);
    const profileImageUri = resolveMediaUri(item.profileImageUrl);

    return (
      <ListRow
        type={LIST_ROW_TYPE.RECIPIENT}
        imageUri={profileImageUri}
        nickname={item.nickname}
        userId={item.userCode}
        isMe={Boolean(item.isMe)}
        isPressed={isSelected}
        onPress={() => handleSelectRecipient(item)}
      />
    );
  };

  return (
    <SearchSelectBottomSheet
      onClose={onClose}
      keyword={keyword}
      onChangeKeyword={handleChangeKeyword}
      placeholder="편지를 받을 사람을 검색해 주세요."
      data={userList}
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

export default RecipientSelectBottomSheet;
