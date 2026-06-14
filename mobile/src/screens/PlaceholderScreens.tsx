import React, { useRef } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BillHistoryEntry, SplitResult } from '../types';
import { theme } from '../theme';
import { money } from '../logic/splitEngine';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

export function HistoryScreen({ history, onOpenBill }: { history: BillHistoryEntry[]; onOpenBill: (bill: BillHistoryEntry) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>History</Text>
      <Text style={styles.sub}>Tap any saved split to see the full receipt, people, assigned items, tip, and share options.</Text>
      {history.map((bill) => (
        <Pressable key={bill.id} onPress={() => onOpenBill(bill)} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.historyIcon}>
              <Ionicons name="receipt-outline" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.cardMain}>
              <Text style={styles.cardTitle}>{bill.merchant}</Text>
              <Text style={styles.cardSub}>{bill.date} · {bill.people.length} people</Text>
              <Text style={styles.cardSub}>with {bill.people.join(', ')}</Text>
              <Text style={styles.cardSub}>Tax {money(bill.tax ?? 0)} · Tip {money(bill.tip ?? 0)}</Text>
            </View>
            <View style={styles.amountBlock}>
              <Text style={styles.amount}>{money(bill.amount)}</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.color.muted} />
            </View>
          </View>
          {bill.note ? <Text style={styles.note}>{bill.note}</Text> : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function BillDetailScreen({ bill, onBack }: { bill: BillHistoryEntry; onBack: () => void }) {
  const results = bill.results ?? buildFallbackResults(bill);
  const fullReceiptRef = useRef<View | null>(null);

  async function saveFullReceiptImage() {
    try {
      if (!fullReceiptRef.current) return Alert.alert('Error', 'Receipt view not available');
      const uri = await captureRef(fullReceiptRef.current, { format: 'png', quality: 0.9 });
      if (!(await Sharing.isAvailableAsync())) {
        await Share.share({ message: `SnapSplit receipt for ${bill.merchant}`, url: uri } as any);
        return;
      }
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert('Save failed', 'Could not create receipt image.');
    }
  }

  async function saveFullReceiptToPhotos() {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow access to save images to your Photos.');
        return;
      }
      if (!fullReceiptRef.current) return Alert.alert('Error', 'Receipt view not available');
      const uri = await captureRef(fullReceiptRef.current, { format: 'png', quality: 0.9 });
      const asset = await MediaLibrary.createAssetAsync(uri);
      try {
        await MediaLibrary.createAlbumAsync('SnapSplit', asset, false);
      } catch (_) { }
      Alert.alert('Saved', 'Receipt saved to Photos');
    } catch (e) {
      Alert.alert('Save failed', 'Could not save receipt to Photos.');
    }
  }
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={20} color={theme.color.blue} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <View style={styles.detailHero}>
        <Text style={styles.detailLabel}>Saved split</Text>
        <Text style={styles.detailTitle}>{bill.merchant}</Text>
        <Text style={styles.detailSub}>{bill.date} · with {bill.people.join(', ')}</Text>
        <Text style={styles.detailAmount}>{money(bill.amount)}</Text>
      </View>
      <View style={styles.originalImageCard}>
        <Text style={styles.originalImageLabel}>Original receipt</Text>
        {bill.receiptImageUri ? (
          <Image source={{ uri: bill.receiptImageUri }} style={styles.originalImage} resizeMode="contain" />
        ) : (
          <View style={styles.noImagePlaceholder}>
            <Text style={styles.noImageText}>Receipt image not available for this bill.</Text>
          </View>
        )}
      </View>
      {/* Full original receipt card */}
      <View collapsable={false} ref={fullReceiptRef} style={styles.fullReceiptCard}>
        <View style={styles.receiptHeader}>
          <View>
            <Text style={styles.receiptTitle}>Full receipt</Text>
            <Text style={styles.receiptMeta}>{bill.merchant} · {bill.date}</Text>
          </View>
          <View style={styles.savedBadge}>
            <Ionicons name="receipt-outline" size={16} color={theme.color.blue} />
            <Text style={styles.savedBadgeText}>Original bill</Text>
          </View>
        </View>

        {bill.receiptItems && bill.receiptItems.length > 0 ? (
          bill.receiptItems.map((item) => {
            const assignedNames = item.assignedTo
              .map((id) => results.find((r) => r.personId === id)?.name)
              .filter(Boolean) as string[];
            const assignedColors = item.assignedTo
              .map((id) => results.find((r) => r.personId === id)?.color)
              .filter(Boolean) as string[];
            const shares = assignedNames.length > 0 ? (item.price / assignedNames.length) : 0;
            return (
              <View key={item.id} style={styles.fullItemRow}>
                <View style={styles.fullItemLeft}>
                  <Text style={styles.fullItemName}>{item.name}{item.quantity > 1 ? ` x${item.quantity}` : ''}</Text>
                  <View style={styles.fullItemMetaRow}>
                    {item.kcal ? <Text style={styles.kcalText}>{Math.round(item.kcal)} kcal</Text> : null}
                    <Text style={styles.fullItemPrice}>{money(item.price)}</Text>
                  </View>
                  {assignedNames.length === 0 ? (
                    <Text style={styles.unassignedText}>Unassigned</Text>
                  ) : assignedNames.length === results.length ? (
                    <Text style={styles.splitText}>Split between everyone</Text>
                  ) : assignedNames.length === 1 ? (
                    <Text style={styles.splitText}>Assigned to {assignedNames[0]}</Text>
                  ) : (
                    <Text style={styles.splitText}>Split between {assignedNames.join(', ')} · {money(item.price)} / {assignedNames.length} = {money(shares)} each</Text>
                  )}
                </View>
                <View style={styles.fullItemRight}>
                  <View style={styles.chipsRow}>
                    {assignedColors.map((c, idx) => (
                      <View key={`${item.id}-chip-${idx}`} style={[styles.chip, { backgroundColor: c }]} />
                    ))}
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.noReceiptSaved}>
            <Text style={styles.noReceiptText}>Full receipt details were not saved for this older bill.</Text>
          </View>
        )}

        <View style={styles.receiptTotalsRow}>
          <Text style={styles.receiptTotalsLabel}>Items subtotal</Text>
          <Text style={styles.receiptTotalsValue}>{money((bill.receiptItems ?? []).reduce((s, i) => s + i.price, 0))}</Text>
        </View>
        <View style={styles.receiptTotalsRow}>
          <Text style={styles.receiptTotalsLabel}>Tax</Text>
          <Text style={styles.receiptTotalsValue}>{money(bill.tax ?? 0)}</Text>
        </View>
        <View style={styles.receiptTotalsRow}>
          <Text style={styles.receiptTotalsLabel}>Tip</Text>
          <Text style={styles.receiptTotalsValue}>{money(bill.tip ?? 0)}</Text>
        </View>
        <View style={styles.receiptTotalsRow}>
          <Text style={styles.receiptTotalsLabel}>Grand total</Text>
          <Text style={styles.receiptTotalsValue}>{money(bill.amount)}</Text>
        </View>
      </View>

      {/* Split by People */}
      <View style={styles.prettyReceipt}>
        <Text style={styles.splitHeader}>Split by People</Text>
        {results.map((result) => (
          <View key={result.personId} style={styles.personReceiptBlock}>
            <View style={styles.personReceiptTop}>
              <View style={[styles.smallAvatar, { backgroundColor: result.color }]}>
                <Text style={styles.smallAvatarText}>{(result.name || '?').slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={styles.personReceiptNameBlock}>
                <Text style={styles.personReceiptName}>{result.name}</Text>
                <Text style={styles.personReceiptSub}>{result.items.length} item(s) · {Math.round(result.kcal)} kcal</Text>
              </View>
              <Text style={styles.personReceiptTotal}>{money(result.total)}</Text>
            </View>
            {result.items.map((item) => (
              <View key={`${result.personId}-${item.id}`} style={styles.receiptLine}>
                <Text style={styles.receiptLineName}>{item.name}{item.assignedTo.length > 1 ? ` /${item.assignedTo.length}` : ''}</Text>
                <Text style={styles.receiptLinePrice}>{money(item.price / Math.max(1, item.assignedTo.length || 1))}</Text>
              </View>
            ))}
            {result.extras > 0 ? (
              <View style={styles.receiptLine}>
                <Text style={styles.receiptLineName}>Tip share</Text>
                <Text style={styles.receiptLinePrice}>{money(result.extras)}</Text>
              </View>
            ) : null}
          </View>
        ))}

        <View style={styles.totalLine}>
          <Text style={styles.totalLineText}>Total</Text>
          <Text style={styles.totalLineAmount}>{money((bill.amount))}</Text>
        </View>
      </View>

      <View style={styles.detailActions}>
        <Pressable style={styles.actionButton}><Ionicons name="call-outline" size={18} color="#FFFFFF" /><Text style={styles.actionButtonText}>Send via Phone</Text></Pressable>
        <Pressable style={styles.outlineButton}><Ionicons name="logo-instagram" size={18} color={theme.color.blue} /><Text style={styles.outlineButtonText}>Instagram</Text></Pressable>
        <Pressable style={styles.outlineButton}><Ionicons name="logo-whatsapp" size={18} color={theme.color.blue} /><Text style={styles.outlineButtonText}>WhatsApp</Text></Pressable>
        <Pressable style={styles.outlineButton} onPress={saveFullReceiptImage}><Ionicons name="image-outline" size={18} color={theme.color.blue} /><Text style={styles.outlineButtonText}>Share image</Text></Pressable>
        <Pressable style={styles.outlineButton} onPress={saveFullReceiptToPhotos}><Ionicons name="download-outline" size={18} color={theme.color.blue} /><Text style={styles.outlineButtonText}>Save to Photos</Text></Pressable>
      </View>
    </ScrollView>
  );
}

export function ActivityScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Activity</Text>
      <Text style={styles.sub}>Coming next: monthly spending, favorite places, average dinner cost, and kcal estimates.</Text>
    </View>
  );
}

export function ProfileScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.sub}>Coming next: default payment details, Instagram, phone, WhatsApp, and favorite split rules.</Text>
    </View>
  );
}

function buildFallbackResults(bill: BillHistoryEntry): SplitResult[] {
  const share = bill.people.length > 0 ? bill.amount / bill.people.length : bill.amount;
  return bill.people.map((name, index) => ({
    personId: `${bill.id}-${index}`,
    name,
    contactType: 'none',
    color: fallbackColors[index % fallbackColors.length],
    emoji: name.slice(0, 1).toUpperCase(),
    items: [],
    itemSubtotal: share,
    extras: 0,
    total: share,
    kcal: 0
  }));
}

const fallbackColors = ['#3F6BFF', '#F973B7', '#22C55E', '#F59E0B', '#8B5CF6', '#06B6D4'];

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 24, gap: 14 },
  center: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 30, fontWeight: '900', color: theme.color.text },
  sub: { color: theme.color.muted, fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 8 },
  card: { backgroundColor: theme.color.card, borderRadius: 22, padding: 16, ...theme.shadow },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyIcon: { width: 48, height: 48, borderRadius: 18, backgroundColor: theme.color.blue, alignItems: 'center', justifyContent: 'center' },
  cardMain: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '900', color: theme.color.text },
  cardSub: { marginTop: 4, color: theme.color.muted, fontWeight: '600' },
  amountBlock: { alignItems: 'flex-end', gap: 4 },
  amount: { color: theme.color.blue, fontSize: 22, fontWeight: '900' },
  note: { marginTop: 12, color: theme.color.blueDark, fontWeight: '700', backgroundColor: theme.color.blueSoft, padding: 10, borderRadius: 14 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: theme.color.blueSoft, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  backText: { color: theme.color.blue, fontWeight: '900' },
  detailHero: { backgroundColor: theme.color.blue, borderRadius: 28, padding: 20, ...theme.shadow },
  detailLabel: { color: '#EAF0FF', fontWeight: '800' },
  detailTitle: { marginTop: 4, color: '#FFFFFF', fontSize: 30, fontWeight: '900' },
  detailSub: { marginTop: 6, color: '#EAF0FF', fontWeight: '700' },
  detailAmount: { marginTop: 18, color: '#FFFFFF', fontSize: 38, fontWeight: '900' },
  prettyReceipt: { backgroundColor: '#FFFDF8', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#F2E7D2', ...theme.shadow },
  fullReceiptCard: { backgroundColor: '#FFFDF8', borderRadius: 22, padding: 14, borderWidth: 1, borderColor: '#F2E7D2', ...theme.shadow },
  fullItemRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3E9D6' },
  fullItemLeft: { flex: 1 },
  fullItemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  kcalText: { color: theme.color.muted, fontSize: 12, fontWeight: '700' },
  fullItemPrice: { color: theme.color.text, fontWeight: '900', marginLeft: 6 },
  unassignedText: { marginTop: 6, color: theme.color.muted, fontWeight: '700' },
  splitText: { marginTop: 6, color: theme.color.blueDark, fontWeight: '900' },
  fullItemRight: { width: 86, alignItems: 'flex-end', justifyContent: 'center' },
  chipsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  chip: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  noReceiptSaved: { padding: 18, alignItems: 'center' },
  noReceiptText: { color: theme.color.muted, fontWeight: '700' },
  receiptTotalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10 },
  receiptTotalsLabel: { color: theme.color.muted, fontWeight: '900' },
  receiptTotalsValue: { color: theme.color.text, fontWeight: '900' },
  receiptHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#EFE3CC', paddingBottom: 12, marginBottom: 12 },
  receiptTitle: { fontSize: 20, fontWeight: '900', color: theme.color.text },
  receiptMeta: { color: theme.color.muted, fontWeight: '700', marginTop: 2 },
  originalImageCard: { backgroundColor: theme.color.card, borderRadius: 22, padding: 14, marginTop: 14, ...theme.shadow },
  originalImageLabel: { fontSize: 14, fontWeight: '900', color: theme.color.text, marginBottom: 10 },
  originalImage: { width: '100%', height: 220, borderRadius: 18, backgroundColor: theme.color.background },
  noImagePlaceholder: { width: '100%', height: 220, borderRadius: 18, borderWidth: 1, borderColor: theme.color.line, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.color.background },
  noImageText: { color: theme.color.muted, fontWeight: '700', textAlign: 'center', paddingHorizontal: 12 },
  splitHeader: { fontSize: 18, fontWeight: '900', color: theme.color.text, marginBottom: 12 },
  savedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ECFDF3', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  savedBadgeText: { color: theme.color.green, fontWeight: '900' },
  personReceiptBlock: { borderBottomWidth: 1, borderBottomColor: '#F2E7D2', paddingVertical: 12 },
  personReceiptTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  smallAvatar: { width: 38, height: 38, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  smallAvatarText: { color: '#FFFFFF', fontWeight: '900' },
  personReceiptNameBlock: { flex: 1 },
  personReceiptName: { color: theme.color.text, fontSize: 16, fontWeight: '900' },
  personReceiptSub: { color: theme.color.muted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  personReceiptTotal: { color: theme.color.text, fontSize: 20, fontWeight: '900' },
  receiptLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  receiptLineName: { color: theme.color.text, fontWeight: '700', flex: 1 },
  receiptLinePrice: { color: theme.color.text, fontWeight: '900' },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14 },
  totalLineText: { color: theme.color.text, fontSize: 18, fontWeight: '900' },
  totalLineAmount: { color: theme.color.blue, fontSize: 24, fontWeight: '900' },
  detailActions: { gap: 10 },
  actionButton: { height: 52, borderRadius: 18, backgroundColor: theme.color.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...theme.shadow },
  actionButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
  outlineButton: { height: 52, borderRadius: 18, backgroundColor: theme.color.card, borderWidth: 1.5, borderColor: theme.color.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  outlineButtonText: { color: theme.color.blue, fontWeight: '900', fontSize: 15 }
});
