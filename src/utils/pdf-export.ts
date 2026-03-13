// Shared PDF Export Utility using jsPDF + autoTable
// Used across all dashboard pages for consistent, phone-friendly PDF exports

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PDFExportOptions {
    title: string;
    subtitle?: string;
    headers: string[];
    rows: (string | number)[][];
    /** Row indices that are department/section headers (will be colored) */
    sectionRows?: number[];
    /** Map row index -> background color hex for special rows */
    rowColors?: Record<number, string>;
    orientation?: "landscape" | "portrait";
    fileName: string;
}

export function exportToPDF(opts: PDFExportOptions) {
    const {
        title,
        subtitle,
        headers,
        rows,
        sectionRows = [],
        rowColors = {},
        orientation = "landscape",
        fileName,
    } = opts;

    const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 16);

    if (subtitle) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120, 120, 120);
        doc.text(subtitle, 14, 22);
        doc.setTextColor(0, 0, 0);
    }

    // Restly branding - top right
    doc.setFontSize(9);
    doc.setTextColor(180, 160, 100);
    doc.text("Restly — AI Restaurant Manager", pageWidth - 14, 10, { align: "right" });
    doc.setTextColor(0, 0, 0);

    const sectionSet = new Set(sectionRows);

    autoTable(doc, {
        startY: subtitle ? 26 : 20,
        head: [headers],
        body: rows,
        theme: "grid",
        styles: {
            fontSize: 8,
            cellPadding: 2.5,
            font: "helvetica",
            lineColor: [200, 200, 200],
            lineWidth: 0.2,
            overflow: "linebreak",
        },
        headStyles: {
            fillColor: [35, 35, 50],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8,
            halign: "center",
        },
        columnStyles: {
            0: { fontStyle: "bold", halign: "left" },
        },
        didParseCell: (data: any) => {
            const rowIdx = data.row.index;
            // Section/department headers
            if (data.section === "body" && sectionSet.has(rowIdx)) {
                data.cell.styles.fillColor = [200, 50, 50];
                data.cell.styles.textColor = [255, 255, 255];
                data.cell.styles.fontStyle = "bold";
                data.cell.styles.fontSize = 9;
                return;
            }
            // Custom row colors
            if (data.section === "body" && rowColors[rowIdx]) {
                const hex = rowColors[rowIdx];
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                data.cell.styles.fillColor = [r, g, b];
            }
            // Color OFF/LEAVE cells
            if (data.section === "body") {
                const val = String(data.cell.raw || "");
                if (val === "OFF") {
                    data.cell.styles.fillColor = [255, 230, 230];
                    data.cell.styles.textColor = [180, 50, 50];
                    data.cell.styles.fontStyle = "bold";
                    data.cell.styles.halign = "center";
                } else if (val === "LEAVE") {
                    data.cell.styles.fillColor = [30, 30, 30];
                    data.cell.styles.textColor = [255, 255, 255];
                    data.cell.styles.fontStyle = "bold";
                    data.cell.styles.halign = "center";
                } else if (val === "—" || val === "") {
                    data.cell.styles.halign = "center";
                    data.cell.styles.textColor = [180, 180, 180];
                } else if (data.column.index > 0 && data.column.index < data.table.columns.length - 1) {
                    // Shift time cells - center align
                    data.cell.styles.halign = "center";
                }
                // Hours column - last column
                if (data.column.index === data.table.columns.length - 1 && !sectionSet.has(rowIdx)) {
                    data.cell.styles.halign = "center";
                    data.cell.styles.fontStyle = "bold";
                    const hrs = Number(val);
                    if (hrs > 40) {
                        data.cell.styles.textColor = [220, 50, 50]; // Red for overtime
                    } else if (hrs > 0) {
                        data.cell.styles.textColor = [50, 160, 80]; // Green
                    }
                }
            }
        },
        margin: { left: 10, right: 10 },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: "right" });
        doc.text(`Generated by Restly — ${new Date().toLocaleDateString()}`, 14, pageHeight - 8);
    }

    doc.save(`${fileName}.pdf`);
}
