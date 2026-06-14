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
    [key: string]: { name: string; sku: string; unit: string; qty: number };
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
          qty: 0,
        };
      }
      reportItems[product.id].qty += item.quantity;
    });
  });

  const tableData = Object.values(reportItems).map((item, idx) => [
    idx + 1,
    item.sku,
    item.name,
    item.unit,
    item.qty,
  ]);

  // If no data, insert an informational placeholder row
  const hasData = tableData.length > 0;
  const bodyRows = hasData
    ? tableData
    : [['—', '—', 'No orders found in this period', '—', '—']];

  doc.autoTable({
    startY: 90,
    head: [['#', 'SKU', 'Product Name', 'Unit', 'Total Qty']],
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
    const summary: { [key: string]: { name: string; sku: string; unit: string; qty: number } } = {};
    
    let catHasOrders = false;
    orders.forEach(o => {
      o.items.forEach((i: any) => {
        const prod = catProducts.find((p: any) => p.id === i.productId);
        if (prod) {
          catHasOrders = true;
          if (!summary[prod.id]) {
            summary[prod.id] = { name: prod.name, sku: prod.sku, unit: prod.unit, qty: 0 };
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
      
      const tableData = Object.values(summary).map((item, idx) => [
        idx + 1,
        item.sku,
        item.name,
        item.unit,
        item.qty,
        '[  ]'
      ]);

      doc.autoTable({
        startY: currentY + 5,
        head: [['#', 'SKU', 'Item Name', 'Unit', 'Total Qty', 'Picked']],
        body: tableData,
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 15, right: 15 },
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 30 },
          4: { halign: 'center', fontStyle: 'bold' },
          5: { cellWidth: 20, halign: 'center' }
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
