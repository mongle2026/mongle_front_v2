import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TopSubNavigation from '../../../../shared/components/navigation/topnavigation/TopSubNavigation';
import Menu from '../../../../shared/components/action/menu/Menu';

import IcArrowLeft from '../../../../assets/icons/ic_arrow_left.svg';
import IcX from '../../../../assets/icons/ic_x.svg';

import { colors } from '../../../../shared/styles/color';
import { padding } from '../../../../shared/styles/token';

/**
 * 피드 상세 상단 (뒤로가기 · 공유 · 더보기)과 더보기 메뉴.
 * 내 피드는 수정/삭제, 남의 피드는 신고/차단를 보여준다.
 * 메뉴를 열고 닫는 상태는 화면(FeedDetailScreen)이 가지고, 여기서는 그리기만 합니다.
 * isBlinded: 운영자가 가린 피드면 닫기(ic_x)만 보여준다.
 */
const FeedDetailHeader = ({
  onPressClose,
  onPressShare,
  onPressMore,
  isMenuOpen = false,
  isMine = false,
  onPressEdit,
  onPressDelete,
  deleteDisabled,
  onPressReport,
  onPressBlock,
  isBlinded = false,
}) => (
  <SafeAreaView
    edges={['top']}
    style={styles.topSafeArea}
  >
    <View style={styles.topNavigationContainer}>
      <TopSubNavigation
        leftIcon={isBlinded ? IcX : IcArrowLeft}
        leftAccessibilityLabel={isBlinded ? '닫기' : '뒤로가기'}
        showShare={!isBlinded}
        showMore={!isBlinded}
        onPressClose={onPressClose}
        onPressShare={onPressShare}
        onPressMore={onPressMore}
      />

      {isMenuOpen && (isMine ? (
        <Menu
          style={styles.menu}
          onPressEdit={onPressEdit}
          onPressDelete={onPressDelete}
          deleteDisabled={deleteDisabled}
          deleteAccessibilityLabel="게시물 삭제"
        />
      ) : (
        <Menu
          style={styles.menu}
          showReport
          showEdit={false}
          showDelete={false}
          onPressReport={onPressReport}
          onPressBlock={onPressBlock}
        />
      ))}
    </View>
  </SafeAreaView>
);

export default FeedDetailHeader;

const styles = StyleSheet.create({
  topSafeArea: {
    width: '100%',
    position: 'relative',
    backgroundColor: colors.bgSurface,
    zIndex: 20,
  },

  topNavigationContainer: {
    width: '100%',
    position: 'relative',
    zIndex: 20,
  },

  menu: {
    position: 'absolute',
    top: '100%',
    right: padding.L,
    zIndex: 30,
  },
});
