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

Quotation database
------------------

The bridge automatically creates a SQLite database at `device-bridge/data/quotations.db`.
Every completed quotation PDF export and every created receipt is saved with its client,
line items, totals, status, note, currency, tax rate, template settings, and export time.

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
