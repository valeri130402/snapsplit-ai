import { BillHistoryEntry, Person, ReceiptItem, ReceiptParseResult, SplitResult } from '../types';

export const personPalette = [
  '#3F6BFF', // blue
  '#F973B7', // pink
  '#22C55E', // green
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#EF4444', // red
  '#14B8A6' // teal
];

export const initialPeople: Person[] = [
  { id: 'p1', name: '', contact: '', contactType: 'none', color: personPalette[0], emoji: '1' },
  { id: 'p2', name: '', contact: '', contactType: 'none', color: personPalette[1], emoji: '2' }
];

export const demoReceipt: ReceiptParseResult = {
  merchant: 'Bella Napoli',
  currency: 'EUR',
  items: [
    { id: 'i1', name: 'Pasta Carbonara', price: 12.5, quantity: 1, kcal: 850 },
    { id: 'i2', name: 'Pizza Margherita', price: 14, quantity: 1, kcal: 900 },
    { id: 'i3', name: 'Wine Bottle', price: 24, quantity: 1, kcal: 620 },
    { id: 'i4', name: 'Dessert', price: 8, quantity: 1, kcal: 650 },
    { id: 'i5', name: 'Caesar Salad', price: 9.5, quantity: 1, kcal: 420 },
    { id: 'i6', name: 'Fries', price: 5.5, quantity: 1, kcal: 480 },
    { id: 'i7', name: 'Sparkling Water', price: 4, quantity: 1, kcal: 0 },
    { id: 'i8', name: 'Coffee', price: 3, quantity: 1, kcal: 60 }
  ]
};

export const initialItems: ReceiptItem[] = demoReceipt.items.map((item) => ({ ...item, assignedTo: [] }));

const h1Items: ReceiptItem[] = [
  { id: 'h1-i1', name: 'Pasta Carbonara', price: 12.5, quantity: 1, kcal: 850, assignedTo: ['h1-p1'] },
  { id: 'h1-i2', name: 'Pizza Margherita', price: 14, quantity: 1, kcal: 900, assignedTo: ['h1-p2'] },
  { id: 'h1-i3', name: 'Wine Bottle', price: 24, quantity: 1, kcal: 620, assignedTo: ['h1-p1', 'h1-p2', 'h1-p3', 'h1-p4'] },
  { id: 'h1-i4', name: 'Dessert', price: 8, quantity: 1, kcal: 650, assignedTo: ['h1-p1', 'h1-p4'] },
  { id: 'h1-i5', name: 'Caesar Salad', price: 9.5, quantity: 1, kcal: 420, assignedTo: ['h1-p3'] },
  { id: 'h1-i6', name: 'Coffee', price: 3, quantity: 1, kcal: 60, assignedTo: ['h1-p4'] }
];

const h1Results: SplitResult[] = [
  { personId: 'h1-p1', name: 'Anna', contact: '@anna_w', contactType: 'instagram', color: personPalette[0], emoji: 'A', items: [h1Items[0], h1Items[2], h1Items[3]], itemSubtotal: 22.5, extras: 2.35, total: 24.85, kcal: 1330 },
  { personId: 'h1-p2', name: 'Kate', contact: '@kate.daily', contactType: 'instagram', color: personPalette[1], emoji: 'K', items: [h1Items[1], h1Items[2]], itemSubtotal: 20, extras: 2.09, total: 22.09, kcal: 1055 },
  { personId: 'h1-p3', name: 'Marta', contact: '+371 2220 001', contactType: 'phone', color: personPalette[2], emoji: 'M', items: [h1Items[2], h1Items[4]], itemSubtotal: 15.5, extras: 1.62, total: 17.12, kcal: 575 },
  { personId: 'h1-p4', name: 'Leo', contact: '@leo.bites', contactType: 'instagram', color: personPalette[3], emoji: 'L', items: [h1Items[2], h1Items[3], h1Items[5]], itemSubtotal: 13, extras: 1.36, total: 14.36, kcal: 540 }
];
const h2Items: ReceiptItem[] = [
  { id: 'h2-i1', name: 'Flat White', price: 4.5, quantity: 1, kcal: 120, assignedTo: ['h2-p1'] },
  { id: 'h2-i2', name: 'Latte', price: 4.9, quantity: 1, kcal: 130, assignedTo: ['h2-p2'] },
  { id: 'h2-i3', name: 'Blueberry Muffin', price: 3.5, quantity: 1, kcal: 350, assignedTo: ['h2-p1', 'h2-p2'] }
];

const h2Results: SplitResult[] = [
  { personId: 'h2-p1', name: 'Tom', contact: '', contactType: 'none', color: personPalette[5], emoji: 'T', items: [h2Items[0], h2Items[2]], itemSubtotal: 8.0, extras: 0.8, total: 8.8, kcal: 470 },
  { personId: 'h2-p2', name: 'Laura', contact: '', contactType: 'none', color: personPalette[4], emoji: 'L', items: [h2Items[1], h2Items[2]], itemSubtotal: 8.4, extras: 0.8, total: 9.2, kcal: 480 }
];

const h3Items: ReceiptItem[] = [
  { id: 'h3-i1', name: 'Classic Burger', price: 12.5, quantity: 1, kcal: 950, assignedTo: ['h3-p1'] },
  { id: 'h3-i2', name: 'Fries', price: 4.5, quantity: 1, kcal: 480, assignedTo: ['h3-p2'] },
  { id: 'h3-i3', name: 'Chicken Salad', price: 10.0, quantity: 1, kcal: 420, assignedTo: ['h3-p3'] },
  { id: 'h3-i4', name: 'Shared Nachos', price: 8.0, quantity: 1, kcal: 800, assignedTo: ['h3-p1', 'h3-p2', 'h3-p3'] }
];

const h3Results: SplitResult[] = [
  { personId: 'h3-p1', name: 'Jack', contact: '', contactType: 'none', color: personPalette[0], emoji: 'J', items: [h3Items[0], h3Items[3]], itemSubtotal: 16.1666666667, extras: 0.5, total: 16.67, kcal: 1750 },
  { personId: 'h3-p2', name: 'Amy', contact: '', contactType: 'none', color: personPalette[1], emoji: 'A', items: [h3Items[1], h3Items[3]], itemSubtotal: 12.1666666667, extras: 0.5, total: 12.67, kcal: 1280 },
  { personId: 'h3-p3', name: 'Sam', contact: '', contactType: 'none', color: personPalette[2], emoji: 'S', items: [h3Items[2], h3Items[3]], itemSubtotal: 13.3333333333, extras: 0.5, total: 13.83, kcal: 1220 }
];

export const historyEntries: BillHistoryEntry[] = [
  { id: 'h1', merchant: 'Bella Napoli', date: 'May 12, 2025', amount: 78.42, tip: 7.42, people: ['Anna', 'Kate', 'Marta', 'Leo'], receiptItems: h1Items, results: h1Results, note: 'Dinner with shared wine and dessert.' },
  { id: 'h2', merchant: 'Brew & Beans', date: 'May 10, 2025', amount: 27.4, tip: 2.4, people: ['Tom', 'Laura'], receiptItems: h2Items, results: h2Results, note: 'Coffee catch-up.' },
  { id: 'h3', merchant: 'Burger House', date: 'May 8, 2025', amount: 64.2, tip: 5.2, people: ['Jack', 'Amy', 'Sam'], receiptItems: h3Items, results: h3Results, note: 'Quick lunch split.' }
];

export function makeEmptyPerson(index: number): Person {
  const color = personPalette[(index - 1) % personPalette.length];
  return {
    id: `p${Date.now()}${index}`,
    name: `Person ${index}`,
    contact: '',
    contactType: 'none',
    color,
    emoji: `${index}`
  };
}
