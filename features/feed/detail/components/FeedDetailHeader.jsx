import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TopIconNavigation from '../../../../shared/components/navigation/topnavigation/TopIconNavigation';
import Menu from '../../../../shared/components/action/menu/Menu';

import { colors } from '../../../../shared/styles/color';
import { padding } from '../../../../shared/styles/token';

/**
 * 피드 상세 상단 (닫기 · 공유 · 더보기)과 내 피드 수정/삭제 메뉴.
 * 메뉴를 열고 닫는 상태는 화면(FeedDetailScreen)이 가지고, 여기서는 그리기만 합니다.
 */
const FeedDetailHeader = ({
  onPressClose,
  onPressShare,
  onPressMore,
  isMenuOpen = false,
  onPressEdit,
  onPressDelete,
  deleteDisabled,
}) => (
  <SafeAreaView
    edges={['top']}
    style={styles.topSafeArea}
  >
    <View style={styles.topNavigationContainer}>
      <TopIconNavigation
        onPressClose={onPressClose}
        onPressShare={onPressShare}
        onPressMore={onPressMore}
      />

      {isMenuOpen && (
        <Menu
          style={styles.menu}
          onPressEdit={onPressEdit}
          onPressDelete={onPressDelete}
          deleteDisabled={deleteDisabled}
        />
      )}
    </View>
  </SafeAreaView>
);

export default FeedDetailHeader;

const styles = StyleSheet.create({
  topSafeArea: {
    width: '100%',
    position: 'relative',
    backgroundColor: colors.bgLayerDefault,
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
