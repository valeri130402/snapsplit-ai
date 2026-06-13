import { Person, ReceiptItem, SplitResult } from '../types';

export function money(value: number): string {
  return `€${value.toFixed(2)}`;
}

export function getItemsTotal(items: ReceiptItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

export function getTotalKcal(items: ReceiptItem[]): number {
  return items.reduce((sum, item) => sum + (item.kcal ?? 0), 0);
}

export function getGrandTotal(items: ReceiptItem[], tip: number): number {
  return getItemsTotal(items) + Math.max(0, tip);
}

export function calculateSplit(people: Person[], items: ReceiptItem[], tip: number): SplitResult[] {
  const totals = new Map<string, number>();
  const kcals = new Map<string, number>();
  const personItems = new Map<string, ReceiptItem[]>();

  for (const person of people) {
    totals.set(person.id, 0);
    kcals.set(person.id, 0);
    personItems.set(person.id, []);
  }

  for (const item of items) {
    const portionMap: Record<string, number> = item.assignedPortions
      ? { ...item.assignedPortions }
      : item.assignedTo.reduce((map: Record<string, number>, personId) => {
        map[personId] = (map[personId] || 0) + 1;
        return map;
      }, {} as Record<string, number>);

    const totalPortions = Object.values(portionMap).reduce((sum, count) => sum + count, 0);
    if (totalPortions === 0) continue;

    for (const [personId, count] of Object.entries(portionMap)) {
      if (!totals.has(personId)) continue;
      const share = item.price * (count / totalPortions);
      const kcalShare = (item.kcal ?? 0) * (count / totalPortions);
      totals.set(personId, (totals.get(personId) ?? 0) + share);
      kcals.set(personId, (kcals.get(personId) ?? 0) + kcalShare);
      personItems.set(personId, [...(personItems.get(personId) ?? []), {
        ...item,
        id: `${item.id}-${personId}`,
        price: share,
        quantity: count,
        assignedTo: [personId]
      }]);
    }
  }

  const itemGrandTotal = [...totals.values()].reduce((sum, value) => sum + value, 0);

  return people.map((person) => {
    const itemSubtotal = totals.get(person.id) ?? 0;
    const extras = itemGrandTotal > 0
      ? Math.max(0, tip) * (itemSubtotal / itemGrandTotal)
      : people.length > 0
        ? Math.max(0, tip) / people.length
        : 0;

    return {
      personId: person.id,
      name: person.name,
      contact: person.contact,
      contactType: person.contactType,
      color: person.color,
      emoji: person.emoji,
      items: personItems.get(person.id) ?? [],
      itemSubtotal,
      extras,
      total: itemSubtotal + extras,
      kcal: kcals.get(person.id) ?? 0
    };
  });
}
