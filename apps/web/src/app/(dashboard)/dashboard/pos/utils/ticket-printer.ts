export interface TicketData {
  restaurantName:     string;
  restaurantAddress?: string;
  restaurantPhone?:   string;
  orderNumber:        string;
  orderType:          string;
  tableNumber?:       string;
  customerName?:      string;
  items: Array<{
    name:      string;
    options?:  string;
    quantity:  number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal:            number;
  discountAmount?:     number;
  total:               number;
  paymentMethod:       string;
  paymentMethodIcon?:  string;
  amountPaid:          number;
  change?:             number;
  currencyCode?:       string;
  locale?:             string;
}

function fmt(amount: number, locale = 'fr-SN', currency = 'XOF'): string {
  return new Intl.NumberFormat(locale, {
    style:                'currency',
    currency,
    maximumFractionDigits: currency === 'XOF' ? 0 : 2,
  }).format(amount);
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildTicketHtml(d: TicketData): string {
  const locale   = d.locale   ?? 'fr-SN';
  const currency = d.currencyCode ?? 'XOF';
  const f        = (n: number) => fmt(n, locale, currency);
  const now      = new Date();

  const dateStr = now.toLocaleDateString(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString(locale, {
    hour: '2-digit', minute: '2-digit',
  });

  // ── Items rows ────────────────────────────────────────────────────────────
  const itemsHtml = d.items.map((item, i) => `
    <div class="item${i > 0 ? ' sep' : ''}">
      <div class="item-body">
        <div class="item-top">
          <span class="item-qty">${item.quantity}×</span>
          <span class="item-name">${esc(item.name)}</span>
        </div>
        ${item.options ? `<div class="item-opts">${esc(item.options)}</div>` : ''}
        ${item.quantity > 1 ? `<div class="item-unit">${f(item.unitPrice)} / unité</div>` : ''}
      </div>
      <div class="item-total">${f(item.lineTotal)}</div>
    </div>`).join('');

  // ── Subtotal / discount rows ──────────────────────────────────────────────
  const totalsHtml = (d.discountAmount && d.discountAmount > 0) ? `
    <div class="total-row muted">
      <span>Sous-total</span>
      <span>${f(d.subtotal)}</span>
    </div>
    <div class="total-row green">
      <span>🏷️ Remise</span>
      <span>− ${f(d.discountAmount)}</span>
    </div>` : '';

  // ── Change row ────────────────────────────────────────────────────────────
  const changeHtml = (d.change && d.change > 0) ? `
    <div class="change-row">
      <span>Rendu monnaie</span>
      <span>${f(d.change)}</span>
    </div>` : '';

  // ── Meta badges ──────────────────────────────────────────────────────────
  const metaBadges = [
    `<span>📅 ${dateStr}</span>`,
    `<span>🕐 ${timeStr}</span>`,
    ...(d.tableNumber  ? [`<span>🪑 Table ${esc(d.tableNumber)}</span>`]  : []),
    ...(d.customerName ? [`<span>👤 ${esc(d.customerName)}</span>`]        : []),
  ].join('');

  const payIcon  = d.paymentMethodIcon ?? '💳';
  const payLabel = esc(d.paymentMethod);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ticket ${esc(d.orderNumber)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      width: 300px;
      margin: 0 auto;
      padding: 20px 14px 28px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #111;
      background: #fff;
    }

    /* ── Header ─────────────────────────────────────────── */
    .header { text-align: center; padding-bottom: 14px; }

    .brand-icon { font-size: 28px; display: block; margin-bottom: 4px; }

    .brand {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #C8553D;
      line-height: 1;
    }

    .sub-brand {
      font-size: 8px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #C8553D88;
      margin-top: 2px;
    }

    .restaurant-info {
      margin-top: 6px;
      font-size: 9px;
      color: #999;
      line-height: 1.6;
    }

    /* ── Dividers ────────────────────────────────────────── */
    .div-solid  { border: none; border-top: 1px solid #e5e5e5; margin: 12px 0; }
    .div-dashed { border: none; border-top: 1px dashed #d5d5d5; margin: 10px 0; }
    .div-double { border: none; border-top: 3px double #222;    margin: 14px 0; }

    /* ── Order header ────────────────────────────────────── */
    .order-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .order-number {
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -1px;
      color: #111;
    }

    .order-type-pill {
      background: #C8553D;
      color: #fff;
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 4px 10px;
      border-radius: 50px;
      white-space: nowrap;
    }

    .order-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 5px;
      font-size: 9px;
      color: #888;
    }

    /* ── Items ───────────────────────────────────────────── */
    .items { padding: 2px 0; }

    .item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
      padding: 7px 0;
    }
    .item.sep { border-top: 1px dotted #ececec; }

    .item-body { flex: 1; min-width: 0; }

    .item-top {
      display: flex;
      align-items: baseline;
      gap: 5px;
    }

    .item-qty {
      font-size: 9px;
      font-weight: 700;
      color: #C8553D;
      background: #C8553D14;
      padding: 1px 5px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .item-name {
      font-size: 11px;
      font-weight: 600;
      line-height: 1.3;
    }

    .item-opts {
      font-size: 8.5px;
      color: #aaa;
      margin-top: 2px;
      line-height: 1.3;
    }

    .item-unit {
      font-size: 8px;
      color: #ccc;
      margin-top: 1px;
    }

    .item-total {
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      flex-shrink: 0;
      padding-top: 1px;
    }

    /* ── Totals ───────────────────────────────────────────── */
    .totals { padding: 2px 0; }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3px 0;
      font-size: 10px;
    }
    .total-row.muted  { color: #999; }
    .total-row.green  { color: #16a34a; font-weight: 600; }

    .total-grand {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0 4px;
    }

    .total-grand .label {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .total-grand .value {
      font-size: 22px;
      font-weight: 900;
      color: #C8553D;
      letter-spacing: -0.5px;
    }

    /* ── Payment ──────────────────────────────────────────── */
    .payment { padding: 4px 0; }

    .pay-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10.5px;
      padding: 3px 0;
    }

    .pay-method {
      display: flex;
      align-items: center;
      gap: 5px;
      font-weight: 600;
    }

    .pay-icon { font-size: 14px; }

    .change-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      font-weight: 700;
      color: #16a34a;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 5px 10px;
      border-radius: 8px;
      margin-top: 6px;
    }

    /* ── Footer ───────────────────────────────────────────── */
    .footer { text-align: center; padding-top: 6px; }

    .footer-icon { font-size: 22px; display: block; margin-bottom: 5px; }

    .footer-msg {
      font-size: 13px;
      font-weight: 800;
      color: #111;
      margin-bottom: 3px;
    }

    .footer-sub {
      font-size: 9px;
      color: #bbb;
      margin-bottom: 10px;
    }

    .footer-tagline {
      display: inline-block;
      font-size: 8px;
      color: #C8553D;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      border: 1px solid #C8553D33;
      padding: 3px 10px;
      border-radius: 50px;
    }

    .cut {
      text-align: center;
      color: #ddd;
      font-size: 9px;
      letter-spacing: 4px;
      margin-top: 18px;
    }

    @media print {
      body { width: 100%; padding: 6px 4px 20px; }
      @page { margin: 0; size: 80mm auto; }
    }
  </style>
</head>
<body>

  <!-- ── HEADER ── -->
  <div class="header">
    <span class="brand-icon">🍽️</span>
    <div class="brand">${esc(d.restaurantName.toUpperCase())}</div>
    <div class="sub-brand">La table du partage</div>
    ${d.restaurantAddress || d.restaurantPhone ? `
    <div class="restaurant-info">
      ${d.restaurantAddress ? `<div>${esc(d.restaurantAddress)}</div>` : ''}
      ${d.restaurantPhone   ? `<div>📞 ${esc(d.restaurantPhone)}</div>`   : ''}
    </div>` : ''}
  </div>

  <hr class="div-solid">

  <!-- ── ORDER INFO ── -->
  <div class="order-header">
    <div class="order-number">${esc(d.orderNumber)}</div>
    <div class="order-type-pill">${esc(d.orderType)}</div>
  </div>
  <div class="order-meta">${metaBadges}</div>

  <hr class="div-dashed">

  <!-- ── ITEMS ── -->
  <div class="items">${itemsHtml}</div>

  <hr class="div-dashed">

  <!-- ── TOTALS ── -->
  <div class="totals">
    ${totalsHtml}
    <div class="total-grand">
      <span class="label">Total</span>
      <span class="value">${f(d.total)}</span>
    </div>
  </div>

  <hr class="div-solid">

  <!-- ── PAYMENT ── -->
  <div class="payment">
    <div class="pay-row">
      <div class="pay-method">
        <span class="pay-icon">${payIcon}</span>
        <span>${payLabel}</span>
      </div>
      <span>${f(d.amountPaid)}</span>
    </div>
    ${changeHtml}
  </div>

  <hr class="div-double">

  <!-- ── FOOTER ── -->
  <div class="footer">
    <span class="footer-icon">🙏</span>
    <div class="footer-msg">Merci de votre visite !</div>
    <div class="footer-sub">À bientôt &nbsp;·&nbsp; Karibu tena</div>
    <div class="footer-tagline">Térangatable</div>
  </div>

  <div class="cut">✂ ─────────── ✂</div>

</body>
</html>`;
}

// ── Z-Report ───────────────────────────────────────────────────────────────────

export interface ZReportData {
  restaurantName:     string;
  restaurantAddress?: string;
  openedBy:           string;
  closedBy?:          string;
  openedAt:           string;
  closedAt:           string;
  durationLabel:      string;
  totalSales:         number;
  totalOrders:        number;
  avgOrderValue:      number;
  openingAmount:      number;
  salesByMethod:      Record<string, number>;
  cashCounted:        number;
  cashTheoretical:    number;
  cashDifference:     number;
  notes?:             string;
  currencyCode?:      string;
  locale?:            string;
}

const METHOD_LABELS_Z: Record<string, string> = {
  cash:         '💵 Espèces',
  card:         '💳 Carte',
  mobile_money: '📱 Mobile Money',
  online:       '🌐 En ligne',
  voucher:      '🎟️ Bon',
};

export function buildZReportHtml(d: ZReportData): string {
  const locale   = d.locale   ?? 'fr-SN';
  const currency = d.currencyCode ?? 'XOF';
  const f        = (n: number) => fmt(n, locale, currency);

  const now = new Date();
  const printedAt = now.toLocaleString(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const openedDate = new Date(d.openedAt).toLocaleString(locale, {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
  const closedDate = new Date(d.closedAt).toLocaleString(locale, {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });

  const methodRows = Object.entries(d.salesByMethod)
    .filter(([, amount]) => amount > 0)
    .map(([method, amount]) => `
      <div class="row">
        <span>${esc(METHOD_LABELS_Z[method] ?? method)}</span>
        <span>${f(amount)}</span>
      </div>`).join('');

  const diffPositive  = d.cashDifference >= 0;
  const diffColor     = diffPositive ? '#16a34a' : '#dc2626';
  const diffSign      = diffPositive ? '+' : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Ticket Z — ${esc(d.restaurantName)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      width: 300px;
      margin: 0 auto;
      padding: 20px 14px 28px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #111;
      background: #fff;
    }

    .header { text-align: center; padding-bottom: 14px; }
    .brand-icon { font-size: 24px; display: block; margin-bottom: 4px; }
    .brand { font-size: 17px; font-weight: 900; letter-spacing: -0.5px; color: #C8553D; }
    .sub-brand { font-size: 8px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #C8553D66; margin-top: 2px; }
    .restaurant-info { margin-top: 5px; font-size: 9px; color: #999; }

    .ticket-z-badge {
      display: inline-block;
      background: #111;
      color: #fff;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 4px 14px;
      border-radius: 50px;
      margin: 10px 0 4px;
    }
    .printed-at { font-size: 8px; color: #aaa; }

    .div-solid  { border: none; border-top: 1px solid #e5e5e5; margin: 10px 0; }
    .div-dashed { border: none; border-top: 1px dashed #d5d5d5; margin: 8px 0; }
    .div-double { border: none; border-top: 3px double #222; margin: 12px 0; }

    /* Session info */
    .session-info { font-size: 9px; color: #777; display: flex; flex-direction: column; gap: 2px; }
    .session-info .si-row { display: flex; justify-content: space-between; }
    .session-info .si-val { font-weight: 600; color: #444; }

    /* KPIs */
    .kpis { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin: 8px 0; }
    .kpi {
      background: #fafafa;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      padding: 8px 4px;
      text-align: center;
    }
    .kpi-val { font-size: 14px; font-weight: 900; color: #C8553D; line-height: 1.1; }
    .kpi-val.small { font-size: 10px; }
    .kpi-label { font-size: 8px; color: #999; margin-top: 2px; line-height: 1.2; }

    /* Method table */
    .section-title {
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #bbb;
      margin-bottom: 5px;
    }

    .row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      padding: 4px 0;
      border-bottom: 1px dotted #eee;
    }
    .row:last-child { border-bottom: none; }
    .row span:last-child { font-weight: 600; }

    /* Cash reconciliation */
    .cash-block { background: #fafafa; border: 1px solid #eee; border-radius: 8px; padding: 10px; }
    .cash-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      padding: 3px 0;
      color: #555;
    }
    .cash-row.bold span { font-weight: 700; color: #111; }
    .cash-diff {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 800;
      padding: 6px 8px;
      border-radius: 6px;
      margin-top: 6px;
    }

    /* Notes */
    .notes-block {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 9px;
      color: #92400e;
      margin-top: 4px;
    }
    .notes-label { font-weight: 700; margin-bottom: 2px; font-size: 8px; text-transform: uppercase; letter-spacing: 1px; }

    /* Footer */
    .footer { text-align: center; margin-top: 4px; }
    .footer-line { font-size: 9px; color: #ccc; margin-bottom: 2px; }
    .footer-brand { font-size: 8px; color: #C8553D; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; border: 1px solid #C8553D33; padding: 3px 10px; border-radius: 50px; display: inline-block; }

    .cut { text-align: center; color: #ccc; font-size: 9px; letter-spacing: 4px; margin-top: 14px; }

    @media print {
      body { width: 100%; padding: 6px 4px 20px; }
      @page { margin: 0; size: 80mm auto; }
    }
  </style>
</head>
<body>

  <div class="header">
    <span class="brand-icon">🏪</span>
    <div class="brand">${esc(d.restaurantName.toUpperCase())}</div>
    <div class="sub-brand">La table du partage</div>
    ${d.restaurantAddress ? `<div class="restaurant-info">${esc(d.restaurantAddress)}</div>` : ''}
    <div class="ticket-z-badge">✕ Ticket Z</div>
    <div class="printed-at">Imprimé le ${printedAt}</div>
  </div>

  <hr class="div-solid">

  <div class="session-info">
    <div class="si-row"><span>Ouverture</span><span class="si-val">${openedDate} — ${esc(d.openedBy)}</span></div>
    <div class="si-row"><span>Clôture</span><span class="si-val">${closedDate}${d.closedBy ? ` — ${esc(d.closedBy)}` : ''}</span></div>
    <div class="si-row"><span>Durée</span><span class="si-val">${esc(d.durationLabel)}</span></div>
  </div>

  <hr class="div-dashed">

  <div class="kpis">
    <div class="kpi">
      <div class="kpi-val">${d.totalOrders}</div>
      <div class="kpi-label">Commandes</div>
    </div>
    <div class="kpi">
      <div class="kpi-val small">${f(d.totalSales)}</div>
      <div class="kpi-label">Total ventes</div>
    </div>
    <div class="kpi">
      <div class="kpi-val small">${f(Math.round(d.avgOrderValue))}</div>
      <div class="kpi-label">Moy. / cmd</div>
    </div>
  </div>

  <hr class="div-dashed">

  <div class="section-title">Ventes par méthode</div>
  ${methodRows || '<div class="row"><span style="color:#bbb">Aucune vente</span><span>—</span></div>'}
  <div class="row" style="font-weight:700; margin-top:4px;">
    <span>TOTAL</span>
    <span>${f(d.totalSales)}</span>
  </div>

  <hr class="div-dashed">

  <div class="section-title">Clôture espèces</div>
  <div class="cash-block">
    <div class="cash-row">
      <span>Fond initial</span>
      <span>${f(d.openingAmount)}</span>
    </div>
    <div class="cash-row">
      <span>Espèces encaissées</span>
      <span>${f(d.salesByMethod['cash'] ?? 0)}</span>
    </div>
    <div class="cash-row bold">
      <span>Théorique caisse</span>
      <span>${f(d.cashTheoretical)}</span>
    </div>
    <div class="cash-row bold">
      <span>Espèces comptées</span>
      <span>${f(d.cashCounted)}</span>
    </div>
    <div class="cash-diff" style="background:${diffPositive ? '#f0fdf4' : '#fef2f2'}; color:${diffColor};">
      <span>Écart</span>
      <span>${diffSign}${f(d.cashDifference)}</span>
    </div>
  </div>

  ${d.notes ? `
  <hr class="div-dashed">
  <div class="notes-block">
    <div class="notes-label">Notes</div>
    <div>${esc(d.notes)}</div>
  </div>` : ''}

  <hr class="div-double">

  <div class="footer">
    <div class="footer-line">Signature caissier · ____________________</div>
    <br>
    <div class="footer-brand">Térangatable</div>
  </div>

  <div class="cut">✂ ─────────── ✂</div>

</body>
</html>`;
}

export function printZReport(data: ZReportData): void {
  const html = buildZReportHtml(data);
  const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
  const url  = URL.createObjectURL(blob);

  const win = window.open(url, '_blank', 'width=420,height=800,scrollbars=yes');
  if (!win) { URL.revokeObjectURL(url); return; }

  win.addEventListener('load', () => {
    setTimeout(() => {
      win.focus();
      win.print();
      win.close();
      URL.revokeObjectURL(url);
    }, 350);
  });
}

// ── Ticket client ──────────────────────────────────────────────────────────────

export function printTicket(data: TicketData): void {
  const html = buildTicketHtml(data);
  const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
  const url  = URL.createObjectURL(blob);

  const win = window.open(url, '_blank', 'width=420,height=700,scrollbars=yes');
  if (!win) { URL.revokeObjectURL(url); return; }

  win.addEventListener('load', () => {
    setTimeout(() => {
      win.focus();
      win.print();
      win.close();
      URL.revokeObjectURL(url);
    }, 350);
  });
}
