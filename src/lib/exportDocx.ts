import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  UnderlineType,
  WidthType,
  convertMillimetersToTwip,
} from 'docx';
import { saveAs } from 'file-saver';
import type { DocBlock, DocumentSpec } from './documentModel';

const FONT_NAME = 'Times New Roman';
const BODY_SIZE = 22; // 11pt in half-points (fits cleanly on 1 A4 page per official form)
const SMALL_SIZE = 19; // 9.5pt
const TITLE_SIZE = 26; // 13pt
const KOP_MAIN_SIZE = 28; // 14pt

const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

const CELL_NO_BORDER = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

function mapAlign(align?: 'left' | 'center' | 'right' | 'justify') {
  switch (align) {
    case 'center':
      return AlignmentType.CENTER;
    case 'right':
      return AlignmentType.RIGHT;
    case 'justify':
      return AlignmentType.JUSTIFIED;
    default:
      return AlignmentType.LEFT;
  }
}

function renderBlockToDocx(block: DocBlock): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];

  switch (block.type) {
    case 'lampiranHeader': {
      block.lines.forEach((line, idx) => {
        out.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 0, after: idx === block.lines.length - 1 ? 60 : 20, line: 240 },
            children: [
              new TextRun({
                text: line,
                font: FONT_NAME,
                size: SMALL_SIZE,
                bold: idx === block.lines.length - 1,
              }),
            ],
          })
        );
      });
      out.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 0, after: 120 },
          children: [
            new TextRun({
              text: block.modelCode,
              font: FONT_NAME,
              size: BODY_SIZE,
              bold: true,
            }),
          ],
        })
      );
      break;
    }

    case 'kopDesa': {
      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 20 },
          children: [
            new TextRun({ text: block.kabupaten, font: FONT_NAME, size: 24, bold: true }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 20 },
          children: [
            new TextRun({ text: block.kecamatan, font: FONT_NAME, size: 24, bold: true }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 40 },
          children: [
            new TextRun({ text: block.desaLine, font: FONT_NAME, size: KOP_MAIN_SIZE, bold: true }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 140 },
          border: {
            bottom: {
              style: BorderStyle.DOUBLE,
              size: 12,
              space: 4,
              color: '000000',
            },
          },
          children: [
            new TextRun({ text: block.alamat, font: FONT_NAME, size: SMALL_SIZE, italics: true }),
          ],
        })
      );
      break;
    }

    case 'wilayahBox': {
      const rows = block.rows.map(
        ([k, v]) =>
          new TableRow({
            children: [
              new TableCell({
                borders: CELL_NO_BORDER,
                width: { size: convertMillimetersToTwip(56), type: WidthType.DXA },
                children: [
                  new Paragraph({
                    spacing: { before: 15, after: 15 },
                    children: [new TextRun({ text: k, font: FONT_NAME, size: BODY_SIZE })],
                  }),
                ],
              }),
              new TableCell({
                borders: CELL_NO_BORDER,
                width: { size: convertMillimetersToTwip(5), type: WidthType.DXA },
                children: [
                  new Paragraph({
                    spacing: { before: 15, after: 15 },
                    children: [new TextRun({ text: ':', font: FONT_NAME, size: BODY_SIZE })],
                  }),
                ],
              }),
              new TableCell({
                borders: CELL_NO_BORDER,
                width: { size: convertMillimetersToTwip(107), type: WidthType.DXA },
                children: [
                  new Paragraph({
                    spacing: { before: 15, after: 15 },
                    children: [
                      new TextRun({ text: v, font: FONT_NAME, size: BODY_SIZE, bold: true }),
                    ],
                  }),
                ],
              }),
            ],
          })
      );
      out.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_BORDERS,
          rows,
        }),
        new Paragraph({ spacing: { before: 80, after: 0 }, children: [] })
      );
      break;
    }

    case 'n2Header': {
      out.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_BORDERS,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: CELL_NO_BORDER,
                  width: { size: 55, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      spacing: { before: 20, after: 20 },
                      children: [
                        new TextRun({ text: 'Perihal : ', font: FONT_NAME, size: BODY_SIZE }),
                        new TextRun({
                          text: block.perihal,
                          font: FONT_NAME,
                          size: BODY_SIZE,
                          bold: true,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  borders: CELL_NO_BORDER,
                  width: { size: 45, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      spacing: { before: 20, after: 20 },
                      children: [
                        new TextRun({ text: block.tempatTanggal, font: FONT_NAME, size: BODY_SIZE }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
      block.kepadaLines.forEach((line, idx) => {
        out.push(
          new Paragraph({
            spacing: { before: idx === 0 ? 120 : 15, after: 15 },
            children: [
              new TextRun({
                text: line,
                font: FONT_NAME,
                size: BODY_SIZE,
                bold: idx === 1,
              }),
            ],
          })
        );
      });
      break;
    }

    case 'title': {
      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: block.subtitle || block.nomor ? 30 : 100 },
          children: [
            new TextRun({
              text: block.text,
              font: FONT_NAME,
              size: TITLE_SIZE,
              bold: true,
              underline: { type: UnderlineType.SINGLE },
            }),
          ],
        })
      );
      if (block.subtitle) {
        out.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: block.nomor ? 30 : 100 },
            children: [
              new TextRun({
                text: block.subtitle,
                font: FONT_NAME,
                size: BODY_SIZE,
                bold: true,
              }),
            ],
          })
        );
      }
      if (block.nomor) {
        out.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 100 },
            children: [
              new TextRun({
                text: block.nomor,
                font: FONT_NAME,
                size: BODY_SIZE,
              }),
            ],
          })
        );
      }
      break;
    }

    case 'paragraph': {
      out.push(
        new Paragraph({
          alignment: mapAlign(block.align),
          indent: block.indent ? { firstLine: convertMillimetersToTwip(10) } : undefined,
          spacing: {
            before: (block.spaceBefore ?? 2) * 28,
            after: (block.spaceAfter ?? 2) * 28,
            line: 270,
          },
          children: [
            new TextRun({
              text: block.text,
              font: FONT_NAME,
              size: BODY_SIZE,
              bold: block.bold,
              italics: block.italic,
            }),
          ],
        })
      );
      break;
    }

    case 'kvTable': {
      const labelMm = block.labelWidthMm ?? 56;
      const valueMm = Math.max(80, 168 - labelMm - 5);
      const rows = block.rows.map(
        (r) =>
          new TableRow({
            children: [
              new TableCell({
                borders: CELL_NO_BORDER,
                width: { size: convertMillimetersToTwip(labelMm), type: WidthType.DXA },
                children: [
                  new Paragraph({
                    spacing: { before: 16, after: 16, line: 250 },
                    children: [new TextRun({ text: r.label, font: FONT_NAME, size: BODY_SIZE })],
                  }),
                ],
              }),
              new TableCell({
                borders: CELL_NO_BORDER,
                width: { size: convertMillimetersToTwip(5), type: WidthType.DXA },
                children: [
                  new Paragraph({
                    spacing: { before: 16, after: 16, line: 250 },
                    children: [new TextRun({ text: ':', font: FONT_NAME, size: BODY_SIZE })],
                  }),
                ],
              }),
              new TableCell({
                borders: CELL_NO_BORDER,
                width: { size: convertMillimetersToTwip(valueMm), type: WidthType.DXA },
                children: [
                  new Paragraph({
                    spacing: { before: 16, after: 16, line: 250 },
                    children: [new TextRun({ text: r.value, font: FONT_NAME, size: BODY_SIZE })],
                  }),
                ],
              }),
            ],
          })
      );
      out.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_BORDERS,
          rows,
        })
      );
      break;
    }

    case 'numberedList': {
      block.items.forEach((item, idx) => {
        out.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            indent: {
              left: convertMillimetersToTwip(8),
              hanging: convertMillimetersToTwip(5),
            },
            spacing: { before: 24, after: 24, line: 265 },
            children: [
              new TextRun({
                text: `${idx + 1}.  `,
                font: FONT_NAME,
                size: BODY_SIZE,
              }),
              new TextRun({
                text: item,
                font: FONT_NAME,
                size: BODY_SIZE,
              }),
            ],
          })
        );
      });
      break;
    }

    case 'signatures': {
      if (block.dateLine) {
        out.push(
          new Paragraph({
            alignment: block.dateAlign === 'center' ? AlignmentType.CENTER : AlignmentType.RIGHT,
            spacing: { before: 120, after: 80 },
            children: [
              new TextRun({ text: block.dateLine, font: FONT_NAME, size: BODY_SIZE }),
            ],
          })
        );
      }

      const isSingleRight = block.columns.length === 1;
      const cells: TableCell[] = [];

      if (isSingleRight) {
        cells.push(
          new TableCell({
            borders: CELL_NO_BORDER,
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [] })],
          })
        );
      }

      block.columns.forEach((col) => {
        const colChildren: Paragraph[] = [];
        if (col.topLabel) {
          colChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 20, after: 20 },
              children: [new TextRun({ text: col.topLabel, font: FONT_NAME, size: BODY_SIZE })],
            })
          );
        }
        col.role.split('\n').forEach((roleLine) => {
          colChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 15, after: 15 },
              children: [new TextRun({ text: roleLine, font: FONT_NAME, size: BODY_SIZE })],
            })
          );
        });

        if (col.materai) {
          colChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 220, after: 220 },
              children: [
                new TextRun({
                  text: '[ Materai Rp10.000 ]',
                  font: FONT_NAME,
                  size: SMALL_SIZE,
                  italics: true,
                  color: '555555',
                }),
              ],
            })
          );
        } else {
          colChildren.push(
            new Paragraph({
              spacing: { before: 460, after: 0 },
              children: [],
            })
          );
        }

        colChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 20, after: 15 },
            children: [
              new TextRun({
                text: col.name,
                font: FONT_NAME,
                size: BODY_SIZE,
                bold: true,
                underline: { type: UnderlineType.SINGLE },
              }),
            ],
          })
        );

        if (col.subInfo) {
          colChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 10, after: 10 },
              children: [new TextRun({ text: col.subInfo, font: FONT_NAME, size: SMALL_SIZE })],
            })
          );
        }

        cells.push(
          new TableCell({
            borders: CELL_NO_BORDER,
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: colChildren,
          })
        );
      });

      out.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_BORDERS,
          rows: [new TableRow({ children: cells })],
        })
      );
      break;
    }
  }

  return out;
}

export async function exportSpecsToDocx(
  specs: DocumentSpec[],
  fileName: string
): Promise<void> {
  const children: (Paragraph | Table)[] = [];

  specs.forEach((spec, specIdx) => {
    if (specIdx > 0) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }
    spec.blocks.forEach((block) => {
      children.push(...renderBlockToDocx(block));
    });
  });

  // Strict A4 Size: 210mm x 297mm
  const doc = new Document({
    creator: 'Form Daftar Nikah (form-daftar-nikah.vercel.app)',
    title: fileName,
    description: 'Berkas Pemberkasan Nikah KUA & Desa Format A4',
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertMillimetersToTwip(210),
              height: convertMillimetersToTwip(297),
            },
            margin: {
              top: convertMillimetersToTwip(16),
              bottom: convertMillimetersToTwip(16),
              left: convertMillimetersToTwip(22),
              right: convertMillimetersToTwip(20),
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = fileName.endsWith('.docx') ? fileName : `${fileName}.docx`;
  saveAs(blob, safeName);
}
