"use client";

import { useCallback, useState, useRef, useEffect, useMemo } from "react";
import { validateImage } from "@/lib/image-utils";

interface Props {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export default function ImageUploader({ files, onFilesChange }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate preview URLs when files change (memoized, not setState in effect)
  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );

  // Revoke old preview URLs when previews change — but NOT on unmount,
  // so URLs survive the parent collapsing/re-expanding the form.
  const prevPreviewsRef = useRef<string[]>([]);
  useEffect(() => {
    const old = prevPreviewsRef.current;
    prevPreviewsRef.current = previews;
    // Revoke previous batch (skip on first render when old is empty)
    if (old.length > 0 && old !== previews) {
      old.forEach((url) => URL.revokeObjectURL(url));
    }
    // No cleanup — intentionally don't revoke on unmount
  }, [previews]);

  // Close lightbox on Escape key
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft")
        setLightboxIndex((prev) =>
          prev !== null ? (prev - 1 + files.length) % files.length : null
        );
      if (e.key === "ArrowRight")
        setLightboxIndex((prev) =>
          prev !== null ? (prev + 1) % files.length : null
        );
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, files.length]);

  const processFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(newFiles);
      const errors: string[] = [];
      const valid: File[] = [];

      for (const file of fileArray) {
        const err = validateImage(file);
        if (err) {
          errors.push(`${file.name}: ${err}`);
        } else {
          valid.push(file);
        }
      }

      if (errors.length > 0) {
        setError(errors.join("; "));
      }

      if (valid.length > 0) {
        onFilesChange([...files, ...valid]);
      }
    },
    [files, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeFile = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    onFilesChange([]);
    setError(null);
  };

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg transition-colors ${
          dragOver
            ? "border-blue-500 bg-blue-50"
            : files.length > 0
              ? "border-gray-200 bg-gray-50/50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />

        {files.length === 0 ? (
          /* Empty state — big drop zone */
          <div
            onClick={handleClick}
            className="p-8 text-center cursor-pointer"
          >
            <svg
              className="mx-auto h-10 w-10 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-blue-600">
                Click to browse
              </span>{" "}
              or drag and drop label images
            </p>
            <p className="mt-1 text-xs text-gray-400">
              JPG, PNG, or WebP — single or multiple files (up to 300)
            </p>
          </div>
        ) : (
          /* Thumbnails grid */
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                {files.length} {files.length === 1 ? "image" : "images"}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClick}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add more
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-sm text-gray-400 hover:text-red-500"
                >
                  Clear all
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {previews.map((url, i) => (
                <div
                  key={`${files[i]?.name}-${i}`}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                  onClick={() => setLightboxIndex(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={files[i]?.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                      />
                    </svg>
                  </div>
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={(e) => removeFile(i, e)}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  {/* Filename */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                    <p className="text-[10px] text-white truncate">
                      {files[i]?.name}
                    </p>
                  </div>
                </div>
              ))}
              {/* Add more button */}
              <div
                onClick={handleClick}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                <span className="text-[10px] text-gray-400 mt-1">Add</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && previews[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previews[lightboxIndex]}
              alt={files[lightboxIndex]?.name}
              className="max-w-full max-h-[85vh] mx-auto rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-center text-white/70 text-sm mt-3">
              {files[lightboxIndex]?.name}
            </p>
            {/* Close */}
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            {/* Prev/Next for multiple */}
            {files.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(
                      (lightboxIndex - 1 + files.length) % files.length
                    );
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((lightboxIndex + 1) % files.length);
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
