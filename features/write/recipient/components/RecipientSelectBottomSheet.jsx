import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

// Shared Components
import BottomSheet from '../../../../shared/components/overlay/BottomSheet';
import SearchField from '../../../../shared/components/action/Searchfield';
import Empty from '../../../../shared/components/content/Empty';

// Shared Utils & Styles
import { resolveMediaUri } from '../../../../shared/utils/media';
import { colors } from '../../../../shared/styles/color';
import { padding } from '../../../../shared/styles/token';

// Feature Components & Hooks
import ListRow, { LIST_ROW_TYPE } from '../../components/ListRow';
import useSelectRecipient from '../hooks/useSelectRecipient';

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

  const isSearching = keyword.trim().length > 0;

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
        onChangeText={handleChangeKeyword}
        placeholder="편지를 받을 사람을 검색해 주세요."
        returnKeyType="search"
        autoCorrect={false}
      />

      <FlatList
        data={userList}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (isSearching && hasNextPage && !loadingMore) {
            handleLoadMore();
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
              type="recipient"
              title="일치하는 사용자가 없습니다."
              body="닉네임이나 아이디를 다시 확인해 주세요."
            />
          ) : null
        }
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
      />
    </BottomSheet>
  );
};

export default RecipientSelectBottomSheet;

const styles = StyleSheet.create({
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