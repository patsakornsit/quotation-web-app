import { useState, useRef, useEffect } from "react";

const STYLES = `
html, body, #root {
  min-height: 100vh;
  height: 100%;
  margin: 0;
  background: #101A24;
}
body {
  background: #101A24;
}
.ledger-app {
  --paper: #EDE6D3;
  --paper-line: #B9C6AE;
  --ink: #1E2A38;
  --ink-soft: #45566a;
  --accent-red: #A63A2E;
  --accent-gold: #B8862F;
  --panel-dark: #101A24;
  --panel-dark-2: #182531;
  --panel-dark-3: #223447;
  --bubble-user: #2B4258;
  --bubble-bot: #1A2733;
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--ink);
  display: grid;
  grid-template-columns: minmax(300px, 1fr) minmax(340px, 1.15fr);
  min-height: 100vh;
  background: var(--panel-dark);
  border-radius: 8px;
  overflow: hidden;
}
.ledger-serif { font-family: 'Zilla Slab', Georgia, serif; }
.ledger-mono { font-family: 'IBM Plex Mono', 'Courier New', monospace; }

.chat-side {
  background: radial-gradient(ellipse at top left, var(--panel-dark-3) 0%, var(--panel-dark) 55%);
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-right: 1px solid #05090d;
}
.chat-header {
  padding: 18px 22px 14px;
  border-bottom: 1px solid #04080c;
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.chat-header .brand { font-weight: 700; font-size: 20px; color: var(--paper); }
.chat-header .brand-mark { color: var(--accent-gold); }
.chat-header .tag {
  font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #6f8296;
}
.chat-log {
  flex: 1; overflow-y: auto; padding: 18px 22px;
  display: flex; flex-direction: column; gap: 12px;
}
.msg {
  max-width: 86%; padding: 10px 13px; border-radius: 3px;
  font-size: 14px; line-height: 1.5; animation: rise 0.25s ease both;
  white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word;
}
@keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.msg.bot { align-self: flex-start; background: var(--bubble-bot); color: #cfd9e2; border-left: 2px solid var(--accent-gold); }
.msg.user { align-self: flex-end; background: var(--bubble-user); color: var(--paper); border-right: 2px solid var(--accent-red); }
.msg .who { display: block; font-size: 9px; letter-spacing: 0.13em; text-transform: uppercase; opacity: 0.55; margin-bottom: 3px; }
.msg code { background: rgba(255,255,255,0.08); padding: 1px 5px; border-radius: 2px; font-size: 0.92em; }

.suggestions { padding: 0 22px 10px; display: flex; flex-wrap: wrap; gap: 7px; }
.chip {
  font-size: 11px; color: #a9bacb; background: var(--panel-dark-3);
  border: 1px solid #2c4155; padding: 5px 10px; border-radius: 20px; cursor: pointer;
}
.chip:hover { background: var(--accent-gold); color: #1a1305; border-color: var(--accent-gold); }

.chat-input-row { display: flex; gap: 8px; padding: 14px 22px 18px; border-top: 1px solid #04080c; }
.chat-input-row textarea {
  flex: 1; background: var(--panel-dark-2); border: 1px solid #2c4155; color: var(--paper);
  padding: 10px 12px; border-radius: 4px; font: 13.5px 'Inter', sans-serif; line-height: 1.4;
  outline: none; resize: vertical; min-height: 42px; max-height: 120px; box-sizing: border-box;
  overflow-wrap: anywhere; word-break: break-word;
}
.chat-input-row textarea:focus { border-color: var(--accent-gold); }
.chat-input-row textarea::placeholder { color: #5c7086; }
.send-btn {
  background: var(--accent-gold); color: #1a1305; border: none; border-radius: 4px;
  padding: 0 18px; font-weight: 600; font-size: 12px; letter-spacing: 0.05em;
  text-transform: uppercase; cursor: pointer;
}

.paper-side {
  background: var(--paper); overflow-y: auto; padding: 30px 34px 46px; position: relative;
  background-image: repeating-linear-gradient(to bottom, transparent, transparent 27px, var(--paper-line) 28px);
  background-position: 0 108px;
}
.paper-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 18px; }
.paper-toolbar .label { margin-right: auto; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-soft); }
.page-tabs { display: flex; border: 1px solid var(--ink); border-radius: 3px; overflow: hidden; }
.page-tab { border: 0; background: transparent; color: var(--ink); padding: 7px 10px; cursor: pointer; font: 10px 'IBM Plex Mono', monospace; }
.page-tab.active { background: var(--ink); color: var(--paper); }
.pdf-btn {
  background: var(--ink); color: var(--paper); border: none; padding: 8px 14px; border-radius: 3px;
  font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer;
}
.pdf-btn:hover { background: var(--accent-red); }
.toolbar-actions { display: flex; gap: 8px; }
.design-btn { background: transparent; color: var(--ink); border: 1px solid var(--ink); }
.design-btn:hover { background: var(--ink); color: var(--paper); }
.history-btn { background: var(--accent-gold); color: #1a1305; }

.history-modal {
  position: fixed; inset: 0; z-index: 25; background: rgba(5,9,13,.75); padding: 24px;
  display: flex; align-items: center; justify-content: center;
}
.history-panel {
  width: min(720px, 100%); max-height: min(760px, 90vh); overflow-y: auto;
  background: #f7f3e8; color: #1E2A38; border-radius: 6px; padding: 24px;
  box-shadow: 0 20px 60px rgba(0,0,0,.35);
}
.history-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
.history-head h2 { margin: 0; font-size: 25px; }
.history-head p { margin: 4px 0 0; color: #66717c; font-size: 12px; }
.history-search { width: 100%; box-sizing: border-box; border: 1px solid #c6bdab; border-radius: 4px; padding: 10px 12px; margin-bottom: 14px; font-size: 13px; }
.history-list { display: flex; flex-direction: column; gap: 9px; }
.history-row {
  display: grid; grid-template-columns: 1fr 1.3fr .8fr .8fr auto; gap: 12px; align-items: center;
  padding: 12px; border: 1px solid #d2cab8; background: #fffdf7; border-radius: 4px;
}
.history-row small { display: block; color: #74808a; font-size: 9px; margin-bottom: 3px; text-transform: uppercase; letter-spacing: .07em; }
.history-row strong { font-size: 12px; }
.history-row em { display: block; color: #74808a; font-size: 9px; font-style: normal; margin-top: 3px; }
.history-status { display: inline-block; border: 1px solid #b8ad98; border-radius: 20px; padding: 3px 7px; font-size: 9px; }
.history-load { border: 0; border-radius: 3px; background: #1E2A38; color: white; padding: 7px 11px; cursor: pointer; }
.history-load:disabled { opacity: .5; cursor: wait; }
.record-actions { display: flex; gap: 6px; justify-content: flex-end; }
.history-delete { border: 1px solid #A63A2E; border-radius: 3px; background: transparent; color: #A63A2E; padding: 7px 9px; cursor: pointer; }
.history-delete:hover { background: #A63A2E; color: white; }
.history-delete:disabled { opacity: .5; cursor: wait; }
.history-empty { padding: 34px; text-align: center; border: 1px dashed #c6bdab; color: #66717c; }
.history-error { padding: 12px; background: #f4dcd7; color: #8b3027; border-radius: 4px; margin-bottom: 12px; }

.template-modal {
  position: fixed; inset: 0; z-index: 20; background: rgba(5,9,13,0.72); padding: 24px;
  display: flex; justify-content: flex-end; align-items: stretch;
}
.template-panel {
  width: min(420px, 100%); background: #f7f3e8; color: #1E2A38; border-radius: 6px;
  padding: 24px; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.35);
}
.template-panel-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.template-panel h2 { margin: 0; font-size: 24px; }
.template-panel-head p { margin: 4px 0 0; color: #66717c; font-size: 12px; }
.icon-btn { border: 0; background: transparent; font-size: 24px; cursor: pointer; color: #45566a; }
.template-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.template-field { display: flex; flex-direction: column; gap: 5px; }
.template-field.wide { grid-column: 1 / -1; }
.template-field label { font: 10px 'IBM Plex Mono', monospace; letter-spacing: .1em; text-transform: uppercase; color: #66717c; }
.template-field input { box-sizing: border-box; width: 100%; border: 1px solid #c6bdab; border-radius: 4px; background: white; padding: 9px 10px; color: #1E2A38; font-size: 13px; }
.template-field input[type='color'] { padding: 3px; height: 38px; cursor: pointer; }
.template-actions { display: flex; justify-content: space-between; gap: 10px; margin-top: 22px; }
.template-actions button { border: 0; border-radius: 4px; padding: 9px 14px; cursor: pointer; font-weight: 600; }
.reset-btn { background: #ded7c7; color: #1E2A38; }
.done-btn { background: #1E2A38; color: #EDE6D3; }

.quote-head { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; margin-bottom: 4px; }
.quote-head h1 { font-size: 30px; margin: 0; font-weight: 700; }
.quote-head .sub { font-size: 10.5px; color: var(--ink-soft); margin-top: 4px; }
.quote-meta { text-align: right; font-size: 11.5px; color: var(--ink-soft); line-height: 1.7; }
.quote-meta strong { color: var(--ink); }
.quote-number-input { width: 92px; border: 0; border-bottom: 1px solid var(--ink-soft); background: transparent; color: var(--ink); text-align: right; font: 600 11.5px 'IBM Plex Mono', monospace; }

.quote-parties { display: flex; justify-content: space-between; margin: 18px 0 6px; gap: 18px; }
.party { flex: 1; }
.party-label { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent-gold); margin-bottom: 4px; }
.party-name { font-size: 17px; font-weight: 600; }
.party-name.empty { color: #9c9686; font-style: italic; font-weight: 400; font-size: 14px; }

table.items { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12.5px; }
table.items thead th {
  text-align: left; font-size: 9.5px; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--ink-soft); border-bottom: 2px solid var(--ink); padding-bottom: 7px; font-weight: 500;
}
table.items thead th.num { text-align: right; }
table.items tbody td { padding: 9px 0; border-bottom: 1px solid #c9c0a8; vertical-align: top; }
table.items tbody td.num { text-align: right; white-space: nowrap; }
table.items tbody td:first-child {
  width: 52%; max-width: 0; padding-right: 14px; white-space: pre-wrap;
  overflow-wrap: anywhere; word-break: break-word; line-height: 1.45;
}
.package-item-row td.package-item-cell { width: auto; max-width: none; padding: 10px 0; white-space: normal; }
.package-item-heading {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 14px;
  padding-bottom: 7px; margin-bottom: 8px; border-bottom: 1px solid #c9c0a8;
}
.package-item-heading strong { display: block; font-size: 16px; line-height: 1.35; }
.package-item-heading small { display: block; margin-top: 4px; color: var(--ink-soft); font-size: 11.5px; line-height: 1.4; }
.package-item-price { text-align: right; white-space: nowrap; font-size: 15px; font-weight: 700; }
.package-item-actions { display: flex; align-items: flex-start; gap: 8px; }
.package-item-actions .remove-x { font-size: 12px; }
.package-scope {
  columns: 2 220px; column-gap: 20px; column-rule: 1px solid rgba(69,86,106,.2);
  white-space: pre-wrap; overflow-wrap: anywhere; font: 12px/1.45 'Inter', sans-serif;
}
.package-a-item .package-scope { font-size: 14px; line-height: 1.55; }
.empty-row td { padding: 22px 0; text-align: center; color: #a49c86; font-style: italic; font-family: 'Inter', sans-serif; font-size: 12.5px; }
.remove-x { color: var(--accent-red); cursor: pointer; font-size: 11px; opacity: 0.55; padding-left: 8px; }
.remove-x:hover { opacity: 1; }

.totals { margin-top: 4px; margin-left: auto; width: 220px; font-size: 12.5px; }
.totals .row { display: flex; justify-content: space-between; padding: 6px 0; color: var(--ink-soft); }
.totals .row.grand { border-top: 2px solid var(--ink); margin-top: 4px; padding-top: 9px; font-size: 15px; color: var(--ink); font-weight: 600; }

.deposit-note {
  width: min(310px, 100%); margin-top: 24px; padding: 13px 14px; box-sizing: border-box;
  border-left: 3px solid var(--accent-gold); background: rgba(255,255,255,0.28);
}
.deposit-title { font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-soft); }
.deposit-mode { display: flex; gap: 6px; margin-top: 9px; }
.deposit-options { display: flex; flex-wrap: wrap; gap: 6px; margin: 9px 0 11px; }
.deposit-option {
  border: 1px solid #a9a18e; background: transparent; color: var(--ink); border-radius: 3px;
  padding: 5px 8px; font: 10px 'IBM Plex Mono', monospace; cursor: pointer;
}
.deposit-option.active { background: var(--ink); border-color: var(--ink); color: var(--paper); }
.deposit-schedule { display: flex; flex-direction: column; gap: 7px; }
.deposit-installment { display: grid; grid-template-columns: 1fr 58px auto; gap: 8px; align-items: center; font-size: 11px; }
.deposit-installment label { color: var(--ink-soft); }
.deposit-installment input {
  width: 58px; box-sizing: border-box; border: 1px solid #a9a18e; border-radius: 3px;
  background: var(--paper); color: var(--ink); padding: 5px 4px; text-align: right;
  font: 10px 'IBM Plex Mono', monospace;
}
.deposit-installment strong { min-width: 76px; text-align: right; font-size: 11px; }
.deposit-total { display: flex; justify-content: space-between; gap: 16px; border-top: 1px solid #c9c0a8; margin-top: 10px; padding-top: 8px; font-size: 10.5px; }
.deposit-total.invalid { color: var(--accent-red); font-weight: 700; }
.deposit-help { margin-top: 7px; font: 9.5px 'Inter', sans-serif; color: var(--ink-soft); }
.deposit-comment { margin-top: 12px; }
.deposit-comment label { display: block; margin-bottom: 5px; font-size: 9px; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-soft); }
.deposit-comment textarea {
  width: 100%; min-height: 54px; box-sizing: border-box; resize: vertical; border: 1px solid #a9a18e;
  border-radius: 3px; background: rgba(255,255,255,.25); color: var(--ink); padding: 7px 8px;
  font: 13px 'Inter', sans-serif; line-height: 1.45;
}
.deposit-comment-print { display: none; white-space: pre-wrap; overflow-wrap: anywhere; font: 13px 'Inter', sans-serif; line-height: 1.45; }
.cash-payment { margin-top: 10px; padding: 9px 0; border-top: 1px solid #c9c0a8; border-bottom: 1px solid #c9c0a8; display: flex; justify-content: space-between; gap: 12px; font-size: 11px; }

.quote-summary {
  margin-top: 26px; border: 1px solid #c9c0a8; background: rgba(255,255,255,0.32);
  padding: 14px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; align-items: end;
}
.summary-heading { grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: baseline; }
.summary-heading strong { font-size: 14px; }
.summary-heading span { font-size: 9px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: .1em; }
.summary-cell label { display: block; font-size: 8px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 3px; }
.summary-cell strong { font-size: 12px; }
.status-select { width: 100%; border: 1px solid #a9a18e; background: var(--paper); color: var(--ink); padding: 7px; border-radius: 3px; }
.receipt-btn { border: 0; background: var(--accent-red); color: white; padding: 8px 10px; border-radius: 3px; cursor: pointer; }
.receipt-btn:disabled { opacity: .45; cursor: not-allowed; }

.receipt-modal {
  position: fixed; inset: 0; z-index: 30; background: rgba(5,9,13,.78); padding: 24px;
  display: flex; align-items: center; justify-content: center; overflow-y: auto;
}
.receipt-sheet { width: min(680px, 100%); background: #fffdf7; color: #1E2A38; padding: 34px; box-sizing: border-box; box-shadow: 0 20px 60px rgba(0,0,0,.35); }
.receipt-actions { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 24px; }
.receipt-actions button { border: 0; border-radius: 3px; padding: 8px 12px; cursor: pointer; }
.receipt-close { background: #e4ded0; color: #1E2A38; }
.receipt-print { background: #1E2A38; color: white; }
.receipt-head { display: flex; justify-content: space-between; border-bottom: 2px solid #1E2A38; padding-bottom: 16px; }
.receipt-head h2 { font-size: 30px; margin: 0; }
.receipt-meta { text-align: right; font-size: 11px; line-height: 1.7; }
.receipt-paid { display: inline-block; margin-top: 8px; padding: 4px 9px; border: 2px solid #4c8b63; color: #39734f; font-weight: 700; letter-spacing: .12em; }
.receipt-party { margin: 22px 0; }
.receipt-party span { display: block; font-size: 9px; color: #687480; text-transform: uppercase; letter-spacing: .1em; }
.receipt-party strong { font-size: 17px; }
.receipt-items { width: 100%; border-collapse: collapse; font-size: 12px; }
.receipt-items th, .receipt-items td { padding: 9px 0; border-bottom: 1px solid #d8d1c1; text-align: left; }
.receipt-items .num { text-align: right; }
.receipt-items td:first-child { width: 68%; max-width: 0; padding-right: 14px; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; line-height: 1.45; }
.receipt-total { margin: 16px 0 0 auto; width: 240px; }
.receipt-total div { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; }
.receipt-total .grand { border-top: 2px solid #1E2A38; margin-top: 4px; padding-top: 9px; font-size: 16px; font-weight: 700; }
.receipt-footer { margin-top: 38px; text-align: center; color: #687480; font-size: 10px; }

.note-line { margin-top: 22px; font-size: 12.5px; color: var(--ink-soft); font-style: italic; min-height: 16px; font-family: 'Inter', sans-serif; }
.footer-note { margin-top: 34px; font-size: 9.5px; color: #a49c86; letter-spacing: 0.05em; }
.confirmation { width: min(280px, 100%); margin: 32px 0 0 auto; text-align: right; break-inside: avoid; }
.confirmation-title { font-size: 9px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-soft); margin-bottom: 12px; }
.confirmation input { width: 100%; box-sizing: border-box; border: 0; border-bottom: 1px solid #a9a18e; background: transparent; color: var(--ink); padding: 6px 2px; text-align: right; }
.confirmation-name { font: 12px 'IBM Plex Mono', monospace; }
.confirmation-signature { margin-top: 8px; font: 22px 'Brush Script MT', 'Segoe Script', cursive; }
.signature-upload-controls { display: flex; justify-content: flex-end; gap: 7px; margin-top: 9px; }
.signature-upload-controls label, .signature-upload-controls button { border: 1px solid #a9a18e; background: transparent; color: var(--ink); border-radius: 3px; padding: 5px 8px; cursor: pointer; font: 9px 'IBM Plex Mono', monospace; }
.signature-upload-controls input { display: none; }
.signature-image { display: block; max-width: 220px; max-height: 86px; margin: 10px 0 4px auto; object-fit: contain; }
.confirmation-labels { display: flex; justify-content: space-between; margin-top: 4px; color: var(--ink-soft); font-size: 8px; text-transform: uppercase; letter-spacing: .08em; }

.summary-page { min-height: 620px; }
.summary-page-head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--ink); padding-bottom: 14px; }
.summary-page-head h1 { margin: 0; font-size: 29px; }
.summary-page-head p { margin: 4px 0 0; color: var(--ink-soft); font-size: 11px; }
.summary-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 24px 0; }
.summary-kpi { border: 1px solid #c9c0a8; background: rgba(255,255,255,.28); padding: 14px; }
.summary-kpi span { display: block; color: var(--ink-soft); font-size: 8px; text-transform: uppercase; letter-spacing: .1em; margin-bottom: 5px; }
.summary-kpi strong { font-size: 15px; }
.summary-section { margin-top: 24px; }
.summary-section h2 { margin: 0 0 10px; font-size: 18px; }
.summary-schedule-row { display: flex; justify-content: space-between; border-bottom: 1px solid #c9c0a8; padding: 8px 0; font-size: 11px; }
.summary-actions { display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: end; margin-top: 28px; }
.summary-dashboard-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.summary-dashboard-head button { border: 0; background: var(--ink); color: var(--paper); border-radius: 3px; padding: 8px 11px; cursor: pointer; }
.summary-records { display: flex; flex-direction: column; gap: 12px; margin-top: 22px; }
.summary-record { border: 1px solid #c9c0a8; background: rgba(255,255,255,.28); padding: 14px; }
.summary-record-main { display: grid; grid-template-columns: .8fr 1.3fr .8fr 1fr auto; gap: 12px; align-items: center; }
.summary-record-main small { display: block; color: var(--ink-soft); font-size: 8px; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 4px; }
.summary-record-main strong { font-size: 11px; }
.summary-record .status-select { min-width: 120px; }
.payment-tracker { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 12px; padding-top: 11px; border-top: 1px solid #c9c0a8; }
.payment-toggle { border: 1px solid #a9a18e; background: transparent; color: var(--ink); border-radius: 3px; padding: 6px 9px; cursor: pointer; font: 9.5px 'IBM Plex Mono', monospace; }
.payment-toggle.paid { background: #39734f; border-color: #39734f; color: white; }
.summary-error { margin-top: 14px; padding: 10px; background: #f4dcd7; color: #8b3027; font-size: 11px; }

@media (max-width: 760px) {
  html, body, #root { height: auto; min-height: 100%; }
  .ledger-app {
    display: flex; flex-direction: column; min-height: 100vh;
    border-radius: 0; overflow: visible;
  }
  .chat-side {
    height: 58svh; min-height: 420px; flex: none;
    border-right: 0; border-bottom: 1px solid #05090d;
  }
  .chat-header { padding: 14px 14px 11px; }
  .chat-log { padding: 12px 14px; }
  .msg { max-width: 90%; font-size: 13px; }
  .suggestions {
    padding: 0 14px 9px; flex-wrap: nowrap; overflow-x: auto;
    scrollbar-width: thin;
  }
  .chip { flex: 0 0 auto; }
  .chat-input-row { padding: 11px 14px 14px; }
  .send-btn { padding: 0 13px; }
  .paper-side { padding: 18px 12px 36px; overflow: visible; background-position: 0 90px; }
  .history-modal { padding: 10px; }
  .history-panel { padding: 14px; max-height: 94vh; }
  .history-row { grid-template-columns: 1fr 1fr; }
  .record-actions { grid-column: 1 / -1; }
  .record-actions button { flex: 1; }
  .paper-toolbar { flex-wrap: wrap; align-items: stretch; }
  .paper-toolbar .label { width: 100%; }
  .page-tabs { flex: 1 1 auto; }
  .page-tab { flex: 1; }
  .pdf-btn { flex: 1 1 auto; padding: 8px 9px; font-size: 9px; }
  .quote-head { gap: 12px; }
  .quote-head h1 { font-size: 25px; }
  .quote-meta { flex: 0 0 auto; font-size: 10px; }
  .quote-number-input { width: 78px; }
  .quote-parties { flex-direction: column; gap: 10px; margin-top: 12px; }
  table.items { table-layout: fixed; font-size: 10px; }
  table.items th:nth-child(3),
  table.items td:not(.package-item-cell):nth-child(3) { display: none; }
  table.items tbody td:first-child { width: 58%; padding-right: 8px; }
  .package-item-heading { gap: 8px; }
  .package-item-heading strong { font-size: 13px; }
  .package-item-price { font-size: 12px; }
  .package-scope, .package-a-item .package-scope { columns: 1; font-size: 11px; line-height: 1.45; }
  .totals { width: min(220px, 100%); }
  .deposit-note { width: 100%; }
  .deposit-installment { grid-template-columns: 1fr 58px; }
  .deposit-installment strong { grid-column: 1 / -1; text-align: left; }
  .confirmation { width: 100%; margin-top: 24px; }
  .template-modal, .receipt-modal { padding: 8px; align-items: flex-start; overflow-y: auto; }
  .template-panel, .receipt-sheet { padding: 18px 14px; }
  .template-grid { grid-template-columns: 1fr; }
  .template-field.wide { grid-column: auto; }
  .summary-kpis { grid-template-columns: 1fr; gap: 8px; }
  .summary-record-main { grid-template-columns: 1fr 1fr; }
  .summary-actions { grid-template-columns: 1fr; }
}

@media print {
  @page { size: Letter portrait; margin: 0; }
  html, body, #root {
    width: 8.5in;
    height: auto;
    min-height: 0;
    margin: 0;
    padding: 0;
    background: var(--paper, #EDE6D3);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body { overflow: visible; }
  .ledger-app {
    display: block;
    width: 8.5in;
    min-height: 11in;
    overflow: visible;
    background: var(--paper);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .chat-side { display: none !important; }
  .paper-side {
    position: static;
    width: 8.5in;
    min-height: 11in;
    margin: 0;
    padding: 12mm 14mm;
    box-sizing: border-box;
    background-color: var(--paper);
    background-image: none;
    overflow: visible;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .paper-toolbar { display: none; }
  .quote-summary { display: none; }
  .deposit-options, .deposit-mode { display: none; }
  .deposit-note { break-inside: avoid; }
  .deposit-installment { grid-template-columns: 1fr auto; }
  .deposit-installment input { display: none; }
  .deposit-comment textarea { display: none; }
  .deposit-comment-print { display: block; }
  .quote-number-input, .confirmation input { border-bottom-color: transparent; }
  .package-item-heading { padding-bottom: 4px; margin-bottom: 5px; }
  .package-item-heading strong { font-size: 12.5px; }
  .package-item-heading small { font-size: 8.5px; }
  .package-item-price { font-size: 12px; }
  .package-item-actions .remove-x { display: none; }
  .package-scope {
    columns: 3; column-gap: 10px; column-rule: 1px solid rgba(69,86,106,.2);
    font-size: 8.2px; line-height: 1.24;
  }
  .package-quote .deposit-note { width: 100%; margin-top: 8px; padding: 6px 8px; }
  .package-quote .deposit-comment { margin-top: 5px; }
  .package-quote .deposit-comment label { margin-bottom: 3px; font-size: 8px; }
  .package-quote .deposit-comment-print {
    columns: 2; column-gap: 12px; column-rule: 1px solid rgba(69,86,106,.2);
    font-size: 8.2px; line-height: 1.24;
  }
  .package-quote .confirmation { margin-top: 12px; }
  .package-a-quote .package-item-heading { padding-bottom: 7px; margin-bottom: 8px; }
  .package-a-quote .package-item-heading strong { font-size: 14px; }
  .package-a-quote .package-item-heading small { font-size: 10px; }
  .package-a-quote .package-item-price { font-size: 13px; }
  .package-a-quote .package-scope {
    columns: 2; column-gap: 18px;
    font-size: 10.5px; line-height: 1.42;
  }
  .package-a-quote .deposit-comment label { font-size: 9px; }
  .package-a-quote .deposit-comment-print { font-size: 9.2px; line-height: 1.34; }
  table.items { margin-top: 10px; }
  table.items tbody td { padding-top: 5px; padding-bottom: 5px; }
  .signature-upload-controls { display: none; }
  .template-modal { display: none !important; }
  .history-modal { display: none !important; }
  .receipt-actions { display: none; }
  body.printing-receipt .paper-side { display: none !important; }
  body.printing-receipt .receipt-modal {
    position: static;
    width: 8.5in;
    min-height: 11in;
    padding: 12mm 14mm;
    box-sizing: border-box;
    background: white;
    display: block;
  }
  body.printing-receipt .receipt-sheet { width: 100%; padding: 0; box-shadow: none; }
}
`;

const DEFAULT_TEMPLATE = {
  title: "Quotation",
  tagline: "generated in chat, priced on paper",
  companyName: "JOYA Atelier",
  footer: "Ledger demo · this preview is what gets exported to PDF",
  currency: "$",
  taxRate: 7,
  paperColor: "#EDE6D3",
  inkColor: "#1E2A38",
  accentColor: "#B8862F",
  stampColor: "#A63A2E",
};

const initialMessage = {
  who: "bot",
  text: `Hi — I'm the Ledger demo agent. Tell me a client, add line items, and I'll build the quotation on the right in real time. Try a suggestion below, or type "add Logo design, 1, 800".`,
};

const PACKAGE_A_ITEM = {
  buttonLabel: "PACKAGE A",
  qty: 1,
  price: 90000,
  name: `PACKAGE A

Interior Design Package

ค่าบริการออกแบบ : 90,000 บาท

ขอบเขตการให้บริการ (Scope of Services)

1. สำรวจและวิเคราะห์ความต้องการ
• ประชุมรับฟังความต้องการ (Design Brief)
• วิเคราะห์รูปแบบการใช้งาน (Space Requirement)
• ศึกษาพื้นที่และข้อจำกัดของโครงการ

2. การออกแบบพื้นที่ (Space Planning)
• จัดทำผังการใช้งาน (Layout Plan)
• วางตำแหน่งเฟอร์นิเจอร์และฟังก์ชันการใช้งาน
• ปรับปรุงผังให้เหมาะสมกับการใช้งานจริง

3. แนวคิดการออกแบบ (Concept Design)
• จัดทำ Mood & Material Board
• กำหนดโทนสี วัสดุ และบรรยากาศของโครงการ
• นำเสนอแนวคิดการออกแบบโดยรวม

4. ภาพจำลองสามมิติ (3D Perspective)
• จัดทำภาพ Perspective สำหรับนำเสนอแนวคิดการออกแบบ
• เพื่อแสดงบรรยากาศและภาพรวมของพื้นที่ก่อนดำเนินการก่อสร้าง

5. แบบก่อสร้างงานตกแต่งภายใน (Working Drawing)
จัดทำแบบก่อสร้างที่เกี่ยวข้องกับงานตกแต่งภายใน เช่น
• แบบแปลนงานตกแต่งภายใน
• แบบขยายงานบิลท์อิน (Built-in Detail)
• แบบรายละเอียดเฟอร์นิเจอร์บิลท์อิน
• แบบรายละเอียดวัสดุที่เกี่ยวข้องกับงานออกแบบ
(รายละเอียดแบบขึ้นอยู่กับขอบเขตของโครงการ)

6. BOQ (Quantity Take-off)
จัดทำรายการปริมาณงานสำหรับ
• งานตกแต่งภายใน
• งานเฟอร์นิเจอร์บิลท์อิน
เพื่อใช้ประกอบการขอใบเสนอราคาจากผู้รับเหมา

หมายเหตุ
BOQ เป็นการถอดปริมาณงาน (Quantity Take-off) เท่านั้น
ไม่รวมการจัดทำราคากลาง
ไม่รวมการเปรียบเทียบราคาผู้รับเหมา
ไม่รวมการบริหารต้นทุนโครงการ

7. การแก้ไขแบบ (Revision)
รวมการแก้ไขแบบไม่เกิน 3 รอบ
การแก้ไขต้องอยู่ภายใต้แนวคิดและขอบเขตงานเดิม
หากมีการเปลี่ยนแปลงแนวคิด (Concept) หรือเพิ่มขอบเขตงานภายหลังการอนุมัติแบบ จะถือเป็นงานเพิ่มเติมและเสนอค่าบริการแยกต่างหาก

ไม่รวมในขอบเขตงาน (Exclusions)

ค่าบริการนี้ ไม่รวม

งานรื้อถอนและซ่อมแซม
• งานรื้อถอน
• งานซ่อมแซมพื้นที่เดิม
• งานแก้ไขความเสียหายที่พบภายหลังการรื้อถอน

งานโครงสร้าง
• งานวิศวกรรมโครงสร้าง
• แบบโครงสร้าง
• การรับรองแบบโดยวิศวกร

งานระบบอาคาร
• ระบบไฟฟ้า
• ระบบประปาและสุขาภิบาล
• ระบบปรับอากาศ
• ระบบระบายอากาศ
• ระบบดับเพลิง
• ระบบสื่อสารและระบบพิเศษทุกประเภท

งานก่อสร้าง
• ควบคุมงานก่อสร้าง
• บริหารโครงการ
• ตรวจรับงานผู้รับเหมา
• ประสานงานผู้รับเหมา
• จัดซื้อวัสดุและอุปกรณ์

งานอื่น ๆ
• ขออนุญาตก่อสร้าง
• ยื่นแบบต่อหน่วยงานราชการ
• ค่าที่ปรึกษาวิศวกร
• ค่าเดินทางและค่าใช้จ่ายนอกพื้นที่ (หากมี)`,
};

const PACKAGE_B_ITEM = {
  buttonLabel: "PACKAGE B",
  qty: 1,
  price: 115000,
  name: `PACKAGE B

Interior Design + Interior Electrical Package

ค่าบริการออกแบบ : 115,000 บาท

รวมบริการทั้งหมดใน Package A

พร้อมเพิ่มเติม

งานออกแบบระบบไฟฟ้าสำหรับงานตกแต่งภายใน

ประกอบด้วย
• Lighting Layout
• Power Layout
• Switching Layout
• Lighting Fixture Schedule
• Electrical Load Schedule (สำหรับงานตกแต่งภายใน)
• ประสานตำแหน่งงานระบบกับงานบิลท์อินและงานตกแต่ง

ไม่รวม
• การคำนวณโหลดระบบไฟฟ้าหลักของอาคาร
• Single Line Diagram (SLD)
• การออกแบบตู้เมนไฟฟ้า (MDB/DB)
• การรับรองแบบโดยวิศวกรไฟฟ้า`,
};

const PACKAGE_ITEMS = [PACKAGE_A_ITEM, PACKAGE_B_ITEM];

function packageDefinition(item) {
  const name = String(item?.name || "");
  return PACKAGE_ITEMS.find((packageItem) => name.startsWith(`${packageItem.buttonLabel}\n\n`));
}

function isPackageItem(item) {
  return Boolean(packageDefinition(item));
}

function packageDetails(name) {
  const fullText = String(name || "");
  const detailMarkers = [
    "ขอบเขตการให้บริการ (Scope of Services)",
    "รวมบริการทั้งหมดใน Package A",
  ];
  const detailStart = detailMarkers
    .map((marker) => fullText.indexOf(marker))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  return Number.isInteger(detailStart) ? fullText.slice(detailStart) : fullText;
}

function itemShortLabel(item) {
  return packageDefinition(item)?.buttonLabel || String(item?.name || "Item");
}

const SUGGESTIONS = [
  PACKAGE_A_ITEM.buttonLabel,
  PACKAGE_B_ITEM.buttonLabel,
  "Open previous quotations",
  "Open summary",
  "create quotation name: Patsakorn Sit subject: Website design qty: 1 price: 500",
  "client Acme Renovations",
  "add Site survey, 1, 450",
  "add Kitchen cabinetry, 12, 310",
  "deposit 30",
  "note Prices valid for 30 days",
  "pdf",
];

const DEPOSIT_SCHEDULES = {
  2: [30, 70],
  3: [55, 25, 20],
};

const DEFAULT_DEPOSIT_TERMS = [
  "ยืนยันการว่าจ้างและเริ่มดำเนินงาน",
  "หลังอนุมัติ Concept, Layout และ Perspective",
  "ก่อนส่งมอบ Working Drawing, BOQ และไฟล์ต้นฉบับทั้งหมด",
];

const DEFAULT_PAYMENT_COMMENT = `เงื่อนไข

1. หากค้างชำระ
ผู้ออกแบบขอสงวนสิทธิ์ในการระงับการดำเนินงานจนกว่าจะได้รับชำระเงินตามงวด

2. การส่งไฟล์
ไฟล์ต้นฉบับ (.DWG, .SKP, .PDF, Render ความละเอียดสูง และ BOQ) จะส่งมอบหลังได้รับชำระเงินครบถ้วน

3. หากลูกค้าหยุดงาน
หากลูกค้าหยุดโครงการเกิน 30 วัน ผู้ออกแบบสามารถเลื่อนกำหนดส่งงานตามคิวงานปัจจุบันได้

4. หากลูกค้ายกเลิก
เงินที่ชำระแล้วในแต่ละงวดไม่สามารถขอคืนได้ และผู้ออกแบบจะส่งมอบงานที่ดำเนินการแล้วตามสัดส่วนของงาน`;

function getDefaultDepositSchedule() {
  return [...DEPOSIT_SCHEDULES[3]];
}

const API_BASE_URL = String(
  import.meta.env.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:3001`
).replace(/\/$/, "");
const DEVICE_API_ENDPOINT = `${API_BASE_URL}/api/device`;
const QUOTATION_API_ENDPOINT = `${API_BASE_URL}/api/quotations`;
const QUOTATION_ASSISTANT_ENDPOINT = `${API_BASE_URL}/api/quotation-assistant`;
const API_REQUEST_HEADERS = { "ngrok-skip-browser-warning": "1" };

function money(n, currency = "$") {
  return currency + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function savedDate(value) {
  if (!value) return "";
  const parsed = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

function parseNaturalQuotationRequest(text) {
  if (!/\b(?:create|make|new)\b[\s\S]*\b(?:quotation|quote)\b/i.test(text)) return null;

  const clientMatch = text.match(/\b(?:name|client|customer)\s*(?:is|:|=)?\s*(.+?)(?=\s+\b(?:subject|item|service|description)\b|$)/i);
  const subjectMatch = text.match(/\b(?:subject|item|service|description)\s*(?:is|:|=)?\s*(.+?)(?=\s+(?:(?:qty|quantity)\s*(?:is|:|=)?\s*\d|\d+(?:\.\d+)?\s+(?:qty|quantity)\b|(?:price|cost|amount)\b)|$)/i);
  const quantityAfterLabel = text.match(/\b(?:qty|quantity)\s*(?:is|:|=)?\s*(\d+(?:\.\d+)?)/i);
  const quantityBeforeLabel = text.match(/\b(\d+(?:\.\d+)?)\s+(?:qty|quantity)\b/i);
  const priceMatch = text.match(/\b(?:price|cost|amount)\s*(?:is|:|=)?\s*[^\d]*([\d,]+(?:\.\d+)?)/i);

  const client = clientMatch?.[1]?.trim() || "Customer";
  const subject = subjectMatch?.[1]?.trim() || "Professional service";
  const qty = Math.max(0.01, Number(quantityAfterLabel?.[1] || quantityBeforeLabel?.[1]) || 1);
  const price = Math.max(0, Number((priceMatch?.[1] || "0").replace(/,/g, "")) || 0);

  return { client, subject, qty, price };
}

// callDevice sends a request to the local/backend device bridge
async function callDevice(action, params = {}) {
  try {
    const res = await fetch(DEVICE_API_ENDPOINT, {
      method: "POST",
      headers: { ...API_REQUEST_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ action, params }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `HTTP ${res.status}`);
    }
    const json = await res.json();
    return { ok: true, json };
  } catch (err) {
    return {
      ok: false,
      error: err.message || String(err),
      mock: { status: "mock", message: `Could not reach ${DEVICE_API_ENDPOINT} — running in mock mode. (${err.message || err})` },
    };
  }
}

async function saveQuotationRecord(record) {
  try {
    const response = await fetch(QUOTATION_API_ENDPOINT, {
      method: "POST",
      headers: { ...API_REQUEST_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
    return { ok: true, ...result };
  } catch (error) {
    return { ok: false, error: error.message || String(error) };
  }
}

async function getSavedQuotations() {
  try {
    const response = await fetch(`${QUOTATION_API_ENDPOINT}?limit=100`, { headers: API_REQUEST_HEADERS });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
    const seenQuoteNumbers = new Set();
    const records = [...(result.records || [])]
      .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
      .filter((record) => {
        if (record.documentType !== "quotation") return false;
        const quoteNumber = String(record.quoteNumber || "").trim().toUpperCase();
        if (!quoteNumber || seenQuoteNumbers.has(quoteNumber)) return false;
        seenQuoteNumbers.add(quoteNumber);
        return true;
      });
    return { ok: true, records };
  } catch (error) {
    return { ok: false, error: error.message || String(error), records: [] };
  }
}

async function getSavedQuotation(id) {
  try {
    const response = await fetch(`${QUOTATION_API_ENDPOINT}/${id}`, { headers: API_REQUEST_HEADERS });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
    return { ok: true, record: result.record };
  } catch (error) {
    return { ok: false, error: error.message || String(error) };
  }
}

async function getNextQuotationNumber() {
  try {
    const response = await fetch(`${QUOTATION_API_ENDPOINT}/next-number`, { headers: API_REQUEST_HEADERS });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
    return { ok: true, quoteNumber: result.quoteNumber };
  } catch (error) {
    return { ok: false, error: error.message || String(error) };
  }
}

async function updateSavedQuotation(id, changes) {
  try {
    const response = await fetch(`${QUOTATION_API_ENDPOINT}/${id}`, {
      method: "PATCH",
      headers: { ...API_REQUEST_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    const responseText = await response.text();
    let result;
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch {
      const contentType = response.headers.get("content-type") || "unknown content type";
      throw new Error(`API returned HTTP ${response.status} (${contentType}). Restart the device-bridge server and try again.`);
    }
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
    return { ok: true, ...result };
  } catch (error) {
    return { ok: false, error: error.message || String(error) };
  }
}

async function deleteSavedQuotation(id) {
  try {
    const response = await fetch(`${QUOTATION_API_ENDPOINT}/${id}`, {
      method: "DELETE",
      headers: API_REQUEST_HEADERS,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
    return { ok: true, ...result };
  } catch (error) {
    return { ok: false, error: error.message || String(error) };
  }
}

async function interpretQuotationMessage(message, quotation) {
  try {
    const response = await fetch(QUOTATION_ASSISTANT_ENDPOINT, {
      method: "POST",
      headers: { ...API_REQUEST_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ message, quotation }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
    return { ok: true, ...result };
  } catch (error) {
    return { ok: false, error: error.message || String(error) };
  }
}

export default function LedgerQuotationDemo() {
  const [template, setTemplate] = useState(() => {
    try {
      const savedTemplate = JSON.parse(localStorage.getItem("ledger-quotation-template") || "{}");
      if (savedTemplate.companyName === "Fieldstone Studio") {
        savedTemplate.companyName = DEFAULT_TEMPLATE.companyName;
      }
      return { ...DEFAULT_TEMPLATE, ...savedTemplate };
    } catch {
      return DEFAULT_TEMPLATE;
    }
  });
  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState("");
  const [client, setClient] = useState("");
  const [items, setItems] = useState([]);
  const [note, setNote] = useState("");
  const [depositEnabled, setDepositEnabled] = useState(true);
  const [depositComment, setDepositComment] = useState(DEFAULT_PAYMENT_COMMENT);
  const [depositSchedule, setDepositSchedule] = useState(getDefaultDepositSchedule);
  const [depositPaymentStatuses, setDepositPaymentStatuses] = useState([false, false, false]);
  const [status, setStatus] = useState("Draft");
  const [activePage, setActivePage] = useState("quotation");
  const [confirmationName, setConfirmationName] = useState("");
  const [confirmationSignature, setConfirmationSignature] = useState("");
  const [confirmationSignatureImage, setConfirmationSignatureImage] = useState("");
  const [newRowIdx, setNewRowIdx] = useState(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [quoteNo, setQuoteNo] = useState("Q-1042");
  const [showHistory, setShowHistory] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyQuery, setHistoryQuery] = useState("");
  const [loadingRecordId, setLoadingRecordId] = useState(null);
  const [deletingRecordId, setDeletingRecordId] = useState(null);
  const logRef = useRef(null);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("ledger-quotation-template", JSON.stringify(template));
  }, [template]);

  useEffect(() => {
    let active = true;
    getNextQuotationNumber().then((result) => {
      if (active && result.ok) setQuoteNo(result.quoteNumber);
    });
    return () => { active = false; };
  }, []);

  function addMsg(text, who) {
    setMessages((m) => [...m, { text, who }]);
  }

  function updateTemplate(field, value) {
    setTemplate((current) => ({ ...current, [field]: value }));
  }

  async function assignNextQuotationNumber() {
    const result = await getNextQuotationNumber();
    setQuoteNo(result.ok ? result.quoteNumber : "Q-1042");
  }

  function uploadSignatureImage(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      addMsg("Please choose an image file for the signature.", "bot");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      addMsg("Signature image must be smaller than 2 MB.", "bot");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setConfirmationSignatureImage(String(reader.result || ""));
    reader.onerror = () => addMsg("Could not read that signature image.", "bot");
    reader.readAsDataURL(file);
  }

  async function openQuotationHistory() {
    setShowHistory(true);
    setHistoryLoading(true);
    setHistoryError("");
    const result = await getSavedQuotations();
    setHistoryLoading(false);
    if (result.ok) {
      setHistoryRecords(result.records);
    } else {
      setHistoryError(`Could not load saved quotations: ${result.error}`);
    }
  }

  async function openSummaryDashboard() {
    setActivePage("summary");
    setHistoryLoading(true);
    setHistoryError("");
    const result = await getSavedQuotations();
    setHistoryLoading(false);
    if (result.ok) {
      setHistoryRecords(result.records);
    } else {
      setHistoryError(`Could not load saved quotations: ${result.error}`);
    }
  }

  async function changeSavedStatus(id, nextStatus) {
    const previousRecords = historyRecords;
    setHistoryRecords((records) => records.map((record) => record.id === id ? { ...record, status: nextStatus } : record));
    const result = await updateSavedQuotation(id, { status: nextStatus });
    if (!result.ok) {
      setHistoryRecords(previousRecords);
      setHistoryError(`Could not update status: ${result.error}`);
    }
  }

  async function removePreviousQuotation(record) {
    if (!window.confirm(`Delete quotation ${record.quoteNumber} for ${record.client}? This cannot be undone.`)) return;
    setDeletingRecordId(record.id);
    setHistoryError("");
    const result = await deleteSavedQuotation(record.id);
    setDeletingRecordId(null);
    if (!result.ok) {
      setHistoryError(`Could not delete quotation: ${result.error}`);
      return;
    }
    setHistoryRecords((records) => records.filter((item) => item.quoteNumber !== record.quoteNumber));
    if (lastSaved?.id === record.id) setLastSaved(null);
    addMsg(`Deleted quotation ${record.quoteNumber} from Previous Quotations.`, "bot");
  }

  async function toggleDepositPaid(record, installmentIndex) {
    const schedule = record.depositSchedule?.length ? record.depositSchedule : [record.depositRate || 30, 100 - (record.depositRate || 30)];
    const currentStatuses = schedule.map((_, index) => Boolean(record.depositPaymentStatuses?.[index]));
    const nextStatuses = currentStatuses.map((paid, index) => index === installmentIndex ? !paid : paid);
    const previousRecords = historyRecords;
    setHistoryRecords((records) => records.map((item) => item.id === record.id ? { ...item, depositPaymentStatuses: nextStatuses } : item));
    const result = await updateSavedQuotation(record.id, { depositPaymentStatuses: nextStatuses });
    if (!result.ok) {
      setHistoryRecords(previousRecords);
      setHistoryError(`Could not update deposit payment: ${result.error}`);
    }
  }

  async function loadPreviousQuotation(id) {
    setLoadingRecordId(id);
    setHistoryError("");
    const result = await getSavedQuotation(id);
    setLoadingRecordId(null);
    if (!result.ok) {
      setHistoryError(`Could not open that quotation: ${result.error}`);
      return;
    }
    const record = result.record;
    setQuoteNo(record.quoteNumber);
    setClient(record.client || "");
    setItems((record.items || []).map((item) => ({ name: item.name, qty: Number(item.qty), price: Number(item.price) })));
    setNote(record.note || "");
    setDepositEnabled(record.depositEnabled !== false);
    setDepositComment(record.depositComment || "");
    const savedSchedule = Array.isArray(record.depositSchedule) && [2, 3].includes(record.depositSchedule.length)
      ? record.depositSchedule.map((rate) => Math.min(100, Math.max(0, Number(rate) || 0)))
      : [record.depositRate == null ? 30 : Math.min(100, Math.max(0, Number(record.depositRate) || 0)),
          100 - (record.depositRate == null ? 30 : Math.min(100, Math.max(0, Number(record.depositRate) || 0)))];
    setDepositSchedule(savedSchedule);
    setDepositPaymentStatuses(savedSchedule.map((_, index) => Boolean(record.depositPaymentStatuses?.[index])));
    setConfirmationName(record.confirmationName || "");
    setConfirmationSignature(record.confirmationSignature || "");
    setConfirmationSignatureImage(record.confirmationSignatureImage || "");
    setStatus(record.status || "Draft");
    setTemplate((current) => ({ ...current, ...(record.template || {}), currency: record.currency || current.currency, taxRate: record.taxRate ?? current.taxRate }));
    setActivePage("quotation");
    setReceipt(null);
    setLastSaved({ id: record.id, type: "Quotation" });
    setShowHistory(false);
    addMsg(`Loaded quotation ${record.quoteNumber} for ${record.client} from database record #${record.id}.`, "bot");
  }

  async function applyQuotationActions(actions) {
    for (const action of Array.isArray(actions) ? actions : []) {
      switch (action.type) {
        case "new_quotation":
          setClient("");
          setItems([]);
          setNote("");
          setDepositEnabled(true);
          setDepositComment(DEFAULT_PAYMENT_COMMENT);
          setDepositSchedule(getDefaultDepositSchedule());
          setDepositPaymentStatuses(getDefaultDepositSchedule().map(() => false));
          setConfirmationName("");
          setConfirmationSignature("");
          setConfirmationSignatureImage("");
          setStatus("Draft");
          setReceipt(null);
          setLastSaved(null);
          setActivePage("quotation");
          await assignNextQuotationNumber();
          break;
        case "set_client":
          setClient(String(action.value || "").trim());
          break;
        case "set_quote_number":
          setQuoteNo(String(action.value || "").trim().slice(0, 24));
          break;
        case "add_item":
          setItems((current) => [...current, {
            name: String(action.name || "Professional service").trim(),
            qty: Math.max(0.01, Number(action.qty) || 1),
            price: Math.max(0, Number(action.price) || 0),
          }]);
          break;
        case "update_item":
          setItems((current) => {
            const requestedIndex = Number(action.index);
            const index = Number.isInteger(requestedIndex) && requestedIndex > 0
              ? requestedIndex - 1
              : current.findIndex((item) => item.name.toLowerCase().includes(String(action.name || "").toLowerCase()));
            if (index < 0 || !current[index]) return current;
            return current.map((item, itemIndex) => itemIndex === index ? {
              ...item,
              name: action.newName == null ? item.name : String(action.newName).trim(),
              qty: action.qty == null ? item.qty : Math.max(0.01, Number(action.qty) || 1),
              price: action.price == null ? item.price : Math.max(0, Number(action.price) || 0),
            } : item);
          });
          break;
        case "remove_item":
          setItems((current) => {
            const requestedIndex = Number(action.index);
            if (Number.isInteger(requestedIndex) && requestedIndex > 0) return current.filter((_, index) => index !== requestedIndex - 1);
            const name = String(action.name || "").toLowerCase();
            return current.filter((item) => !item.name.toLowerCase().includes(name));
          });
          break;
        case "clear_items":
          setItems([]);
          break;
        case "set_note":
          setNote(String(action.value || "").trim());
          break;
        case "set_payment_comment":
          setDepositComment(String(action.value || "").trim());
          break;
        case "set_deposit": {
          const enabled = action.enabled !== false;
          setDepositEnabled(enabled);
          if (action.comment != null) setDepositComment(String(action.comment).trim());
          if (!enabled) {
            setDepositPaymentStatuses([false]);
            break;
          }
          const schedule = Array.isArray(action.schedule) && [2, 3].includes(action.schedule.length)
            ? action.schedule.map((rate) => Math.min(100, Math.max(0, Number(rate) || 0)))
            : getDefaultDepositSchedule();
          setDepositSchedule(schedule);
          setDepositPaymentStatuses(schedule.map(() => false));
          break;
        }
        case "set_status":
          if (["Draft", "Sent", "Accepted", "Rejected", "Receipt created", "Paid"].includes(String(action.value))) {
            setStatus(String(action.value));
          }
          break;
        case "set_tax_rate":
          updateTemplate("taxRate", Math.max(0, Number(action.value) || 0));
          break;
        case "set_currency":
          updateTemplate("currency", String(action.value || "$").slice(0, 4));
          break;
        case "set_confirmation_name":
          setConfirmationName(String(action.value || "").trim());
          break;
        case "set_signature_text":
          setConfirmationSignature(String(action.value || "").trim());
          break;
        case "remove_signature_image":
          setConfirmationSignatureImage("");
          break;
        case "set_deposit_paid":
          setDepositPaymentStatuses((current) => current.map((paid, index) => index === Math.max(0, Number(action.index || 1) - 1) ? action.paid !== false : paid));
          break;
        case "set_template_field": {
          const allowedFields = new Set(["title", "tagline", "companyName", "footer", "paperColor", "inkColor", "accentColor", "stampColor"]);
          const field = String(action.field || "");
          if (!allowedFields.has(field)) break;
          const value = String(action.value || "").trim();
          if (field.endsWith("Color") && !/^#[0-9a-f]{6}$/i.test(value)) break;
          updateTemplate(field, value);
          break;
        }
        case "reset_template":
          setTemplate(DEFAULT_TEMPLATE);
          break;
        case "open_summary":
          await openSummaryDashboard();
          break;
        case "open_history":
          await openQuotationHistory();
          break;
        case "open_template_editor":
          setShowTemplateEditor(true);
          break;
        case "load_quotation":
          if (Number.isInteger(Number(action.id)) && Number(action.id) > 0) await loadPreviousQuotation(Number(action.id));
          break;
        case "create_receipt":
          await createReceipt();
          break;
        case "export_pdf":
          await exportPdf();
          break;
        default:
          break;
      }
    }
  }

  async function handleCommand(raw) {
    const text = raw.trim();
    if (!text) return;
    addMsg(text, "user");
    const lower = text.toLowerCase();
    const selectedPackage = PACKAGE_ITEMS.find((packageItem) => lower === packageItem.buttonLabel.toLowerCase());
    const normalizedNavigationText = lower.replace(/\bopem\b|\boppen\b/g, "open");
    const naturalQuotation = parseNaturalQuotationRequest(text);
    const collectionMatch = text.match(/\b([23])\s*(?:payment\s+)?collections?\b/i)
      || text.match(/\bcollections?\s*(?:is|to|:|=)?\s*([23])\b/i);
    const savedQuotationMatch = normalizedNavigationText.match(/\b(?:open|load)\s+(?:previous|saved)?\s*quotation\s*(?:id|#)?\s*(\d+)\b/i);
    const hasOpenIntent = /\b(?:open|show|view|load|go\s+to)\b/i.test(normalizedNavigationText);
    const openHistoryRequested = hasOpenIntent && (
      /\b(?:previous|saved)\b[\s\S]*\bquotations?\b/i.test(normalizedNavigationText)
      || /\bquotations?\b[\s\S]*\b(?:previous|saved|history)\b/i.test(normalizedNavigationText)
      || /\bhistory\b/i.test(normalizedNavigationText)
    );
    const openSummaryRequested = hasOpenIntent && /\bsummary\b/i.test(normalizedNavigationText);

    if (selectedPackage) {
      setItems((current) => [...current, { name: selectedPackage.name, qty: selectedPackage.qty, price: selectedPackage.price }]);
      updateTemplate("currency", "฿");
      setActivePage("quotation");
      addMsg(`Added ${selectedPackage.buttonLabel} — ${money(selectedPackage.price, "฿")}. The full scope and exclusions are shown in the quotation.`, "bot");
    } else if (naturalQuotation) {
      setClient(naturalQuotation.client);
      setItems([{ name: naturalQuotation.subject, qty: naturalQuotation.qty, price: naturalQuotation.price }]);
      setNote("");
      setDepositEnabled(true);
      setDepositComment(DEFAULT_PAYMENT_COMMENT);
      setDepositSchedule(getDefaultDepositSchedule());
      setDepositPaymentStatuses(getDefaultDepositSchedule().map(() => false));
      setConfirmationName("");
      setConfirmationSignature("");
      setConfirmationSignatureImage("");
      setStatus("Draft");
      setReceipt(null);
      setLastSaved(null);
      setActivePage("quotation");
      await assignNextQuotationNumber();
      addMsg(
        `Created a new quotation for "${naturalQuotation.client}" with "${naturalQuotation.subject}" — ${naturalQuotation.qty} × ${money(naturalQuotation.price, template.currency)}. Unspecified settings use the defaults.`,
        "bot"
      );
    } else if (savedQuotationMatch) {
      await loadPreviousQuotation(Number(savedQuotationMatch[1]));
    } else if (openHistoryRequested) {
      await openQuotationHistory();
      addMsg("Opened previous quotations.", "bot");
    } else if (openSummaryRequested) {
      await openSummaryDashboard();
      addMsg("Opened the quotation summary.", "bot");
    } else if (collectionMatch) {
      const collections = Number(collectionMatch[1]);
      const schedule = [...DEPOSIT_SCHEDULES[collections]];
      setDepositEnabled(true);
      setDepositSchedule(schedule);
      setDepositPaymentStatuses(schedule.map(() => false));
      setItems((current) => current.filter((item) => !/^collections?$/i.test(item.name.trim())));
      addMsg(
        `Payment terms changed to ${collections} deposit collections: ${schedule.join("% / ")}%. This changes the deposit schedule, not the quotation items.`,
        "bot"
      );
    } else if (lower.startsWith("client ")) {
      const name = text.slice(7).trim();
      setClient(name);
      addMsg(`Set client to "${name}".`, "bot");
    } else if (lower.startsWith("add ")) {
      const rest = text.slice(4);
      const parts = rest.split(",").map((p) => p.trim());
      if (parts.length >= 3) {
        const name = parts[0];
        const qty = parseFloat(parts[1]) || 1;
        const price = parseFloat(parts[2].replace(/[^0-9.]/g, "")) || 0;
        setItems((prev) => {
          const next = [...prev, { name, qty, price }];
          setNewRowIdx(next.length - 1);
          return next;
        });
        addMsg(`Added "${name}" — ${qty} × ${money(price, template.currency)} = ${money(qty * price, template.currency)}.`, "bot");
      } else {
        addMsg(`Couldn't parse that. Try: "add Item name, qty, price" — e.g. "add Logo design, 1, 800"`, "bot");
      }
    } else if (lower.startsWith("remove ")) {
      const n = parseInt(text.slice(7).trim(), 10);
      setItems((prev) => {
        if (!isNaN(n) && prev[n - 1]) {
          const removed = prev[n - 1];
          addMsg(`Removed line ${n}: "${removed.name}".`, "bot");
          return prev.filter((_, i) => i !== n - 1);
        }
        addMsg(`No line item at position ${n}. You can also click "remove" next to any row.`, "bot");
        return prev;
      });
    } else if (lower.startsWith("note ")) {
      const n = text.slice(5).trim();
      setNote(n);
      addMsg(`Added note to the quote: "${n}"`, "bot");
    } else if (lower.startsWith("deposit ")) {
      const depositValue = text.slice(8).replace("%", "").trim().toLowerCase();
      const rate = Number(depositValue);
      if (["off", "cash", "none"].includes(depositValue)) {
        setDepositEnabled(false);
        setDepositPaymentStatuses([false]);
        addMsg("Deposit turned off. Payment is set to one-time cash in full.", "bot");
      } else if (depositValue === "on") {
        const schedule = getDefaultDepositSchedule();
        setDepositEnabled(true);
        setDepositSchedule(schedule);
        setDepositPaymentStatuses(schedule.map(() => false));
        addMsg(`Deposit turned on with the default ${schedule.join("% / ")}% schedule.`, "bot");
      } else if (Number.isFinite(rate) && rate >= 0 && rate <= 100) {
        setDepositEnabled(true);
        setDepositSchedule([rate, 100 - rate]);
        setDepositPaymentStatuses([false, false]);
        addMsg(`Two-part deposit schedule set to ${rate}% and ${100 - rate}%.`, "bot");
      } else {
        addMsg(`Enter a deposit percentage from 0 to 100, for example: "deposit 30".`, "bot");
      }
    } else if (lower === "pdf" || lower === "generate pdf" || lower === "export pdf") {
      addMsg(`Opening the print dialog — choose "Save as PDF" as the destination.`, "bot");
      exportPdf();
    } else if (lower === "reset" || lower === "clear") {
      setClient("");
      setItems([]);
      setNote("");
      setDepositEnabled(true);
      setDepositComment(DEFAULT_PAYMENT_COMMENT);
      setDepositSchedule(getDefaultDepositSchedule());
      setDepositPaymentStatuses(getDefaultDepositSchedule().map(() => false));
      setConfirmationName("");
      setConfirmationSignature("");
      setConfirmationSignatureImage("");
      setStatus("Draft");
      await assignNextQuotationNumber();
      setLastSaved(null);
      setActivePage("quotation");
      addMsg("Cleared the quote. Starting fresh.", "bot");
    } else if (lower.startsWith("status ")) {
      const s = text.slice(7).trim();
      setStatus(s);
      addMsg(`Status set to "${s}".`, "bot");
    } else {
      const assistantResult = await interpretQuotationMessage(text, {
        quoteNumber: quoteNo,
        client,
        items,
        note,
        status,
        taxRate,
        currency: template.currency,
        depositEnabled,
        depositComment,
        depositSchedule,
        depositPaymentStatuses,
        confirmationName,
        confirmationSignature,
        template: {
          title: template.title,
          tagline: template.tagline,
          companyName: template.companyName,
          footer: template.footer,
          paperColor: template.paperColor,
          inkColor: template.inkColor,
          accentColor: template.accentColor,
          stampColor: template.stampColor,
        },
      });
      if (!assistantResult.ok) {
        addMsg(`I could not interpret that quotation request: ${assistantResult.error}`, "bot");
      } else {
        await applyQuotationActions(assistantResult.actions);
        addMsg(assistantResult.reply || "Quotation updated.", "bot");
      }
    }
  }

  function removeItem(idx) {
    const removed = items[idx];
    setItems((prev) => prev.filter((_, i) => i !== idx));
    addMsg(`Removed "${itemShortLabel(removed)}" from the quote.`, "bot");
  }

  function chooseDepositCollections(collections) {
    const schedule = [...DEPOSIT_SCHEDULES[collections]];
    setDepositEnabled(true);
    setDepositSchedule(schedule);
    setDepositPaymentStatuses(schedule.map(() => false));
  }

  function updateDepositInstallment(index, value) {
    const rate = Math.min(100, Math.max(0, Number(value) || 0));
    setDepositSchedule((current) => current.map((item, itemIndex) => itemIndex === index ? rate : item));
  }

  async function exportPdf() {
    if (!quoteNo.trim()) {
      addMsg("Enter a quotation number before exporting the PDF.", "bot");
      return;
    }
    if (!client || items.length === 0) {
      addMsg("Add a client and at least one line item before exporting the PDF.", "bot");
      return;
    }
    if (depositEnabled && !depositScheduleIsValid) {
      addMsg(`The deposit schedule must total 100% before exporting the PDF.`, "bot");
      return;
    }
    setStatus("Sent");
    setActivePage("quotation");
    const saved = await saveQuotationRecord({
      quoteNumber: quoteNo,
      documentType: "quotation",
      client,
      status: "Sent",
      items,
      subtotal,
      tax,
      total,
      currency: template.currency,
      taxRate,
      depositRate,
      depositAmount,
      depositEnabled,
      depositComment,
      depositSchedule: effectivePaymentSchedule,
      depositPaymentStatuses: effectivePaymentStatuses,
      confirmationName,
      confirmationSignature,
      confirmationSignatureImage,
      note,
      template,
    });
    if (saved.ok) {
      setLastSaved({ id: saved.id, type: "Quotation" });
      addMsg(
        saved.updated
          ? `Updated quotation ${quoteNo} in Previous Quotations. No duplicate was created.`
          : `Saved quotation ${quoteNo} to the database as record #${saved.id}.`,
        "bot"
      );
    } else {
      addMsg(`PDF will open, but the database save failed: ${saved.error}`, "bot");
    }
    setTimeout(() => window.print(), 150);
  }

  async function createReceipt() {
    if (!quoteNo.trim()) {
      addMsg("Enter a quotation number before creating a receipt.", "bot");
      return;
    }
    if (!client || items.length === 0) {
      addMsg("Add a client and at least one line item before creating a receipt.", "bot");
      return;
    }
    if (depositEnabled && !depositScheduleIsValid) {
      addMsg(`The deposit schedule must total 100% before creating a receipt.`, "bot");
      return;
    }
    const nextReceipt = {
      number: `R-${quoteNo.replace(/^Q-/, "")}`,
      quoteNo,
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      client,
      items: items.map((item) => ({ ...item })),
      subtotal,
      tax,
      total,
      taxRate,
      currency: template.currency,
      depositRate,
      depositAmount,
      depositEnabled,
      depositComment,
      depositSchedule: [...effectivePaymentSchedule],
      depositPaymentStatuses: [...effectivePaymentStatuses],
      confirmationName,
      confirmationSignature,
      confirmationSignatureImage,
    };
    setReceipt(nextReceipt);
    setStatus("Paid");
    const saved = await saveQuotationRecord({
      quoteNumber: nextReceipt.number,
      documentType: "receipt",
      client: nextReceipt.client,
      status: "Paid",
      items: nextReceipt.items,
      subtotal: nextReceipt.subtotal,
      tax: nextReceipt.tax,
      total: nextReceipt.total,
      currency: nextReceipt.currency,
      taxRate: nextReceipt.taxRate,
      depositRate: nextReceipt.depositRate,
      depositAmount: nextReceipt.depositAmount,
      depositEnabled: nextReceipt.depositEnabled,
      depositComment: nextReceipt.depositComment,
      depositSchedule: nextReceipt.depositSchedule,
      depositPaymentStatuses: nextReceipt.depositPaymentStatuses,
      confirmationName: nextReceipt.confirmationName,
      confirmationSignature: nextReceipt.confirmationSignature,
      confirmationSignatureImage: nextReceipt.confirmationSignatureImage,
      note,
      template,
    });
    if (saved.ok) {
      setLastSaved({ id: saved.id, type: "Receipt" });
      setReceipt((current) => current ? { ...current, databaseId: saved.id } : current);
      addMsg(`Created receipt ${nextReceipt.number} and saved it as database record #${saved.id}.`, "bot");
    } else {
      addMsg(`Created the receipt, but the database save failed: ${saved.error}`, "bot");
    }
  }

  function printReceipt() {
    document.body.classList.add("printing-receipt");
    const cleanup = () => document.body.classList.remove("printing-receipt");
    window.addEventListener("afterprint", cleanup, { once: true });
    setTimeout(() => window.print(), 100);
  }

  const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
  const taxRate = Math.max(0, Number(template.taxRate) || 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  const effectivePaymentSchedule = depositEnabled ? depositSchedule : [100];
  const effectivePaymentStatuses = depositEnabled
    ? depositSchedule.map((_, index) => Boolean(depositPaymentStatuses[index]))
    : [Boolean(depositPaymentStatuses[0])];
  const depositRate = depositEnabled ? depositSchedule[0] || 0 : 0;
  const depositAmount = total * (depositRate / 100);
  const depositScheduleTotal = depositSchedule.reduce((sum, rate) => sum + rate, 0);
  const depositScheduleIsValid = Math.abs(depositScheduleTotal - 100) < 0.001;
  const normalizedHistoryQuery = historyQuery.trim().toLowerCase();
  const filteredHistoryRecords = historyRecords.filter((record) =>
    !normalizedHistoryQuery || [record.quoteNumber, record.client, record.status]
      .some((value) => String(value || "").toLowerCase().includes(normalizedHistoryQuery))
  );

  return (
    <div
      className="ledger-app"
      style={{
        "--paper": template.paperColor,
        "--ink": template.inkColor,
        "--accent-gold": template.accentColor,
        "--accent-red": template.stampColor,
      }}
    >
      <style>{STYLES}</style>

      {/* CHAT SIDE */}
      <div className="chat-side">
        <div className="chat-header">
          <span className="brand ledger-serif">
            <span className="brand-mark">Ledger</span> · chat
          </span>
          <span className="tag ledger-mono">demo — quotation agent</span>
        </div>

        <div className="chat-log ledger-mono" ref={logRef}>
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.who}`} style={{ fontFamily: "'Inter', sans-serif" }}>
              <span className="who ledger-mono">{m.who === "user" ? "you" : "ledger"}</span>
              {m.text}
            </div>
          ))}
        </div>

        <div className="suggestions ledger-mono">
          {SUGGESTIONS.map((s) => (
            <button type="button" key={s} className="chip" onClick={() => handleCommand(s)}>
              {s}
            </button>
          ))}
        </div>

        <div className="chat-input-row">
          <textarea
            rows={2}
            placeholder='Try: add Logo design, 1, 800'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCommand(input);
                setInput("");
              }
            }}
          />
          <button
            className="send-btn"
            onClick={() => {
              handleCommand(input);
              setInput("");
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* QUOTATION PAPER */}
      <div className="paper-side">
        <div className="paper-toolbar">
          <div className="page-tabs" aria-label="Document pages">
            <button className={`page-tab ${activePage === "quotation" ? "active" : ""}`} onClick={() => setActivePage("quotation")}>Quotation</button>
            <button className={`page-tab ${activePage === "summary" ? "active" : ""}`} onClick={openSummaryDashboard}>Summary</button>
          </div>
          <span className="label ledger-mono">{activePage === "quotation" ? "Live preview" : "Quotation overview"}</span>
          <button className="pdf-btn history-btn ledger-mono" onClick={openQuotationHistory}>
            Previous quotations
          </button>
          <button className="pdf-btn design-btn ledger-mono" onClick={() => setShowTemplateEditor(true)}>
            Design template
          </button>
          <button className="pdf-btn ledger-mono" onClick={activePage === "quotation" ? exportPdf : openSummaryDashboard}>
            {activePage === "quotation" ? "⇩ Export PDF" : "↻ Refresh list"}
          </button>
        </div>

        <div className={`quote-sheet ${items.some(isPackageItem) ? "package-quote" : ""} ${items.some((item) => packageDefinition(item)?.buttonLabel === "PACKAGE A") ? "package-a-quote" : ""}`} style={{ position: "relative", display: activePage === "quotation" ? "block" : "none" }}>

          <div className="quote-head">
            <div>
              <h1 className="ledger-serif">{template.title}</h1>
              <div className="sub ledger-mono">{template.tagline}</div>
            </div>
            <div className="quote-meta ledger-mono">
              No. <input className="quote-number-input" value={quoteNo} maxLength={24} aria-label="Quotation number" onChange={(e) => setQuoteNo(e.target.value)} />
              <br />
              Date: <strong>{today}</strong>
              <br />
              Status: <strong>{status}</strong>
            </div>
          </div>

          <div className="quote-parties">
            <div className="party">
              <div className="party-label ledger-mono">From</div>
              <div className="party-name ledger-serif">{template.companyName}</div>
            </div>
            <div className="party">
              <div className="party-label ledger-mono">To</div>
              <div className={`party-name ledger-serif ${client ? "" : "empty"}`}>
                {client || 'no client set — try "client Acme Co"'}
              </div>
            </div>
          </div>

          <table className="items ledger-mono">
            <thead>
              <tr>
                <th>Item</th>
                <th className="num">Qty</th>
                <th className="num">Unit</th>
                <th className="num">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={5}>No line items yet — add one from the chat</td>
                </tr>
              ) : (
                items.map((it, i) => isPackageItem(it) ? (
                  <tr className={`package-item-row ${packageDefinition(it)?.buttonLabel === "PACKAGE A" ? "package-a-item" : "package-b-item"}`} key={i}>
                    <td className="package-item-cell" colSpan={5}>
                      <div className="package-item-heading">
                        <div>
                          <strong>{itemShortLabel(it)} · {packageDefinition(it)?.buttonLabel === "PACKAGE B" ? "Interior Design + Interior Electrical Package" : "Interior Design Package"}</strong>
                          <small>ค่าบริการออกแบบ · Qty {it.qty}</small>
                        </div>
                        <div className="package-item-actions">
                          <span className="package-item-price">{money(it.qty * it.price, template.currency)}</span>
                          <span className="remove-x" onClick={() => removeItem(i)}>remove</span>
                        </div>
                      </div>
                      <div className="package-scope">{packageDetails(it.name)}</div>
                    </td>
                  </tr>
                ) : (
                  <tr key={i}>
                    <td style={{ fontFamily: "'Inter', sans-serif", fontSize: 13 }}>{it.name}</td>
                    <td className="num">{it.qty}</td>
                    <td className="num">{money(it.price, template.currency)}</td>
                    <td className="num">{money(it.qty * it.price, template.currency)}</td>
                    <td className="num">
                      <span className="remove-x" onClick={() => removeItem(i)}>
                        remove
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="totals ledger-mono">
            <div className="row">
              <span>Subtotal</span>
              <span>{money(subtotal, template.currency)}</span>
            </div>
            <div className="row">
              <span>Tax ({taxRate}%)</span>
              <span>{money(tax, template.currency)}</span>
            </div>
            <div className="row grand">
              <span>Total</span>
              <span>{money(total, template.currency)}</span>
            </div>
          </div>

          <div className="deposit-note ledger-mono">
            <div className="deposit-title">Payment terms</div>
            <div className="deposit-mode" aria-label="Turn deposit on or off">
              <button type="button" className={`deposit-option ${depositEnabled ? "active" : ""}`} aria-pressed={depositEnabled} onClick={() => { const schedule = getDefaultDepositSchedule(); setDepositEnabled(true); setDepositSchedule(schedule); setDepositPaymentStatuses(schedule.map(() => false)); }}>
                Deposit on
              </button>
              <button type="button" className={`deposit-option ${!depositEnabled ? "active" : ""}`} aria-pressed={!depositEnabled} onClick={() => { setDepositEnabled(false); setDepositPaymentStatuses([false]); }}>
                Deposit off / cash once
              </button>
            </div>
            {depositEnabled ? <>
              <div className="deposit-options" aria-label="Choose number of deposit collections">
                {[2, 3].map((collections) => (
                  <button type="button" key={collections} className={`deposit-option ${depositSchedule.length === collections ? "active" : ""}`} aria-pressed={depositSchedule.length === collections} onClick={() => chooseDepositCollections(collections)}>
                    {collections} collections
                  </button>
                ))}
              </div>
              <div className="deposit-schedule">
                {depositSchedule.map((rate, index) => (
                  <div className="deposit-installment" key={index}>
                    <label htmlFor={`deposit-installment-${index}`}>
                      {depositSchedule.length === 3 ? `งวดที่ ${index + 1} · ${DEFAULT_DEPOSIT_TERMS[index]}` : `${index + 1}${index === 0 ? "st" : "nd"} collection`}
                    </label>
                    <input id={`deposit-installment-${index}`} type="number" min="0" max="100" step="1" value={rate} aria-label={`Collection ${index + 1} percentage`} onChange={(e) => updateDepositInstallment(index, e.target.value)} />
                    <strong>{rate}% · {money(total * rate / 100, template.currency)}</strong>
                  </div>
                ))}
              </div>
              <div className={`deposit-total ${depositScheduleIsValid ? "" : "invalid"}`}>
                <span>Schedule total</span>
                <span>{depositScheduleTotal}% {depositScheduleIsValid ? "✓" : "— must equal 100%"}</span>
              </div>
              <div className="deposit-help">Each collection is calculated from the total, including tax.</div>
            </> : (
              <div className="cash-payment"><span>Cash payment · 1 time</span><strong>{money(total, template.currency)}</strong></div>
            )}
            <div className="deposit-comment">
              <label htmlFor="deposit-comment">Payment comment</label>
              <textarea id="deposit-comment" value={depositComment} placeholder="Add a comment about the deposit or payment…" onChange={(e) => setDepositComment(e.target.value)} />
              <div className="deposit-comment-print">{depositComment || "—"}</div>
            </div>
          </div>

          <div className="note-line">{note ? `"${note}"` : ""}</div>
          <div className="confirmation">
            <div className="confirmation-title ledger-mono">Quotation confirmation</div>
            <input
              className="confirmation-name"
              value={confirmationName}
              placeholder="Confirmation name"
              aria-label="Confirmation name"
              onChange={(e) => setConfirmationName(e.target.value)}
            />
            <div className="signature-upload-controls">
              <label>
                Upload signature image
                <input type="file" accept="image/*" onChange={(e) => uploadSignatureImage(e.target.files?.[0])} />
              </label>
              {confirmationSignatureImage && <button type="button" onClick={() => setConfirmationSignatureImage("")}>Remove image</button>}
            </div>
            {confirmationSignatureImage && <img className="signature-image" src={confirmationSignatureImage} alt="Uploaded signature" />}
            <input
              className="confirmation-signature"
              value={confirmationSignature}
              placeholder="Type signature"
              aria-label="Signature"
              onChange={(e) => setConfirmationSignature(e.target.value)}
            />
            <div className="confirmation-labels ledger-mono"><span>Name</span><span>Signature</span></div>
          </div>
          <div className="footer-note ledger-mono">{template.footer}</div>
        </div>

        <div className="summary-page" style={{ display: activePage === "summary" ? "block" : "none" }}>
          <div className="summary-dashboard-head">
            <div>
              <h1 className="ledger-serif">All quotations</h1>
              <p className="ledger-mono">Review quotation status and deposit payments</p>
            </div>
            <button className="ledger-mono" onClick={openSummaryDashboard}>Refresh</button>
          </div>
          {historyError && <div className="summary-error ledger-mono">{historyError}</div>}
          {historyLoading ? (
            <div className="history-empty ledger-mono">Loading quotations…</div>
          ) : historyRecords.length === 0 ? (
            <div className="history-empty ledger-mono">No saved quotations yet. Export a quotation first.</div>
          ) : (
            <div className="summary-records">
              {historyRecords.map((record) => {
                const depositIsEnabled = record.depositEnabled !== false;
                const schedule = depositIsEnabled
                  ? (record.depositSchedule?.length ? record.depositSchedule : [record.depositRate || 30, 100 - (record.depositRate || 30)])
                  : [100];
                return (
                  <div className="summary-record ledger-mono" key={record.id}>
                    <div className="summary-record-main">
                      <div><small>Quotation</small><strong>{record.quoteNumber}</strong></div>
                      <div><small>Client</small><strong>{record.client}</strong></div>
                      <div><small>Total</small><strong>{money(record.total, record.currency)}</strong></div>
                      <div>
                        <small>Quotation status</small>
                        <select className="status-select ledger-mono" value={record.status} onChange={(e) => changeSavedStatus(record.id, e.target.value)}>
                          <option>Draft</option><option>Sent</option><option>Accepted</option><option>Rejected</option><option>Receipt created</option><option>Paid</option>
                        </select>
                      </div>
                      <div className="record-actions">
                        <button className="history-load" onClick={() => loadPreviousQuotation(record.id)}>Open</button>
                        <button className="history-delete" disabled={deletingRecordId !== null} onClick={() => removePreviousQuotation(record)}>
                          {deletingRecordId === record.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </div>
                    <div className="payment-tracker">
                      {schedule.map((rate, index) => {
                        const paid = Boolean(record.depositPaymentStatuses?.[index]);
                        return (
                          <button className={`payment-toggle ${paid ? "paid" : ""}`} key={index} onClick={() => toggleDepositPaid(record, index)}>
                            {depositIsEnabled ? `${index + 1}${index === 0 ? "st" : index === 1 ? "nd" : "rd"} deposit · ${rate}%` : "Cash · 1 time"} · {money(record.total * rate / 100, record.currency)} · {paid ? "Paid ✓" : "Unpaid"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showHistory && (
        <div className="history-modal" onMouseDown={(e) => e.target === e.currentTarget && setShowHistory(false)}>
          <div className="history-panel" role="dialog" aria-modal="true" aria-labelledby="history-title">
            <div className="history-head">
              <div>
                <h2 className="ledger-serif" id="history-title">Previous quotations</h2>
                <p>Choose a saved quotation to continue editing or create another receipt.</p>
              </div>
              <button className="icon-btn" aria-label="Close previous quotations" onClick={() => setShowHistory(false)}>×</button>
            </div>
            {historyError && <div className="history-error">{historyError}</div>}
            <input
              className="history-search"
              type="search"
              placeholder="Search quotation number, client, or status…"
              value={historyQuery}
              onChange={(e) => setHistoryQuery(e.target.value)}
            />
            {historyLoading ? (
              <div className="history-empty">Loading saved quotations…</div>
            ) : filteredHistoryRecords.length === 0 ? (
              <div className="history-empty">
                {historyRecords.length === 0 ? "No saved quotations yet. Export a completed quotation PDF first." : "No quotations match your search."}
              </div>
            ) : (
              <div className="history-list">
                {filteredHistoryRecords.map((record) => (
                  <div className="history-row ledger-mono" key={record.id}>
                    <div><small>Quotation</small><strong>{record.quoteNumber}</strong><em>{savedDate(record.exportedAt)}</em></div>
                    <div><small>Client</small><strong>{record.client}</strong></div>
                    <div><small>Total</small><strong>{money(record.total, record.currency)}</strong></div>
                    <div><small>Status</small><span className="history-status">{record.status}</span></div>
                    <div className="record-actions">
                      <button className="history-load" disabled={loadingRecordId !== null || deletingRecordId !== null} onClick={() => loadPreviousQuotation(record.id)}>
                        {loadingRecordId === record.id ? "Loading…" : "Use"}
                      </button>
                      <button className="history-delete" disabled={deletingRecordId !== null || loadingRecordId !== null} onClick={() => removePreviousQuotation(record)}>
                        {deletingRecordId === record.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showTemplateEditor && (
        <div className="template-modal" onMouseDown={(e) => e.target === e.currentTarget && setShowTemplateEditor(false)}>
          <div className="template-panel" role="dialog" aria-modal="true" aria-labelledby="template-editor-title">
            <div className="template-panel-head">
              <div>
                <h2 className="ledger-serif" id="template-editor-title">Design template</h2>
                <p>Changes are saved automatically in this browser.</p>
              </div>
              <button className="icon-btn" aria-label="Close template editor" onClick={() => setShowTemplateEditor(false)}>×</button>
            </div>
            <div className="template-grid">
              <div className="template-field wide"><label>Document title</label><input value={template.title} onChange={(e) => updateTemplate("title", e.target.value)} /></div>
              <div className="template-field wide"><label>Tagline</label><input value={template.tagline} onChange={(e) => updateTemplate("tagline", e.target.value)} /></div>
              <div className="template-field wide"><label>Company name</label><input value={template.companyName} onChange={(e) => updateTemplate("companyName", e.target.value)} /></div>
              <div className="template-field wide"><label>Footer</label><input value={template.footer} onChange={(e) => updateTemplate("footer", e.target.value)} /></div>
              <div className="template-field"><label>Currency symbol</label><input value={template.currency} maxLength={4} onChange={(e) => updateTemplate("currency", e.target.value)} /></div>
              <div className="template-field"><label>Tax rate (%)</label><input type="number" min="0" step="0.1" value={template.taxRate} onChange={(e) => updateTemplate("taxRate", e.target.value)} /></div>
              <div className="template-field"><label>Paper color</label><input type="color" value={template.paperColor} onChange={(e) => updateTemplate("paperColor", e.target.value)} /></div>
              <div className="template-field"><label>Text color</label><input type="color" value={template.inkColor} onChange={(e) => updateTemplate("inkColor", e.target.value)} /></div>
              <div className="template-field"><label>Accent color</label><input type="color" value={template.accentColor} onChange={(e) => updateTemplate("accentColor", e.target.value)} /></div>
              <div className="template-field"><label>Action color</label><input type="color" value={template.stampColor} onChange={(e) => updateTemplate("stampColor", e.target.value)} /></div>
            </div>
            <div className="template-actions">
              <button className="reset-btn" onClick={() => setTemplate(DEFAULT_TEMPLATE)}>Reset defaults</button>
              <button className="done-btn" onClick={() => setShowTemplateEditor(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {receipt && (
        <div className="receipt-modal" onMouseDown={(e) => e.target === e.currentTarget && setReceipt(null)}>
          <div className="receipt-sheet" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
            <div className="receipt-actions ledger-mono">
              <button className="receipt-close" onClick={() => setReceipt(null)}>Close</button>
              <button className="receipt-print" onClick={printReceipt}>Print receipt</button>
            </div>
            <div className="receipt-head">
              <div>
                <h2 className="ledger-serif" id="receipt-title">Receipt</h2>
                <div className="ledger-mono">{template.companyName}</div>
              </div>
              <div className="receipt-meta ledger-mono">
                Receipt <strong>{receipt.number}</strong><br />
                From quote <strong>{receipt.quoteNo}</strong><br />
                {receipt.databaseId && <>Database <strong>#{receipt.databaseId}</strong><br /></>}
                Date <strong>{receipt.date}</strong><br />
                <span className="receipt-paid">PAID</span>
              </div>
            </div>
            <div className="receipt-party">
              <span className="ledger-mono">Received from</span>
              <strong className="ledger-serif">{receipt.client}</strong>
            </div>
            <table className="receipt-items ledger-mono">
              <thead>
                <tr><th>Item</th><th className="num">Qty</th><th className="num">Amount</th></tr>
              </thead>
              <tbody>
                {receipt.items.map((item, index) => (
                  <tr key={`${item.name}-${index}`}>
                    <td>{item.name}</td>
                    <td className="num">{item.qty}</td>
                    <td className="num">{money(item.qty * item.price, receipt.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="receipt-total ledger-mono">
              <div><span>Subtotal</span><span>{money(receipt.subtotal, receipt.currency)}</span></div>
              <div><span>Tax ({receipt.taxRate}%)</span><span>{money(receipt.tax, receipt.currency)}</span></div>
              <div className="grand"><span>Total paid</span><span>{money(receipt.total, receipt.currency)}</span></div>
            </div>
            <div className="receipt-footer ledger-mono">Thank you · Payment received in full</div>
          </div>
        </div>
      )}
    </div>
  );
}
