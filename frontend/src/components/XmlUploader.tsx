"use client";

import { useCallback, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type UploadStatus = "idle" | "loading" | "success" | "error";

interface UploadResult {
  message: string;
  record_id: string;
  filename: string;
  parsed_data: Record<string, unknown>;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File selection ──────────────────────────────────────────────────────────

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    if (!file.name.endsWith(".xml")) {
      setErrorMessage("Only .xml files are accepted.");
      setStatus("error");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setStatus("idle");
    setResult(null);
    setErrorMessage("");
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files?.[0] ?? null);
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
    handleFileChange(e.dataTransfer.files?.[0] ?? null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!selectedFile) return;

    setStatus("loading");
    setResult(null);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/upload-xml", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(err.detail ?? `Server responded with ${response.status}`);
      }

      const data: UploadResult = await response.json();
      setResult(data);
      setStatus("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Upload failed.");
      setStatus("error");
    }
  };

  // ── Reset ───────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setSelectedFile(null);
    setStatus("idle");
    setResult(null);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
          ${selectedFile ? "border-emerald-500/50 bg-emerald-500/5" : ""}
        `}
      >
        {/* Hidden native input */}
        <input
          ref={fileInputRef}
          id="xml-file-input"
          type="file"
          accept=".xml,text/xml,application/xml"
          className="sr-only"
          onChange={onInputChange}
        />

        {selectedFile ? (
          <>
            {/* File selected state */}
            <span className="text-3xl">📄</span>
            <div className="text-center">
              <p className="text-sm font-semibold text-emerald-400 truncate max-w-xs">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatBytes(selectedFile.size)}
              </p>
            </div>
            <button
              id="remove-file-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="text-xs text-slate-500 hover:text-rose-400 transition-colors mt-1"
            >
              Remove
            </button>
          </>
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
        disabled={!selectedFile || status === "loading"}
        className={`
          w-full py-3 px-6 rounded-xl font-semibold text-sm
          transition-all duration-200
          ${
            !selectedFile || status === "loading"
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
      {status === "success" && result && (
        <div
          id="upload-success-banner"
          role="alert"
          className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <p className="text-sm font-semibold text-emerald-400">
              {result.message}
            </p>
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <p>
              <span className="text-slate-500">Type: </span>
              <span className="text-sky-300 font-semibold">{(result as any).message_type || "Unknown"}</span>
            </p>
            <p>
              <span className="text-slate-500">Record ID: </span>
              <code className="text-sky-300 font-mono">{result.record_id}</code>
            </p>
            <p>
              <span className="text-slate-500">File: </span>
              {result.filename}
            </p>
          </div>

          {/* Parsed JSON Preview */}
          <details className="group">
            <summary className="text-xs text-sky-400 cursor-pointer hover:text-sky-300 transition-colors list-none flex items-center gap-1">
              <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
              View parsed JSON
            </summary>
            <pre className="mt-2 text-xs bg-slate-900/60 text-emerald-300 rounded-xl p-3 overflow-x-auto max-h-64">
              {JSON.stringify(result.parsed_data, null, 2)}
            </pre>
          </details>

          <button
            id="upload-again-btn"
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-sky-400 transition-colors"
          >
            Upload another file →
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
