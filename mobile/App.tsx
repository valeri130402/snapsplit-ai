import React, { useMemo, useState, useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { BottomNav } from './src/components/BottomNav';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { demoReceipt, historyEntries, initialItems, initialPeople, makeEmptyPerson } from './src/data/mockData';
import { parseReceiptImage } from './src/logic/receiptApi';
import { calculateSplit, getGrandTotal, getItemsTotal } from './src/logic/splitEngine';
import { AssignItemsScreen } from './src/screens/AssignItemsScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { NewBillScreen } from './src/screens/NewBillScreen';
import { ReceiptImportScreen } from './src/screens/ReceiptImportScreen';
import { ReceiptReviewScreen } from './src/screens/ReceiptReviewScreen';
import { ActivityScreen, BillDetailScreen, HistoryScreen, ProfileScreen } from './src/screens/PlaceholderScreens';
import { SummaryScreen } from './src/screens/SummaryScreen';
import { BillHistoryEntry, Person, ReceiptItem, ScreenName, SplitMode } from './src/types';
import { theme } from './src/theme';

export default function App() {
  const STORAGE_KEY = 'snapsplit_history_v1';
  const [screen, setScreen] = useState<ScreenName>('home');
  const [merchant, setMerchant] = useState(demoReceipt.merchant);
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [items, setItems] = useState<ReceiptItem[]>(initialItems);
  const [tip, setTip] = useState('0.00');
  const [splitMode, setSplitMode] = useState<SplitMode>('manual');
  const [selectedItemId, setSelectedItemId] = useState(initialItems[0]?.id ?? '');
  const [receiptWarning, setReceiptWarning] = useState<string | undefined>(undefined);
  const [receiptRawText, setReceiptRawText] = useState<string | undefined>(undefined);
  const [receiptImageUri, setReceiptImageUri] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<BillHistoryEntry[]>(historyEntries);
  const [selectedHistoryBill, setSelectedHistoryBill] = useState<BillHistoryEntry | null>(null);

  const parsedTip = Number.parseFloat(tip.replace(',', '.')) || 0;
  const results = useMemo(() => calculateSplit(people, items, parsedTip), [people, items, parsedTip]);
  const grandTotal = getGrandTotal(items, parsedTip);
  const itemsTotal = getItemsTotal(items);

  function getAssignedPortions(item: ReceiptItem) {
    if (item.assignedPortions && Object.keys(item.assignedPortions).length > 0) return item.assignedPortions;
    return item.assignedTo.reduce((map: Record<string, number>, personId) => {
      map[personId] = (map[personId] || 0) + 1;
      return map;
    }, {} as Record<string, number>);
  }

  function getTotalAssignedPortions(item: ReceiptItem) {
    return Object.values(getAssignedPortions(item)).reduce((sum, count) => sum + count, 0);
  }

  function isFullyAssigned(item: ReceiptItem) {
    return getTotalAssignedPortions(item) >= (item.quantity ?? 1);
  }

  function getNextUnassignedItemId(currentId: string) {
    const next = items.find((item) => item.id !== currentId && !isFullyAssigned(item));
    return next?.id ?? currentId;
  }

  function navigate(nextScreen: ScreenName) {
    if (nextScreen === 'importReceipt') {
      startSplitBill();
      return;
    }
    setScreen(nextScreen);
  }

  function openHistoryBill(bill: BillHistoryEntry) {
    setSelectedHistoryBill(bill);
    setScreen('billDetail');
  }

  function resetReceiptToDemo() {
    const freshItems = initialItems.map((item) => ({ ...item, assignedTo: [], assignedPortions: {}, quantity: item.quantity ?? 1 }));
    setMerchant(demoReceipt.merchant);
    setPeople(initialPeople);
    setItems(freshItems);
    setSelectedItemId(freshItems[0]?.id ?? '');
    setTip('0.00');
    setSplitMode('manual');
    setReceiptWarning(undefined);
    setReceiptRawText(undefined);
    setReceiptImageUri(undefined);
  }

  function startSplitBill() {
    resetReceiptToDemo();
    setScreen('importReceipt');
  }

  async function takeReceiptPhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera permission needed', 'You can still use Upload Receipt or demo receipt mode.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.9 });
      if (result.canceled) return;
      await parseAndLoadReceipt(result.assets[0]);
    } catch {
      Alert.alert('Camera failed', 'Demo receipt data will be used instead.');
      resetReceiptToDemo();
    }
  }

  async function uploadReceipt() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9
      });
      if (result.canceled) return;
      await parseAndLoadReceipt(result.assets[0]);
    } catch {
      Alert.alert('Upload failed', 'Demo receipt data will be used instead.');
      resetReceiptToDemo();
    }
  }

  async function parseAndLoadReceipt(asset: ImagePicker.ImagePickerAsset) {
    const parsed = await parseReceiptImage(asset);
    const parsedItems = parsed.items.map((item, idx) => ({ ...item, assignedTo: [], assignedPortions: {}, quantity: item.quantity ?? 1, id: item.id ?? `ai-${idx}` }));
    setMerchant(parsed.merchant || '');
    setItems(parsedItems);
    setSelectedItemId(parsedItems[0]?.id ?? '');
    setReceiptWarning(parsed.warning);
    setReceiptRawText(parsed.rawText);
    setReceiptImageUri(asset.uri);
  }

  function updatePeopleCount(count: number) {
    setPeople((current) => {
      if (count <= current.length) return current.slice(0, Math.max(1, count));
      const next = [...current];
      while (next.length < count) next.push(makeEmptyPerson(next.length + 1));
      return next;
    });
  }

  function updatePerson(personId: string, patch: Partial<Person>) {
    setPeople((current) => current.map((person) => (person.id === personId ? { ...person, ...patch } : person)));
  }

  function addContactFromPhone() {
    setPeople((current) =>
      current.map((person, index) => ({
        ...person,
        contact: person.contact || `+371 2${index + 2}00 00${index + 1}`,
        contactType: person.contactType === 'none' ? 'phone' : person.contactType
      }))
    );
    Alert.alert('Demo contacts added', 'In a production version, this would open your phone contacts and import selected people with phone numbers.');
  }

  function useTenPercentTip() {
    setTip((itemsTotal * 0.1).toFixed(2));
  }

  function clearTip() {
    setTip('0.00');
  }

  function assignItemToPerson(itemId: string, personId: string) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) return item;
        if (item.assignedTo.length === 1 && item.assignedTo[0] === personId) return item;
        return { ...item, assignedTo: [personId] };
      })
    );
  }

  function togglePersonForSelectedItem(personId: string) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== selectedItemId) return item;
        const portions = { ...getAssignedPortions(item) };
        const totalAssigned = Object.values(portions).reduce((sum, count) => sum + count, 0);
        const quantity = item.quantity ?? 1;

        if (portions[personId] != null) {
          delete portions[personId];
        } else {
          if (totalAssigned >= quantity) return item;
          portions[personId] = 1;
        }

        return { ...item, assignedPortions: portions, assignedTo: Object.keys(portions) };
      })
    );
  }

  function assignSelectedItemToEveryone() {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== selectedItemId) return item;
        const quantity = item.quantity ?? 1;
        const peopleCount = people.length;
        if (peopleCount === 0) return item;
        const portionSize = quantity / peopleCount;
        const portions = people.reduce((map: Record<string, number>, person) => {
          map[person.id] = portionSize;
          return map;
        }, {} as Record<string, number>);
        return { ...item, assignedPortions: portions, assignedTo: Object.keys(portions) };
      })
    );
  }

  function clearSelectedItemAssignment() {
    setItems((current) => current.map((item) => (item.id === selectedItemId ? { ...item, assignedTo: [], assignedPortions: {} } : item)));
  }

  function applyEqualSplit() {
    const allPeople = people.map((person) => person.id);
    setItems((current) =>
      current.map((item) => {
        if (allPeople.length === 0) return item;
        const quantity = item.quantity ?? 1;
        const portionSize = quantity / allPeople.length;
        const portions = allPeople.reduce((map: Record<string, number>, personId) => {
          map[personId] = portionSize;
          return map;
        }, {} as Record<string, number>);
        return { ...item, assignedPortions: portions, assignedTo: allPeople };
      })
    );
  }

  function continueFromSetup() {
    if (splitMode === 'equal') {
      const allPeople = people.map((person) => person.id);
      const equalItems = items.map((item) => {
        const quantity = item.quantity ?? 1;
        const portionSize = allPeople.length > 0 ? quantity / allPeople.length : 0;
        const portions = allPeople.reduce((map: Record<string, number>, personId) => {
          map[personId] = portionSize;
          return map;
        }, {} as Record<string, number>);
        return { ...item, assignedPortions: portions, assignedTo: allPeople };
      });
      const equalResults = calculateSplit(people, equalItems, parsedTip);
      setItems(equalItems);
      saveBillToHistory(equalItems, equalResults);
      setScreen('summary');
      return;
    }
    setSelectedItemId(items[0]?.id ?? '');
    setScreen('assignItems');
  }

  function quickReview() {
    const unassigned = items.filter((item) => !isFullyAssigned(item));
    if (unassigned.length > 0) {
      Alert.alert('Some items are not fully assigned', `${unassigned.length} item(s) still need a person. Tap an item, then assign all portions.`);
      return;
    }
    saveCurrentBillToHistory();
    setScreen('summary');
  }

  function saveCurrentBillToHistory() {
    saveBillToHistory(items, results);
  }

  function saveBillToHistory(nextItems: ReceiptItem[], nextResults: ReturnType<typeof calculateSplit>) {
    const nextGrandTotal = getGrandTotal(nextItems, parsedTip);
    setHistory((current) => {
      const currentId = `current-${merchant}-${nextItems.length}-${nextGrandTotal.toFixed(2)}`;
      const alreadySaved = current.some((entry) => entry.id === currentId);
      if (alreadySaved) return current;
      const next = [
        {
          id: currentId,
          merchant,
          date: 'Today',
          amount: nextGrandTotal,
          tip: parsedTip,
          people: people.map((person) => person.name).filter(Boolean),
          receiptItems: nextItems,
          receiptImageUri,
          results: nextResults,
          note: 'Created with SnapSplit demo flow.'
        },
        ...current
      ];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => { });
      return next;
    });
  }

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as BillHistoryEntry[];
          if (Array.isArray(parsed) && parsed.length) setHistory(parsed);
        }
      } catch (e) {
        // ignore load errors
      }
    })();
  }, []);

  useEffect(() => {
    const selectedItem = items.find((item) => item.id === selectedItemId);
    if (selectedItem && isFullyAssigned(selectedItem)) {
      const next = items.find((item) => !isFullyAssigned(item));
      if (next && next.id !== selectedItemId) setSelectedItemId(next.id);
    }
  }, [items, selectedItemId]);

  function selectPreviousItem() {
    const index = items.findIndex((item) => item.id === selectedItemId);
    if (items.length === 0) return;
    const previousIndex = index <= 0 ? items.length - 1 : index - 1;
    setSelectedItemId(items[previousIndex].id);
  }

  function selectNextItem() {
    if (items.length === 0) return;
    const unassigned = items.find((item) => !isFullyAssigned(item) && item.id !== selectedItemId);
    if (unassigned) {
      setSelectedItemId(unassigned.id);
      return;
    }
    const index = items.findIndex((item) => item.id === selectedItemId);
    const nextIndex = index < 0 || index >= items.length - 1 ? 0 : index + 1;
    setSelectedItemId(items[nextIndex].id);
  }

  function renderScreen() {
    if (screen === 'home') {
      return <HomeScreen history={history} onSplitBill={startSplitBill} onOpenBill={openHistoryBill} />;
    }

    if (screen === 'history') return <HistoryScreen history={history} onOpenBill={openHistoryBill} />;

    if (screen === 'billDetail') {
      const bill = selectedHistoryBill ?? history[0];
      return <BillDetailScreen bill={bill} onBack={() => setScreen('history')} />;
    }

    if (screen === 'importReceipt') {
      return (
        <ReceiptImportScreen
          merchant={merchant}
          items={items}
          total={itemsTotal}
          onTakePhoto={takeReceiptPhoto}
          onUpload={uploadReceipt}
          onUseDemo={resetReceiptToDemo}
          onDone={() => setScreen('receiptReview')}
        />
      );
    }

    if (screen === 'splitSetup') {
      return (
        <NewBillScreen
          merchant={merchant}
          people={people}
          items={items}
          tip={tip}
          splitMode={splitMode}
          onSplitModeChange={setSplitMode}
          onTipChange={setTip}
          onUseTenPercentTip={useTenPercentTip}
          onClearTip={clearTip}
          onAddContacts={addContactFromPhone}
          onPeopleCountChange={updatePeopleCount}
          onPersonChange={updatePerson}
          onContinue={continueFromSetup}
        />
      );
    }

    if (screen === 'receiptReview') {
      return (
        <ReceiptReviewScreen
          merchant={merchant}
          items={items}
          tip={tip}
          warning={receiptWarning}
          rawText={receiptRawText}
          onMerchantChange={setMerchant}
          onTipChange={setTip}
          onCancel={() => setScreen('importReceipt')}
          onContinue={(nextItems, nextTip) => {
            setItems(nextItems);
            setTip(nextTip);
            setReceiptWarning(undefined);
            setReceiptRawText(undefined);
            setScreen('splitSetup');
          }}
        />
      );
    }

    if (screen === 'assignItems') {
      return (
        <AssignItemsScreen
          merchant={merchant}
          people={people}
          items={items}
          selectedItemId={selectedItemId}
          results={results}
          tip={tip}
          onSelectedItemChange={setSelectedItemId}
          onTogglePerson={togglePersonForSelectedItem}
          onAssignEveryone={assignSelectedItemToEveryone}
          onClearSelected={clearSelectedItemAssignment}
          onPreviousItem={selectPreviousItem}
          onNextItem={selectNextItem}
          onQuickReview={quickReview}
        />
      );
    }

    if (screen === 'summary') return <SummaryScreen merchant={merchant} results={results} grandTotal={grandTotal} onDone={() => setScreen('home')} />;
    if (screen === 'activity') return <ActivityScreen />;
    return <ProfileScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={screen === 'home' ? 'light' : 'dark'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.content}>{renderScreen()}</View>
        <BottomNav active={screen} onNavigate={navigate} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.color.background },
  flex: { flex: 1 },
  content: { flex: 1 }
});
