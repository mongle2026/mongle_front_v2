import { memo, useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import IcArrowLeft from '../../../../assets/icons/ic_arrow_left.svg';

import TopIconNavigation from '../../../../shared/components/navigation/topnavigation/TopIconNavigation';
import useCurrentUser from '../../../../shared/hooks/useCurrentUser';
import { colors } from '../../../../shared/styles/color';
import { gap, padding } from '../../../../shared/styles/token';

import GenreCard from '../../components/GenreCard';
import useMyFeedGenres from './hooks/useMyFeedGenres';

const COLUMN_COUNT = 2;

// 장르별 기록 전체. limit 없이 모든 장르를 한 줄에 두 개씩 보여준다.
const GenreScreen = ({ navigation }) => {
  const { userId } = useCurrentUser();
  const { genres } = useMyFeedGenres({ userId });
  const insets = useSafeAreaInsets();

  const handlePressGenre = useCallback(
    genre => navigation.navigate('MyFeedGenreDetail', { genre }),
    [navigation],
  );

  const genreRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < genres.length; i += COLUMN_COUNT) {
      rows.push(genres.slice(i, i + COLUMN_COUNT));
    }
    return rows;
  }, [genres]);

  const handlePressBack = useCallback(() => navigation?.goBack(), [navigation]);

  // 하단 edge는 SafeAreaView에서 빼두었으니 마지막 줄이 Android 내비게이션 바에 가리지 않게 inset만큼 더 띄운다
  const containerStyle = useMemo(
    () => [styles.container, { paddingBottom: padding.XXL + insets.bottom }],
    [insets.bottom],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopIconNavigation
        type="text"
        leftIcon={IcArrowLeft}
        leftAccessibilityLabel="뒤로가기"
        headerText="장르별 기록"
        showNext={false}
        onPressClose={handlePressBack}
      />

      <ScrollView contentContainerStyle={containerStyle}>
        {genreRows.map(row => (
          <View key={row[0].genre} style={styles.row}>
            {/* GenreCard의 padding이 flex 분배에 섞이지 않도록 padding 없는 칸으로 감싼다 */}
            {row.map(item => (
              <View key={item.genre} style={styles.cell}>
                <GenreCard
                  genre={item.genre}
                  imageSource={item.imageSource}
                  onPress={() => handlePressGenre(item.genre)}
                />
              </View>
            ))}
            {/* 마지막 줄이 한 개뿐이어도 카드가 반 폭을 유지하도록 빈 칸을 채운다 */}
            {row.length < COLUMN_COUNT && <View style={styles.cell} />}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgLayerDefault,
  },
  container: {
    paddingTop: padding.L,
    paddingBottom: padding.XXL,
    flexDirection: 'column',
    gap: gap.M,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: padding.L,
    alignItems: 'flex-start',
    gap: gap.M,
    alignSelf: 'stretch',
  },
  cell: {
    flex: 1,
  },
});

export default memo(GenreScreen);
