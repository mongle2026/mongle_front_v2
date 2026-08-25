import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../styles/color';
import { gap, padding, radius } from '../../styles/token';
import { typo } from '../../styles/typo';
import { FONT } from '../../styles/font';

import { TextButton, TEXT_BUTTON_SIZE, TEXT_BUTTON_VARIANT } from './TextButton';
import IlDialogDelete from '../../../assets/illustrations/il_dialog_delete.svg';

export const Dialog = ({
  illustration: Illustration = IlDialogDelete,
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
      <View style={styles.illustrationContainer}>
        {Illustration && <Illustration width={200} height={144} />}
      </View>

      <View style={styles.textContainer}>
        <Text allowFontScaling={false} style={styles.title}>
          {title}
        </Text>
        <Text allowFontScaling={false} style={styles.description}>
          {description}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TextButton
          variant={TEXT_BUTTON_VARIANT.NEUTRAL_WEAK}
          size={TEXT_BUTTON_SIZE.L}
          font={FONT.SUIT}
          onPress={onCancel}
          style={styles.button}
        >
          {cancelText}
        </TextButton>

        <TextButton
          variant={TEXT_BUTTON_VARIANT.CRITICAL}
          size={TEXT_BUTTON_SIZE.L}
          font={FONT.SUIT}
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
    height: 301,
    padding: padding.XL,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: gap.L,
    borderRadius: radius.XL,
    backgroundColor: colors.bgLayerDefault,
  },
  illustrationContainer: {
    width: 200,
    height: 144,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: gap.S,
  },
  title: {
    alignSelf: 'stretch',
    ...typo.suitTitleXLargeStrong,
    fontSize: 20,
    lineHeight: 30,
    color: colors.fgNeutralMuted,
    textAlign: 'center',
  },
  description: {
    alignSelf: 'stretch',
    ...typo.suitLabelLarge,
    lineHeight: 22.5,
    color: colors.fgNeutralSubtle,
    textAlign: 'center',
  },
  buttonContainer: {
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