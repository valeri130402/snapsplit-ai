import React, { useRef } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../components/AppButton';
import { SplitResult } from '../types';
import { theme } from '../theme';
import { money } from '../logic/splitEngine';

export function SummaryScreen({
  merchant,
  results,
  grandTotal,
  onDone
}: {
  merchant: string;
  results: SplitResult[];
  grandTotal: number;
  onDone: () => void;
}) {
  const message = buildShareMessage(merchant, results, grandTotal);
  const receiptRef = useRef<View | null>(null);

  async function savePrettyReceiptImage() {
    try {
      if (!receiptRef.current) return Alert.alert('Error', 'Receipt view not available');
      const uri = await captureRef(receiptRef.current, { format: 'png', quality: 0.9 });
      if (!(await Sharing.isAvailableAsync())) {
        // fallback to system share
        await Share.share({ message, url: uri } as any);
        return;
      }
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert('Save failed', 'Could not create receipt image.');
    }
  }

  async function savePrettyReceiptToPhotos() {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow access to save images to your Photos.');
        return;
      }
      if (!receiptRef.current) return Alert.alert('Error', 'Receipt view not available');
      const uri = await captureRef(receiptRef.current, { format: 'png', quality: 0.9 });
      const asset = await MediaLibrary.createAssetAsync(uri);
      try {
        await MediaLibrary.createAlbumAsync('SnapSplit', asset, false);
      } catch (_) {
        // ignore if album exists
      }
      Alert.alert('Saved', 'Receipt saved to Photos');
    } catch (e) {
      Alert.alert('Save failed', 'Could not save receipt to Photos.');
    }
  }

  async function shareResult(label: string) {
    if (label === 'phone' || label === 'instagram' || label === 'whatsapp') {
      Alert.alert('Demo send option', 'In the MVP this opens the system share sheet. Later we can connect direct sending through contacts/WhatsApp/Instagram.');
    }
    await Share.share({ message });
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="checkmark-circle" size={44} color={theme.color.green} />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>All set! Split saved.</Text>
          <Text style={styles.headerSub}>This split is saved to History. You can send it now or later.</Text>
        </View>
      </View>

      <Text style={styles.title}>Here's what everyone owes</Text>

      <View collapsable={false} ref={receiptRef} style={styles.prettyReceipt}>
        <View style={styles.prettyHeader}>
          <View>
            <Text style={styles.prettyTitle}>{merchant}</Text>
            <Text style={styles.prettySub}>Pretty receipt preview</Text>
          </View>
          <Text style={styles.prettyTotal}>{money(grandTotal)}</Text>
        </View>

        {results.map((result) => (
          <View key={result.personId} style={styles.personReceiptBlock}>
            <View style={styles.personHeaderRow}>
              <View style={[styles.avatar, { backgroundColor: result.color }]}>
                <Text style={styles.avatarText}>{(result.name || '?').slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={styles.personBlock}>
                <Text style={styles.name}>{result.name}</Text>
                <Text style={styles.sub}>{result.items.length} items · {Math.round(result.kcal)} kcal</Text>
              </View>
              <Text style={styles.amount}>{money(result.total)}</Text>
            </View>

            <View style={styles.allItemsBlock}>
              {result.items.length === 0 ? (
                <Text style={styles.itemLineMuted}>No assigned items</Text>
              ) : (
                result.items.map((item) => (
                  <View key={`${result.personId}-${item.id}`} style={styles.itemLineRow}>
                    <Text style={styles.itemLine}>• {item.name}{item.quantity > 1 ? ` x${item.quantity}` : ''}{item.assignedTo.length > 1 ? ` / ${item.assignedTo.length}` : ''}</Text>
                    <Text style={styles.itemLinePrice}>{money(item.price / Math.max(1, item.assignedTo.length || 1))}</Text>
                  </View>
                ))
              )}
              {result.extras > 0 ? (
                <View style={styles.itemLineRow}>
                  <Text style={styles.itemLine}>• Tip share</Text>
                  <Text style={styles.itemLinePrice}>{money(result.extras)}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total bill</Text>
        <Text style={styles.totalValue}>{money(grandTotal)}</Text>
      </View>

      <AppButton title="Send via Phone" icon="call-outline" onPress={() => shareResult('phone')} />
      <AppButton title="Send via WhatsApp" icon="logo-whatsapp" variant="outline" onPress={() => shareResult('whatsapp')} />
      <AppButton title="Send via Instagram" icon="logo-instagram" variant="outline" onPress={() => shareResult('instagram')} />
      <AppButton title="Save / Share Image" icon="image-outline" variant="outline" onPress={savePrettyReceiptImage} />
      <AppButton title="Save to Photos" icon="download-outline" variant="soft" onPress={savePrettyReceiptToPhotos} />
      <AppButton title="Done" variant="soft" onPress={onDone} />
      <Text style={styles.footer}>For now, “save image” shares a formatted text receipt. Later we can export the pretty receipt as a real image.</Text>
    </ScrollView>
  );
}

function buildShareMessage(merchant: string, results: SplitResult[], grandTotal: number) {
  const lines = results.map((result) => {
    const itemList = result.items.map((item) => `${item.name}${item.assignedTo.length > 1 ? ` /${item.assignedTo.length}` : ''}`).join(', ') || 'no items';
    return `${result.name}: ${money(result.total)} — ${itemList}`;
  });
  return `SnapSplit receipt for ${merchant}\nTotal: ${money(grandTotal)}\n\n${lines.join('\n')}\n\nSplit the bill, not the friendship.`;
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 24, gap: 14 },
  header: { backgroundColor: '#ECFDF3', borderWidth: 1, borderColor: '#ABEFC6', borderRadius: 24, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' },
  headerText: { flex: 1 },
  headerTitle: { color: '#067647', fontWeight: '900', fontSize: 17 },
  headerSub: { color: '#067647', marginTop: 3, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '900', color: theme.color.text },
  prettyReceipt: { backgroundColor: '#FFFDF8', borderRadius: 26, padding: 16, borderWidth: 1, borderColor: '#F2E7D2', ...theme.shadow },
  prettyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F2E7D2', paddingBottom: 12, marginBottom: 8 },
  prettyTitle: { color: theme.color.text, fontSize: 22, fontWeight: '900' },
  prettySub: { color: theme.color.muted, marginTop: 3, fontWeight: '700' },
  prettyTotal: { color: theme.color.blue, fontSize: 24, fontWeight: '900' },
  personReceiptBlock: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F2E7D2' },
  personHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  personBlock: { flex: 1 },
  name: { fontSize: 16, fontWeight: '900', color: theme.color.text },
  amount: { fontSize: 22, fontWeight: '900', color: theme.color.text },
  sub: { color: theme.color.muted, fontSize: 12, marginTop: 2, fontWeight: '700' },
  allItemsBlock: { marginTop: 8, paddingLeft: 58 },
  itemLineRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 3 },
  itemLine: { flex: 1, color: theme.color.blueDark, fontSize: 13, fontWeight: '700' },
  itemLinePrice: { color: theme.color.text, fontSize: 13, fontWeight: '900' },
  itemLineMuted: { color: theme.color.muted, fontSize: 13, fontWeight: '700' },
  totalBox: { backgroundColor: theme.color.blue, borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: '#EAF0FF', fontWeight: '800' },
  totalValue: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
  footer: { textAlign: 'center', color: theme.color.muted, fontWeight: '600', lineHeight: 19 }
});
