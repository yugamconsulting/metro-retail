import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
// Removed unused formatCurrency

interface ReportParams {
  client: any;
  user?: any;
  orders: any[];
  products: any[];
  startDate: Date;
  endDate: Date;
}

export const generateOrderReport = ({
  client,
  user,
  orders,
  products,
  startDate,
  endDate,
}: ReportParams): void => {
  // Guard: client must exist
  if (!client) {
    console.error('[pdfGenerator] No client provided — aborting report generation.');
    return;
  }

  const doc = new jsPDF() as any;

  // Header bar
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDER SUMMARY REPORT', 15, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 15, 30);

  // Client details
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Client Details:', 15, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(client.companyName ?? 'Unknown', 15, 62);
  doc.setFontSize(10);
  doc.setTextColor(99, 102, 241);
  doc.setFont('helvetica', 'bold');
  doc.text(`ID: ${client.clientNumber || 'N/A'}`, 15, 68);
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(`${client.contactPerson ?? ''} | ${client.email ?? ''}`, 15, 73);

  doc.setFont('helvetica', 'bold');
  doc.text('Report Period:', 130, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${format(startDate, 'dd MMM yyyy')} – ${format(endDate, 'dd MMM yyyy')}`,
    130,
    62
  );

  if (user) {
    doc.setFont('helvetica', 'bold');
    doc.text('Filtered by User:', 130, 72);
    doc.setFont('helvetica', 'normal');
    doc.text(`${user.name} (${user.id})`, 130, 78);
  }

  // Aggregate order items
  const reportItems: {
    [key: string]: { name: string; sku: string; unit: string; qty: number, unitValue: number };
  } = {};

  orders.forEach((order) => {
    (order.items ?? []).forEach((item: any) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return;

      if (!reportItems[product.id]) {
        reportItems[product.id] = {
          name: product.name,
          sku: product.sku,
          unit: product.unit,
          unitValue: product.unitValue || 1, // Store for calculation
          qty: 0,
        };
      }
      reportItems[product.id].qty += item.quantity;
    });
  });

  const tableData = Object.values(reportItems).map((item: any, idx) => [
    idx + 1,
    item.sku,
    item.name.toUpperCase(),
    item.unit.toLowerCase(),
    item.qty,
    `${item.qty * item.unitValue} ${item.unit.toLowerCase()}`
  ]);

  // If no data, insert an informational placeholder row
  const hasData = tableData.length > 0;
  const bodyRows = hasData
    ? tableData
    : [['—', '—', 'No orders found in this period', '—', '—', '—']];

  doc.autoTable({
    startY: 90,
    head: [['#', 'SKU', 'Product Name', 'Unit', 'Order Qty', 'Total Measure']],
    body: bodyRows,
    headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 15, right: 15 },
    styles: { font: 'helvetica', fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 30 },
      4: { halign: 'center' },
    },
  });

  // Summary block — only if there's real data
  if (hasData) {
    const finalY = (doc.lastAutoTable?.finalY ?? 200) + 10;
    // Order count summary
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text(
      `Report Summary: ${orders.length} order${orders.length !== 1 ? 's' : ''} fulfilled.`,
      15,
      finalY + 5
    );
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Metro Retail and Trade | Automated Ordering System',
    105,
    285,
    { align: 'center' }
  );

  // Save with structured filename
  const safeClientName = (client.companyName ?? 'client')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 15);
  const clientNo = client.clientNumber || 'NA';
  const timestamp = format(new Date(), 'yyMMdd_HHmm');
  doc.save(`MRT_REP_${clientNo}_${safeClientName}_${timestamp}.pdf`);
};

export const generateMasterPickList = ({
  orders,
  products,
  date,
}: {
  orders: any[];
  products: any[];
  date: Date;
}) => {
  const doc = new jsPDF() as any;

  // Header bar
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('MASTER PICK-LIST', 15, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Warehouse Fulfillment Date: ${format(date, 'dd MMMM yyyy')}`, 15, 30);

  // Grouped Aggregation
  const categories = [...new Set(products.map(p => p.category))].sort();
  
  let currentY = 50;

  categories.forEach(cat => {
    const catProducts = products.filter(p => p.category === cat);
    const summary: { [key: string]: { name: string; sku: string; unit: string; qty: number, unitValue: number } } = {};
    
    let catHasOrders = false;
    orders.forEach(o => {
      o.items.forEach((i: any) => {
        const prod = catProducts.find((p: any) => p.id === i.productId);
        if (prod) {
          catHasOrders = true;
          if (!summary[prod.id]) {
            summary[prod.id] = { name: prod.name, sku: prod.sku, unit: prod.unit, unitValue: prod.unitValue || 1, qty: 0 };
          }
          summary[prod.id].qty += i.quantity;
        }
      });
    });

    if (catHasOrders) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(99, 102, 241);
      doc.text(`${cat.toUpperCase()} ZONE`, 15, currentY);
      
      const tableData = Object.values(summary).map((item: any, idx) => [
        idx + 1,
        item.sku,
        item.name.toUpperCase(),
        item.unit.toLowerCase(),
        item.qty,
        `${item.qty * (item.unitValue || 1)} ${item.unit.toLowerCase()}`,
        '[  ]'
      ]);

      doc.autoTable({
        startY: currentY + 5,
        head: [['#', 'SKU', 'Item Name', 'Unit', 'Order Qty', 'Total Measure', 'Picked']],
        body: tableData,
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 15, right: 15 },
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 25 },
          4: { halign: 'center', fontStyle: 'bold' },
          5: { halign: 'center' },
          6: { cellWidth: 15, halign: 'center' }
        }
      });

      currentY = doc.lastAutoTable.finalY + 15;
      
      // Handle page break
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
    }
  });

  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'bold');
  doc.text(`Summary: ${orders.length} total orders aggregated for picking.`, 15, finalY);

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Metro Retail and Trade | Warehouse Operations Unit', 105, 285, { align: 'center' });

  const filename = `MRT_PICKLIST_${format(date, 'yyyyMMdd')}.pdf`;
  doc.save(filename);
};

export const generateDeliveryConfirmation = ({
  client,
  order,
  products,
}: {
  client: any;
  order: any;
  products: any[];
}) => {
  const doc = new jsPDF() as any;

  // Header bar
  doc.setFillColor(16, 185, 129); // Emerald-500
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('DELIVERY CONFIRMATION (DC)', 15, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Official Receipt for Order #${order.id}`, 15, 30);

  // Client Details
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Client Info:', 15, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(client.companyName, 15, 62);
  doc.setFontSize(9);
  doc.text(`Client ID: ${client.clientNumber}`, 15, 68);
  doc.text(client.address, 15, 73, { maxWidth: 80 });

  // Confirmation Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Confirmation Proof:', 120, 55);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Confirmed At: ${format(new Date(order.deliveryConfirmedAt), 'dd MMM yyyy, hh:mm a')}`, 120, 62);
  doc.text(`Confirmed By: ${order.deliveryConfirmedBy || 'Client Portal'}`, 120, 68);
  doc.text(`Status: SUCCESSFULLY RECEIVED`, 120, 73);

  // Table
  const tableData = order.items.map((item: any, idx: number) => {
    const p = products.find(prod => prod.id === item.productId);
    return [
      idx + 1,
      p?.sku || 'N/A',
      p?.name.toUpperCase() || 'ITEM',
      item.quantity,
      p?.unit.toLowerCase() || 'unit',
      `${item.quantity * (p?.unitValue || 1)} ${p?.unit.toLowerCase()}`
    ];
  });

  doc.autoTable({
    startY: 90,
    head: [['#', 'SKU', 'Item Description', 'Qty', 'Unit', 'Total Measure']],
    body: tableData,
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    margin: { left: 15, right: 15 },
    styles: { font: 'helvetica', fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 10 },
      3: { halign: 'center' },
      5: { halign: 'right' }
    }
  });

  // Footer
  const finalY = doc.lastAutoTable.finalY + 30;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Authorized Receiver Signature', 15, finalY);
  doc.line(15, finalY + 2, 70, finalY + 2);

  doc.text('MRT Dispatch Stamp', 140, finalY);
  doc.line(140, finalY + 2, 195, finalY + 2);

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('This is a digitally verified delivery confirmation. Generated by Metro Retail and Trade.', 105, 285, { align: 'center' });

  const filename = `MRT_DC_${order.id}_${client.clientNumber}.pdf`;
  doc.save(filename);
};
