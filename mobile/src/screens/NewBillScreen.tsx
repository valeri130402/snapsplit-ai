import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../components/AppButton';
import { Person, ReceiptItem, SplitMode } from '../types';
import { getItemsTotal, money } from '../logic/splitEngine';
import { theme } from '../theme';

export function NewBillScreen({
  merchant,
  people,
  items,
  tip,
  splitMode,
  onSplitModeChange,
  onTipChange,
  onUseTenPercentTip,
  onClearTip,
  onAddContacts,
  onPeopleCountChange,
  onPersonChange,
  onMerchantChange,
  onContinue
}: {
  merchant: string;
  people: Person[];
  items: ReceiptItem[];
  tip: string;
  splitMode: SplitMode;
  onSplitModeChange: (mode: SplitMode) => void;
  onTipChange: (tip: string) => void;
  onUseTenPercentTip: () => void;
  onClearTip: () => void;
  onAddContacts: () => void;
  onPeopleCountChange: (count: number) => void;
  onPersonChange: (personId: string, patch: Partial<Person>) => void;
  onMerchantChange: (merchant: string) => void;
  onContinue: () => void;
}) {
  const parsedTip = Number.parseFloat(tip.replace(',', '.')) || 0;
  const itemsTotal = getItemsTotal(items);
  const grandTotal = itemsTotal + parsedTip;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerCard}>
        <Text style={styles.screenTitle}>Set up split</Text>
        <Text style={styles.screenSub}>Receipt from {merchant} · {items.length} items · {money(itemsTotal)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Restaurant name</Text>
        <TextInput
          value={merchant}
          onChangeText={onMerchantChange}
          placeholder="Enter restaurant name"
          style={styles.restaurantInput}
          placeholderTextColor={theme.color.muted}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.label}>People</Text>
          <Pressable onPress={onAddContacts} style={styles.contactButton}>
            <Ionicons name="people-outline" size={16} color={theme.color.blue} />
            <Text style={styles.contactButtonText}>Add from phone</Text>
          </Pressable>
        </View>
        <View style={styles.counter}>
          <AppButton title="−" onPress={() => onPeopleCountChange(Math.max(1, people.length - 1))} variant="outline" style={styles.counterButton} />
          <Text style={styles.counterNumber}>{people.length}</Text>
          <AppButton title="+" onPress={() => onPeopleCountChange(people.length + 1)} variant="outline" style={styles.counterButton} />
        </View>

        {people.map((person, index) => (
          <View key={person.id} style={styles.personRow}>
            <View style={[styles.avatar, { backgroundColor: person.color }]}>
              <Text style={styles.avatarText}>{(person.name || person.emoji || `P${index + 1}` || '?').slice(0, 1).toUpperCase()}</Text>
            </View>
            <TextInput value={person.name} onChangeText={(name) => onPersonChange(person.id, { name })} placeholder={`Person ${index + 1}`} style={[styles.input, styles.nameInput]} />
            <TextInput value={person.contact ?? ''} onChangeText={(contact) => onPersonChange(person.id, { contact })} placeholder="phone / @insta" style={styles.input} />
          </View>
        ))}
        <Text style={styles.helper}>Contacts are optional. You can send automatically later, or save the image and send it manually.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Receipt preview</Text>
        <View style={styles.miniReceipt}>
          {items.map((item) => (
            <View key={item.id} style={styles.receiptLine}>
              <Text style={styles.receiptItem}>{item.name}</Text>
              <Text style={styles.receiptPrice}>{money(item.price)}</Text>
            </View>
          ))}
          <View style={styles.receiptTotalLine}>
            <Text style={styles.receiptTotalLabel}>Items total</Text>
            <Text style={styles.receiptTotal}>{money(itemsTotal)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Tip</Text>
        <View style={styles.tipOptions}>
          <Pressable onPress={onUseTenPercentTip} style={styles.tipPreset}>
            <Text style={styles.tipPresetText}>Use 10% · {money(itemsTotal * 0.1)}</Text>
          </Pressable>
          <Pressable onPress={onClearTip} style={styles.tipPresetLight}>
            <Text style={styles.tipPresetLightText}>No tip</Text>
          </Pressable>
        </View>
        <TextInput value={tip} onChangeText={onTipChange} keyboardType="decimal-pad" style={styles.tipInput} placeholder="0.00" />
        <Text style={styles.helper}>Tip is added to the final bill and split automatically using the selected split method.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>How do you want to split?</Text>
        <View style={styles.modeRow}>
          <Pressable onPress={() => onSplitModeChange('manual')} style={[styles.modeCard, splitMode === 'manual' && styles.modeCardActive]}>
            <Ionicons name="color-wand-outline" size={24} color={splitMode === 'manual' ? '#FFFFFF' : theme.color.blue} />
            <Text style={[styles.modeTitle, splitMode === 'manual' && styles.modeTextActive]}>Manual</Text>
            <Text style={[styles.modeSub, splitMode === 'manual' && styles.modeSubActive]}>Assign items by color</Text>
          </Pressable>
          <Pressable onPress={() => onSplitModeChange('equal')} style={[styles.modeCard, splitMode === 'equal' && styles.modeCardActive]}>
            <Ionicons name="people-circle-outline" size={24} color={splitMode === 'equal' ? '#FFFFFF' : theme.color.blue} />
            <Text style={[styles.modeTitle, splitMode === 'equal' && styles.modeTextActive]}>Equal</Text>
            <Text style={[styles.modeSub, splitMode === 'equal' && styles.modeSubActive]}>Everyone pays same</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.grandTotalBox}>
        <Text style={styles.grandTotalLabel}>Total with tip</Text>
        <Text style={styles.grandTotalValue}>{money(grandTotal)}</Text>
      </View>
      <AppButton title={splitMode === 'equal' ? 'Calculate Equal Split' : 'Continue to Assign Items'} icon="arrow-forward-outline" onPress={onContinue} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 24, gap: 16 },
  headerCard: { backgroundColor: theme.color.blue, borderRadius: 28, padding: 20, ...theme.shadow },
  screenTitle: { fontSize: 26, color: '#FFFFFF', fontWeight: '900' },
  screenSub: { marginTop: 6, color: '#EAF0FF', fontWeight: '700' },
  card: { backgroundColor: theme.color.card, borderRadius: 24, padding: 18, ...theme.shadow },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  label: { fontSize: 17, fontWeight: '900', color: theme.color.text, marginBottom: 14 },
  contactButton: { backgroundColor: theme.color.blueSoft, borderRadius: 999, paddingHorizontal: 12, height: 34, flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactButtonText: { color: theme.color.blue, fontWeight: '900', fontSize: 12 },
  counter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 14 },
  counterButton: { width: 54, height: 44 },
  counterNumber: { fontSize: 34, fontWeight: '900', color: theme.color.text, minWidth: 50, textAlign: 'center' },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  avatar: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontWeight: '900', fontSize: 17 },
  input: { flex: 1, backgroundColor: theme.color.background, borderWidth: 1, borderColor: theme.color.line, borderRadius: 16, paddingHorizontal: 12, height: 44, color: theme.color.text, fontWeight: '700' },
  restaurantInput: { backgroundColor: theme.color.background, borderWidth: 1, borderColor: theme.color.line, borderRadius: 16, paddingHorizontal: 14, height: 52, color: theme.color.text, fontWeight: '700', marginBottom: 10 },
  nameInput: { flex: 0.75 },
  helper: { color: theme.color.muted, lineHeight: 20, fontSize: 13, marginTop: 4, fontWeight: '600' },
  miniReceipt: { borderWidth: 1, borderColor: theme.color.line, borderRadius: 18, padding: 12, backgroundColor: theme.color.background },
  receiptLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.color.line },
  receiptItem: { color: theme.color.text, fontWeight: '700', flex: 1 },
  receiptPrice: { color: theme.color.text, fontWeight: '900' },
  receiptTotalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12 },
  receiptTotalLabel: { color: theme.color.muted, fontWeight: '900' },
  receiptTotal: { color: theme.color.text, fontWeight: '900', fontSize: 18 },
  tipOptions: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  tipPreset: { backgroundColor: theme.color.blue, borderRadius: 16, paddingHorizontal: 14, height: 42, alignItems: 'center', justifyContent: 'center', flex: 1 },
  tipPresetText: { color: '#FFFFFF', fontWeight: '900' },
  tipPresetLight: { backgroundColor: theme.color.blueSoft, borderRadius: 16, paddingHorizontal: 14, height: 42, alignItems: 'center', justifyContent: 'center' },
  tipPresetLightText: { color: theme.color.blue, fontWeight: '900' },
  tipInput: { height: 52, borderRadius: 18, borderWidth: 1.5, borderColor: theme.color.line, textAlign: 'center', fontSize: 22, fontWeight: '900', color: theme.color.text, backgroundColor: theme.color.background },
  modeRow: { flexDirection: 'row', gap: 12 },
  modeCard: { flex: 1, borderWidth: 1.5, borderColor: theme.color.line, borderRadius: 20, padding: 14, backgroundColor: theme.color.background },
  modeCardActive: { backgroundColor: theme.color.blue, borderColor: theme.color.blue },
  modeTitle: { marginTop: 8, color: theme.color.text, fontSize: 17, fontWeight: '900' },
  modeTextActive: { color: '#FFFFFF' },
  modeSub: { marginTop: 3, color: theme.color.muted, fontSize: 12, fontWeight: '700' },
  modeSubActive: { color: '#EAF0FF' },
  grandTotalBox: { backgroundColor: theme.color.blueSoft, borderRadius: 22, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandTotalLabel: { color: theme.color.blueDark, fontWeight: '900' },
  grandTotalValue: { color: theme.color.blue, fontSize: 25, fontWeight: '900' }
});
