import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BillHistoryEntry } from '../types';
import { theme } from '../theme';
import { money } from '../logic/splitEngine';

export function HomeScreen({
  history,
  onSplitBill,
  onOpenBill,
  onDeleteBill
}: {
  history: BillHistoryEntry[];
  onSplitBill: () => void;
  onOpenBill: (bill: BillHistoryEntry) => void;
  onDeleteBill: (billId: string) => void;
}) {
  const monthTotal = history.reduce((sum, bill) => sum + bill.amount, 0);

  function confirmDelete(billId: string) {
    Alert.alert('Delete bill?', 'Do you want to delete this bill from history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDeleteBill(billId) }
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={styles.logo}>SnapSplit</Text>
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.heroContent}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.greeting}>Split the bill, not the friendship.</Text>
            <Text style={styles.subtitle}>Scan a receipt, choose friends, color-mark items, add tip, and share everyone’s part.</Text>
          </View>
          <Text style={styles.receiptEmoji}>🧾</Text>
        </View>
      </View>

      <Pressable onPress={onSplitBill} style={styles.primaryAction}>
        <View style={styles.primaryIcon}>
          <Ionicons name="receipt-outline" size={30} color="#FFFFFF" />
        </View>
        <View style={styles.primaryTextBlock}>
          <Text style={styles.primaryTitle}>Split Bill</Text>
          <Text style={styles.primarySub}>Take picture or upload receipt</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
      </Pressable>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Recent bills</Text>
        <Text style={styles.seeAll}>Tap to open</Text>
      </View>

      <View style={styles.listCard}>
        {history.map((bill, index) => (
          <Pressable
            key={bill.id}
            onPress={() => onOpenBill(bill)}
            onLongPress={() => confirmDelete(bill.id)}
            style={[styles.billRow, index !== history.length - 1 && styles.billBorder]}
          >
            <View style={styles.billIcon}>
              <Ionicons name={index === 0 ? 'restaurant-outline' : index === 1 ? 'cafe-outline' : 'location-outline'} size={22} color="#FFFFFF" />
            </View>
            <View style={styles.billTextBlock}>
              <Text style={styles.billTitle}>{bill.merchant}</Text>
              <Text style={styles.billSub}>{bill.date}</Text>
              <Text style={styles.billSub}>with {bill.people.join(', ')}</Text>
            </View>
            <View style={styles.billRight}>
              <Text style={styles.billAmount}>{money(bill.amount)}</Text>
              <Text style={styles.billPeople}>{bill.people.length} people</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.color.muted} />
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.insightsRow}>
        <View style={styles.insightCard}>
          <Text style={styles.insightLabel}>This Month</Text>
          <Text style={styles.insightValue}>{money(monthTotal)}</Text>
          <Text style={styles.insightSub}>Across {history.length} bills</Text>
        </View>
        <View style={styles.insightCard}>
          <Text style={styles.insightLabel}>Favorite Spot</Text>
          <Text style={styles.insightValueSmall}>{history[0]?.merchant ?? '—'}</Text>
          <Text style={styles.insightSub}>Most recent dinner</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="color-palette-outline" size={22} color={theme.color.blue} />
        <Text style={styles.infoText}>New flow: Split Bill → upload/take photo → review receipt → choose split mode → summary.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 24, gap: 16 },
  hero: { backgroundColor: theme.color.blue, borderRadius: 30, padding: 22, minHeight: 220, ...theme.shadow },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', letterSpacing: -0.8 },
  heroContent: { marginTop: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTextBlock: { flex: 1 },
  greeting: { color: '#FFFFFF', fontSize: 24, lineHeight: 29, fontWeight: '900' },
  subtitle: { marginTop: 10, color: '#EAF0FF', fontSize: 15, lineHeight: 21, fontWeight: '600' },
  receiptEmoji: { fontSize: 70, marginLeft: 10 },
  primaryAction: { backgroundColor: theme.color.blue, borderRadius: 26, padding: 18, minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: 14, ...theme.shadow },
  primaryIcon: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  primaryTextBlock: { flex: 1 },
  primaryTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  primarySub: { marginTop: 4, color: '#EAF0FF', fontSize: 14, fontWeight: '700' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: theme.color.text },
  seeAll: { color: theme.color.blue, fontWeight: '800' },
  listCard: { backgroundColor: theme.color.card, borderRadius: 24, overflow: 'hidden', ...theme.shadow },
  billRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  billBorder: { borderBottomWidth: 1, borderBottomColor: theme.color.line },
  billIcon: { width: 48, height: 48, borderRadius: 18, backgroundColor: theme.color.blue, alignItems: 'center', justifyContent: 'center' },
  billTextBlock: { flex: 1 },
  billTitle: { fontSize: 16, fontWeight: '900', color: theme.color.text },
  billSub: { color: theme.color.muted, fontSize: 12, marginTop: 2 },
  billRight: { alignItems: 'flex-end', gap: 2 },
  billAmount: { fontWeight: '900', color: theme.color.text },
  billPeople: { color: theme.color.muted, fontSize: 11, fontWeight: '700' },
  insightsRow: { flexDirection: 'row', gap: 12 },
  insightCard: { flex: 1, backgroundColor: theme.color.card, borderRadius: 22, padding: 16, ...theme.shadow },
  insightLabel: { color: theme.color.blue, fontWeight: '900', fontSize: 12 },
  insightValue: { marginTop: 8, color: theme.color.text, fontSize: 25, fontWeight: '900' },
  insightValueSmall: { marginTop: 8, color: theme.color.text, fontSize: 17, fontWeight: '900' },
  insightSub: { marginTop: 5, color: theme.color.muted, fontSize: 12, fontWeight: '600' },
  infoCard: { backgroundColor: theme.color.blueSoft, borderRadius: 22, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center' },
  infoText: { flex: 1, color: theme.color.blueDark, fontWeight: '700', lineHeight: 20 }
});
