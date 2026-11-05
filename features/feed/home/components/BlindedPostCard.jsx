import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import Empty from '../../../../shared/components/content/Empty';
import { colors } from '../../../../shared/styles/color';
import { radius } from '../../../../shared/styles/token';

/**
 * 운영자가 가린 피드 카드. PostCard 와 같은 크기의 카드 가운데에 가림 안내만 보여준다.
 * 작성자 · 음악 · 좋아요 같은 내용은 서버가 보내지 않아서 그리지 않는다.
 */
const BlindedPostCard = ({ style }) => (
  <View style={[styles.card, style]}>
    <Empty
      type="restricted"
      title="이 피드는 볼 수 없어요"
      body="운영정책에 따라 가려졌어요"
    />
  </View>
);

const styles = StyleSheet.create({
  // PostCard card 스타일과 같은 모양
  card: {
    width: '100%',
    alignSelf: 'stretch',
    flexShrink: 0,

    justifyContent: 'center',
    alignItems: 'center',

    borderRadius: radius.M,
    overflow: 'hidden',

    backgroundColor: colors.bgSurface,
  },
});

export default memo(BlindedPostCard);
