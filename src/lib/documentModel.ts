import {
  type BerkasNikahData,
  type DocumentTypeId,
  type ParentBiodata,
  type PersonBiodata,
  formatTanggalIndonesia,
  formatTtl,
} from '../types/berkas';

export type PartyTarget = 'pria' | 'wanita';

export type DocBlock =
  | {
      type: 'lampiranHeader';
      lines: string[];
      modelCode: string;
    }
  | {
      type: 'kopDesa';
      kabupaten: string;
      kecamatan: string;
      desaLine: string;
      alamat: string;
    }
  | {
      type: 'wilayahBox';
      rows: [string, string][];
    }
  | {
      type: 'n2Header';
      perihal: string;
      tempatTanggal: string;
      kepadaLines: string[];
    }
  | {
      type: 'title';
      text: string;
      subtitle?: string;
      nomor?: string;
    }
  | {
      type: 'paragraph';
      text: string;
      bold?: boolean;
      italic?: boolean;
      align?: 'left' | 'center' | 'right' | 'justify';
      indent?: boolean;
      spaceBefore?: number;
      spaceAfter?: number;
    }
  | {
      type: 'kvTable';
      rows: { label: string; value: string; indent?: boolean }[];
      labelWidthMm?: number;
    }
  | {
      type: 'numberedList';
      items: string[];
    }
  | {
      type: 'signatures';
      dateLine?: string;
      dateAlign?: 'right' | 'center';
      columns: {
        topLabel?: string;
        role: string;
        materai?: boolean;
        name: string;
        subInfo?: string;
      }[];
    };

export interface DocumentSpec {
  id: DocumentTypeId;
  fileSlug: string;
  displayTitle: string;
  party?: PartyTarget;
  blocks: DocBlock[];
}

function val(s?: string, fallback = '........................................'): string {
  const trimmed = (s || '').trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function parentNameWithStatus(p: ParentBiodata): string {
  const base = val(p.namaLengkap);
  if (p.statusHidup === 'Almarhum') return `${base} (Alm.)`;
  if (p.statusHidup === 'Almarhumah') return `${base} (Almh.)`;
  return base;
}

function formatStatusN1(person: PersonBiodata): string {
  const status = (person.statusPerkawinan || '').trim();
  if (!status) return '-';
  if (person.jenisKelamin === 'Laki-laki') {
    if (status.toLowerCase().includes('beristri') && person.istriKe) {
      return `Beristri (istri ke-${person.istriKe})`;
    }
    return status;
  }
  return status;
}

function getTempatTanggal(data: BerkasNikahData): string {
  const tempat = val(data.desa.tempatSurat || data.desa.desa || data.desa.kabupaten, '....................');
  const tanggal = formatTanggalIndonesia(data.desa.tanggalSurat);
  return `${tempat}, ${tanggal}`;
}

function getJabatanFull(data: BerkasNikahData): string {
  const jabatan = (data.desa.jabatanPejabat || '').trim();
  const wilayah = data.desa.jenisWilayah || 'Desa';
  const desa = (data.desa.desa || '').trim();
  if (jabatan) {
    if (desa && !jabatan.toLowerCase().includes(desa.toLowerCase())) {
      return `${jabatan} ${desa}`;
    }
    return jabatan;
  }
  return desa ? `Kepala ${wilayah} ${desa}` : `Kepala ${wilayah}`;
}

export function buildDocumentSpec(
  data: BerkasNikahData,
  docId: DocumentTypeId,
  partyOverride?: PartyTarget
): DocumentSpec {
  const defaultParty: PartyTarget =
    data.desa.pihakPengaju === 'pria' ? 'pria' : 'wanita';
  const party: PartyTarget = partyOverride || defaultParty;

  const targetCatin = party === 'pria' ? data.catinPria : data.catinWanita;
  const partnerCatin = party === 'pria' ? data.catinWanita : data.catinPria;
  const targetAyah = party === 'pria' ? data.ayahPria : data.ayahWanita;
  const targetIbu = party === 'pria' ? data.ibuPria : data.ibuWanita;
  const tempatTanggal = getTempatTanggal(data);
  const jabatanPejabat = getJabatanFull(data);
  const nipLine = data.desa.nipPejabat?.trim() ? `NIP. ${data.desa.nipPejabat.trim()}` : undefined;
  const kuaName = val(
    data.desa.namaKua || (data.desa.kecamatan ? `KUA Kecamatan ${data.desa.kecamatan}` : ''),
    'KUA Kecamatan ........................'
  );

  switch (docId) {
    case 'n1': {
      const partyLabel = party === 'pria' ? 'Catin Pria' : 'Catin Wanita';
      const statusDetail =
        targetCatin.jenisKelamin === 'Laki-laki'
          ? `Laki-laki : ${formatStatusN1(targetCatin)}`
          : `Perempuan : ${formatStatusN1(targetCatin)}`;

      return {
        id: 'n1',
        fileSlug: `Form_N1_Pengantar_Nikah_${partyLabel.replace(/\s+/g, '_')}`,
        displayTitle: `Form N1 — Pengantar Nikah (${partyLabel})`,
        party,
        blocks: [
          {
            type: 'lampiranHeader',
            lines: [
              'Lampiran IV',
              'Kepdirjen Bimas Islam Nomor 473 Tahun 2020',
              'FORMULIR PENGANTAR NIKAH',
            ],
            modelCode: 'Model N1',
          },
          {
            type: 'wilayahBox',
            rows: [
              [`KANTOR ${data.desa.jenisWilayah.toUpperCase()}`, val(data.desa.desa, '........................').toUpperCase()],
              ['KECAMATAN', val(data.desa.kecamatan, '........................').toUpperCase()],
              ['KABUPATEN / KOTA', val(data.desa.kabupaten, '........................').toUpperCase()],
            ],
          },
          {
            type: 'title',
            text: 'PENGANTAR NIKAH',
            nomor: `Nomor : ${val(data.desa.nomorN1, '474.2 /        / 2026')}`,
          },
          {
            type: 'paragraph',
            text: 'Yang bertanda tangan di bawah ini menjelaskan dengan sesungguhnya bahwa:',
            spaceBefore: 4,
            spaceAfter: 3,
          },
          {
            type: 'kvTable',
            labelWidthMm: 60,
            rows: [
              { label: '1. Nama', value: val(targetCatin.namaLengkap) },
              { label: '2. Nomor Induk Kependudukan (NIK)', value: val(targetCatin.nik) },
              { label: '3. Jenis Kelamin', value: targetCatin.jenisKelamin },
              { label: '4. Tempat dan Tanggal Lahir', value: formatTtl(targetCatin.tempatLahir, targetCatin.tanggalLahir) },
              { label: '5. Kewarganegaraan', value: val(targetCatin.kewarganegaraan, 'Indonesia') },
              { label: '6. Agama', value: val(targetCatin.agama, 'Islam') },
              { label: '7. Pekerjaan', value: val(targetCatin.pekerjaan) },
              { label: '8. Alamat', value: val(targetCatin.alamat) },
              { label: '9. Status Perkawinan', value: statusDetail },
              {
                label: '10. Nama Istri / Suami Terdahulu',
                value: targetCatin.namaPasanganSebelumnya?.trim() || '-',
              },
            ],
          },
          {
            type: 'paragraph',
            text: 'Adalah benar anak dari perkawinan seorang pria:',
            spaceBefore: 4,
            spaceAfter: 2,
          },
          {
            type: 'kvTable',
            labelWidthMm: 60,
            rows: [
              { label: 'Nama lengkap dan alias', value: parentNameWithStatus(targetAyah) },
              { label: 'Nomor Induk Kependudukan (NIK)', value: val(targetAyah.nik, '-') },
              { label: 'Tempat dan tanggal lahir', value: formatTtl(targetAyah.tempatLahir, targetAyah.tanggalLahir) },
              { label: 'Kewarganegaraan', value: val(targetAyah.kewarganegaraan, 'Indonesia') },
              { label: 'Agama', value: val(targetAyah.agama, 'Islam') },
              { label: 'Pekerjaan', value: val(targetAyah.pekerjaan, '-') },
              { label: 'Alamat', value: val(targetAyah.alamat, '-') },
            ],
          },
          {
            type: 'paragraph',
            text: 'dengan seorang wanita:',
            spaceBefore: 4,
            spaceAfter: 2,
          },
          {
            type: 'kvTable',
            labelWidthMm: 60,
            rows: [
              { label: 'Nama lengkap dan alias', value: parentNameWithStatus(targetIbu) },
              { label: 'Nomor Induk Kependudukan (NIK)', value: val(targetIbu.nik, '-') },
              { label: 'Tempat dan tanggal lahir', value: formatTtl(targetIbu.tempatLahir, targetIbu.tanggalLahir) },
              { label: 'Kewarganegaraan', value: val(targetIbu.kewarganegaraan, 'Indonesia') },
              { label: 'Agama', value: val(targetIbu.agama, 'Islam') },
              { label: 'Pekerjaan', value: val(targetIbu.pekerjaan, '-') },
              { label: 'Alamat', value: val(targetIbu.alamat, '-') },
            ],
          },
          {
            type: 'paragraph',
            text: 'Demikian surat pengantar ini dibuat dengan mengingat sumpah jabatan dan untuk dipergunakan sebagaimana mestinya.',
            align: 'justify',
            indent: true,
            spaceBefore: 5,
            spaceAfter: 6,
          },
          {
            type: 'signatures',
            columns: [
              {
                topLabel: tempatTanggal,
                role: jabatanPejabat,
                name: val(data.desa.namaKepalaDesa, '........................................'),
                subInfo: nipLine,
              },
            ],
          },
        ],
      };
    }

    case 'n2': {
      const jadwal = `${val(data.rencanaNikah.hariNikah, '............')}, ${formatTanggalIndonesia(
        data.rencanaNikah.tanggalNikah
      )} / Pukul ${val(data.rencanaNikah.jamNikah, '09.00 WIB')}`;
      const lokasi = [data.rencanaNikah.tempatAkad, data.rencanaNikah.alamatAkad]
        .filter((x) => x && x.trim())
        .join(' — ');
      const pemohonNama =
        data.desa.pihakPengaju === 'pria'
          ? val(data.catinPria.namaLengkap)
          : val(data.catinWanita.namaLengkap || data.catinPria.namaLengkap);

      return {
        id: 'n2',
        fileSlug: 'Form_N2_Permohonan_Kehendak_Nikah',
        displayTitle: 'Form N2 — Permohonan Kehendak Nikah',
        blocks: [
          {
            type: 'lampiranHeader',
            lines: [
              'Lampiran V',
              'Kepdirjen Bimas Islam Nomor 473 Tahun 2020',
              'FORMULIR PERMOHONAN KEHENDAK NIKAH',
            ],
            modelCode: 'Model N2',
          },
          {
            type: 'n2Header',
            perihal: 'Permohonan Kehendak Nikah',
            tempatTanggal,
            kepadaLines: [
              'Kepada Yth.',
              `Kepala ${kuaName}`,
              data.desa.kabupaten ? `Kabupaten ${data.desa.kabupaten}` : 'di Tempat',
            ],
          },
          {
            type: 'paragraph',
            text: 'Dengan hormat, kami mengajukan permohonan kehendak nikah untuk atas nama:',
            spaceBefore: 6,
            spaceAfter: 4,
          },
          {
            type: 'kvTable',
            labelWidthMm: 52,
            rows: [
              { label: 'Calon Suami', value: val(data.catinPria.namaLengkap) },
              { label: 'Calon Istri', value: val(data.catinWanita.namaLengkap) },
              { label: 'Hari / Tanggal / Jam', value: jadwal },
              { label: 'Tempat Akad Nikah', value: lokasi || '........................................' },
              {
                label: 'Maskawin (Mahar)',
                value: data.rencanaNikah.maskawin
                  ? `${data.rencanaNikah.maskawin} (${data.rencanaNikah.pembayarMaskawin})`
                  : '-',
              },
            ],
          },
          {
            type: 'paragraph',
            text: 'Bersama ini kami sampaikan surat-surat yang diperlukan untuk diperiksa sebagai berikut:',
            spaceBefore: 6,
            spaceAfter: 3,
          },
          {
            type: 'numberedList',
            items: [
              'Surat pengantar nikah dari Desa/Kelurahan (Model N1)',
              'Surat persetujuan calon pengantin (Model N4)',
              'Surat izin orang tua (Model N5) bagi calon pengantin berusia di bawah 21 tahun',
              'Fotokopi KTP, Kartu Keluarga (KK), dan Akta Kelahiran / Ijazah kedua calon pengantin',
              'Surat Pernyataan Pertanggungjawaban Mutlak (SPTJM) pemeriksaan berkas catin',
              'Surat Pernyataan Belum Pernah Menikah / Surat Keterangan Status Perkawinan',
              'Surat Keterangan Wali Nikah dari Desa/Kelurahan',
              'Surat Kuasa pendaftaran nikah (apabila dikuasakan) & Pasfoto 2x3 (4 lbr), 4x6 (2 lbr)',
            ],
          },
          {
            type: 'paragraph',
            text: 'Demikian permohonan ini kami sampaikan, kiranya dapat diperiksa, dihadiri, dan dicatat sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.',
            align: 'justify',
            indent: true,
            spaceBefore: 6,
            spaceAfter: 8,
          },
          {
            type: 'signatures',
            columns: [
              {
                topLabel: 'Diterima tanggal ..............................',
                role: `Yang menerima,\nKepala ${kuaName} / Penghulu`,
                name: '................................................',
                subInfo: 'NIP. ..........................................',
              },
              {
                topLabel: 'Wassalam,',
                role: 'Pemohon,',
                name: pemohonNama,
              },
            ],
          },
        ],
      };
    }

    case 'n4': {
      return {
        id: 'n4',
        fileSlug: 'Form_N4_Persetujuan_Calon_Pengantin',
        displayTitle: 'Form N4 — Persetujuan Calon Pengantin',
        blocks: [
          {
            type: 'lampiranHeader',
            lines: [
              'Lampiran VI',
              'Kepdirjen Bimas Islam Nomor 473 Tahun 2020',
              'FORMULIR PERSETUJUAN CALON PENGANTIN',
            ],
            modelCode: 'Model N4',
          },
          {
            type: 'title',
            text: 'SURAT PERSETUJUAN PENGANTIN',
          },
          {
            type: 'paragraph',
            text: 'Yang bertanda tangan di bawah ini:',
            spaceBefore: 4,
            spaceAfter: 2,
          },
          {
            type: 'paragraph',
            text: 'A. Calon Suami:',
            bold: true,
            spaceBefore: 3,
            spaceAfter: 2,
          },
          {
            type: 'kvTable',
            labelWidthMm: 58,
            rows: [
              { label: '1. Nama lengkap dan alias', value: val(data.catinPria.namaLengkap) },
              { label: '2. Bin', value: val(data.catinPria.binBinti || data.ayahPria.namaLengkap) },
              { label: '3. Nomor Induk Kependudukan (NIK)', value: val(data.catinPria.nik) },
              { label: '4. Tempat dan tanggal lahir', value: formatTtl(data.catinPria.tempatLahir, data.catinPria.tanggalLahir) },
              { label: '5. Kewarganegaraan', value: val(data.catinPria.kewarganegaraan, 'Indonesia') },
              { label: '6. Agama', value: val(data.catinPria.agama, 'Islam') },
              { label: '7. Pekerjaan', value: val(data.catinPria.pekerjaan) },
              { label: '8. Alamat', value: val(data.catinPria.alamat) },
            ],
          },
          {
            type: 'paragraph',
            text: 'B. Calon Istri:',
            bold: true,
            spaceBefore: 5,
            spaceAfter: 2,
          },
          {
            type: 'kvTable',
            labelWidthMm: 58,
            rows: [
              { label: '1. Nama lengkap dan alias', value: val(data.catinWanita.namaLengkap) },
              { label: '2. Binti', value: val(data.catinWanita.binBinti || data.ayahWanita.namaLengkap) },
              { label: '3. Nomor Induk Kependudukan (NIK)', value: val(data.catinWanita.nik) },
              { label: '4. Tempat dan tanggal lahir', value: formatTtl(data.catinWanita.tempatLahir, data.catinWanita.tanggalLahir) },
              { label: '5. Kewarganegaraan', value: val(data.catinWanita.kewarganegaraan, 'Indonesia') },
              { label: '6. Agama', value: val(data.catinWanita.agama, 'Islam') },
              { label: '7. Pekerjaan', value: val(data.catinWanita.pekerjaan) },
              { label: '8. Alamat', value: val(data.catinWanita.alamat) },
            ],
          },
          {
            type: 'paragraph',
            text: 'Menyatakan dengan sesungguhnya bahwa atas dasar sukarela, dengan kesadaran sendiri, tanpa ada paksaan dari siapapun juga, setuju untuk melangsungkan pernikahan.',
            align: 'justify',
            indent: true,
            spaceBefore: 5,
            spaceAfter: 3,
          },
          {
            type: 'paragraph',
            text: 'Demikian surat persetujuan ini dibuat untuk digunakan seperlunya.',
            indent: true,
            spaceBefore: 2,
            spaceAfter: 6,
          },
          {
            type: 'signatures',
            dateLine: tempatTanggal,
            dateAlign: 'right',
            columns: [
              {
                role: 'Calon Suami,',
                name: val(data.catinPria.namaLengkap),
              },
              {
                role: 'Calon Istri,',
                name: val(data.catinWanita.namaLengkap),
              },
            ],
          },
        ],
      };
    }

    case 'n5': {
      const partyLabel = party === 'pria' ? 'Catin Pria' : 'Catin Wanita';
      const binLabelChild = party === 'pria' ? 'Bin' : 'Binti';
      const binLabelPartner = party === 'pria' ? 'Binti' : 'Bin';
      const partnerAyah = party === 'pria' ? data.ayahWanita : data.ayahPria;

      return {
        id: 'n5',
        fileSlug: `Form_N5_Izin_Orang_Tua_${partyLabel.replace(/\s+/g, '_')}`,
        displayTitle: `Form N5 — Surat Izin Orang Tua (${partyLabel})`,
        party,
        blocks: [
          {
            type: 'lampiranHeader',
            lines: [
              'Lampiran VII',
              'Kepdirjen Bimas Islam Nomor 473 Tahun 2020',
              'FORMULIR SURAT IZIN ORANG TUA',
            ],
            modelCode: 'Model N5',
          },
          {
            type: 'title',
            text: 'SURAT IZIN ORANG TUA',
          },
          {
            type: 'paragraph',
            text: 'Yang bertanda tangan di bawah ini:',
            spaceBefore: 3,
            spaceAfter: 2,
          },
          {
            type: 'kvTable',
            labelWidthMm: 56,
            rows: [
              { label: 'A. 1. Nama lengkap dan alias', value: parentNameWithStatus(targetAyah) },
              { label: '    2. Bin', value: val(targetAyah.binBinti, '-') },
              { label: '    3. Nomor Induk Kependudukan (NIK)', value: val(targetAyah.nik, '-') },
              { label: '    4. Tempat dan tanggal lahir', value: formatTtl(targetAyah.tempatLahir, targetAyah.tanggalLahir) },
              { label: '    5. Kewarganegaraan / Agama', value: `${val(targetAyah.kewarganegaraan, 'Indonesia')} / ${val(targetAyah.agama, 'Islam')}` },
              { label: '    6. Pekerjaan', value: val(targetAyah.pekerjaan, '-') },
              { label: '    7. Alamat', value: val(targetAyah.alamat, '-') },
            ],
          },
          {
            type: 'kvTable',
            labelWidthMm: 56,
            rows: [
              { label: 'B. 1. Nama lengkap dan alias', value: parentNameWithStatus(targetIbu) },
              { label: '    2. Binti', value: val(targetIbu.binBinti, '-') },
              { label: '    3. Nomor Induk Kependudukan (NIK)', value: val(targetIbu.nik, '-') },
              { label: '    4. Tempat dan tanggal lahir', value: formatTtl(targetIbu.tempatLahir, targetIbu.tanggalLahir) },
              { label: '    5. Kewarganegaraan / Agama', value: `${val(targetIbu.kewarganegaraan, 'Indonesia')} / ${val(targetIbu.agama, 'Islam')}` },
              { label: '    6. Pekerjaan', value: val(targetIbu.pekerjaan, '-') },
              { label: '    7. Alamat', value: val(targetIbu.alamat, '-') },
            ],
          },
          {
            type: 'paragraph',
            text: 'adalah ayah dan ibu kandung / wali / pengampu dari:',
            spaceBefore: 3,
            spaceAfter: 2,
          },
          {
            type: 'kvTable',
            labelWidthMm: 56,
            rows: [
              { label: '1. Nama lengkap dan alias', value: val(targetCatin.namaLengkap) },
              { label: `2. ${binLabelChild}`, value: val(targetCatin.binBinti || targetAyah.namaLengkap) },
              { label: '3. Nomor Induk Kependudukan (NIK)', value: val(targetCatin.nik) },
              { label: '4. Tempat dan tanggal lahir', value: formatTtl(targetCatin.tempatLahir, targetCatin.tanggalLahir) },
              { label: '5. Kewarganegaraan / Agama', value: `${val(targetCatin.kewarganegaraan, 'Indonesia')} / ${val(targetCatin.agama, 'Islam')}` },
              { label: '6. Pekerjaan / Alamat', value: `${val(targetCatin.pekerjaan)} — ${val(targetCatin.alamat)}` },
            ],
          },
          {
            type: 'paragraph',
            text: 'memberikan izin kepada anak kami untuk melakukan pernikahan dengan:',
            spaceBefore: 3,
            spaceAfter: 2,
          },
          {
            type: 'kvTable',
            labelWidthMm: 56,
            rows: [
              { label: '1. Nama lengkap dan alias', value: val(partnerCatin.namaLengkap) },
              { label: `2. ${binLabelPartner}`, value: val(partnerCatin.binBinti || partnerAyah.namaLengkap) },
              { label: '3. Nomor Induk Kependudukan (NIK)', value: val(partnerCatin.nik) },
              { label: '4. Tempat dan tanggal lahir', value: formatTtl(partnerCatin.tempatLahir, partnerCatin.tanggalLahir) },
              { label: '5. Kewarganegaraan / Agama', value: `${val(partnerCatin.kewarganegaraan, 'Indonesia')} / ${val(partnerCatin.agama, 'Islam')}` },
              { label: '6. Pekerjaan / Alamat', value: `${val(partnerCatin.pekerjaan)} — ${val(partnerCatin.alamat)}` },
            ],
          },
          {
            type: 'paragraph',
            text: 'Demikian surat izin ini dibuat dengan kesadaran tanpa ada paksaan dari siapapun dan untuk digunakan seperlunya.',
            align: 'justify',
            indent: true,
            spaceBefore: 4,
            spaceAfter: 5,
          },
          {
            type: 'signatures',
            dateLine: tempatTanggal,
            dateAlign: 'right',
            columns: [
              {
                role: 'Ayah / Wali / Pengampu,',
                name: parentNameWithStatus(targetAyah),
              },
              {
                role: 'Ibu / Wali / Pengampu,',
                name: parentNameWithStatus(targetIbu),
              },
            ],
          },
        ],
      };
    }

    case 'sptjm': {
      const isPria = data.sptjm.pemohon === 'Catin Pria';
      const pemohon = isPria ? data.catinPria : data.catinWanita;
      const pasangan = isPria ? data.catinWanita : data.catinPria;

      return {
        id: 'sptjm',
        fileSlug: 'SPTJM_Pemeriksaan_Berkas_Catin',
        displayTitle: 'Surat Pertanggungjawaban Mutlak (SPTJM)',
        blocks: [
          {
            type: 'title',
            text: 'SURAT PERNYATAAN PERTANGGUNGJAWABAN MUTLAK (SPTJM)',
            subtitle: 'DALAM PEMERIKSAAN BERKAS CALON PENGANTIN',
          },
          {
            type: 'paragraph',
            text: 'Yang bertanda tangan di bawah ini:',
            spaceBefore: 6,
            spaceAfter: 3,
          },
          {
            type: 'kvTable',
            labelWidthMm: 52,
            rows: [
              { label: 'Nama Lengkap', value: val(pemohon.namaLengkap) },
              { label: 'NIK', value: val(pemohon.nik) },
              { label: 'Jenis Kelamin', value: pemohon.jenisKelamin },
              { label: 'Tempat / Tanggal Lahir', value: formatTtl(pemohon.tempatLahir, pemohon.tanggalLahir) },
              { label: 'Kewarganegaraan / Agama', value: `${val(pemohon.kewarganegaraan, 'Indonesia')} / ${val(pemohon.agama, 'Islam')}` },
              { label: 'Pekerjaan', value: val(pemohon.pekerjaan) },
              { label: 'Alamat', value: val(pemohon.alamat) },
            ],
          },
          {
            type: 'paragraph',
            text: `Sehubungan dengan pengajuan dan pemeriksaan berkas kehendak nikah saya dengan calon pasangan saya (${pasangan.jenisKelamin === 'Laki-laki' ? 'Calon Suami' : 'Calon Istri'}):`,
            spaceBefore: 5,
            spaceAfter: 3,
          },
          {
            type: 'kvTable',
            labelWidthMm: 52,
            rows: [
              { label: 'Nama Calon Pasangan', value: val(pasangan.namaLengkap) },
              { label: 'NIK Calon Pasangan', value: val(pasangan.nik) },
              { label: 'Tempat / Tanggal Lahir', value: formatTtl(pasangan.tempatLahir, pasangan.tanggalLahir) },
              { label: 'Alamat', value: val(pasangan.alamat) },
            ],
          },
          {
            type: 'paragraph',
            text: `Dengan ini saya menyatakan dengan sesungguhnya dan penuh tanggung jawab di hadapan Kepala ${kuaName} bahwa:`,
            align: 'justify',
            spaceBefore: 5,
            spaceAfter: 3,
          },
          {
            type: 'numberedList',
            items: [
              'Seluruh data diri dan berkas persyaratan nikah yang saya serahkan (KTP, Kartu Keluarga, Akta Kelahiran/Ijazah, Formulir N1–N5, Surat Keterangan Status Perkawinan, serta Surat Keterangan Wali Nikah) adalah benar, sah, dan sesuai dengan fakta hukum yang sebenarnya.',
              'Tidak terdapat halangan perkawinan baik menurut hukum Islam maupun peraturan perundang-undangan yang berlaku di Negara Kesatuan Republik Indonesia.',
              `Apabila di kemudian hari terbukti bahwa data, keterangan, dan/atau dokumen yang saya sampaikan tidak benar atau palsu, maka saya bersedia bertanggung jawab secara mutlak secara perdata maupun pidana serta membebaskan Kepala ${kuaName}, Penghulu, dan seluruh petugas dari segala tuntutan hukum.`,
            ],
          },
          {
            type: 'paragraph',
            text: 'Demikian Surat Pernyataan Pertanggungjawaban Mutlak (SPTJM) ini saya buat dengan sebenarnya dalam keadaan sadar dan tanpa paksaan dari pihak manapun.',
            align: 'justify',
            indent: true,
            spaceBefore: 5,
            spaceAfter: 6,
          },
          {
            type: 'signatures',
            columns: [
              {
                topLabel: tempatTanggal,
                role: 'Yang Membuat Pernyataan,',
                materai: true,
                name: val(pemohon.namaLengkap),
              },
            ],
          },
          {
            type: 'paragraph',
            text: 'Saksi-Saksi:',
            bold: true,
            spaceBefore: 4,
            spaceAfter: 2,
          },
          {
            type: 'signatures',
            columns: [
              {
                role: 'Saksi I,',
                name: val(data.sptjm.saksi1Nama, '........................................'),
                subInfo: data.sptjm.saksi1Nik ? `NIK. ${data.sptjm.saksi1Nik}` : undefined,
              },
              {
                role: 'Saksi II,',
                name: val(data.sptjm.saksi2Nama, '........................................'),
                subInfo: data.sptjm.saksi2Nik ? `NIK. ${data.sptjm.saksi2Nik}` : undefined,
              },
            ],
          },
        ],
      };
    }

    case 'kuasa': {
      const pemberiIsPria = data.suratKuasa.pemberiKuasa === 'Catin Pria';
      const pemberiBoth = data.suratKuasa.pemberiKuasa === 'Keduanya';
      const pemberiPrimary = pemberiIsPria ? data.catinPria : data.catinWanita;

      const pemberiRows: { label: string; value: string }[] = pemberiBoth
        ? [
            { label: '1. Nama Calon Suami', value: `${val(data.catinPria.namaLengkap)} (NIK: ${val(data.catinPria.nik, '-')})` },
            { label: '    TTL / Pekerjaan', value: `${formatTtl(data.catinPria.tempatLahir, data.catinPria.tanggalLahir)} / ${val(data.catinPria.pekerjaan)}` },
            { label: '    Alamat', value: val(data.catinPria.alamat) },
            { label: '2. Nama Calon Istri', value: `${val(data.catinWanita.namaLengkap)} (NIK: ${val(data.catinWanita.nik, '-')})` },
            { label: '    TTL / Pekerjaan', value: `${formatTtl(data.catinWanita.tempatLahir, data.catinWanita.tanggalLahir)} / ${val(data.catinWanita.pekerjaan)}` },
            { label: '    Alamat', value: val(data.catinWanita.alamat) },
          ]
        : [
            { label: 'Nama Lengkap', value: val(pemberiPrimary.namaLengkap) },
            { label: 'NIK', value: val(pemberiPrimary.nik) },
            { label: 'Tempat / Tanggal Lahir', value: formatTtl(pemberiPrimary.tempatLahir, pemberiPrimary.tanggalLahir) },
            { label: 'Pekerjaan', value: val(pemberiPrimary.pekerjaan) },
            { label: 'Alamat', value: val(pemberiPrimary.alamat) },
          ];

      const pemberiSignName = pemberiBoth
        ? `${val(data.catinPria.namaLengkap)} & ${val(data.catinWanita.namaLengkap)}`
        : val(pemberiPrimary.namaLengkap);

      return {
        id: 'kuasa',
        fileSlug: 'Surat_Kuasa_Pengurusan_Nikah',
        displayTitle: 'Surat Kuasa Pendaftaran Nikah',
        blocks: [
          {
            type: 'title',
            text: 'SURAT KUASA',
          },
          {
            type: 'paragraph',
            text: 'Yang bertanda tangan di bawah ini:',
            spaceBefore: 6,
            spaceAfter: 3,
          },
          {
            type: 'kvTable',
            labelWidthMm: 50,
            rows: pemberiRows,
          },
          {
            type: 'paragraph',
            text: 'Selanjutnya disebut sebagai PEMBERI KUASA.',
            bold: true,
            spaceBefore: 3,
            spaceAfter: 4,
          },
          {
            type: 'paragraph',
            text: 'Dengan ini memberikan kuasa penuh kepada:',
            spaceBefore: 2,
            spaceAfter: 3,
          },
          {
            type: 'kvTable',
            labelWidthMm: 50,
            rows: [
              { label: 'Nama Lengkap', value: val(data.suratKuasa.penerimaNama) },
              { label: 'NIK', value: val(data.suratKuasa.penerimaNik) },
              { label: 'Tempat / Tanggal Lahir', value: formatTtl(data.suratKuasa.penerimaTempatLahir, data.suratKuasa.penerimaTanggalLahir) },
              { label: 'Pekerjaan', value: val(data.suratKuasa.penerimaPekerjaan) },
              { label: 'Hubungan Keluarga / Status', value: val(data.suratKuasa.penerimaHubungan) },
              { label: 'Alamat', value: val(data.suratKuasa.penerimaAlamat) },
            ],
          },
          {
            type: 'paragraph',
            text: 'Selanjutnya disebut sebagai PENERIMA KUASA.',
            bold: true,
            spaceBefore: 3,
            spaceAfter: 5,
          },
          {
            type: 'paragraph',
            text: 'KHUSUS',
            bold: true,
            align: 'center',
            spaceBefore: 3,
            spaceAfter: 3,
          },
          {
            type: 'paragraph',
            text: `Bertindak untuk dan atas nama Pemberi Kuasa guna mengurus pendaftaran kehendak nikah antara ${val(
              data.catinPria.namaLengkap
            )} dengan ${val(data.catinWanita.namaLengkap)} pada ${kuaName}, yaitu: ${val(
              data.suratKuasa.keperluanKuasa,
              'mendaftarkan kehendak nikah, menyerahkan kelengkapan berkas persyaratan nikah, serta mengurus proses pemeriksaan berkas nikah sesuai ketentuan peraturan perundang-undangan.'
            )}`,
            align: 'justify',
            indent: true,
            spaceBefore: 2,
            spaceAfter: 4,
          },
          {
            type: 'paragraph',
            text: 'Demikian Surat Kuasa ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.',
            align: 'justify',
            indent: true,
            spaceBefore: 3,
            spaceAfter: 8,
          },
          {
            type: 'signatures',
            dateLine: tempatTanggal,
            dateAlign: 'right',
            columns: [
              {
                role: 'Penerima Kuasa,',
                name: val(data.suratKuasa.penerimaNama, '........................................'),
              },
              {
                role: 'Pemberi Kuasa,',
                materai: true,
                name: pemberiSignName,
              },
            ],
          },
        ],
      };
    }

    case 'belum_menikah': {
      const partyLabel = party === 'pria' ? 'Catin Pria' : 'Catin Wanita';
      const statusTerm = party === 'pria' ? 'Jejaka' : 'Perawan';
      const binLabel = party === 'pria' ? 'Bin' : 'Binti';

      return {
        id: 'belum_menikah',
        fileSlug: `Surat_Pernyataan_Belum_Menikah_${partyLabel.replace(/\s+/g, '_')}`,
        displayTitle: `Surat Pernyataan Belum Pernah Menikah (${partyLabel})`,
        party,
        blocks: [
          {
            type: 'title',
            text: 'SURAT PERNYATAAN BELUM PERNAH MENIKAH',
          },
          {
            type: 'paragraph',
            text: 'Yang bertanda tangan di bawah ini:',
            spaceBefore: 8,
            spaceAfter: 4,
          },
          {
            type: 'kvTable',
            labelWidthMm: 54,
            rows: [
              { label: 'Nama Lengkap', value: val(targetCatin.namaLengkap) },
              { label: binLabel, value: val(targetCatin.binBinti || targetAyah.namaLengkap) },
              { label: 'Nomor Induk Kependudukan (NIK)', value: val(targetCatin.nik) },
              { label: 'Jenis Kelamin', value: targetCatin.jenisKelamin },
              { label: 'Tempat / Tanggal Lahir', value: formatTtl(targetCatin.tempatLahir, targetCatin.tanggalLahir) },
              { label: 'Kewarganegaraan', value: val(targetCatin.kewarganegaraan, 'Indonesia') },
              { label: 'Agama', value: val(targetCatin.agama, 'Islam') },
              { label: 'Pekerjaan', value: val(targetCatin.pekerjaan) },
              { label: 'Status Perkawinan', value: targetCatin.statusPerkawinan || statusTerm },
              { label: 'Alamat', value: val(targetCatin.alamat) },
            ],
          },
          {
            type: 'paragraph',
            text: `Dengan ini menyatakan dengan sesungguhnya bahwa sampai dengan surat pernyataan ini dibuat, saya benar-benar berstatus ${
              targetCatin.statusPerkawinan || statusTerm
            } dan BELUM PERNAH MENIKAH dengan siapapun, baik secara hukum agama (nikah siri/di bawah tangan) maupun secara hukum negara yang tercatat di Kantor Urusan Agama (KUA) atau Dinas Kependudukan dan Pencatatan Sipil.`,
            align: 'justify',
            indent: true,
            spaceBefore: 6,
            spaceAfter: 4,
          },
          {
            type: 'paragraph',
            text: 'Apabila di kemudian hari ternyata pernyataan yang saya buat ini tidak benar, maka saya bersedia menerima segala konsekuensi dan tuntutan hukum sesuai peraturan perundang-undangan yang berlaku tanpa melibatkan Pemerintah Desa/Kelurahan maupun Kantor Urusan Agama (KUA).',
            align: 'justify',
            indent: true,
            spaceBefore: 2,
            spaceAfter: 4,
          },
          {
            type: 'paragraph',
            text: 'Demikian Surat Pernyataan Belum Pernah Menikah ini saya buat dengan sebenarnya dalam keadaan sadar dan tanpa paksaan dari pihak manapun untuk melengkapi persyaratan pendaftaran pernikahan.',
            align: 'justify',
            indent: true,
            spaceBefore: 2,
            spaceAfter: 10,
          },
          {
            type: 'signatures',
            columns: [
              {
                topLabel: 'Mengetahui,',
                role: jabatanPejabat,
                name: val(data.desa.namaKepalaDesa, '........................................'),
                subInfo: nipLine,
              },
              {
                topLabel: tempatTanggal,
                role: 'Yang Membuat Pernyataan,',
                materai: true,
                name: val(targetCatin.namaLengkap),
              },
            ],
          },
        ],
      };
    }

    case 'wali_nikah': {
      const wilayahUpper = data.desa.jenisWilayah.toUpperCase();
      return {
        id: 'wali_nikah',
        fileSlug: 'Surat_Keterangan_Wali_Nikah_Desa',
        displayTitle: 'Surat Keterangan Wali Nikah dari Desa',
        blocks: [
          {
            type: 'kopDesa',
            kabupaten: `PEMERINTAH KABUPATEN ${val(data.desa.kabupaten, '....................').toUpperCase()}`,
            kecamatan: `KECAMATAN ${val(data.desa.kecamatan, '....................').toUpperCase()}`,
            desaLine: `KANTOR ${wilayahUpper} ${val(data.desa.desa, '....................').toUpperCase()}`,
            alamat: val(
              data.desa.alamatKantorDesa,
              `Alamat: ${data.desa.jenisWilayah} ${data.desa.desa || '...'}, Kec. ${data.desa.kecamatan || '...'}, Kab. ${data.desa.kabupaten || '...'}`
            ),
          },
          {
            type: 'title',
            text: 'SURAT KETERANGAN WALI NIKAH',
            nomor: `Nomor : ${val(data.desa.nomorWali, '474.2 /        / 2026')}`,
          },
          {
            type: 'paragraph',
            text: `Yang bertanda tangan di bawah ini ${jabatanPejabat}, Kecamatan ${val(
              data.desa.kecamatan,
              '................'
            )}, Kabupaten ${val(data.desa.kabupaten, '................')}, menerangkan dengan sesungguhnya bahwa:`,
            align: 'justify',
            indent: true,
            spaceBefore: 4,
            spaceAfter: 3,
          },
          {
            type: 'kvTable',
            labelWidthMm: 54,
            rows: [
              { label: 'Nama Lengkap Wali', value: val(data.waliNikah.namaLengkap) },
              { label: 'Bin', value: val(data.waliNikah.bin, '-') },
              { label: 'Nomor Induk Kependudukan (NIK)', value: val(data.waliNikah.nik) },
              { label: 'Tempat / Tanggal Lahir', value: formatTtl(data.waliNikah.tempatLahir, data.waliNikah.tanggalLahir) },
              { label: 'Kewarganegaraan', value: val(data.waliNikah.kewarganegaraan, 'Indonesia') },
              { label: 'Agama', value: val(data.waliNikah.agama, 'Islam') },
              { label: 'Pekerjaan', value: val(data.waliNikah.pekerjaan) },
              { label: 'Alamat', value: val(data.waliNikah.alamat) },
              { label: 'Nomor Telepon / HP', value: val(data.waliNikah.nomorTelepon, '-') },
            ],
          },
          {
            type: 'paragraph',
            text: `Adalah benar-benar ${data.waliNikah.jenisWali} (${val(
              data.waliNikah.hubunganWali,
              'Ayah Kandung'
            )}) yang berhak dan sah menurut hukum Islam serta peraturan perundang-undangan untuk menjadi Wali Nikah dari seorang perempuan (Calon Pengantin Wanita):`,
            align: 'justify',
            spaceBefore: 4,
            spaceAfter: 3,
          },
          {
            type: 'kvTable',
            labelWidthMm: 54,
            rows: [
              { label: 'Nama Calon Pengantin Wanita', value: val(data.catinWanita.namaLengkap) },
              { label: 'Binti', value: val(data.catinWanita.binBinti || data.ayahWanita.namaLengkap) },
              { label: 'Nomor Induk Kependudukan (NIK)', value: val(data.catinWanita.nik) },
              { label: 'Tempat / Tanggal Lahir', value: formatTtl(data.catinWanita.tempatLahir, data.catinWanita.tanggalLahir) },
              { label: 'Agama / Pekerjaan', value: `${val(data.catinWanita.agama, 'Islam')} / ${val(data.catinWanita.pekerjaan)}` },
              { label: 'Alamat', value: val(data.catinWanita.alamat) },
            ],
          },
          {
            type: 'paragraph',
            text: `Keterangan / Sebab Perwalian: ${val(
              data.waliNikah.sebabWali,
              'Ayah Kandung Masih Hidup dan Memenuhi Syarat Wali Nikah'
            )}. Calon Pengantin Wanita tersebut akan melangsungkan pernikahan dengan seorang laki-laki bernama ${val(
              data.catinPria.namaLengkap
            )} bin ${val(data.catinPria.binBinti || data.ayahPria.namaLengkap)} pada ${kuaName}.`,
            align: 'justify',
            indent: true,
            spaceBefore: 4,
            spaceAfter: 3,
          },
          {
            type: 'paragraph',
            text: 'Demikian Surat Keterangan Wali Nikah ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.',
            align: 'justify',
            indent: true,
            spaceBefore: 2,
            spaceAfter: 6,
          },
          {
            type: 'signatures',
            columns: [
              {
                topLabel: ' ',
                role: 'Wali Nikah,',
                name: val(data.waliNikah.namaLengkap),
              },
              {
                topLabel: tempatTanggal,
                role: jabatanPejabat,
                name: val(data.desa.namaKepalaDesa, '........................................'),
                subInfo: nipLine,
              },
            ],
          },
        ],
      };
    }
  }
}

export function buildAllDocumentSpecs(
  data: BerkasNikahData,
  partyPreference?: PartyTarget
): DocumentSpec[] {
  const defaultParty: PartyTarget =
    partyPreference || (data.desa.pihakPengaju === 'pria' ? 'pria' : 'wanita');
  const includeBothParties = data.desa.pihakPengaju === 'keduanya';

  const specs: DocumentSpec[] = [];

  if (includeBothParties) {
    specs.push(buildDocumentSpec(data, 'n1', 'pria'));
    specs.push(buildDocumentSpec(data, 'n1', 'wanita'));
  } else {
    specs.push(buildDocumentSpec(data, 'n1', defaultParty));
  }

  specs.push(buildDocumentSpec(data, 'n2'));
  specs.push(buildDocumentSpec(data, 'n4'));

  if (includeBothParties) {
    specs.push(buildDocumentSpec(data, 'n5', 'pria'));
    specs.push(buildDocumentSpec(data, 'n5', 'wanita'));
  } else {
    specs.push(buildDocumentSpec(data, 'n5', defaultParty));
  }

  specs.push(buildDocumentSpec(data, 'sptjm'));
  specs.push(buildDocumentSpec(data, 'kuasa'));

  if (includeBothParties) {
    specs.push(buildDocumentSpec(data, 'belum_menikah', 'pria'));
    specs.push(buildDocumentSpec(data, 'belum_menikah', 'wanita'));
  } else {
    specs.push(buildDocumentSpec(data, 'belum_menikah', defaultParty));
  }

  specs.push(buildDocumentSpec(data, 'wali_nikah'));

  return specs;
}
