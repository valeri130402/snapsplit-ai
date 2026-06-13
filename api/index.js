require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const endpointRaw = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
const apiKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
const endpoint = endpointRaw ? endpointRaw.replace(/\/+$/, '') : undefined;
if (!endpoint || !apiKey) {
    console.warn('Warning: AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT and AZURE_DOCUMENT_INTELLIGENCE_KEY are not set. The /api/parse-receipt endpoint will return an error.');
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeErrorMessage(error) {
    if (!error) return 'Unknown error';
    const message = error.message || String(error);
    return message.length > 200 ? `${message.slice(0, 197)}...` : message;
}

function parseFieldValue(field) {
    if (field == null) return undefined;
    if (typeof field === 'string' || typeof field === 'number' || typeof field === 'boolean') return field;
    if (typeof field === 'object') {
        if (field.valueCurrency?.amount != null) return field.valueCurrency.amount;
        if (field.valueNumber != null) return field.valueNumber;
        if (field.valueInteger != null) return field.valueInteger;
        if (field.valueString != null) return field.valueString;
        if (field.value != null && typeof field.value !== 'object') return field.value;
        if (field.content != null) return field.content;
        if (field.text != null) return field.text;
    }
    return undefined;
}

function parseNumberField(field) {
    const raw = parseFieldValue(field);
    if (raw == null) return undefined;
    const num = Number(String(raw).replace(',', '.').replace(/[^\d.-]/g, ''));
    return Number.isFinite(num) ? num : undefined;
}

function parseReceiptItemsFromFields(itemsField) {
    if (!itemsField) return [];
    const itemArray = Array.isArray(itemsField.valueArray)
        ? itemsField.valueArray
        : Array.isArray(itemsField.value)
            ? itemsField.value
            : Array.isArray(itemsField)
                ? itemsField
                : [];

    return itemArray.map((item, idx) => {
        const props = item.valueObject || item.properties || item;
        const name = parseFieldValue(props?.Description)
            || parseFieldValue(props?.Name)
            || parseFieldValue(props?.ItemName)
            || parseFieldValue(props?.Item)
            || parseFieldValue(item?.content)
            || `Item ${idx + 1}`;
        const price = parseNumberField(props?.TotalPrice)
            ?? parseNumberField(props?.Price)
            ?? parseNumberField(props?.Amount)
            ?? 0;
        const quantity = parseNumberField(props?.Quantity) ?? 1;
        return { name, price, quantity };
    });
}

function normalizeReceiptResponse(result) {
    const analyzeResult = result?.analyzeResult || result;
    const doc = Array.isArray(analyzeResult.documents)
        ? analyzeResult.documents[0]
        : Array.isArray(analyzeResult.document)
            ? analyzeResult.document[0]
            : null;
    const fields = doc?.fields || doc || {};

    const restaurantName = parseFieldValue(fields?.MerchantName)
        || parseFieldValue(fields?.Merchant?.Name)
        || undefined;
    const date = parseFieldValue(fields?.TransactionDate)
        || parseFieldValue(fields?.Date)
        || undefined;

    const items = parseReceiptItemsFromFields(fields?.Items);
    const subtotal = parseNumberField(fields?.Subtotal);
    const tax = parseNumberField(fields?.Tax);
    const tip = parseNumberField(fields?.Tip)
        ?? parseNumberField(fields?.TipAmount)
        ?? parseNumberField(fields?.Gratuity)
        ?? 0;
    const total = parseNumberField(fields?.Total);

    return { restaurantName, date, items, subtotal, tax, tip, total };
}

function extractOcrText(result) {
    const content = result?.analyzeResult?.content;
    if (typeof content === 'string' && content.trim().length > 0) {
        return content.trim();
    }

    const pages = result?.analyzeResult?.pages;
    if (Array.isArray(pages)) {
        const lines = pages.flatMap((page) => (page.lines || []).map((line) => line.content).filter(Boolean));
        if (lines.length > 0) {
            return lines.join('\n').trim();
        }
    }

    return '';
}

function extractItemsFromRawOcr(rawText) {
    if (typeof rawText !== 'string' || !rawText.trim()) return [];
    const lines = rawText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    const rejectPattern = /\b(total|subtotal|tax|vat|change|cash|visa|mastercard|amex|receipt|balance|due|amount|paid)\b/i;
    const itemPattern = /^(.+?)\s+€?\s*([0-9]+(?:[.,][0-9]{2})?)$/;

    return lines.reduce((acc, line) => {
        if (rejectPattern.test(line)) return acc;
        const match = line.match(itemPattern);
        if (!match) return acc;
        const name = match[1].replace(/\s{2,}/g, ' ').trim();
        const amount = Number(match[2].replace(',', '.'));
        if (!Number.isFinite(amount) || amount <= 0) return acc;
        acc.push({ name: name || 'Item', price: amount, quantity: 1 });
        return acc;
    }, []);
}

async function pollAzureOperation(operationLocation, headers) {
    const maxAttempts = 20;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const pollResponse = await fetch(operationLocation, { method: 'GET', headers });
        if (!pollResponse.ok) {
            const body = await pollResponse.text();
            throw new Error(`Azure polling failed with status ${pollResponse.status}: ${body}`);
        }

        const pollJson = await pollResponse.json();
        const status = String(pollJson.status || pollJson.statusCode || '').toLowerCase();
        console.log('Azure operation status:', status);

        if (status === 'succeeded' || status === 'failed') {
            return pollJson;
        }

        await sleep(1000);
    }
    throw new Error('Azure polling timed out after multiple attempts');
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/parse-receipt', upload.single('receipt'), async (req, res) => {
    console.log('/api/parse-receipt called');
    console.log('Azure endpoint:', endpoint ? endpoint : 'NOT SET');
    console.log('req.file exists:', !!req.file);

    if (!req.file) {
        console.error('No file received in /api/parse-receipt');
        return res.status(400).json({ error: 'No receipt image received. Expected field name: receipt.' });
    }

    const file = req.file;
    console.log('Uploaded file:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
    });

    if (!endpoint || !apiKey) {
        return res.status(500).json({ error: 'Azure credentials not configured' });
    }

    try {
        const analyzeUrl = `${endpoint}/documentintelligence/documentModels/prebuilt-receipt:analyze?_overload=analyzeDocument&api-version=2024-11-30`;
        const headers = {
            'Ocp-Apim-Subscription-Key': apiKey,
            'Content-Type': file.mimetype || 'image/jpeg'
        };

        const initialResponse = await fetch(analyzeUrl, {
            method: 'POST',
            headers,
            body: file.buffer
        });

        console.log('Azure initial analyze status:', initialResponse.status);

        if (!initialResponse.ok) {
            const body = await initialResponse.text();
            console.error('Azure initial analyze failed:', initialResponse.status, body);
            return res.status(500).json({ error: 'Azure parse failed', details: `Analyze request failed with status ${initialResponse.status}` });
        }

        const operationLocation = initialResponse.headers.get('operation-location');
        if (!operationLocation) {
            console.error('Missing Operation-Location header from Azure');
            return res.status(500).json({ error: 'Azure parse failed', details: 'Missing operation location header from Azure' });
        }

        const operationResult = await pollAzureOperation(operationLocation, {
            'Ocp-Apim-Subscription-Key': apiKey
        });

        const status = String(operationResult.status || operationResult.statusCode || '').toLowerCase();
        console.log('Azure operation status:', status);

        if (status === 'failed') {
            const details = operationResult.error?.message || operationResult.error?.code || 'Azure operation failed';
            console.error('Azure analyze failed:', details);
            return res.status(500).json({ error: 'Azure parse failed', details: safeErrorMessage(details) });
        }

        const analyzeResult = operationResult?.analyzeResult || {};
        const analyzeResultKeys = Object.keys(analyzeResult);
        const documentCount = Array.isArray(analyzeResult.documents) ? analyzeResult.documents.length : 0;
        const fieldKeys = Array.isArray(analyzeResult.documents) && analyzeResult.documents[0]?.fields
            ? Object.keys(analyzeResult.documents[0].fields)
            : [];
        const rawText = extractOcrText(operationResult);
        console.log('Azure analyzeResult keys:', analyzeResultKeys);
        console.log('Azure documents count:', documentCount);
        console.log('Azure document field keys:', fieldKeys);
        console.log('Azure raw OCR content preview:', String(analyzeResult.content || rawText).slice(0, 1000));

        let normalized = normalizeReceiptResponse(operationResult);
        console.log('Normalized receipt items count:', normalized.items.length);

        let items = normalized.items || [];
        if (!items.length) {
            items = extractItemsFromRawOcr(rawText);
            if (items.length > 0) {
                console.log('Fallback OCR-extracted receipt items count:', items.length);
            }
        }

        if (!items.length) {
            return res.json({
                restaurantName: normalized.restaurantName || '',
                date: normalized.date || '',
                items: [],
                rawText,
                warning: 'No structured receipt items found. You can add items manually.',
                subtotal: normalized.subtotal ?? 0,
                tax: normalized.tax ?? 0,
                tip: normalized.tip ?? 0,
                total: normalized.total ?? 0
            });
        }

        return res.json({
            restaurantName: normalized.restaurantName || '',
            date: normalized.date || '',
            items,
            subtotal: normalized.subtotal ?? 0,
            tax: normalized.tax ?? 0,
            tip: normalized.tip ?? 0,
            total: normalized.total ?? 0,
            rawText: rawText || undefined,
            warning: !normalized.items.length ? 'No structured receipt items found. You can add items manually.' : undefined
        });
    } catch (err) {
        console.error('Azure parse error', err);
        return res.status(500).json({ error: 'Azure parse failed', details: safeErrorMessage(err) });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`SnapSplit API listening on ${port}`));
