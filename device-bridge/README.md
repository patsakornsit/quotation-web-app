Device Bridge
================

Small Express bridge that forwards `/api/device` requests from the demo frontend to a cloud OpenClaw or DeepSeek HTTP API.

Setup
-----

1. Copy `.env.example` to `.env` and set `DEEPSEEK_CHAT_URL` and `DEEPSEEK_API_KEY` for the quotation-only natural-language assistant.

   Also configure the admin login:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=replace-with-a-strong-password
AUTH_TOKEN_TTL_SECONDS=43200
```

2. Install and run:

```powershell
cd "d:\Power\quotation web app\device-bridge"
npm install
npm start
```

3. The bridge listens on port `3001` and accepts local-network connections. The frontend automatically uses the same hostname it was opened from. For a fixed server address, copy the root `.env.example` to `.env` and set:

```text
VITE_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:3001
```

To open the app on a phone, connect both devices to the same Wi-Fi network and visit `http://YOUR_COMPUTER_LAN_IP:5173` on the phone.

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

Your `LOCAL\\SQLEXPRESS` / `.\\SQLEXPRESS` connection using Windows Authentication should use:

```env
SQL_SERVER=localhost
SQL_INSTANCE=SQLEXPRESS
SQL_DATABASE=QuotationApp
SQL_AUTHENTICATION=windows
SQL_ENCRYPT=false
SQL_TRUST_SERVER_CERTIFICATE=true
```

The Node process connects as the Windows account that runs `npm run server`; that account needs
access to the `QuotationApp` database. For SQL authentication, set `SQL_AUTHENTICATION=sql`,
`SQL_USER`, and `SQL_PASSWORD`. Every completed quotation PDF export and receipt is saved with
its client, line items, totals, payment terms, status, note, currency, template settings, and
export time.

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
- Quotation, assistant, and device API routes require a valid admin login token.
- Add the same admin environment variables to the deployed backend service; never add the admin password to the Vite frontend environment.
- Free-form chat is sent through the backend to DeepSeek and converted into validated quotation actions. Unrelated requests are refused.
- The API key stays in the backend `.env` and is never sent to the browser.

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
