import { jsPDF } from 'jspdf';
import type { DocBlock, DocumentSpec } from './documentModel';

const PAGE_W = 210; // A4 width in mm
const PAGE_H = 297; // A4 height in mm
const MARGIN_LEFT = 22;
const MARGIN_RIGHT = 20;
const MARGIN_TOP = 16;
const MARGIN_BOTTOM = 16;
const CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT; // 168mm

const BODY_PT = 10.8;
const SMALL_PT = 9.2;
const LINE_H = 4.7;

function ensureSpace(pdf: jsPDF, y: number, neededMm: number): number {
  if (y + neededMm > PAGE_H - MARGIN_BOTTOM) {
    pdf.addPage('a4', 'portrait');
    return MARGIN_TOP;
  }
  return y;
}

function renderBlockToPdf(pdf: jsPDF, block: DocBlock, startY: number): number {
  let y = startY;
  pdf.setTextColor(0, 0, 0);

  switch (block.type) {
    case 'lampiranHeader': {
      pdf.setFont('times', 'normal');
      pdf.setFontSize(SMALL_PT);
      block.lines.forEach((line, idx) => {
        if (idx === block.lines.length - 1) {
          pdf.setFont('times', 'bold');
        } else {
          pdf.setFont('times', 'normal');
        }
        pdf.text(line, PAGE_W - MARGIN_RIGHT, y, { align: 'right' });
        y += 4.0;
      });
      pdf.setFont('times', 'bold');
      pdf.setFontSize(BODY_PT);
      pdf.text(block.modelCode, PAGE_W - MARGIN_RIGHT, y + 1, { align: 'right' });
      y += 6.5;
      break;
    }

    case 'kopDesa': {
      pdf.setFont('times', 'bold');
      pdf.setFontSize(12);
      pdf.text(block.kabupaten, PAGE_W / 2, y, { align: 'center' });
      y += 5.2;
      pdf.text(block.kecamatan, PAGE_W / 2, y, { align: 'center' });
      y += 5.4;
      pdf.setFontSize(13.5);
      pdf.text(block.desaLine, PAGE_W / 2, y, { align: 'center' });
      y += 4.8;
      pdf.setFont('times', 'italic');
      pdf.setFontSize(SMALL_PT);
      const addrLines = pdf.splitTextToSize(block.alamat, CONTENT_W);
      addrLines.forEach((l: string) => {
        pdf.text(l, PAGE_W / 2, y, { align: 'center' });
        y += 4.0;
      });
      // Double official Kop Surat line
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.8);
      pdf.line(MARGIN_LEFT, y, PAGE_W - MARGIN_RIGHT, y);
      pdf.setLineWidth(0.25);
      pdf.line(MARGIN_LEFT, y + 1.1, PAGE_W - MARGIN_RIGHT, y + 1.1);
      y += 6.5;
      break;
    }

    case 'wilayahBox': {
      pdf.setFontSize(BODY_PT);
      block.rows.forEach(([k, v]) => {
        pdf.setFont('times', 'normal');
        pdf.text(k, MARGIN_LEFT, y);
        pdf.text(':', MARGIN_LEFT + 54, y);
        pdf.setFont('times', 'bold');
        pdf.text(v, MARGIN_LEFT + 58, y);
        y += LINE_H;
      });
      y += 3.5;
      break;
    }

    case 'n2Header': {
      pdf.setFontSize(BODY_PT);
      pdf.setFont('times', 'normal');
      pdf.text('Perihal : ', MARGIN_LEFT, y);
      const perihalOffset = pdf.getTextWidth('Perihal : ');
      pdf.setFont('times', 'bold');
      pdf.text(block.perihal, MARGIN_LEFT + perihalOffset, y);

      pdf.setFont('times', 'normal');
      pdf.text(block.tempatTanggal, PAGE_W - MARGIN_RIGHT, y, { align: 'right' });
      y += 7.5;

      block.kepadaLines.forEach((line, idx) => {
        pdf.setFont('times', idx === 1 ? 'bold' : 'normal');
        pdf.text(line, MARGIN_LEFT, y);
        y += LINE_H;
      });
      y += 2;
      break;
    }

    case 'title': {
      y = ensureSpace(pdf, y, 14);
      pdf.setFont('times', 'bold');
      pdf.setFontSize(12.5);
      pdf.text(block.text, PAGE_W / 2, y, { align: 'center' });
      const titleW = pdf.getTextWidth(block.text);
      pdf.setLineWidth(0.35);
      pdf.line(PAGE_W / 2 - titleW / 2, y + 1.1, PAGE_W / 2 + titleW / 2, y + 1.1);
      y += 5.2;

      if (block.subtitle) {
        pdf.setFont('times', 'bold');
        pdf.setFontSize(BODY_PT);
        pdf.text(block.subtitle, PAGE_W / 2, y, { align: 'center' });
        y += 4.8;
      }
      if (block.nomor) {
        pdf.setFont('times', 'normal');
        pdf.setFontSize(BODY_PT);
        pdf.text(block.nomor, PAGE_W / 2, y, { align: 'center' });
        y += 5.2;
      }
      y += 1.5;
      break;
    }

    case 'paragraph': {
      y += (block.spaceBefore ?? 1) * 0.85;
      const fontStyle = block.bold ? 'bold' : block.italic ? 'italic' : 'normal';
      pdf.setFont('times', fontStyle);
      pdf.setFontSize(BODY_PT);

      const indentPrefix = block.indent ? '       ' : '';
      const fullText = `${indentPrefix}${block.text}`;
      const lines: string[] = pdf.splitTextToSize(fullText, CONTENT_W);

      lines.forEach((line, idx) => {
        y = ensureSpace(pdf, y, LINE_H + 1);
        if (block.align === 'center') {
          pdf.text(line, PAGE_W / 2, y, { align: 'center' });
        } else if (block.align === 'right') {
          pdf.text(line, PAGE_W - MARGIN_RIGHT, y, { align: 'right' });
        } else if (block.align === 'justify' && idx < lines.length - 1) {
          pdf.text(line, MARGIN_LEFT, y, { align: 'justify', maxWidth: CONTENT_W });
        } else {
          pdf.text(line, MARGIN_LEFT, y);
        }
        y += LINE_H;
      });
      y += (block.spaceAfter ?? 1) * 0.7;
      break;
    }

    case 'kvTable': {
      pdf.setFont('times', 'normal');
      pdf.setFontSize(BODY_PT);
      const labelW = block.labelWidthMm ?? 56;
      const colonX = MARGIN_LEFT + labelW;
      const valX = colonX + 4;
      const valMaxW = PAGE_W - MARGIN_RIGHT - valX;

      block.rows.forEach((row) => {
        const valLines: string[] = pdf.splitTextToSize(row.value || '-', valMaxW);
        const rowH = Math.max(1, valLines.length) * LINE_H;
        y = ensureSpace(pdf, y, rowH + 1);

        pdf.text(row.label, MARGIN_LEFT, y);
        pdf.text(':', colonX, y);
        valLines.forEach((vl, idx) => {
          pdf.text(vl, valX, y + idx * LINE_H);
        });
        y += rowH;
      });
      y += 1.5;
      break;
    }

    case 'numberedList': {
      pdf.setFont('times', 'normal');
      pdf.setFontSize(BODY_PT);
      const numIndent = 7;
      const textMaxW = CONTENT_W - numIndent;

      block.items.forEach((item, idx) => {
        const lines: string[] = pdf.splitTextToSize(item, textMaxW);
        const itemH = lines.length * LINE_H;
        y = ensureSpace(pdf, y, itemH + 1);

        pdf.text(`${idx + 1}.`, MARGIN_LEFT, y);
        lines.forEach((l, li) => {
          pdf.text(l, MARGIN_LEFT + numIndent, y + li * LINE_H);
        });
        y += itemH + 0.6;
      });
      y += 1.5;
      break;
    }

    case 'signatures': {
      y = ensureSpace(pdf, y, 36);
      y += 3;
      pdf.setFontSize(BODY_PT);
      pdf.setFont('times', 'normal');

      if (block.dateLine) {
        if (block.dateAlign === 'center') {
          pdf.text(block.dateLine, PAGE_W / 2, y, { align: 'center' });
        } else {
          pdf.text(block.dateLine, PAGE_W - MARGIN_RIGHT - 10, y, { align: 'center' });
        }
        y += 5.5;
      }

      const isSingleRight = block.columns.length === 1;
      const colCenters = isSingleRight
        ? [MARGIN_LEFT + CONTENT_W * 0.74]
        : [MARGIN_LEFT + CONTENT_W * 0.25, MARGIN_LEFT + CONTENT_W * 0.75];

      let maxEndY = y;

      block.columns.forEach((col, idx) => {
        let cy = y;
        const cx = colCenters[idx];

        pdf.setFont('times', 'normal');
        pdf.setFontSize(BODY_PT);

        if (col.topLabel && col.topLabel.trim()) {
          pdf.text(col.topLabel, cx, cy, { align: 'center' });
          cy += 4.6;
        } else if (!isSingleRight && block.columns.some((c) => c.topLabel && c.topLabel.trim())) {
          cy += 4.6;
        }

        col.role.split('\n').forEach((rl) => {
          pdf.text(rl, cx, cy, { align: 'center' });
          cy += 4.6;
        });

        if (col.materai) {
          // Draw crisp dashed Materai Rp10.000 box
          const boxW = 28;
          const boxH = 12;
          pdf.setDrawColor(120, 120, 120);
          pdf.setLineWidth(0.2);
          pdf.rect(cx - boxW / 2, cy + 2.5, boxW, boxH);
          pdf.setFont('times', 'italic');
          pdf.setFontSize(8.2);
          pdf.setTextColor(90, 90, 90);
          pdf.text('Materai', cx, cy + 7.5, { align: 'center' });
          pdf.text('Rp10.000', cx, cy + 11.5, { align: 'center' });
          pdf.setTextColor(0, 0, 0);
          cy += 20;
        } else {
          cy += 20;
        }

        pdf.setFont('times', 'bold');
        pdf.setFontSize(BODY_PT);
        pdf.text(col.name, cx, cy, { align: 'center' });
        const nameW = pdf.getTextWidth(col.name);
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.25);
        pdf.line(cx - nameW / 2, cy + 0.9, cx + nameW / 2, cy + 0.9);
        cy += 4.5;

        if (col.subInfo) {
          pdf.setFont('times', 'normal');
          pdf.setFontSize(SMALL_PT);
          pdf.text(col.subInfo, cx, cy, { align: 'center' });
          cy += 4.2;
        }

        if (cy > maxEndY) maxEndY = cy;
      });

      y = maxEndY + 2;
      break;
    }
  }

  return y;
}

export function exportSpecsToPdf(specs: DocumentSpec[], fileName: string): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  specs.forEach((spec, idx) => {
    if (idx > 0) {
      pdf.addPage('a4', 'portrait');
    }
    let y = MARGIN_TOP;
    spec.blocks.forEach((block) => {
      y = renderBlockToPdf(pdf, block, y);
    });
  });

  const safeName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  pdf.save(safeName);
}
