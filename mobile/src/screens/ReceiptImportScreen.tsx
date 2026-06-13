import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../components/AppButton';
import { ReceiptItem } from '../types';
import { money } from '../logic/splitEngine';
import { theme } from '../theme';

export function ReceiptImportScreen({
  merchant,
  items,
  total,
  onTakePhoto,
  onUpload,
  onUseDemo,
  onDone
}: {
  merchant: string;
  items: ReceiptItem[];
  total: number;
  onTakePhoto: () => void;
  onUpload: () => void;
  onUseDemo: () => void;
  onDone: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="camera-outline" size={42} color="#FFFFFF" />
        <Text style={styles.title}>Add your receipt</Text>
        <Text style={styles.subtitle}>Take a picture or upload from gallery. For now, demo OCR loads sample receipt items.</Text>
      </View>

      <View style={styles.actionsCard}>
        <AppButton title="Take Picture" icon="camera-outline" onPress={onTakePhoto} />
        <AppButton title="Upload from Phone" icon="image-outline" variant="outline" onPress={onUpload} />
        <AppButton title="Use Demo Receipt" icon="sparkles-outline" variant="soft" onPress={onUseDemo} />
      </View>

      <View style={styles.receiptCard}>
        <View style={styles.receiptHeader}>
          <View>
            <Text style={styles.receiptLabel}>Analyzed receipt</Text>
            <Text style={styles.merchant}>{merchant || 'Enter restaurant name'}</Text>
          </View>
          <View style={styles.aiBadge}>
            <Ionicons name="scan-outline" size={16} color={theme.color.blue} />
            <Text style={styles.aiBadgeText}>Demo AI</Text>
          </View>
        </View>

        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>{money(item.price)}</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Receipt total</Text>
          <Text style={styles.total}>{money(total)}</Text>
        </View>
      </View>

      <AppButton title="Done — Set People & Split" icon="checkmark-circle-outline" onPress={onDone} />
      <Text style={styles.footer}>Demo OCR mode: real AI receipt reading will be connected next.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 24, gap: 16 },
  header: { backgroundColor: theme.color.blue, borderRadius: 30, padding: 22, alignItems: 'center', ...theme.shadow },
  title: { marginTop: 10, color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  subtitle: { marginTop: 8, color: '#EAF0FF', textAlign: 'center', fontSize: 15, lineHeight: 21, fontWeight: '600' },
  actionsCard: { backgroundColor: theme.color.card, borderRadius: 26, padding: 14, gap: 12, ...theme.shadow },
  receiptCard: { backgroundColor: theme.color.card, borderRadius: 26, padding: 18, ...theme.shadow },
  receiptHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  receiptLabel: { color: theme.color.muted, fontWeight: '800', fontSize: 13 },
  merchant: { marginTop: 3, color: theme.color.text, fontWeight: '900', fontSize: 22 },
  aiBadge: { backgroundColor: theme.color.blueSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 5 },
  aiBadgeText: { color: theme.color.blue, fontWeight: '900', fontSize: 12 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.color.line },
  itemName: { color: theme.color.text, fontWeight: '800', flex: 1 },
  itemPrice: { color: theme.color.text, fontWeight: '900' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16 },
  totalLabel: { color: theme.color.muted, fontWeight: '900' },
  total: { color: theme.color.text, fontSize: 24, fontWeight: '900' },
  footer: { color: theme.color.muted, textAlign: 'center', lineHeight: 19, fontWeight: '600' }
});
