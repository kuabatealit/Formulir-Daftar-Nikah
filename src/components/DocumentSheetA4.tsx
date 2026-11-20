import type { DocBlock, DocumentSpec } from '../lib/documentModel';

interface Props {
  spec: DocumentSpec;
}

function renderBlock(block: DocBlock, idx: number) {
  switch (block.type) {
    case 'lampiranHeader':
      return (
        <div key={idx} className="text-right mb-3 text-[9.5pt] leading-[1.3]">
          {block.lines.map((line, i) => (
            <div key={i} className={i === block.lines.length - 1 ? 'font-bold' : ''}>
              {line}
            </div>
          ))}
          <div className="font-bold text-[11pt] mt-0.5">{block.modelCode}</div>
        </div>
      );

    case 'kopDesa':
      return (
        <div key={idx} className="text-center pb-2 mb-3 border-b-[3px] border-double border-black">
          <div className="text-[12pt] font-bold leading-tight">{block.kabupaten}</div>
          <div className="text-[12pt] font-bold leading-tight">{block.kecamatan}</div>
          <div className="text-[14pt] font-bold leading-tight mt-0.5">{block.desaLine}</div>
          <div className="text-[9.5pt] italic mt-0.5">{block.alamat}</div>
        </div>
      );

    case 'wilayahBox':
      return (
        <table key={idx} className="w-full mb-3 text-[11pt]">
          <tbody>
            {block.rows.map(([k, v], i) => (
              <tr key={i}>
                <td className="w-[54mm] align-top py-[0.5px]">{k}</td>
                <td className="w-[4mm] align-top py-[0.5px]">:</td>
                <td className="align-top py-[0.5px] font-bold">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case 'n2Header':
      return (
        <div key={idx} className="mb-3 text-[11pt]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span>Perihal : </span>
              <span className="font-bold">{block.perihal}</span>
            </div>
            <div className="text-right shrink-0">{block.tempatTanggal}</div>
          </div>
          <div className="mt-4 leading-[1.4]">
            {block.kepadaLines.map((line, i) => (
              <div key={i} className={i === 1 ? 'font-bold' : ''}>
                {line}
              </div>
            ))}
          </div>
        </div>
      );

    case 'title':
      return (
        <div key={idx} className="text-center my-2.5">
          <div className="text-[12.5pt] font-bold underline underline-offset-2 tracking-wide">
            {block.text}
          </div>
          {block.subtitle && (
            <div className="text-[11pt] font-bold mt-0.5">{block.subtitle}</div>
          )}
          {block.nomor && <div className="text-[11pt] mt-0.5">{block.nomor}</div>}
        </div>
      );

    case 'paragraph': {
      const alignClass =
        block.align === 'center'
          ? 'text-center'
          : block.align === 'right'
            ? 'text-right'
            : block.align === 'justify'
              ? 'text-justify'
              : 'text-left';

      return (
        <p
          key={idx}
          className={`${alignClass} ${block.bold ? 'font-bold' : ''} ${block.italic ? 'italic' : ''} ${
            block.indent ? 'indent-8' : ''
          }`}
          style={{
            marginTop: `${(block.spaceBefore ?? 1) * 1.1}mm`,
            marginBottom: `${(block.spaceAfter ?? 1) * 1.1}mm`,
          }}
        >
          {block.text}
        </p>
      );
    }

    case 'kvTable':
      return (
        <table key={idx} className="w-full text-[11pt] my-1">
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i}>
                <td
                  className="align-top py-[0.6px] whitespace-pre-wrap"
                  style={{ width: `${block.labelWidthMm ?? 56}mm` }}
                >
                  {row.label}
                </td>
                <td className="w-[4mm] align-top py-[0.6px]">:</td>
                <td className="align-top py-[0.6px]">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );

    case 'numberedList':
      return (
        <ol key={idx} className="list-decimal pl-6 space-y-1 text-justify text-[11pt] my-1.5">
          {block.items.map((item, i) => (
            <li key={i} className="pl-1">
              {item}
            </li>
          ))}
        </ol>
      );

    case 'signatures': {
      const isSingleRight = block.columns.length === 1;
      return (
        <div key={idx} className="mt-4 text-[11pt]">
          {block.dateLine && (
            <div
              className={`mb-2 ${
                block.dateAlign === 'center' ? 'text-center' : 'text-right pr-6'
              }`}
            >
              {block.dateLine}
            </div>
          )}
          <div className="grid grid-cols-2 gap-6">
            {isSingleRight && <div />}
            {block.columns.map((col, i) => (
              <div key={i} className="text-center flex flex-col items-center">
                {col.topLabel ? (
                  <div className="min-h-[18px]">{col.topLabel}</div>
                ) : (
                  block.columns.some((c) => c.topLabel) && <div className="min-h-[18px]">&nbsp;</div>
                )}
                <div className="whitespace-pre-line">{col.role}</div>

                {col.materai ? (
                  <div className="my-3 w-[28mm] h-[13mm] border border-dashed border-neutral-500 flex flex-col items-center justify-center text-[8.5pt] italic text-neutral-600 leading-tight">
                    <span>Materai</span>
                    <span>Rp10.000</span>
                  </div>
                ) : (
                  <div className="h-[18mm]" />
                )}

                <div className="font-bold underline underline-offset-2">{col.name}</div>
                {col.subInfo && <div className="text-[9.5pt] mt-0.5">{col.subInfo}</div>}
              </div>
            ))}
          </div>
        </div>
      );
    }
  }
}

export function DocumentSheetA4({ spec }: Props) {
  return (
    <article className="a4-paper" aria-label={spec.displayTitle}>
      {spec.blocks.map((block, idx) => renderBlock(block, idx))}
    </article>
  );
}
