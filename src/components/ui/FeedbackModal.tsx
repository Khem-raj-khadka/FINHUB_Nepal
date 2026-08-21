import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import { Spacing } from '../../constants/theme';
import Typography from '../../constants/Typography';
import { useAppTheme } from '../../hooks/useAppTheme';
import Button from './Button';
import Card from './Card';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface FeedbackModalProps {
  visible: boolean;
  type?: FeedbackType;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  isDestructive?: boolean;
}

export default function FeedbackModal({
  visible,
  type = 'info',
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  onClose,
  isDestructive = false,
}: FeedbackModalProps) {
  const { colors, isDark } = useAppTheme();

  if (!visible) return null;

  const handleClose = () => {
    if (onClose) onClose();
    else if (onCancel) onCancel();
  };

  const getStatusVisuals = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 color={colors.success} size={32} />,
          bgColor: `${colors.success}18`,
          borderColor: colors.success,
          btnVariant: 'success' as const,
        };
      case 'error':
        return {
          icon: <AlertCircle color={colors.danger} size={32} />,
          bgColor: `${colors.danger}18`,
          borderColor: colors.danger,
          btnVariant: 'danger' as const,
        };
      case 'warning':
        return {
          icon: <AlertTriangle color={colors.warning} size={32} />,
          bgColor: `${colors.warning}18`,
          borderColor: colors.warning,
          btnVariant: 'primary' as const,
        };
      case 'confirm':
        return {
          icon: isDestructive ? (
            <AlertTriangle color={colors.danger} size={32} />
          ) : (
            <Info color={colors.accent} size={32} />
          ),
          bgColor: isDestructive ? `${colors.danger}18` : `${colors.accent}18`,
          borderColor: isDestructive ? colors.danger : colors.accent,
          btnVariant: isDestructive ? ('danger' as const) : ('primary' as const),
        };
      case 'info':
      default:
        return {
          icon: <Info color={colors.accent} size={32} />,
          bgColor: `${colors.accent}18`,
          borderColor: colors.accent,
          btnVariant: 'primary' as const,
        };
    }
  };

  const visual = getStatusVisuals();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Card style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Close button */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Close modal"
            onPress={handleClose}
            style={[styles.closeBtn, { backgroundColor: colors.backgroundElement }]}>
            <X color={colors.textSecondary} size={16} />
          </TouchableOpacity>

          {/* Status Icon */}
          <View style={[styles.iconWrapper, { backgroundColor: visual.bgColor }]}>
            {visual.icon}
          </View>

          {/* Title & Message */}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

          {/* Actions */}
          <View style={styles.actionRow}>
            {type === 'confirm' && (
              <Button
                label={cancelLabel}
                variant="secondary"
                onPress={onCancel || handleClose}
                style={styles.cancelBtn}
              />
            )}
            <Button
              label={confirmLabel}
              variant={visual.btnVariant}
              onPress={onConfirm || handleClose}
              style={styles.confirmBtn}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: Spacing.four * 1.2,
    alignItems: 'center',
    borderWidth: 1,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
    marginTop: Spacing.one,
  },
  title: {
    ...Typography.h2,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  message: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: Spacing.four,
    paddingHorizontal: Spacing.two,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.two,
  },
  cancelBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 1,
  },
});
