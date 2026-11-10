'use client';

import React, { useState, useMemo } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
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
  spouseName?: string;
  age: number;
  gender: string;
  phone: string;
  partNo: number;
  address: string;
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

  const existingEpics = useMemo(() => new Set(voters.map((v) => v.epicNo)), [voters]);
  const vpByPartNo = useMemo(() => new Map(villageParts.map((vp) => [vp.partNo, vp])), [villageParts]);

  // Validate rows
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
        rowErrors.push('Invalid EPIC format (must be 3 uppercase letters + 7 digits)');
      }
      if (existingEpics.has(r.epicNo) || seenEpicsInBatch.has(r.epicNo)) {
        rowErrors.push('Duplicate EPIC number already exists in electoral roll');
      }
      if (r.age < 18) {
        rowErrors.push(`Underage voter (Age ${r.age} < 18 — Flagged as Upcoming Voter / Data Issue)`);
      }
      if (!['M', 'F', 'O'].includes(r.gender)) {
        rowErrors.push(`Invalid gender value "${r.gender}" (allowed: M, F, O)`);
      }
      if (!r.name.trim() || !r.fatherName.trim()) {
        rowErrors.push('Missing required Name or Father Name');
      }

      seenEpicsInBatch.add(r.epicNo);

      if (rowErrors.length > 0) {
        errors.push({ rowNum: r.rowNum, epicNo: r.epicNo, name: r.name, reasons: rowErrors });
        continue;
      }

      const vp = vpByPartNo.get(r.partNo);
      if (!vp) {
        unassigned.push({
          rowNum: r.rowNum,
          epicNo: r.epicNo,
          name: r.name,
          fatherName: r.fatherName,
          motherName: r.motherName,
          age: r.age,
          gender: r.gender as Gender,
          rawAddress: r.address,
          rawPartNo: r.partNo,
          reason: `Part No. ${r.partNo} not found in AC-31 Polling Station coverage mapping (PS 1–41)`,
        });
        continue;
      }

      const fam = families.find((f) => f.villagePartId === vp.id);
      const targetFamilyId = fam ? fam.id : `fam-part-${vp.partNo}`;
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = String(evt.target?.result || '');
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return;

      const parsed: RawImportRow[] = lines.slice(1).map((line, idx) => {
        const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
        return {
          rowNum: idx + 1,
          epicNo: (cols[0] || '').toUpperCase(),
          name: cols[1] || '',
          fatherName: cols[2] || '',
          motherName: cols[3] || '',
          age: Number(cols[4] || 18),
          gender: (cols[5] || 'M').toUpperCase(),
          phone: cols[6] || '9862000000',
          partNo: Number(cols[7] || 1),
          address: cols[8] || 'Thoubal Leikai',
        };
      });
      setRawRows(parsed);
      setStep('preview');
    };
    reader.readAsText(file);
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

    const newVotersPayload = validationResult.valid.map((v, idx) => ({
      epicNo: v.row.epicNo,
      name: v.row.name,
      fatherName: v.row.fatherName,
      motherName: v.row.motherName,
      spouseName: v.row.spouseName,
      age: v.row.age,
      gender: v.row.gender as Gender,
      phone: v.row.phone,
      familyId: v.familyId,
      partNo: v.row.partNo,
      serialNo: voters.length + idx + 1,
      villageId: v.villageId,
      villagePartId: v.vpId,
      pollingStationId: v.psId,
      addressId: v.row.address,
      status: 'New' as const,
      tags: ['Imported Batch'],
      assignedWorkerId: currentUser?.id || 'usr-super-admin',
    }));

    const unassignedPayload = validationResult.unassigned.map((u) => ({
      epicNo: u.epicNo,
      name: u.name,
      fatherName: u.fatherName,
      motherName: u.motherName,
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
      {/* Pipeline Stepper Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Electoral Roll Import Pipeline & Batch Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Validates EPIC format (3 letters + 7 digits), deduplicates, flags under-18 records, allocates Village & Polling Station from Part No., and supports full batch rollback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['upload', 'mapping', 'preview'] as const).map((s, idx) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                step === s ? 'bg-[#0071e3] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {idx + 1}. {s === 'upload' ? 'Upload Roll' : s === 'mapping' ? 'Column Mapping' : 'Validation & Dedupe'}
            </button>
          ))}
        </div>
      </div>

      {/* Step 1 / File Upload & Sample Loader */}
      {step === 'upload' && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-4">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0071e3]">
            <Upload className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Upload Electoral Roll CSV or Excel Export</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Expected columns: EPIC_NO, VOTER_NAME, FATHER_NAME, MOTHER_NAME, AGE, GENDER, PHONE, PART_NO, ADDRESS
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Choose CSV File</span>
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 'mapping' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Column Mapping Template (ECI Standard Electoral Roll)</h3>
            <button
              type="button"
              onClick={() => setStep('preview')}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-4 py-2 text-xs font-semibold text-white"
            >
              <span>Proceed to Validation Preview</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {[
              { src: 'EPIC_NO', dest: 'epicNo (3 Letters + 7 Digits, Unique)' },
              { src: 'VOTER_NAME_EN', dest: 'name (Required)' },
              { src: 'FATHER_NAME_EN', dest: 'fatherName (Required)' },
              { src: 'MOTHER_NAME_EN', dest: 'motherName' },
              { src: 'AGE_AS_ON_JAN1', dest: 'age (Must be >= 18)' },
              { src: 'GENDER_CODE', dest: 'gender (M / F / O)' },
              { src: 'ROLL_PART_NO', dest: 'partNo → Maps to Village Part & PS 1–41' },
              { src: 'HOUSE_ADDRESS', dest: 'addressId & Auto-Family Grouping' },
              { src: 'MOBILE_NO', dest: 'phone (Masked in UI)' },
            ].map((item) => (
              <div key={item.src} className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between">
                <span className="font-mono font-semibold text-slate-700">{item.src}</span>
                <span className="text-emerald-700 font-medium">→ {item.dest}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Validation Preview, Dedupe & Confirm */}
      {step === 'preview' && (
        <div className="space-y-5">
          {/* Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-xs text-slate-500">Active File</span>
              <div className="text-sm font-bold text-slate-900 mt-1 truncate">{fileName}</div>
              <span className="text-[11px] text-slate-400">{rawRows.length} Total Rows Parsed</span>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
              <span className="text-xs font-semibold text-emerald-800">Ready to Import (Status: New)</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{validationResult.valid.length}</div>
              <span className="text-[11px] text-emerald-600">Allocated to Village & PS 1–41</span>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
              <span className="text-xs font-semibold text-amber-800">Unassigned Queue (Unmapped Part)</span>
              <div className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">{validationResult.unassigned.length}</div>
              <span className="text-[11px] text-amber-600">Requires manual PS allocation</span>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50/40 p-4">
              <span className="text-xs font-semibold text-red-800">Validation Errors Rejected</span>
              <div className="text-2xl font-bold text-red-700 mt-1 tabular-nums">{validationResult.errors.length}</div>
              <span className="text-[11px] text-red-600">Invalid EPIC / Underage &lt;18 / Dedupe</span>
            </div>
          </div>

          {/* Preview Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Validation & Polling Station Allocation Preview</h3>
                <p className="text-xs text-slate-500">
                  Records passing validation receive status &ldquo;New&rdquo; and a rollback-capable Batch ID.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {validationResult.errors.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadErrorReport}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Error Report ({validationResult.errors.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={validationResult.valid.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
                >
                  <Check className="h-3.5 w-3.5" />
                  Confirm Import ({validationResult.valid.length} Valid Voters)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                    <th className="py-2.5 px-4">Row</th>
                    <th className="py-2.5 px-3">EPIC No.</th>
                    <th className="py-2.5 px-3">Voter Name</th>
                    <th className="py-2.5 px-3">Father&apos;s Name</th>
                    <th className="py-2.5 px-2 text-right">Age</th>
                    <th className="py-2.5 px-2 text-center">Sex</th>
                    <th className="py-2.5 px-3">Roll Part</th>
                    <th className="py-2.5 px-4">Validation & Station Allocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rawRows.map((r) => {
                    const err = validationResult.errors.find((e) => e.rowNum === r.rowNum);
                    const unass = validationResult.unassigned.find((u) => u.rowNum === r.rowNum);
                    const vp = vpByPartNo.get(r.partNo);

                    return (
                      <tr key={r.rowNum} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono text-slate-500">#{r.rowNum}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{r.epicNo}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{r.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{r.fatherName}</td>
                        <td className="py-2.5 px-2 text-right font-mono tabular-nums">{r.age}</td>
                        <td className="py-2.5 px-2 text-center">{r.gender}</td>
                        <td className="py-2.5 px-3 font-mono">Part {r.partNo}</td>
                        <td className="py-2.5 px-4">
                          {err ? (
                            <span className="inline-flex items-center gap-1 text-red-700 font-medium">
                              <XCircle className="h-3.5 w-3.5 shrink-0" />
                              {err.reasons.join(' · ')}
                            </span>
                          ) : unass ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                              <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                              Unassigned Queue: {unass.reason}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              Valid → Allocated to PS-{vp?.partNo} ({vp?.name})
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Unassigned Queue Section */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Unassigned Import Queue ({unassignedImports.length} Records Pending Station Allocation)
            </h3>
            <p className="text-xs text-slate-500">
              Records whose Part Number or address could not be automatically mapped cannot be verified until allocated to one of the 41 polling stations.
            </p>
          </div>
        </div>
        {unassignedImports.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            All imported records have been allocated to a Village Part and Polling Station.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {unassignedImports.map((u) => (
              <div key={u.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{u.epicNo}</span>
                    <span className="font-semibold text-slate-900">{u.name}</span>
                    <span className="text-slate-500">
                      (Age {u.age}, {u.gender} · Father: {u.fatherName})
                    </span>
                  </div>
                  <p className="text-amber-700">
                    Raw Address: {u.rawAddress} · {u.reason}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedVpForUnassigned[u.id] || ''}
                    onChange={(e) =>
                      setSelectedVpForUnassigned((prev) => ({ ...prev, [u.id]: e.target.value }))
                    }
                    className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                  >
                    <option value="">Select Village Part (Leikai) & PS...</option>
                    {villageParts.map((vp) => (
                      <option key={vp.id} value={vp.id}>
                        {vp.name} → PS-{vp.partNo}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedVpForUnassigned[u.id]}
                    onClick={() => allocateUnassignedRecord(u.id, selectedVpForUnassigned[u.id])}
                    className="rounded-full bg-[#0071e3] px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    Allocate to Station
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import Batch History & Rollback */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">Import Batch History & Rollback</h3>
          <p className="text-xs text-slate-500">
            Every import gets a unique Batch ID. Whole batches can be rolled back if an electoral roll file was uploaded in error.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                <th className="py-2.5 px-4">Batch ID</th>
                <th className="py-2.5 px-3">File Name</th>
                <th className="py-2.5 px-2.5 text-right">Total Rows</th>
                <th className="py-2.5 px-2.5 text-right">Valid Imported</th>
                <th className="py-2.5 px-2.5 text-right">Unassigned</th>
                <th className="py-2.5 px-2.5 text-right">Errors</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-4 text-right">Rollback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {importBatches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-800">{b.id}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{b.fileName}</td>
                  <td className="py-2.5 px-2.5 text-right font-mono tabular-nums">{b.totalRows}</td>
                  <td className="py-2.5 px-2.5 text-right font-mono text-emerald-700 font-semibold tabular-nums">
                    {b.validRows}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono text-amber-700 tabular-nums">{b.unassignedRows}</td>
                  <td className="py-2.5 px-2.5 text-right font-mono text-red-600 tabular-nums">{b.errorRows}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        b.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500 line-through'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 tabular-nums">
                    {new Date(b.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {b.status === 'Completed' && b.id !== 'batch-master-2026' ? (
                      <button
                        type="button"
                        onClick={() => rollbackImportBatch(b.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Rollback Batch
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px]">
                        {b.id === 'batch-master-2026' ? 'Base Roll Locked' : 'Rolled Back'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
