"use client";

import { useCallback, useRef, useState } from "react";
import JSZip from "jszip";

// ─── Types ───────────────────────────────────────────────────────────────────

type UploadStatus = "idle" | "loading" | "success" | "error";

interface UploadResult {
  status?: string;
  message: string;
  record_id?: string;
  filename: string;
  message_type?: string;
  parsed_data?: Record<string, unknown>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function XmlUploader() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [results, setResults] = useState<UploadResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File selection ──────────────────────────────────────────────────────────

  const handleFileChange = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    
    const validFiles = Array.from(files).filter(f => f.name.endsWith(".xml"));
    
    if (validFiles.length === 0) {
      setErrorMessage("Only .xml files are accepted.");
      setStatus("error");
      return;
    }
    
    if (validFiles.length !== files.length) {
      setErrorMessage("Some files were skipped because they are not .xml files.");
    } else {
      setErrorMessage("");
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setStatus("idle");
    setResults([]);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ── Drag & Drop ─────────────────────────────────────────────────────────────

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setStatus("loading");
    setResults([]);
    setErrorMessage("");

    const formData = new FormData();
    selectedFiles.forEach(f => formData.append("files", f));

    try {
      const response = await fetch("/api/upload-xml", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(err.detail ?? `Server responded with ${response.status}`);
      }

      const data = await response.json();
      setResults(data.results || []);
      setStatus("success");
      setSelectedFiles([]); // clear after upload
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Upload failed.");
      setStatus("error");
    }
  };

  // ── Reset ───────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setSelectedFiles([]);
    setStatus("idle");
    setResults([]);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Download helpers ────────────────────────────────────────────────────────

  const downloadJson = (result: UploadResult) => {
    const json = JSON.stringify(result.parsed_data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename.replace(/\.xml$/i, ".json");
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllJson = async () => {
    const withData = results.filter((r) => r.parsed_data);
    if (withData.length === 0) return;

    if (withData.length === 1) {
      downloadJson(withData[0]);
      return;
    }

    const zip = new JSZip();
    withData.forEach((r) => {
      const filename = r.filename.replace(/\.xml$/i, ".json");
      zip.file(filename, JSON.stringify(r.parsed_data, null, 2));
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "extracted_json.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-6">
      {/* Drop Zone */}
      <div
        id="xml-drop-zone"
        role="button"
        tabIndex={0}
        aria-label="XML file drop zone — click or drag a file here"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-3
          h-48 cursor-pointer rounded-2xl border-2 border-dashed
          transition-all duration-200 select-none
          ${
            isDragging
              ? "border-sky-400 bg-sky-500/10"
              : "border-white/20 hover:border-sky-500/60 hover:bg-white/5"
          }
          ${selectedFiles.length > 0 ? "border-emerald-500/50 bg-emerald-500/5" : ""}
        `}
      >
        {/* Hidden native input */}
        <input
          ref={fileInputRef}
          id="xml-file-input"
          type="file"
          multiple
          accept=".xml,text/xml,application/xml"
          className="sr-only"
          onChange={onInputChange}
        />

        {selectedFiles.length > 0 ? (
          <div className="w-full flex flex-col items-center max-h-40 overflow-y-auto px-4 py-2">
            <span className="text-3xl mb-2">📄</span>
            {selectedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 mb-1 w-full justify-center">
                <p className="text-sm font-semibold text-emerald-400 truncate max-w-[150px] sm:max-w-xs">
                  {f.name}
                </p>
                <p className="text-xs text-slate-500">({formatBytes(f.size)})</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(i);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 ml-2 bg-rose-400/10 px-2 py-0.5 rounded"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Empty state */}
            <span className="text-3xl opacity-60">
              {isDragging ? "⬇️" : "📂"}
            </span>
            <div className="text-center">
              <p className="text-sm text-slate-300">
                <span className="text-sky-400 font-semibold">Click to browse</span>{" "}
                or drag &amp; drop
              </p>
              <p className="text-xs text-slate-500 mt-1">XML files only</p>
            </div>
          </>
        )}
      </div>

      {/* Upload Button */}
      <button
        id="upload-submit-btn"
        type="button"
        onClick={handleUpload}
        disabled={selectedFiles.length === 0 || status === "loading"}
        className={`
          w-full py-3 px-6 rounded-xl font-semibold text-sm
          transition-all duration-200
          ${
            selectedFiles.length === 0 || status === "loading"
              ? "bg-slate-800 text-slate-600 cursor-not-allowed"
              : "bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 active:scale-[0.98]"
          }
        `}
      >
        {status === "loading" ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Uploading &amp; Parsing…
          </span>
        ) : (
          "Upload XML File"
        )}
      </button>

      {/* Success Banner */}
      {status === "success" && results.length > 0 && (
        <div className="space-y-4">
          {/* Bulk download bar */}
          {results.some((r) => r.parsed_data) && (
            <div className="flex items-center justify-between rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-2.5">
              <p className="text-xs text-slate-400">
                <span className="text-sky-300 font-semibold">{results.filter((r) => r.parsed_data).length}</span>
                {" "}JSON file{results.filter((r) => r.parsed_data).length !== 1 ? "s" : ""} ready
              </p>
              <button
                id="download-all-json-btn"
                type="button"
                onClick={downloadAllJson}
                className="flex items-center gap-1.5 text-xs font-semibold text-sky-300 hover:text-white bg-sky-500/15 hover:bg-sky-500/30 border border-sky-500/30 px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {results.filter((r) => r.parsed_data).length > 1 ? "Download All (ZIP)" : "Download JSON"}
              </button>
            </div>
          )}

          {results.map((res, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border p-4 space-y-3 ${
                res.status === "error" 
                  ? "border-rose-500/30 bg-rose-500/10" 
                  : "border-emerald-500/30 bg-emerald-500/10"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{res.status === "error" ? "❌" : "✅"}</span>
                <p className={`text-sm font-semibold flex-1 ${res.status === "error" ? "text-rose-400" : "text-emerald-400"}`}>
                  {res.message}
                </p>
                {/* Per-file download button */}
                {res.parsed_data && (
                  <button
                    id={`download-json-btn-${idx}`}
                    type="button"
                    title={`Download ${res.filename.replace(/\.xml$/i, ".json")}`}
                    onClick={() => downloadJson(res)}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 px-2.5 py-1 rounded-lg transition-all duration-150 active:scale-95 shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    .json
                  </button>
                )}
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                {res.message_type && (
                  <p>
                    <span className="text-slate-500">Type: </span>
                    <span className="text-sky-300 font-semibold">{res.message_type}</span>
                  </p>
                )}
                {res.record_id && (
                  <p>
                    <span className="text-slate-500">Record ID: </span>
                    <code className="text-sky-300 font-mono">{res.record_id}</code>
                  </p>
                )}
                <p>
                  <span className="text-slate-500">File: </span>
                  {res.filename}
                </p>
              </div>

              {res.parsed_data && (
                <details className="group">
                  <summary className="text-xs text-sky-400 cursor-pointer hover:text-sky-300 transition-colors list-none flex items-center gap-1">
                    <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                    View parsed JSON
                  </summary>
                  <pre className="mt-2 text-xs bg-slate-900/60 text-emerald-300 rounded-xl p-3 overflow-x-auto max-h-64">
                    {JSON.stringify(res.parsed_data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-sky-400 transition-colors"
          >
            Upload more files →
          </button>
        </div>
      )}

      {/* Error Banner */}
      {status === "error" && (
        <div
          id="upload-error-banner"
          role="alert"
          className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-start gap-3"
        >
          <span className="text-lg mt-0.5">❌</span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-rose-400">Upload Failed</p>
            <p className="text-xs text-slate-400">{errorMessage}</p>
            <button
              id="retry-upload-btn"
              type="button"
              onClick={() => setStatus("idle")}
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors mt-1"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
