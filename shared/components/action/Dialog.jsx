import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../styles/color';
import { gap, padding, radius } from '../../styles/token';
import { typo } from '../../styles/typo';
import { TextButton } from './TextButton';

export const Dialog = ({
  title,
  description,
  cancelText = '취소',
  confirmText = '삭제',
  onCancel,
  onConfirm,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.containerTexts}>
        <Text
          allowFontScaling={false}
          style={styles.title}
        >
          {title}
        </Text>
        <Text
          allowFontScaling={false}
          style={styles.description}
        >
          {description}
        </Text>
      </View>
      <View style={styles.containerButtons}>
        <TextButton
          variant="BrandWeak"
          font="suit"
          onPress={onCancel}
          style={styles.button}
        >
          {cancelText}
        </TextButton>
        <TextButton
          variant="Critical"
          font="suit"
          onPress={onConfirm}
          style={styles.button}
        >
          {confirmText}
        </TextButton>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 302,
    padding: padding.XL,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap.L,
    borderRadius: radius.XL,
    backgroundColor: colors.bgLayerDefault,
  },
  containerTexts: {
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.S,
  },
  title: {
    alignSelf: 'stretch',
    ...typo.suitTitleMediumStrong,
    color: '#34373A',
  },
  description: {
    alignSelf: 'stretch',
    ...typo.suitBodyLarge,
    color: '#747A81',
  },
  containerButtons: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.S,
  },
  button: {
    flex: 1,
    alignSelf: 'stretch',
  },
});