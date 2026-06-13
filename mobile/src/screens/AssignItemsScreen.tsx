import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../components/AppButton';
import { Person, ReceiptItem, SplitResult } from '../types';
import { theme } from '../theme';
import { money } from '../logic/splitEngine';

export function AssignItemsScreen({
  merchant,
  people,
  items,
  selectedItemId,
  results,
  tip,
  onSelectedItemChange,
  onTogglePerson,
  onAssignEveryone,
  onClearSelected,
  onPreviousItem,
  onNextItem,
  onQuickReview
}: {
  merchant: string;
  people: Person[];
  items: ReceiptItem[];
  selectedItemId: string;
  results: SplitResult[];
  tip: string;
  onSelectedItemChange: (itemId: string) => void;
  onTogglePerson: (personId: string) => void;
  onAssignEveryone: () => void;
  onClearSelected: () => void;
  onPreviousItem: () => void;
  onNextItem: () => void;
  onQuickReview: () => void;
}) {
  const selectedIndex = Math.max(0, items.findIndex((item) => item.id === selectedItemId));
  const selectedItem = items[selectedIndex] ?? items[0];
  const assignedCount = items.filter((item) => getTotalAssignedPortions(item) >= (item.quantity ?? 1)).length;
  const allAssigned = assignedCount === items.length;

  function getAssignedPortions(item: ReceiptItem) {
    return item.assignedPortions && Object.keys(item.assignedPortions).length > 0
      ? item.assignedPortions
      : item.assignedTo.reduce((map: Record<string, number>, personId) => {
        map[personId] = (map[personId] || 0) + 1;
        return map;
      }, {} as Record<string, number>);
  }

  function getTotalAssignedPortions(item: ReceiptItem) {
    return Object.values(getAssignedPortions(item)).reduce((sum, count) => sum + count, 0);
  }

  function getUnitPrice(item: ReceiptItem) {
    return item.quantity > 0 ? item.price / item.quantity : item.price;
  }

  function previewPerson(person: Person) {
    const result = results.find((entry) => entry.personId === person.id);
    const itemLines = result?.items.length
      ? result.items.map((item) => `• ${item.name}${item.assignedTo.length > 1 ? ` /${item.assignedTo.length}` : ''}`).join('\n')
      : 'No items yet.';
    Alert.alert(`${person.name}'s receipt`, `${itemLines}\n\nTotal: ${money(result?.total ?? 0)}`);
  }

  function selectedPeopleText(item: ReceiptItem) {
    const portions = getAssignedPortions(item);
    const personNames = Object.entries(portions)
      .map(([personId, count]) => {
        const personName = people.find((person) => person.id === personId)?.name || '?';
        return count > 1 ? `${personName} x${count}` : personName;
      });

    if (personNames.length === 0) return 'Unassigned';
    if (Object.keys(portions).length === people.length) return 'Everyone';
    return personNames.join(', ');
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.topCard}>
        <Text style={styles.title}>Assign items</Text>
        <Text style={styles.subtitle}>{merchant} · use arrows to move item-by-item. Tap one person or several people.</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${items.length ? (assignedCount / items.length) * 100 : 0}%` }]} />
        </View>
        <Text style={styles.progressText}>{assignedCount} of {items.length} items assigned</Text>
      </View>

      <View style={styles.peopleGrid}>
        {people.map((person, index) => {
          const selectedItemPeople = selectedItem ? Object.keys(getAssignedPortions(selectedItem)) : [];
          const isSelectedForItem = selectedItemPeople.includes(person.id);
          return (
            <Pressable
              key={person.id}
              onPress={() => onTogglePerson(person.id)}
              onLongPress={() => previewPerson(person)}
              style={[styles.personBubble, isSelectedForItem && { borderColor: person.color, backgroundColor: hexToRgba(person.color, 0.12), opacity: 1 }]}
            >
              <View style={[styles.avatar, { backgroundColor: person.color }]}>
                <Text style={styles.avatarText}>{(person.name || person.emoji || '?').slice(0, 1).toUpperCase()}</Text>
              </View>
              <Text style={styles.personName} numberOfLines={1}>{person.name || `Person ${index + 1}`}</Text>
              <Text style={[styles.personMiniTotal, { color: person.color }]}>{money(results.find((r) => r.personId === person.id)?.total ?? 0)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.selectedItemCard}>
        <View style={styles.itemPagerRow}>
          <Pressable onPress={onPreviousItem} style={styles.arrowButton}>
            <Ionicons name="chevron-back" size={28} color={theme.color.blue} />
          </Pressable>
          <View style={styles.selectedItemMain}>
            <View style={styles.foodArt}>
              <Text style={styles.foodEmoji}>{getFoodEmoji(selectedItem?.name ?? '')}</Text>
            </View>
            <View style={styles.selectedItemTextBlock}>
              <Text style={styles.selectedLabel}>Item {selectedIndex + 1} of {items.length}</Text>
              <Text style={styles.selectedName}>{selectedItem?.name ?? 'No item'}</Text>
              <Text style={styles.selectedPrice}>{money(selectedItem?.price ?? 0)}{selectedItem?.quantity > 1 ? ` · ${money(getUnitPrice(selectedItem))} each` : ''}</Text>
              <Text style={styles.selectedAssigned}>{selectedItem ? `Assigned ${getTotalAssignedPortions(selectedItem)}/${selectedItem.quantity ?? 1}` : 'Unassigned'}</Text>
              <Text style={styles.selectedHint}>{selectedItem ? selectedPeopleText(selectedItem) : ''}</Text>
            </View>
          </View>
          <Pressable onPress={onNextItem} style={styles.arrowButton}>
            <Ionicons name="chevron-forward" size={28} color={theme.color.blue} />
          </Pressable>
        </View>
        <Text style={styles.selectedHint}>Tap a person to assign this item to them. Tap several people if it was shared.</Text>
        <View style={styles.quickActionsRow}>
          <Pressable onPress={onAssignEveryone} style={styles.quickAction}>
            <Ionicons name="people-outline" size={16} color={theme.color.blue} />
            <Text style={styles.quickActionText}>Split between everyone</Text>
          </Pressable>
          <Pressable onPress={onClearSelected} style={styles.quickActionLight}>
            <Ionicons name="close-circle-outline" size={16} color={theme.color.muted} />
            <Text style={styles.quickActionLightText}>Clear</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.receiptCard}>
        <View style={styles.receiptHeader}>
          <Text style={styles.receiptTitle}>Full receipt</Text>
          <Text style={styles.receiptTip}>Tip {money(Number.parseFloat(tip.replace(',', '.')) || 0)} auto-split</Text>
        </View>
        {items.map((item, index) => {
          const totalAssigned = getTotalAssignedPortions(item);
          const fullyAssigned = totalAssigned >= (item.quantity ?? 1);
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelectedItemChange(item.id)}
              style={[
                styles.receiptRow,
                selectedItemId === item.id && styles.receiptRowSelected,
                fullyAssigned && styles.receiptRowCompleted
              ]}
            >
              <View style={styles.transparentOwnerBand}>{renderOwnerBands(item, people)}</View>
              <View style={styles.colorRail}>{renderColorMarkers(item, people)}</View>
              <View style={styles.receiptItemBlock}>
                <Text style={styles.receiptItemName}>{index + 1}. {item.name}{item.quantity > 1 ? ` x${item.quantity}` : ''}</Text>
                <Text style={styles.receiptAssigned}>{selectedPeopleText(item)}</Text>
                {item.quantity > 1 ? (
                  <Text style={styles.receiptAssignedMeta}>{`€${(item.price / item.quantity).toFixed(2)} each · Assigned ${totalAssigned}/${item.quantity}`}</Text>
                ) : null}
                {fullyAssigned ? <Text style={styles.assignedBadge}>Assigned</Text> : null}
              </View>
              <Text style={styles.receiptPrice}>{money(item.price)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legendCard}>
        <Text style={styles.legendTitle}>Color legend</Text>
        <View style={styles.legendWrap}>
          {people.map((person, index) => (
            <View key={person.id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: person.color }]} />
              <Text style={styles.legendName}>{person.name || `Person ${index + 1}`}</Text>
            </View>
          ))}
        </View>
      </View>

      <AppButton title={allAssigned ? 'Quick Review — All Items Assigned' : 'Quick Review'} icon="list-outline" onPress={onQuickReview} />
      <Text style={styles.footer}>Long-press any person to preview their full receipt. Transparent colors show item ownership.</Text>
    </ScrollView>
  );
}

function getAssignedOwnerIds(item: ReceiptItem) {
  return item.assignedTo.length > 0 ? item.assignedTo : Object.keys(item.assignedPortions || {});
}

function renderColorMarkers(item: ReceiptItem, people: Person[]) {
  const owners = getAssignedOwnerIds(item);
  if (owners.length === 0) return <View style={styles.emptyMarker} />;
  return owners.map((personId) => {
    const color = getColorForPerson(personId, people);
    return <View key={personId} style={[styles.colorMarker, { backgroundColor: color }]} />;
  });
}

function renderOwnerBands(item: ReceiptItem, people: Person[]) {
  const owners = getAssignedOwnerIds(item);
  if (owners.length === 0) return null;
  return owners.map((personId) => (
    <View key={personId} style={[styles.ownerBandSegment, { backgroundColor: hexToRgba(getColorForPerson(personId, people), 0.18) }]} />
  ));
}

function getColorForPerson(personId: string, people: Person[]) {
  return people.find((person) => person.id === personId)?.color ?? theme.color.blue;
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getFoodEmoji(name: string) {
  const text = name.toLowerCase();
  if (text.includes('wine')) return '🍷';
  if (text.includes('pizza')) return '🍕';
  if (text.includes('dessert')) return '🍰';
  if (text.includes('salad')) return '🥗';
  if (text.includes('fries')) return '🍟';
  if (text.includes('coffee')) return '☕';
  if (text.includes('water')) return '💧';
  return '🍝';
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 24, gap: 14 },
  topCard: { backgroundColor: theme.color.card, borderRadius: 26, padding: 18, ...theme.shadow },
  title: { fontSize: 28, fontWeight: '900', color: theme.color.text },
  subtitle: { marginTop: 6, color: theme.color.muted, lineHeight: 20, fontWeight: '600' },
  progressBar: { marginTop: 14, height: 8, borderRadius: 999, backgroundColor: theme.color.line, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 999, backgroundColor: theme.color.blue },
  progressText: { marginTop: 8, color: theme.color.blue, fontWeight: '900', fontSize: 13 },
  peopleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  personBubble: { width: '30%', minHeight: 112, borderRadius: 24, backgroundColor: theme.color.background, alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: theme.color.line, opacity: 0.72 },
  avatar: { width: 52, height: 52, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  personName: { color: theme.color.text, fontWeight: '900', maxWidth: 78 },
  personMiniTotal: { fontSize: 12, fontWeight: '900' },
  selectedItemCard: { backgroundColor: theme.color.card, borderRadius: 28, padding: 16, ...theme.shadow },
  itemPagerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrowButton: { width: 42, height: 82, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.color.blueSoft },
  selectedItemMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  foodArt: { width: 82, height: 82, borderRadius: 24, backgroundColor: theme.color.background, alignItems: 'center', justifyContent: 'center' },
  foodEmoji: { fontSize: 43 },
  selectedItemTextBlock: { flex: 1 },
  selectedLabel: { color: theme.color.muted, fontWeight: '900', fontSize: 12 },
  selectedName: { marginTop: 4, fontSize: 20, fontWeight: '900', color: theme.color.text },
  selectedPrice: { marginTop: 4, color: theme.color.blue, fontSize: 21, fontWeight: '900' },
  selectedAssigned: { marginTop: 4, color: theme.color.muted, fontWeight: '800' },
  selectedHint: { marginTop: 14, color: theme.color.muted, textAlign: 'center', lineHeight: 19, fontWeight: '600' },
  quickActionsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  quickAction: { flex: 1.25, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, backgroundColor: theme.color.blueSoft },
  quickActionText: { color: theme.color.blue, fontWeight: '900' },
  quickActionLight: { flex: 0.75, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, backgroundColor: theme.color.background, borderWidth: 1, borderColor: theme.color.line },
  quickActionLightText: { color: theme.color.muted, fontWeight: '900' },
  receiptCard: { backgroundColor: theme.color.card, borderRadius: 26, padding: 12, ...theme.shadow },
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8 },
  receiptTitle: { color: theme.color.text, fontSize: 18, fontWeight: '900' },
  receiptTip: { color: theme.color.muted, fontSize: 12, fontWeight: '800' },
  receiptRow: { minHeight: 66, borderRadius: 18, padding: 10, marginBottom: 6, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.color.line, overflow: 'hidden', backgroundColor: theme.color.card },
  receiptRowSelected: { borderColor: theme.color.blue, borderWidth: 2 },
  transparentOwnerBand: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flexDirection: 'row' },
  ownerBandSegment: { flex: 1 },
  colorRail: { width: 34, flexDirection: 'row', flexWrap: 'wrap', gap: 3, alignItems: 'center', justifyContent: 'center' },
  emptyMarker: { width: 14, height: 14, borderRadius: 7, backgroundColor: theme.color.line },
  colorMarker: { width: 12, height: 12, borderRadius: 6 },
  receiptItemBlock: { flex: 1, marginLeft: 8 },
  receiptItemName: { color: theme.color.text, fontWeight: '900', fontSize: 15 },
  receiptAssigned: { marginTop: 3, color: theme.color.muted, fontWeight: '700', fontSize: 12 },
  receiptAssignedMeta: { marginTop: 4, color: theme.color.muted, fontSize: 11, fontWeight: '700' },
  assignedBadge: { marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: theme.color.blueSoft, color: theme.color.blue, fontWeight: '900', fontSize: 11 },
  receiptPrice: { color: theme.color.text, fontWeight: '900' },
  receiptRowCompleted: { opacity: 0.6, backgroundColor: theme.color.background },
  legendCard: { backgroundColor: theme.color.card, borderRadius: 22, padding: 14, ...theme.shadow },
  legendTitle: { color: theme.color.text, fontWeight: '900', marginBottom: 8 },
  legendWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.color.background, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { color: theme.color.text, fontSize: 12, fontWeight: '800' },
  footer: { color: theme.color.muted, fontWeight: '600', textAlign: 'center', lineHeight: 19 }
});
