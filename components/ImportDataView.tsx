'use client';

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Download,
  RotateCcw,
  ArrowRight,
  HelpCircle,
  Check,
} from 'lucide-react';
import { useVoterStore } from '@/lib/store-context';
import { Gender } from '@/lib/types';

interface RawImportRow {
  rowNum: number;
  epicNo: string;
  name: string;
  fatherName: string;
  motherName: string;
  spouseName: string;
  age: number | null;
  rawAge: string;
  gender: string;
  phone: string;
  partNo: number | null;
  rawPartNo: string;
  houseNo: string;
  address: string;
}

function splitCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result.map((cell) => cell.replace(/^"|"$/g, '').trim());
}

function normalizeHeader(header: string): string {
  return header.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function parsePartNumber(raw: string): number | null {
  const cleaned = raw.trim();
  if (!cleaned) return 1;
  const direct = Number(cleaned);
  if (Number.isFinite(direct)) return Math.round(direct);
  const prefixMatch = cleaned.match(/^(?:ps|part(?:\s*no\.?)?|booth(?:\s*no\.?)?)[\s\-:#._]*(\d+)$/i);
  if (prefixMatch) {
    const n = Number(prefixMatch[1]);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  const taggedMatch = cleaned.match(/^(?:(?:ps|part|booth)[\s\-:#._]*)?(\d+)(?:\b|[\s\-–—(])/i);
  if (taggedMatch) {
    const n = Number(taggedMatch[1]);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  return null;
}

const TEMPLATE_HEADERS = [
  'EPIC_NO',
  'VOTER_NAME',
  'FATHER_NAME',
  'MOTHER_NAME',
  'SPOUSE_NAME',
  'AGE',
  'GENDER',
  'PHONE',
  'PART_NO',
  'HOUSE_NO',
  'ADDRESS',
];

function parseMatrixToRows(rows: string[][]): RawImportRow[] {
  const nonEmptyRows = rows.filter((r) => r.some((cell) => cell.trim().length > 0));
  if (nonEmptyRows.length <= 1) return [];

  const headerCols = nonEmptyRows[0].map(normalizeHeader);
  const findCol = (aliases: string[]) => headerCols.findIndex((h) => aliases.includes(h));

  const hasKnownHeaders =
    findCol(['EPICNO', 'EPIC', 'EPICNUMBER', 'VOTERID']) >= 0 ||
    findCol(['VOTERNAME', 'VOTERNAMEEN', 'NAME', 'FULLNAME']) >= 0;

  const isExtendedPositional = !hasKnownHeaders && nonEmptyRows[1].length >= 11;

  const idxMap = hasKnownHeaders
    ? {
        epicNo: findCol(['EPICNO', 'EPIC', 'EPICNUMBER', 'VOTERID']),
        name: findCol(['VOTERNAME', 'VOTERNAMEEN', 'NAME', 'FULLNAME']),
        fatherName: findCol(['FATHERNAME', 'FATHERNAMEEN', 'FATHER']),
        motherName: findCol(['MOTHERNAME', 'MOTHERNAMEEN', 'MOTHER']),
        spouseName: findCol(['SPOUSENAME', 'SPOUSENAMEEN', 'SPOUSE', 'HUSBANDNAME', 'WIFENAME', 'HUSBANDWIFE']),
        age: findCol(['AGE', 'AGEASONJAN1']),
        gender: findCol(['GENDER', 'GENDERCODE', 'SEX']),
        phone: findCol(['PHONE', 'PHONENO', 'MOBILENO', 'MOBILE', 'CONTACT']),
        partNo: findCol(['PARTNO', 'PARTNUMBER', 'ROLLPARTNO', 'PART', 'BOOTHNO', 'BOOTH', 'PSNO', 'PS', 'POLLINGSTATIONNO', 'POLLINGSTATION']),
        houseNo: findCol(['HOUSENO', 'HOUSENUMBER', 'HNO', 'HOUSE']),
        address: findCol(['ADDRESS', 'HOUSEADDRESS', 'LOCALITY', 'LEIKAI']),
      }
    : isExtendedPositional
    ? {
        epicNo: 0,
        name: 1,
        fatherName: 2,
        motherName: 3,
        spouseName: 4,
        age: 5,
        gender: 6,
        phone: 7,
        partNo: 8,
        houseNo: 9,
        address: 10,
      }
    : {
        epicNo: 0,
        name: 1,
        fatherName: 2,
        motherName: 3,
        spouseName: -1,
        age: 4,
        gender: 5,
        phone: 6,
        partNo: 7,
        houseNo: -1,
        address: 8,
      };

  return nonEmptyRows.slice(1).map((cols, idx) => {
    const getVal = (colIdx: number) => (colIdx >= 0 && colIdx < cols.length ? cols[colIdx].trim() : '');

    const rawAge = getVal(idxMap.age);
    const parsedAge = rawAge === '' ? 18 : Number(rawAge);
    const rawPartNo = getVal(idxMap.partNo);
    const parsedPartNo = parsePartNumber(rawPartNo);

    return {
      rowNum: idx + 1,
      epicNo: getVal(idxMap.epicNo).toUpperCase(),
      name: getVal(idxMap.name),
      fatherName: getVal(idxMap.fatherName),
      motherName: getVal(idxMap.motherName),
      spouseName: getVal(idxMap.spouseName),
      age: Number.isFinite(parsedAge) ? Math.round(parsedAge) : null,
      rawAge,
      gender: (getVal(idxMap.gender) || 'M').toUpperCase(),
      phone: getVal(idxMap.phone) || '9862000000',
      partNo: parsedPartNo,
      rawPartNo,
      houseNo: getVal(idxMap.houseNo),
      address: getVal(idxMap.address) || 'Thoubal Leikai',
    };
  });
}

export default function ImportDataView() {
  const {
    voters,
    villageParts,
    families,
    importBatches,
    unassignedImports,
    currentUser,
    commitImportBatch,
    rollbackImportBatch,
    allocateUnassignedRecord,
  } = useVoterStore();

  const [fileName, setFileName] = useState<string>('');
  const [rawRows, setRawRows] = useState<RawImportRow[]>([]);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [selectedVpForUnassigned, setSelectedVpForUnassigned] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState<string>('');
  const [sheetGrids, setSheetGrids] = useState<Record<string, string[][]>>({});
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheetName, setActiveSheetName] = useState<string>('');

  const existingEpics = useMemo(() => new Set(voters.map((v) => v.epicNo)), [voters]);
  const vpByPartNo = useMemo(() => new Map(villageParts.map((vp) => [vp.partNo, vp])), [villageParts]);

  const validationResult = useMemo(() => {
    const valid: {
      row: RawImportRow;
      vpId: string;
      villageId: string;
      psId: string;
      familyId: string;
    }[] = [];
    const errors: { rowNum: number; epicNo: string; name: string; reasons: string[] }[] = [];
    const unassigned: {
      rowNum: number;
      epicNo: string;
      name: string;
      fatherName: string;
      motherName: string;
      spouseName?: string;
      houseNo?: string;
      age: number;
      gender: Gender;
      rawAddress: string;
      rawPartNo: number;
      reason: string;
    }[] = [];

    const seenEpicsInBatch = new Set<string>();

    for (const r of rawRows) {
      const rowErrors: string[] = [];

      if (!/^[A-Z]{3}[0-9]{7}$/.test(r.epicNo)) {
        rowErrors.push('Invalid EPIC format (requires 3 uppercase letters and 7 digits)');
      }
      if (existingEpics.has(r.epicNo) || seenEpicsInBatch.has(r.epicNo)) {
        rowErrors.push('Duplicate EPIC number already exists in electoral roll');
      }
      if (r.age === null || !Number.isFinite(r.age)) {
        rowErrors.push(`Invalid age value "${r.rawAge || 'empty'}" (must be a number 18 or older)`);
      } else if (r.age < 18) {
        rowErrors.push(`Underage voter (Age ${r.age} is under 18, flagged as data issue)`);
      }
      if (!['M', 'F', 'O'].includes(r.gender)) {
        rowErrors.push(`Invalid gender value "${r.gender}" (allowed: M, F, O)`);
      }
      if (!r.name.trim() || !r.fatherName.trim()) {
        rowErrors.push('Missing required name or father name');
      }

      seenEpicsInBatch.add(r.epicNo);

      if (rowErrors.length > 0) {
        errors.push({ rowNum: r.rowNum, epicNo: r.epicNo, name: r.name, reasons: rowErrors });
        continue;
      }

      const safeAge = r.age !== null && Number.isFinite(r.age) ? r.age : 18;
      const safePartNo = r.partNo !== null && Number.isFinite(r.partNo) ? r.partNo : 0;
      const vp = safePartNo > 0 ? vpByPartNo.get(safePartNo) : undefined;
      if (!vp) {
        unassigned.push({
          rowNum: r.rowNum,
          epicNo: r.epicNo,
          name: r.name,
          fatherName: r.fatherName,
          motherName: r.motherName,
          spouseName: r.spouseName || undefined,
          houseNo: r.houseNo || undefined,
          age: safeAge,
          gender: r.gender as Gender,
          rawAddress: r.address,
          rawPartNo: safePartNo,
          reason: `Part no. ${r.rawPartNo || safePartNo} not found in AC-31 polling station mapping`,
        });
        continue;
      }

      const trimmedHouseNo = r.houseNo.trim();
      const fam = trimmedHouseNo
        ? families.find(
            (f) => f.villagePartId === vp.id && f.address.toLowerCase().includes(trimmedHouseNo.toLowerCase())
          )
        : families.find((f) => f.villagePartId === vp.id);
      const houseSlug = trimmedHouseNo ? trimmedHouseNo.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
      const targetFamilyId = fam
        ? fam.id
        : houseSlug
        ? `fam-${vp.partNo}-${houseSlug}`
        : `fam-part-${vp.partNo}`;
      valid.push({
        row: r,
        vpId: vp.id,
        villageId: vp.villageId,
        psId: vp.pollingStationId,
        familyId: targetFamilyId,
      });
    }

    return { valid, errors, unassigned };
  }, [rawRows, existingEpics, vpByPartNo, families]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setFileName(file.name);
    setUploadError('');

    try {
      const isExcel = /\.(xlsx|xls|xlsm|xlsb)$/i.test(file.name);

      if (isExcel) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        if (workbook.SheetNames.length === 0) {
          setUploadError('The Excel workbook has no readable worksheets.');
          return;
        }

        const grids: Record<string, string[][]> = {};
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) continue;
          const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
            header: 1,
            defval: '',
            raw: false,
          });
          grids[sheetName] = matrix.map((row) =>
            Array.isArray(row) ? row.map((cell) => String(cell ?? '').trim()) : []
          );
        }

        const firstPopulatedSheet =
          workbook.SheetNames.find((name) => parseMatrixToRows(grids[name] || []).length > 0) ||
          workbook.SheetNames[0];

        const parsed = parseMatrixToRows(grids[firstPopulatedSheet] || []);
        if (parsed.length === 0) {
          setUploadError('No voter rows found beneath the header row in the selected Excel sheet.');
          return;
        }

        setSheetGrids(grids);
        setSheetNames(workbook.SheetNames);
        setActiveSheetName(firstPopulatedSheet);
        setRawRows(parsed);
        setStep('preview');
      } else {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        const matrix = lines.map(splitCsvRow);
        const parsed = parseMatrixToRows(matrix);
        if (parsed.length === 0) {
          setUploadError('No voter rows found beneath the header row in the CSV file.');
          return;
        }

        setSheetGrids({});
        setSheetNames([]);
        setActiveSheetName('');
        setRawRows(parsed);
        setStep('preview');
      }
    } catch {
      setUploadError('Could not read the uploaded file. Please upload a valid .xlsx, .xls, or .csv file.');
    }
  };

  const handleSelectWorksheet = (sheetName: string) => {
    setActiveSheetName(sheetName);
    const parsed = parseMatrixToRows(sheetGrids[sheetName] || []);
    setRawRows(parsed);
  };

  const handleDownloadCsvTemplate = () => {
    const csv = `${TEMPLATE_HEADERS.join(',')}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AC31_Voter_Roll_Import_Template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadExcelTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
    XLSX.utils.book_append_sheet(wb, ws, 'Voters');
    XLSX.writeFile(wb, 'AC31_Voter_Roll_Import_Template.xlsx');
  };

  const handleDownloadErrorReport = () => {
    const header = ['RowNumber,EPIC_No,Voter_Name,Validation_Errors'];
    const lines = validationResult.errors.map(
      (err) => `${err.rowNum},${err.epicNo},"${err.name}","${err.reasons.join('; ')}"`
    );
    const blob = new Blob([[...header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AC31_Import_Validation_Errors_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmImport = () => {
    if (validationResult.valid.length === 0 && validationResult.unassigned.length === 0) return;

    const newVotersPayload = validationResult.valid.map((v, idx) => {
      const trimmedHouseNo = v.row.houseNo.trim();
      const formattedAddress =
        trimmedHouseNo && !v.row.address.toLowerCase().includes(trimmedHouseNo.toLowerCase())
          ? `${trimmedHouseNo}, ${v.row.address}`
          : v.row.address;
      return {
        epicNo: v.row.epicNo,
        name: v.row.name,
        fatherName: v.row.fatherName,
        motherName: v.row.motherName,
        spouseName: v.row.spouseName.trim() || undefined,
        houseNo: trimmedHouseNo || undefined,
        age: v.row.age !== null && Number.isFinite(v.row.age) ? v.row.age : 18,
        gender: v.row.gender as Gender,
        phone: v.row.phone,
        familyId: v.familyId,
        partNo: v.row.partNo !== null && Number.isFinite(v.row.partNo) ? v.row.partNo : 1,
        serialNo: voters.length + idx + 1,
        villageId: v.villageId,
        villagePartId: v.vpId,
        pollingStationId: v.psId,
        addressId: formattedAddress,
        status: 'New' as const,
        tags: ['Imported Batch'],
        assignedWorkerId: currentUser?.id || 'usr-super-admin',
      };
    });

    const unassignedPayload = validationResult.unassigned.map((u) => ({
      epicNo: u.epicNo,
      name: u.name,
      fatherName: u.fatherName,
      motherName: u.motherName,
      spouseName: u.spouseName,
      houseNo: u.houseNo,
      age: u.age,
      gender: u.gender,
      rawAddress: u.rawAddress,
      rawPartNo: u.rawPartNo,
      reason: u.reason,
    }));

    commitImportBatch(fileName, newVotersPayload, unassignedPayload, validationResult.errors.length);
  };

  return (
    <div className="space-y-6">
      {/* Header & Pipeline Stepper */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
            Electoral roll import
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Validates EPIC format, removes duplicates, allocates stations by part number, and tracks rollback batches.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-zinc-800/80 p-1">
          {(['upload', 'mapping', 'preview'] as const).map((s, idx) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                step === s
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              {idx + 1}. {s === 'upload' ? 'Upload file' : s === 'mapping' ? 'Column mapping' : 'Validation preview'}
            </button>
          ))}
        </div>
      </div>

      {/* Step 1: File Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-8 sm:p-10 text-center space-y-4">
            <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Upload className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Upload electoral roll CSV or Excel (.xlsx) file
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-2xl mx-auto">
                Include the 11 standard columns below in your CSV or Excel header row, including{' '}
                <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">SPOUSE_NAME</span> and{' '}
                <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">HOUSE_NO</span>.
              </p>
            </div>
            {uploadError && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">{uploadError}</p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Choose CSV or Excel file</span>
                <input
                  type="file"
                  accept=".csv,.txt,.xlsx,.xls,.xlsm,.xlsb"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={handleDownloadExcelTemplate}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Excel (.xlsx) template</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadCsvTemplate}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>CSV template</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                  Required column headers (CSV &amp; Excel)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Ensure row 1 uses these column headers before processing. Spouse and house number are matched by header name or 11-column order.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 tabular-nums">
                11 columns
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:gap-px bg-slate-100 dark:bg-zinc-800">
              {[
                { header: 'EPIC_NO', label: 'EPIC ID', note: 'Required · 3 letters + 7 digits', highlight: false },
                { header: 'VOTER_NAME', label: 'Voter Name', note: 'Required · Full elector name', highlight: false },
                { header: 'FATHER_NAME', label: 'Father Name', note: 'Required · Father full name', highlight: false },
                { header: 'MOTHER_NAME', label: 'Mother Name', note: 'Mother full name', highlight: false },
                {
                  header: 'SPOUSE_NAME',
                  label: 'Spouse Name',
                  note: 'Aliases: SPOUSE, HUSBAND_NAME, WIFE_NAME',
                  highlight: true,
                },
                { header: 'AGE', label: 'Age', note: 'Required · Minimum 18', highlight: false },
                { header: 'GENDER', label: 'Gender', note: 'Required · M, F, or O', highlight: false },
                { header: 'PHONE', label: 'Phone', note: '10-digit mobile (masked in UI)', highlight: false },
                { header: 'PART_NO', label: 'Part No.', note: 'Required · e.g. 1 or PS-1 (maps to station)', highlight: false },
                {
                  header: 'HOUSE_NO',
                  label: 'House Number',
                  note: 'Aliases: HOUSE_NUMBER, H_NO, HOUSE',
                  highlight: true,
                },
                { header: 'ADDRESS', label: 'Address', note: 'Locality / Leikai street address', highlight: false },
              ].map((col, idx) => (
                <div
                  key={col.header}
                  className={`px-4 py-3 flex items-start justify-between gap-3 ${
                    col.highlight
                      ? 'bg-blue-50/50 dark:bg-blue-950/20'
                      : 'bg-white dark:bg-zinc-900'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-900 dark:text-zinc-100">
                        {col.header}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">
                      {col.note}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] shrink-0 font-medium ${
                      col.highlight
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    {col.label}
                  </span>
                </div>
              ))}
              <div className="hidden lg:block bg-white dark:bg-zinc-900" aria-hidden="true" />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 'mapping' && (
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Standard ECI roll column mapping
            </h2>
            <button
              type="button"
              onClick={() => setStep('preview')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap"
            >
              <span>Validation preview</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 text-xs">
            {[
              { src: 'EPIC_NO', dest: 'epicNo (3 letters and 7 digits, unique)' },
              { src: 'VOTER_NAME', dest: 'name (required)' },
              { src: 'FATHER_NAME', dest: 'fatherName (required)' },
              { src: 'MOTHER_NAME', dest: 'motherName' },
              { src: 'SPOUSE_NAME', dest: 'spouseName (optional spouse or close relation)' },
              { src: 'AGE', dest: 'age (minimum 18)' },
              { src: 'GENDER', dest: 'gender (M, F, or O)' },
              { src: 'PHONE', dest: 'phone (masked in UI by default)' },
              { src: 'PART_NO', dest: 'partNo (maps to village part and polling station)' },
              { src: 'HOUSE_NO', dest: 'houseNo (house number for household grouping)' },
              { src: 'ADDRESS', dest: 'addressId (street / leikai address)' },
            ].map((item) => (
              <div key={item.src} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono font-semibold text-slate-800 dark:text-zinc-200">{item.src}</span>
                <span className="text-slate-600 dark:text-zinc-400">{item.dest}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Validation Preview, Dedupe & Confirm */}
      {step === 'preview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Active file</span>
              <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mt-1 truncate">
                {fileName || 'No file loaded'}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-400 dark:text-zinc-500 tabular-nums">
                  {rawRows.length} rows parsed
                </span>
                {sheetNames.length > 1 && (
                  <select
                    value={activeSheetName}
                    onChange={(e) => handleSelectWorksheet(e.target.value)}
                    aria-label="Select Excel worksheet"
                    className="rounded border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 px-1.5 py-0.5 text-[11px] text-slate-700 dark:text-zinc-300"
                  >
                    {sheetNames.map((name) => (
                      <option key={name} value={name}>
                        Sheet: {name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Ready to import</span>
              <div className="text-2xl font-semibold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
                {validationResult.valid.length}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Allocated to station</span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Unassigned queue</span>
              <div className="text-2xl font-semibold text-amber-700 dark:text-amber-400 mt-1 tabular-nums">
                {validationResult.unassigned.length}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Needs station mapping</span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">Validation errors</span>
              <div className="text-2xl font-semibold text-red-600 dark:text-red-400 mt-1 tabular-nums">
                {validationResult.errors.length}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Invalid EPIC, age, or duplicate</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Validation and station allocation preview
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Valid rows are imported with status New and assigned a rollback Batch ID.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {validationResult.errors.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadErrorReport}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/50 whitespace-nowrap"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Error report ({validationResult.errors.length})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={validationResult.valid.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 whitespace-nowrap"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Confirm import ({validationResult.valid.length})</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400">
                    <th className="py-2.5 px-4 font-medium">Row</th>
                    <th className="py-2.5 px-3 font-medium">EPIC no.</th>
                    <th className="py-2.5 px-3 font-medium">Voter name</th>
                    <th className="py-2.5 px-3 font-medium">Father name</th>
                    <th className="py-2.5 px-3 font-medium">Spouse</th>
                    <th className="py-2.5 px-3 font-medium">House no.</th>
                    <th className="py-2.5 px-2 text-right font-medium">Age</th>
                    <th className="py-2.5 px-2 text-center font-medium">Sex</th>
                    <th className="py-2.5 px-3 font-medium">Roll part</th>
                    <th className="py-2.5 px-4 font-medium">Validation result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {rawRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500 dark:text-zinc-400">
                        Upload a CSV or Excel (.xlsx) file in step 1 to preview row validation.
                      </td>
                    </tr>
                  ) : (
                    rawRows.map((r) => {
                      const err = validationResult.errors.find((e) => e.rowNum === r.rowNum);
                      const unass = validationResult.unassigned.find((u) => u.rowNum === r.rowNum);
                      const vp = r.partNo !== null && Number.isFinite(r.partNo) ? vpByPartNo.get(r.partNo) : undefined;

                      return (
                        <tr key={r.rowNum} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                          <td className="py-2.5 px-4 font-mono text-slate-500 dark:text-zinc-400 tabular-nums">
                            #{r.rowNum}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-zinc-100">
                            {r.epicNo}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-zinc-100">{r.name}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">{r.fatherName}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">
                            {r.spouseName || <span className="text-slate-300 dark:text-zinc-600">-</span>}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-zinc-300">
                            {r.houseNo || <span className="text-slate-300 dark:text-zinc-600">-</span>}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-700 dark:text-zinc-300 tabular-nums">
                            {r.age !== null && Number.isFinite(r.age) ? r.age : r.rawAge || '-'}
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-600 dark:text-zinc-400">{r.gender}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-zinc-300">
                            Part {r.partNo !== null && Number.isFinite(r.partNo) ? r.partNo : r.rawPartNo || '-'}
                          </td>
                          <td className="py-2.5 px-4">
                            {err ? (
                              <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
                                <XCircle className="h-3.5 w-3.5 shrink-0" />
                                <span>{err.reasons.join(' · ')}</span>
                              </span>
                            ) : unass ? (
                              <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                                <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                                <span>Unassigned: {unass.reason}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                <span>
                                  Valid · PS-{vp?.partNo ?? '-'} ({vp?.name ?? 'Unknown'})
                                </span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Unassigned Queue Section */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
            Unassigned import queue ({unassignedImports.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Records without a mapped part number remain here until allocated to a polling station.
          </p>
        </div>
        {unassignedImports.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-zinc-400">
            All imported records are allocated to a village part and polling station.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
            {unassignedImports.map((u) => (
              <div key={u.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">{u.epicNo}</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100">{u.name}</span>
                    <span className="text-slate-500 dark:text-zinc-400">
                      Age {Number.isFinite(u.age) ? u.age : 18}, {u.gender} · Father: {u.fatherName}
                      {u.spouseName ? ` · Spouse: ${u.spouseName}` : ''}
                    </span>
                  </div>
                  <p className="text-amber-700 dark:text-amber-400">
                    {u.houseNo ? `${u.houseNo} · ` : ''}
                    {u.rawAddress} · {u.reason}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedVpForUnassigned[u.id] || ''}
                    onChange={(e) =>
                      setSelectedVpForUnassigned((prev) => ({ ...prev, [u.id]: e.target.value }))
                    }
                    className="rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-200"
                  >
                    <option value="">Select village part and station...</option>
                    {villageParts.map((vp) => (
                      <option key={vp.id} value={vp.id}>
                        {vp.name} (PS-{vp.partNo})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedVpForUnassigned[u.id]}
                    onClick={() => allocateUnassignedRecord(u.id, selectedVpForUnassigned[u.id])}
                    className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 whitespace-nowrap"
                  >
                    Allocate station
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import Batch History & Rollback */}
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
            Import batch history
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Each import receives a Batch ID so incorrect uploads can be rolled back cleanly.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 text-slate-500 dark:text-zinc-400">
                <th className="py-2.5 px-4 font-medium">Batch ID</th>
                <th className="py-2.5 px-3 font-medium">File name</th>
                <th className="py-2.5 px-2.5 text-right font-medium">Total</th>
                <th className="py-2.5 px-2.5 text-right font-medium">Imported</th>
                <th className="py-2.5 px-2.5 text-right font-medium">Unassigned</th>
                <th className="py-2.5 px-2.5 text-right font-medium">Errors</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 px-3 font-medium">Date</th>
                <th className="py-2.5 px-4 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {importBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 dark:text-zinc-400">
                    No import batches recorded yet.
                  </td>
                </tr>
              ) : (
                importBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-800 dark:text-zinc-200">{b.id}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-zinc-100">{b.fileName}</td>
                    <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-slate-700 dark:text-zinc-300">
                      {b.totalRows}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                      {b.validRows}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-amber-700 dark:text-amber-400 tabular-nums">
                      {b.unassignedRows}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-red-600 dark:text-red-400 tabular-nums">
                      {b.errorRows}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[11px] font-medium ${
                          b.status === 'Completed'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-zinc-500 line-through'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-400 font-mono tabular-nums whitespace-nowrap">
                      {new Date(b.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      {b.status === 'Completed' && b.id !== 'batch-master-2026' ? (
                        <button
                          type="button"
                          onClick={() => rollbackImportBatch(b.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-2.5 py-1 text-[11px] font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/50"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Rollback</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-zinc-500 text-[11px]">
                          {b.id === 'batch-master-2026' ? 'Base roll locked' : 'Rolled back'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
