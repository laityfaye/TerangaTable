export interface TicketData {
  restaurantName:  string;
  restaurantAddress?: string;
  orderNumber:     string;
  orderType:       string;
  tableNumber?:    string;
  items: Array<{
    name:       string;
    options?:   string;
    quantity:   number;
    unitPrice:  number;
    lineTotal:  number;
  }>;
  subtotal:        number;
  discountAmount?: number;
  total:           number;
  paymentMethod:   string;
  amountPaid:      number;
  change?:         number;
  currencyCode?:   string;
  locale?:         string;
}

function fmt(amount: number, locale = 'fr-SN', currency = 'XOF'): string {
  return new Intl.NumberFormat(locale, {
    style:                'currency',
    currency,
    maximumFractionDigits: currency === 'XOF' ? 0 : 2,
  }).format(amount);
}

function center(text: string, width = 42): string {
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(pad) + text;
}

function line(char = '─', width = 42): string {
  return char.repeat(width);
}

export function buildTicketText(d: TicketData): string {
  const locale   = d.locale ?? 'fr-SN';
  const currency = d.currencyCode ?? 'XOF';
  const now      = new Date();
  const dateStr  = now.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr  = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  const lines: string[] = [
    '',
    center(d.restaurantName.toUpperCase()),
    ...(d.restaurantAddress ? [center(d.restaurantAddress)] : []),
    '',
    line(),
    `N° ${d.orderNumber}   ${d.orderType}${d.tableNumber ? `   Table ${d.tableNumber}` : ''}`,
    `${dateStr}  ${timeStr}`,
    line(),
  ];

  for (const item of d.items) {
    const priceStr = fmt(item.lineTotal, locale, currency);
    const qtyName  = `${item.quantity}x ${item.name}`;
    const pad      = Math.max(1, 42 - qtyName.length - priceStr.length);
    lines.push(qtyName + ' '.repeat(pad) + priceStr);
    if (item.options) {
      lines.push(`   ${item.options}`);
    }
  }

  lines.push(line('─'));

  if (d.discountAmount && d.discountAmount > 0) {
    const sub    = `Sous-total`;
    const subVal = fmt(d.subtotal, locale, currency);
    lines.push(sub + ' '.repeat(42 - sub.length - subVal.length) + subVal);
    const disc    = `Remise`;
    const discVal = `-${fmt(d.discountAmount, locale, currency)}`;
    lines.push(disc + ' '.repeat(42 - disc.length - discVal.length) + discVal);
  }

  const totalLabel = `TOTAL`;
  const totalVal   = fmt(d.total, locale, currency);
  lines.push(totalLabel + ' '.repeat(42 - totalLabel.length - totalVal.length) + totalVal);

  const paidLabel = `${d.paymentMethod}`;
  const paidVal   = fmt(d.amountPaid, locale, currency);
  lines.push(paidLabel + ' '.repeat(42 - paidLabel.length - paidVal.length) + paidVal);

  if (d.change !== undefined && d.change > 0) {
    const chLabel = `Rendu`;
    const chVal   = fmt(d.change, locale, currency);
    lines.push(chLabel + ' '.repeat(42 - chLabel.length - chVal.length) + chVal);
  }

  lines.push(line('═'));
  lines.push('');
  lines.push(center('Merci de votre visite !'));
  lines.push(center('À bientôt'));
  lines.push('');

  return lines.join('\n');
}

export function printTicket(data: TicketData): void {
  const text = buildTicketText(data);

  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ticket ${data.orderNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          white-space: pre;
          padding: 8px;
          color: #000;
          background: #fff;
        }
        @media print {
          body { font-size: 11px; }
          @page { margin: 4mm; size: 80mm auto; }
        }
      </style>
    </head>
    <body>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}
