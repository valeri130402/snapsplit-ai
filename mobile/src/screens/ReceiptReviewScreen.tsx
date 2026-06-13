import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../components/AppButton';
import { ReceiptItem } from '../types';
import { money, getItemsTotal } from '../logic/splitEngine';
import { theme } from '../theme';

export function ReceiptReviewScreen({
    merchant,
    items: initialItems,
    tip,
    warning,
    rawText,
    onMerchantChange,
    onTipChange,
    onCancel,
    onContinue
}: {
    merchant: string;
    items: ReceiptItem[];
    tip: string;
    warning?: string;
    rawText?: string;
    onMerchantChange: (merchant: string) => void;
    onTipChange: (tip: string) => void;
    onCancel: () => void;
    onContinue: (items: ReceiptItem[], tip: string) => void;
}) {
    const [items, setItems] = useState<ReceiptItem[]>(initialItems.map((i) => ({ ...i, quantity: i.quantity ?? 1 })));

    function updateItem(id: string, patch: Partial<ReceiptItem>) {
        setItems((cur) => cur.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    }

    function removeItem(id: string) {
        Alert.alert('Delete item', 'Remove this item from the receipt?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => setItems((cur) => cur.filter((it) => it.id !== id)) }
        ]);
    }

    function addItem() {
        const id = `new-${Date.now()}`;
        setItems((cur) => [...cur, { id, name: 'New item', price: 0, quantity: 1, assignedTo: [] }]);
    }

    const itemsTotal = getItemsTotal(items);
    const parsedTip = Number.parseFloat(tip.replace(',', '.')) || 0;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.headerCard}>
                    <Text style={styles.title}>Review receipt</Text>
                    <Text style={styles.sub}>Edit the restaurant name, items, prices, and quantities before splitting.</Text>
                    <TextInput
                        style={styles.merchantInput}
                        value={merchant}
                        onChangeText={onMerchantChange}
                        placeholder="Enter restaurant name"
                        placeholderTextColor={theme.color.muted}
                        autoCapitalize="words"
                        clearButtonMode="while-editing"
                    />
                    {warning ? <Text style={styles.warningText}>{warning}</Text> : null}
                    {rawText ? <View style={styles.rawTextCard}><Text style={styles.rawTextLabel}>OCR text:</Text><Text style={styles.rawText}>{rawText}</Text></View> : null}
                </View>

                <View style={styles.listCard}>
                    {items.map((item) => (
                        <View key={item.id} style={styles.itemCard}>
                            <View style={styles.itemRow}>
                                <TextInput
                                    style={styles.nameInput}
                                    value={item.name}
                                    onChangeText={(t) => updateItem(item.id, { name: t })}
                                    autoCorrect={false}
                                    autoCapitalize="words"
                                    clearButtonMode="while-editing"
                                    returnKeyType="next"
                                />
                                <View style={styles.itemMetaColumn}>
                                    <TextInput
                                        style={styles.quantityInput}
                                        value={String(item.quantity)}
                                        keyboardType="number-pad"
                                        onChangeText={(t) => updateItem(item.id, { quantity: Math.max(1, Number.parseInt(t || '1')) })}
                                        clearButtonMode="while-editing"
                                        returnKeyType="next"
                                    />
                                    <Text style={styles.quantityLabel}>Qty</Text>
                                </View>
                                <TextInput
                                    style={styles.priceInput}
                                    value={item.price.toFixed(2)}
                                    keyboardType="decimal-pad"
                                    onChangeText={(t) => updateItem(item.id, { price: Number.parseFloat(t.replace(',', '.') || '0') })}
                                    clearButtonMode="while-editing"
                                    returnKeyType="done"
                                />
                                <Pressable onPress={() => removeItem(item.id)} style={styles.deleteButton}>
                                    <Ionicons name="trash-outline" size={20} color={theme.color.danger} />
                                </Pressable>
                            </View>
                        </View>
                    ))}

                    <View style={styles.addRowWrap}>
                        <Pressable onPress={addItem} style={styles.addButton}><Ionicons name="add" size={18} color="#FFFFFF" /><Text style={styles.addTextWhite}>Add item</Text></Pressable>
                    </View>
                </View>

                <View style={styles.totalsCard}>
                    <View style={styles.totalsRow}><Text style={styles.totalsLabel}>Items subtotal</Text><Text style={styles.totalsValue}>{money(itemsTotal)}</Text></View>
                    <View style={styles.tipRow}><Text style={styles.totalsLabel}>Tip</Text><TextInput style={styles.tipInput} value={tip} onChangeText={onTipChange} keyboardType="decimal-pad" clearButtonMode="while-editing" returnKeyType="done" /></View>
                    <View style={styles.totalsRow}><Text style={styles.totalsLabel}>Grand total</Text><Text style={styles.totalsValue}>{money(itemsTotal + parsedTip)}</Text></View>
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <AppButton title="Looks good" icon="checkmark-circle-outline" onPress={() => onContinue(items, tip)} style={styles.primaryButton} />
                <AppButton title="Cancel" variant="soft" onPress={onCancel} style={styles.cancelButton} />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    container: { padding: 18, paddingBottom: 36, gap: 14 },
    headerCard: { backgroundColor: theme.color.card, borderRadius: 16, padding: 14, ...theme.shadow },
    title: { fontSize: 20, fontWeight: '900', color: theme.color.text },
    sub: { marginTop: 6, color: theme.color.muted, fontWeight: '700' },
    listCard: { paddingTop: 8, gap: 10 },
    itemCard: { backgroundColor: theme.color.card, borderRadius: 14, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: theme.color.line },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    nameInput: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, height: 48, borderWidth: 1, borderColor: theme.color.line, color: theme.color.text, fontWeight: '700' },
    itemMetaColumn: { width: 70, alignItems: 'center', justifyContent: 'center' },
    quantityInput: { width: 64, backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 10, height: 48, borderWidth: 1, borderColor: theme.color.line, textAlign: 'center', color: theme.color.text, fontWeight: '900' },
    quantityLabel: { marginTop: 4, color: theme.color.muted, fontSize: 11, fontWeight: '700' },
    priceInput: { width: 110, backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, height: 48, borderWidth: 1, borderColor: theme.color.line, textAlign: 'right', color: theme.color.text, fontWeight: '900' },
    deleteButton: { padding: 8 },
    addRowWrap: { alignItems: 'center', marginTop: 6 },
    addButton: { backgroundColor: theme.color.blue, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
    addTextWhite: { color: '#FFFFFF', fontWeight: '900' },
    addText: { color: theme.color.blue, fontWeight: '900' },
    totalsCard: { backgroundColor: theme.color.card, borderRadius: 14, padding: 12, marginTop: 8, borderWidth: 1, borderColor: theme.color.line },
    totalsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    totalsLabel: { color: theme.color.muted, fontWeight: '900' },
    totalsValue: { color: theme.color.text, fontWeight: '900' },
    tipRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    tipInput: { width: 120, height: 44, borderRadius: 12, borderWidth: 1, borderColor: theme.color.line, backgroundColor: '#FFFFFF', textAlign: 'right', fontWeight: '900', color: theme.color.text, paddingHorizontal: 10 },
    warningText: { marginTop: 10, color: theme.color.warning, fontWeight: '900' },
    rawTextCard: { marginTop: 10, backgroundColor: '#F9F9F8', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: theme.color.line },
    rawTextLabel: { color: theme.color.muted, fontSize: 12, fontWeight: '700', marginBottom: 6 },
    rawText: { color: theme.color.text, fontSize: 13, lineHeight: 18 },
    bottomBar: { position: 'absolute', left: 18, right: 18, bottom: 18, flexDirection: 'row', gap: 10 },
    primaryButton: { flex: 1 },
    cancelButton: { width: 110 }
});
