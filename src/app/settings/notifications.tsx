import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Trash2, CheckCircle2, ChevronLeft, Info, Calendar, Target, AlertTriangle } from 'lucide-react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Colors, Spacing } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function Notifications() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  // Zustand
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
  } = useFinanceStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'sip_due':
        return <Calendar color={colors.warning} size={18} />;
      case 'milestone':
        return <Target color={colors.success} size={18} />;
      case 'spending_alert':
        return <AlertTriangle color={colors.danger} size={18} />;
      default:
        return <Info color={colors.accent} size={18} />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Top Header controls */}
      <View style={[styles.actionHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.notifCount, { color: colors.textSecondary }]}>
          {notifications.filter((n) => !n.isRead).length} Unread
        </Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={markAllNotificationsAsRead} style={styles.markAllBtn}>
            <Text style={[styles.markAllText, { color: colors.accent }]}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {notifications.map((notif) => {
          const dateStr = new Date(notif.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <Card
              key={notif.id}
              style={[
                styles.notifCard,
                { borderColor: colors.border },
                !notif.isRead && { backgroundColor: `${colors.accent}05`, borderLeftWidth: 4, borderLeftColor: colors.accent },
              ]}>
              <View style={styles.notifLayout}>
                {/* Type Icon */}
                <View style={[styles.iconBox, { backgroundColor: colors.backgroundElement }]}>
                  {getIcon(notif.type)}
                </View>

                {/* Info */}
                <View style={styles.infoBox}>
                  <Text style={[styles.notifTitle, { color: colors.text }]}>{notif.title}</Text>
                  <Text style={[styles.notifMessage, { color: colors.textSecondary }]}>
                    {notif.message}
                  </Text>
                  <Text style={[styles.notifDate, { color: colors.textSecondary }]}>{dateStr}</Text>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  {!notif.isRead && (
                    <TouchableOpacity
                      onPress={() => markNotificationAsRead(notif.id)}
                      style={styles.actionBtn}>
                      <CheckCircle2 color={colors.success} size={16} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => deleteNotification(notif.id)}
                    style={styles.actionBtn}>
                    <Trash2 color={colors.danger} size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          );
        })}

        {notifications.length === 0 && (
          <View style={styles.emptyContainer}>
            <Bell color={colors.textSecondary} size={48} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Your Inbox is Empty</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              We will send you notifications when your SIPs are due or savings goals hit milestones.
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionHeader: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    borderBottomWidth: 1,
  },
  notifCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  markAllBtn: {
    padding: Spacing.one * 1.5,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.four,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  notifCard: {
    borderWidth: 1,
    marginVertical: Spacing.one,
    padding: Spacing.three,
  },
  notifLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  infoBox: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  notifMessage: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  notifDate: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  actionBtn: {
    padding: Spacing.one,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.six * 2,
    gap: Spacing.two,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: Spacing.three,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.four,
  },
  bottomSpacer: {
    height: Spacing.five,
  },
});
