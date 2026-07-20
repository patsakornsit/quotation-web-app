const express = require('express');
const axios = require('axios');
const cors = require('cors');
const sql = require('mssql');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const sqlConfig = {
  server: process.env.SQL_SERVER || 'localhost',
  port: Number(process.env.SQL_PORT) || 1433,
  database: process.env.SQL_DATABASE || 'QuotationApp',
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: {
    encrypt: String(process.env.SQL_ENCRYPT || 'false').toLowerCase() === 'true',
    trustServerCertificate: String(process.env.SQL_TRUST_SERVER_CERTIFICATE || 'true').toLowerCase() === 'true',
    enableArithAbort: true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

if (process.env.SQL_INSTANCE) {
  delete sqlConfig.port;
  sqlConfig.options.instanceName = process.env.SQL_INSTANCE;
}

let dbPool;

async function initializeDatabase() {
  dbPool = await sql.connect(sqlConfig);
  await dbPool.request().query(`
    IF OBJECT_ID(N'dbo.quotations', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.quotations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        quote_number NVARCHAR(100) NOT NULL,
        document_type NVARCHAR(30) NOT NULL CONSTRAINT DF_quotations_document_type DEFAULT 'quotation',
        client NVARCHAR(300) NOT NULL,
        status NVARCHAR(100) NOT NULL,
        subtotal DECIMAL(18,2) NOT NULL,
        tax DECIMAL(18,2) NOT NULL,
        total DECIMAL(18,2) NOT NULL,
        currency NVARCHAR(10) NOT NULL,
        tax_rate DECIMAL(9,4) NOT NULL,
        deposit_rate DECIMAL(9,4) NOT NULL CONSTRAINT DF_quotations_deposit_rate DEFAULT 30,
        deposit_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_quotations_deposit_amount DEFAULT 0,
        deposit_enabled BIT NOT NULL CONSTRAINT DF_quotations_deposit_enabled DEFAULT 1,
        deposit_comment NVARCHAR(MAX) NOT NULL CONSTRAINT DF_quotations_deposit_comment DEFAULT '',
        deposit_schedule_json NVARCHAR(MAX) NOT NULL CONSTRAINT DF_quotations_deposit_schedule DEFAULT '[]',
        deposit_payment_statuses_json NVARCHAR(MAX) NOT NULL CONSTRAINT DF_quotations_payment_statuses DEFAULT '[]',
        confirmation_name NVARCHAR(300) NOT NULL CONSTRAINT DF_quotations_confirmation_name DEFAULT '',
        confirmation_signature NVARCHAR(MAX) NOT NULL CONSTRAINT DF_quotations_confirmation_signature DEFAULT '',
        confirmation_signature_image NVARCHAR(MAX) NOT NULL CONSTRAINT DF_quotations_signature_image DEFAULT '',
        note NVARCHAR(MAX) NULL,
        template_json NVARCHAR(MAX) NULL,
        exported_at DATETIME2 NOT NULL CONSTRAINT DF_quotations_exported_at DEFAULT SYSUTCDATETIME()
      );
    END;

    IF OBJECT_ID(N'dbo.quotation_items', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.quotation_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        quotation_id INT NOT NULL,
        item_name NVARCHAR(500) NOT NULL,
        quantity DECIMAL(18,4) NOT NULL,
        unit_price DECIMAL(18,2) NOT NULL,
        amount DECIMAL(18,2) NOT NULL,
        CONSTRAINT FK_quotation_items_quotations FOREIGN KEY (quotation_id)
          REFERENCES dbo.quotations(id) ON DELETE CASCADE
      );
    END;
  `);
}

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

app.get('/api/health', (req, res) => res.json({ ok: true, database: dbPool?.connected ? 'connected' : 'disconnected' }));

app.post('/api/quotations', async (req, res) => {
  const record = req.body || {};
  const items = Array.isArray(record.items) ? record.items : [];
  if (!record.quoteNumber || !record.client || items.length === 0) {
    return res.status(400).json({ ok: false, error: 'quoteNumber, client, and at least one item are required' });
  }
  const transaction = new sql.Transaction(dbPool);
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);
    request.input('quoteNumber', sql.NVarChar(100), String(record.quoteNumber));
    request.input('documentType', sql.NVarChar(30), record.documentType === 'receipt' ? 'receipt' : 'quotation');
    request.input('client', sql.NVarChar(300), String(record.client));
    request.input('status', sql.NVarChar(100), String(record.status || 'Draft'));
    request.input('subtotal', sql.Decimal(18, 2), Number(record.subtotal) || 0);
    request.input('tax', sql.Decimal(18, 2), Number(record.tax) || 0);
    request.input('total', sql.Decimal(18, 2), Number(record.total) || 0);
    request.input('currency', sql.NVarChar(10), String(record.currency || '$'));
    request.input('taxRate', sql.Decimal(9, 4), Number(record.taxRate) || 0);
    request.input('depositRate', sql.Decimal(9, 4), Math.min(100, Math.max(0, Number(record.depositRate) || 0)));
    request.input('depositAmount', sql.Decimal(18, 2), Math.max(0, Number(record.depositAmount) || 0));
    request.input('depositEnabled', sql.Bit, record.depositEnabled === false ? 0 : 1);
    request.input('depositComment', sql.NVarChar(sql.MAX), String(record.depositComment || ''));
    request.input('depositSchedule', sql.NVarChar(sql.MAX), JSON.stringify(Array.isArray(record.depositSchedule) ? record.depositSchedule : []));
    request.input('paymentStatuses', sql.NVarChar(sql.MAX), JSON.stringify(Array.isArray(record.depositPaymentStatuses) ? record.depositPaymentStatuses.map(Boolean) : []));
    request.input('confirmationName', sql.NVarChar(300), String(record.confirmationName || ''));
    request.input('confirmationSignature', sql.NVarChar(sql.MAX), String(record.confirmationSignature || ''));
    request.input('signatureImage', sql.NVarChar(sql.MAX), String(record.confirmationSignatureImage || ''));
    request.input('note', sql.NVarChar(sql.MAX), String(record.note || ''));
    request.input('template', sql.NVarChar(sql.MAX), JSON.stringify(record.template || {}));
    const result = await request.query(`
      INSERT INTO dbo.quotations (
        quote_number, document_type, client, status, subtotal, tax, total, currency, tax_rate,
        deposit_rate, deposit_amount, deposit_enabled, deposit_comment, deposit_schedule_json,
        deposit_payment_statuses_json, confirmation_name, confirmation_signature,
        confirmation_signature_image, note, template_json
      )
      OUTPUT INSERTED.id
      VALUES (@quoteNumber, @documentType, @client, @status, @subtotal, @tax, @total, @currency,
        @taxRate, @depositRate, @depositAmount, @depositEnabled, @depositComment, @depositSchedule,
        @paymentStatuses, @confirmationName, @confirmationSignature, @signatureImage, @note, @template)
    `);
    const quotationId = Number(result.recordset[0].id);
    for (const item of items) {
      const quantity = Number(item.qty) || 0;
      const unitPrice = Number(item.price) || 0;
      const itemRequest = new sql.Request(transaction);
      itemRequest.input('quotationId', sql.Int, quotationId);
      itemRequest.input('itemName', sql.NVarChar(500), String(item.name || 'Item'));
      itemRequest.input('quantity', sql.Decimal(18, 4), quantity);
      itemRequest.input('unitPrice', sql.Decimal(18, 2), unitPrice);
      itemRequest.input('amount', sql.Decimal(18, 2), quantity * unitPrice);
      await itemRequest.query(`
        INSERT INTO dbo.quotation_items (quotation_id, item_name, quantity, unit_price, amount)
        VALUES (@quotationId, @itemName, @quantity, @unitPrice, @amount)
      `);
    }
    await transaction.commit();
    return res.status(201).json({ ok: true, id: quotationId });
  } catch (error) {
    try { await transaction.rollback(); } catch {}
    return res.status(500).json({ ok: false, error: error.message || String(error) });
  }
});

app.get('/api/quotations', async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  try {
    const request = dbPool.request();
    request.input('limit', sql.Int, limit);
    const result = await request.query(`
      SELECT TOP (@limit) id, quote_number AS quoteNumber, document_type AS documentType,
        client, status, subtotal, tax, total, currency, tax_rate AS taxRate,
        deposit_rate AS depositRate, deposit_amount AS depositAmount,
        deposit_enabled AS depositEnabled, deposit_comment AS depositComment,
        deposit_schedule_json AS depositScheduleJson, deposit_payment_statuses_json AS depositPaymentStatusesJson,
        note, exported_at AS exportedAt
      FROM dbo.quotations ORDER BY id DESC
    `);
    const records = result.recordset.map(normalizeQuotationRecord);
    return res.json({ ok: true, records });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || String(error) });
  }
});

app.get('/api/quotations/next-number', async (req, res) => {
  try {
    const result = await dbPool.request().query(`SELECT quote_number AS quoteNumber FROM dbo.quotations WHERE document_type = 'quotation'`);
    const highestNumber = result.recordset.reduce((highest, record) => {
    const match = String(record.quoteNumber || '').match(/(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
    }, 1041);
    return res.json({ ok: true, quoteNumber: `Q-${highestNumber + 1}` });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || String(error) });
  }
});

app.get('/api/quotations/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok: false, error: 'Invalid record id' });
  try {
    const request = dbPool.request();
    request.input('id', sql.Int, id);
    const result = await request.query(`
      SELECT id, quote_number AS quoteNumber, document_type AS documentType,
        client, status, subtotal, tax, total, currency, tax_rate AS taxRate,
        deposit_rate AS depositRate, deposit_amount AS depositAmount,
        deposit_enabled AS depositEnabled, deposit_comment AS depositComment,
        deposit_schedule_json AS depositScheduleJson, deposit_payment_statuses_json AS depositPaymentStatusesJson,
        confirmation_name AS confirmationName, confirmation_signature AS confirmationSignature,
        confirmation_signature_image AS confirmationSignatureImage,
        note, template_json AS templateJson, exported_at AS exportedAt
      FROM dbo.quotations WHERE id = @id;
      SELECT id, item_name AS name, quantity AS qty, unit_price AS price, amount
      FROM dbo.quotation_items WHERE quotation_id = @id ORDER BY id;
    `);
    if (!result.recordsets[0][0]) return res.status(404).json({ ok: false, error: 'Record not found' });
    const record = normalizeQuotationRecord(result.recordsets[0][0]);
    record.template = parseJson(record.templateJson, {});
    delete record.templateJson;
    record.items = result.recordsets[1];
    return res.json({ ok: true, record });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || String(error) });
  }
});

app.patch('/api/quotations/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ ok: false, error: 'Invalid record id' });
  try {
    const readRequest = dbPool.request();
    readRequest.input('id', sql.Int, id);
    const existingResult = await readRequest.query(`SELECT status, deposit_payment_statuses_json AS depositPaymentStatusesJson FROM dbo.quotations WHERE id = @id`);
    const existing = existingResult.recordset[0];
    if (!existing) return res.status(404).json({ ok: false, error: 'Record not found' });
    const nextStatus = req.body.status == null ? existing.status : String(req.body.status);
    const nextPaymentStatuses = Array.isArray(req.body.depositPaymentStatuses)
      ? req.body.depositPaymentStatuses.slice(0, 3).map(Boolean)
      : parseJson(existing.depositPaymentStatusesJson, []);
    const updateRequest = dbPool.request();
    updateRequest.input('id', sql.Int, id);
    updateRequest.input('status', sql.NVarChar(100), nextStatus);
    updateRequest.input('paymentStatuses', sql.NVarChar(sql.MAX), JSON.stringify(nextPaymentStatuses));
    await updateRequest.query(`UPDATE dbo.quotations SET status = @status, deposit_payment_statuses_json = @paymentStatuses WHERE id = @id`);
    return res.json({ ok: true, id, status: nextStatus, depositPaymentStatuses: nextPaymentStatuses });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || String(error) });
  }
});

function parseJson(value, fallback) {
  try { return JSON.parse(value || JSON.stringify(fallback)); } catch { return fallback; }
}

function normalizeQuotationRecord(record) {
  record.depositEnabled = Boolean(record.depositEnabled);
  record.depositSchedule = parseJson(record.depositScheduleJson, []);
  record.depositPaymentStatuses = parseJson(record.depositPaymentStatusesJson, []);
  delete record.depositScheduleJson;
  delete record.depositPaymentStatusesJson;
  return record;
}

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

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Device bridge listening on http://localhost:${port}`);
      const sqlLocation = sqlConfig.options.instanceName
        ? `${sqlConfig.server}\\${sqlConfig.options.instanceName}`
        : `${sqlConfig.server}:${sqlConfig.port}`;
      console.log(`SQL Server database: ${sqlLocation}/${sqlConfig.database}`);
    });
  })
  .catch((error) => {
    console.error('Could not connect to SQL Server:', error.message || error);
    process.exitCode = 1;
  });
