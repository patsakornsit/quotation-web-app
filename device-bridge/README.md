Device Bridge
================

Small Express bridge that forwards `/api/device` requests from the demo frontend to a cloud OpenClaw or DeepSeek HTTP API.

Setup
-----

1. Copy `.env.example` to `.env` and set `OPENCLAW_API_URL` or `DEEPSEEK_API_URL` (and `OPENCLAW_API_KEY` or `DEEPSEEK_API_KEY` if required).

2. Install and run:

```powershell
cd "d:\Power\quotation web app\device-bridge"
npm install
npm start
```

3. The bridge listens on `http://localhost:3001` by default. From the demo frontend you can either:

- Use a dev proxy so `/api/device` is proxied to `http://localhost:3001/api/device` (recommended when running the React dev server), or
- Edit the client fetch URL in `quotation-chat-demo.jsx` to point at `http://localhost:3001/api/device`.

Test
----

Send a test command:

```powershell
curl -X POST http://localhost:3001/api/device -H "Content-Type: application/json" -d '{"action":"status","params":{}}'
```

Quotation database (Microsoft SQL Server)
-----------------------------------------

Create an empty SQL Server database named `QuotationApp`, then add the SQL connection values
from `.env.example` to your `.env`. The configured SQL login needs permission to connect to the
database and create/read/write tables. On startup, the bridge automatically creates the
`dbo.quotations` and `dbo.quotation_items` tables when they do not exist.

Example SQL Server authentication settings:

```env
SQL_SERVER=localhost
SQL_PORT=1433
SQL_DATABASE=QuotationApp
SQL_USER=quotation_app
SQL_PASSWORD=your-secure-password
SQL_ENCRYPT=false
SQL_TRUST_SERVER_CERTIFICATE=true
```

For SQL Server Express or another named instance, use `SQL_INSTANCE=SQLEXPRESS` instead of
`SQL_PORT`. Every completed quotation PDF export and receipt is saved with its client, line
items, totals, payment terms, status, note, currency, template settings, and export time.

Read the most recent records:

```powershell
curl http://localhost:3001/api/quotations
```

Read one record including all line items:

```powershell
curl http://localhost:3001/api/quotations/1
```

Notes
-----
- The bridge simply forwards `{ command, params }` to the configured `OPENCLAW_API_URL` and returns the remote response.
- Provide the actual OpenClaw API docs or the exact request format if the cloud API differs from this shape and I will adapt the bridge.

Serial (USB) mode
------------------

You can run the bridge in serial mode to talk directly to a USB/serial-connected OpenClaw device.

1. Set these in `.env`:

```
OPENCLAW_MODE=serial
OPENCLAW_SERIAL_PORT=COM3           # or /dev/ttyUSB0
OPENCLAW_BAUD=115200
PORT=3001
```

2. Start the bridge and the server will open the serial port and expose `/api/openclaw` which accepts POST `{ action, params }` and forwards the JSON command down the serial link.

Notes about device protocol
--------------------------
The bridge writes a single-line JSON payload (ending with `\n`) like `{ "command": "open", "params": { ... } }` and waits for a newline-terminated response from the device. If your device uses a different wire format, paste the protocol here and I will adapt the bridge.
