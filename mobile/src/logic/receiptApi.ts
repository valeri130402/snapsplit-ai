import { ImagePickerAsset } from 'expo-image-picker';
import { Alert } from 'react-native';
import { demoReceipt } from '../data/mockData';
import { ReceiptParseResult } from '../types';

// Default backend URL for LAN (iPhone testing). Override via setBackendUrl().
export let BACKEND_URL = 'http://192.168.60.149:3000';
export function setBackendUrl(url: string) {
  BACKEND_URL = url;
}

export async function parseReceiptImage(asset: ImagePickerAsset): Promise<ReceiptParseResult> {
  // Try to send to backend API which will call Azure Document Intelligence.
  try {
    const localUri = asset.uri;
    const form = new FormData();
    // In Expo/React Native, append a file object with uri, name, type
    // Backend expects multipart field named 'receipt'
    form.append('receipt' as any, { uri: localUri, name: 'receipt.jpg', type: 'image/jpeg' } as any);

    const resp = await fetch(`${BACKEND_URL}/api/parse-receipt`, {
      method: 'POST',
      body: form
      // NOTE: do not set Content-Type; fetch will add the correct multipart boundary
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.warn('Receipt API failed, falling back to demo receipt', text);
      Alert.alert('Receipt parsing failed', 'Could not parse the receipt. Using demo receipt is available.', [{ text: 'OK' }]);
      return demoReceipt;
    }

    const json = await resp.json();

    if (json.error) {
      console.warn('Receipt API returned error response:', json.error, json.details || '');
      Alert.alert('Receipt parsing failed', json.error, [{ text: 'Use demo receipt' }]);
      return demoReceipt;
    }

    const parsed: ReceiptParseResult = {
      merchant: json.restaurantName || json.merchant || demoReceipt.merchant,
      currency: json.currency || 'EUR',
      items: (json.items || []).map((it: any, idx: number) => ({ id: it.id ?? `ai-${idx}`, name: it.name ?? `Item ${idx + 1}`, price: Number(it.price ?? 0), quantity: Number(it.quantity ?? 1), kcal: it.kcal })),
      subtotal: Number(json.subtotal ?? 0),
      tax: Number(json.tax ?? 0),
      total: Number(json.total ?? 0),
      tip: Number(json.tip ?? 0),
      rawText: json.rawText,
      warning: json.warning
    };

    if (!parsed.items || parsed.items.length === 0) {
      if (parsed.rawText) {
        console.warn('Receipt API returned no extracted items, but raw OCR text is available', json.rawText?.slice(0, 200));
        Alert.alert('No items detected', 'No items were detected automatically. You can add items manually.');
        return parsed;
      }
      console.warn('Receipt API returned no extracted items', json);
      Alert.alert('No items detected', 'The receipt was parsed, but no line items were found. Using demo receipt instead.', [{ text: 'OK' }]);
      return demoReceipt;
    }

    return parsed;
  } catch (e) {
    console.warn('Receipt parse failed, using demo:', String(e));
    return demoReceipt;
  }
}

