import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../styles/color';
import { gap, padding, radius } from '../../styles/token';
import { typo } from '../../styles/typo';
import { FONT } from '../../styles/fontType';

import { Button, BUTTON_SIZE, BUTTON_VARIANT } from '../action/Button';
import IlDialogDelete from '../../../assets/illustrations/il_dialog_delete.svg';

/*
 * confirmText에 null을 넘기면 오른쪽 버튼 없이 왼쪽 버튼만 보여준다.
 */
export const Dialog = ({
  illustration: Illustration = IlDialogDelete,
  title,
  description,
  cancelText = '닫기',
  confirmText = '삭제',
  confirmVariant = BUTTON_VARIANT.CRITICAL,
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
        <Text style={styles.title}>
          {title}
        </Text>
        <Text style={styles.description}>
          {description}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          variant={BUTTON_VARIANT.WEAK}
          size={BUTTON_SIZE.L}
          font={FONT.SUIT}
          onPress={onCancel}
          style={styles.button}
        >
          {cancelText}
        </Button>

        {confirmText != null && (
          <Button
            variant={confirmVariant}
            size={BUTTON_SIZE.L}
            font={FONT.SUIT}
            onPress={onConfirm}
            style={styles.button}
          >
            {confirmText}
          </Button>
        )}
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
    backgroundColor: colors.bgSurface,
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
    color: colors.fgNeutralSecondary,
    textAlign: 'center',
  },
  description: {
    alignSelf: 'stretch',
    ...typo.suitBodyLarge,
    color: colors.fgNeutralTertiary,
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