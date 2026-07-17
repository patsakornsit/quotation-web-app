const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const dataDirectory = path.join(__dirname, 'data');
const databasePath = process.env.QUOTATION_DB_PATH
  ? path.resolve(process.env.QUOTATION_DB_PATH)
  : path.join(dataDirectory, 'quotations.db');
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const db = new DatabaseSync(databasePath);
db.exec('PRAGMA foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS quotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_number TEXT NOT NULL,
    document_type TEXT NOT NULL DEFAULT 'quotation',
    client TEXT NOT NULL,
    status TEXT NOT NULL,
    subtotal REAL NOT NULL,
    tax REAL NOT NULL,
    total REAL NOT NULL,
    currency TEXT NOT NULL,
    tax_rate REAL NOT NULL,
    deposit_rate REAL NOT NULL DEFAULT 30,
    deposit_amount REAL NOT NULL DEFAULT 0,
    deposit_schedule_json TEXT NOT NULL DEFAULT '[]',
    deposit_payment_statuses_json TEXT NOT NULL DEFAULT '[]',
    confirmation_name TEXT NOT NULL DEFAULT '',
    confirmation_signature TEXT NOT NULL DEFAULT '',
    confirmation_signature_image TEXT NOT NULL DEFAULT '',
    note TEXT DEFAULT '',
    template_json TEXT DEFAULT '{}',
    exported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS quotation_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quotation_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
  );
`);

const quotationColumns = new Set(db.prepare('PRAGMA table_info(quotations)').all().map((column) => column.name));
if (!quotationColumns.has('deposit_rate')) {
  db.exec('ALTER TABLE quotations ADD COLUMN deposit_rate REAL NOT NULL DEFAULT 30');
}
if (!quotationColumns.has('deposit_amount')) {
  db.exec('ALTER TABLE quotations ADD COLUMN deposit_amount REAL NOT NULL DEFAULT 0');
}
if (!quotationColumns.has('deposit_schedule_json')) {
  db.exec("ALTER TABLE quotations ADD COLUMN deposit_schedule_json TEXT NOT NULL DEFAULT '[]'");
}
if (!quotationColumns.has('confirmation_name')) {
  db.exec("ALTER TABLE quotations ADD COLUMN confirmation_name TEXT NOT NULL DEFAULT ''");
}
if (!quotationColumns.has('deposit_payment_statuses_json')) {
  db.exec("ALTER TABLE quotations ADD COLUMN deposit_payment_statuses_json TEXT NOT NULL DEFAULT '[]'");
}
if (!quotationColumns.has('confirmation_signature')) {
  db.exec("ALTER TABLE quotations ADD COLUMN confirmation_signature TEXT NOT NULL DEFAULT ''");
}
if (!quotationColumns.has('confirmation_signature_image')) {
  db.exec("ALTER TABLE quotations ADD COLUMN confirmation_signature_image TEXT NOT NULL DEFAULT ''");
}

const insertQuotation = db.prepare(`
  INSERT INTO quotations (
    quote_number, document_type, client, status, subtotal, tax, total,
    currency, tax_rate, deposit_rate, deposit_amount, deposit_schedule_json, deposit_payment_statuses_json,
    confirmation_name, confirmation_signature, confirmation_signature_image, note, template_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertQuotationItem = db.prepare(`
  INSERT INTO quotation_items (quotation_id, item_name, quantity, unit_price, amount)
  VALUES (?, ?, ?, ?, ?)
`);

const OPENCLAW_API_URL = process.env.OPENCLAW_API_URL;
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = DEEPSEEK_API_URL || OPENCLAW_API_URL;
const API_KEY = DEEPSEEK_API_KEY || OPENCLAW_API_KEY;
const OPENCLAW_MODE = (process.env.OPENCLAW_MODE || 'cloud').toLowerCase(); // 'cloud' or 'serial'

// Serial settings (when OPENCLAW_MODE=serial)
const OPENCLAW_SERIAL_PORT = process.env.OPENCLAW_SERIAL_PORT; // e.g. COM3 or /dev/ttyUSB0
const OPENCLAW_BAUD = parseInt(process.env.OPENCLAW_BAUD || '115200', 10);

let serialPort = null;
let serialParser = null;
if (OPENCLAW_MODE === 'serial') {
  if (!OPENCLAW_SERIAL_PORT) {
    console.warn('OPENCLAW_MODE=serial but OPENCLAW_SERIAL_PORT is not set. Serial mode will not function.');
  } else {
    try {
      const SerialPortLib = require('serialport');
      const { ReadlineParser } = require('@serialport/parser-readline');
      serialPort = new SerialPortLib(OPENCLAW_SERIAL_PORT, { baudRate: OPENCLAW_BAUD, autoOpen: false });
      serialPort.open((err) => {
        if (err) console.error('Failed to open serial port', err.message);
        else console.log(`Serial port ${OPENCLAW_SERIAL_PORT} opened at ${OPENCLAW_BAUD} baud`);
      });
      serialParser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));
      serialParser.on('data', (d) => console.log('Device(serial) ->', d));
    } catch (err) {
      console.error('Error initializing serialport:', err.message || err);
    }
  }
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.post('/api/quotations', (req, res) => {
  const record = req.body || {};
  const items = Array.isArray(record.items) ? record.items : [];
  if (!record.quoteNumber || !record.client || items.length === 0) {
    return res.status(400).json({ ok: false, error: 'quoteNumber, client, and at least one item are required' });
  }

  try {
    db.exec('BEGIN');
    const result = insertQuotation.run(
      String(record.quoteNumber),
      record.documentType === 'receipt' ? 'receipt' : 'quotation',
      String(record.client),
      String(record.status || 'Draft'),
      Number(record.subtotal) || 0,
      Number(record.tax) || 0,
      Number(record.total) || 0,
      String(record.currency || '$'),
      Number(record.taxRate) || 0,
      Math.min(100, Math.max(0, Number(record.depositRate) || 0)),
      Math.max(0, Number(record.depositAmount) || 0),
      JSON.stringify(Array.isArray(record.depositSchedule) ? record.depositSchedule : []),
      JSON.stringify(Array.isArray(record.depositPaymentStatuses) ? record.depositPaymentStatuses.map(Boolean) : []),
      String(record.confirmationName || ''),
      String(record.confirmationSignature || ''),
      String(record.confirmationSignatureImage || ''),
      String(record.note || ''),
      JSON.stringify(record.template || {})
    );
    const quotationId = Number(result.lastInsertRowid);
    for (const item of items) {
      const quantity = Number(item.qty) || 0;
      const unitPrice = Number(item.price) || 0;
      insertQuotationItem.run(quotationId, String(item.name || 'Item'), quantity, unitPrice, quantity * unitPrice);
    }
    db.exec('COMMIT');
    return res.status(201).json({ ok: true, id: quotationId });
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch {}
    return res.status(500).json({ ok: false, error: error.message || String(error) });
  }
});

app.get('/api/quotations', (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const rows = db.prepare(`
    SELECT id, quote_number AS quoteNumber, document_type AS documentType,
      client, status, subtotal, tax, total, currency, tax_rate AS taxRate,
      deposit_rate AS depositRate, deposit_amount AS depositAmount,
      deposit_schedule_json AS depositScheduleJson, deposit_payment_statuses_json AS depositPaymentStatusesJson,
      note, exported_at AS exportedAt
    FROM quotations ORDER BY id DESC LIMIT ?
  `).all(limit);
  const records = rows.map((record) => {
    record.depositSchedule = JSON.parse(record.depositScheduleJson || '[]');
    record.depositPaymentStatuses = JSON.parse(record.depositPaymentStatusesJson || '[]');
    delete record.depositScheduleJson;
    delete record.depositPaymentStatusesJson;
    return record;
  });
  return res.json({ ok: true, records });
});

app.get('/api/quotations/next-number', (req, res) => {
  const rows = db.prepare(`
    SELECT quote_number AS quoteNumber
    FROM quotations
    WHERE document_type = 'quotation'
  `).all();
  const highestNumber = rows.reduce((highest, record) => {
    const match = String(record.quoteNumber || '').match(/(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 1041);
  return res.json({ ok: true, quoteNumber: `Q-${highestNumber + 1}` });
});

app.get('/api/quotations/:id', (req, res) => {
  const id = Number(req.params.id);
  const record = db.prepare(`
    SELECT id, quote_number AS quoteNumber, document_type AS documentType,
      client, status, subtotal, tax, total, currency, tax_rate AS taxRate,
      deposit_rate AS depositRate, deposit_amount AS depositAmount,
      deposit_schedule_json AS depositScheduleJson,
      deposit_payment_statuses_json AS depositPaymentStatusesJson,
      confirmation_name AS confirmationName, confirmation_signature AS confirmationSignature,
      confirmation_signature_image AS confirmationSignatureImage,
      note, template_json AS templateJson, exported_at AS exportedAt
    FROM quotations WHERE id = ?
  `).get(id);
  if (!record) return res.status(404).json({ ok: false, error: 'Record not found' });
  record.template = JSON.parse(record.templateJson || '{}');
  record.depositSchedule = JSON.parse(record.depositScheduleJson || '[]');
  record.depositPaymentStatuses = JSON.parse(record.depositPaymentStatusesJson || '[]');
  delete record.templateJson;
  delete record.depositScheduleJson;
  delete record.depositPaymentStatusesJson;
  record.items = db.prepare(`
    SELECT id, item_name AS name, quantity AS qty, unit_price AS price, amount
    FROM quotation_items WHERE quotation_id = ? ORDER BY id
  `).all(id);
  return res.json({ ok: true, record });
});

app.patch('/api/quotations/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id, status, deposit_payment_statuses_json AS depositPaymentStatusesJson FROM quotations WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ ok: false, error: 'Record not found' });

  const nextStatus = req.body.status == null ? existing.status : String(req.body.status);
  const nextPaymentStatuses = Array.isArray(req.body.depositPaymentStatuses)
    ? req.body.depositPaymentStatuses.slice(0, 3).map(Boolean)
    : JSON.parse(existing.depositPaymentStatusesJson || '[]');

  db.prepare(`
    UPDATE quotations
    SET status = ?, deposit_payment_statuses_json = ?
    WHERE id = ?
  `).run(nextStatus, JSON.stringify(nextPaymentStatuses), id);

  return res.json({ ok: true, id, status: nextStatus, depositPaymentStatuses: nextPaymentStatuses });
});

async function handleDeviceRequest(req, res) {
  const { action, params } = req.body || {};
  if (OPENCLAW_MODE === 'serial') {
    if (!serialPort || !serialPort.isOpen) {
      return res.status(500).json({ ok: false, error: 'Serial port not open or not configured' });
    }

    const payloadStr = JSON.stringify({ command: action, params }) + '\n';
    try {
      // write and wait for a single line response
      const resp = await new Promise((resolve, reject) => {
        let timer = setTimeout(() => reject(new Error('Timeout waiting for device response')), 5000);
        const onData = (d) => {
          clearTimeout(timer);
          serialParser.removeListener('data', onData);
          resolve(d);
        };
        serialParser.on('data', onData);
        serialPort.write(payloadStr, (err) => {
          if (err) {
            clearTimeout(timer);
            serialParser.removeListener('data', onData);
            reject(err);
          }
        });
      });

      return res.json({ ok: true, message: resp });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message || String(err) });
    }
  }

  // Default: cloud mode
  if (!API_URL) {
    return res.status(500).json({ ok: false, error: 'API URL not configured for cloud mode' });
  }

  try {
    const payload = { command: action, params };
    const headers = { 'Content-Type': 'application/json' };
    if (API_KEY) headers.Authorization = `Bearer ${API_KEY}`;

    const resp = await axios.post(API_URL, payload, { headers, timeout: 15000 });

    return res.json({ ok: true, message: resp.data && resp.data.message ? resp.data.message : resp.data, raw: resp.data });
  } catch (err) {
    const details = err.response ? { status: err.response.status, data: err.response.data } : undefined;
    return res.status(500).json({ ok: false, error: err.message, details });
  }
}

app.post('/api/device', handleDeviceRequest);
app.post('/api/openclaw', handleDeviceRequest);

app.listen(port, () => {
  console.log(`Device bridge listening on http://localhost:${port}`);
  console.log(`Quotation database: ${databasePath}`);
});
