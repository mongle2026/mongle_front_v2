import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../../../../shared/styles/color';
import { padding } from '../../../../shared/styles/token';

import Profile from '../../components/Profile';

import CenterToStartRow from './CenterToStartRow';

// 오른쪽 끝 그라데이션. Figma 는 100x40 을 -90도 돌린 값이라 실제로는 폭 40 에
// 높이는 프로필 줄 전체(약 100)다. 폭만 고정하고 높이는 줄 높이를 따라가게 한다.
const FADE_WIDTH = 40;
const FADE_COLORS = ['rgba(255, 255, 255, 0)', colors.bgLayerDefault];

/**
 * 이 우표를 보내준 사람들. 왼쪽이 오래된 순이고, 항상 가로로 스크롤된다.
 *
 * @param {{ userId: number, nickname: string, imageUri?: string, isMe: boolean }[]} senders
 * @param {import('react-native-reanimated').SharedValue<number>} progress
 *   시트가 처음 떴을 때(0)는 가운데 정렬, 끌어올리면(1) 왼쪽 정렬. 줄을 넘치면 항상 왼쪽부터 채운다.
 */
const SenderProfileList = ({ senders, progress }) => (
  <View style={styles.container}>
    {/* 시트 제스처와 함께 동작하도록 gesture-handler 의 ScrollView 를 쓴다 */}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <CenterToStartRow progress={progress} style={styles.row}>
        {senders.map(sender => (
          <Profile
            key={sender.userId}
            imageUri={sender.imageUri}
            name={sender.nickname}
            isMe={sender.isMe}
          />
        ))}
      </CenterToStartRow>
    </ScrollView>

    <LinearGradient
      pointerEvents="none"
      colors={FADE_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.fade}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  content: {
    // 프로필이 적어도 줄 전체 폭을 차지해야 가운데 정렬이 된다
    flexGrow: 1,
    paddingVertical: padding.XL,
    paddingHorizontal: padding.L,
  },
  row: {
    flexGrow: 1,
  },
  fade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: FADE_WIDTH,
  },
});

export default memo(SenderProfileList);
