/**
 * FILE UPLOAD ENHANCEMENTS
 *
 * Drag-drop upload with progress tracking
 */

"use client";

import React, { useState, useCallback, useRef } from "react";
import { Upload, X, File, Image as ImageIcon } from "lucide-react";

export interface FileUploadOptions {
  accept?: string;
  maxSize?: number; // in bytes
  maxFiles?: number;
  multiple?: boolean;
  onUpload: (files: File[]) => Promise<void>;
  onProgress?: (file: string, progress: number) => void;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export function useFileUpload(options: FileUploadOptions) {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (options.accept && !file.type.match(options.accept)) {
        return `File type ${file.type} not allowed`;
      }
      if (options.maxSize && file.size > options.maxSize) {
        return `File size exceeds ${options.maxSize / 1024 / 1024}MB`;
      }
      return null;
    },
    [options.accept, options.maxSize]
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).slice(0, options.maxFiles || 10);

      // Validate files
      const validFiles: File[] = [];
      const newUploads: UploadProgress[] = [];

      for (const file of fileArray) {
        const error = validateFile(file);
        newUploads.push({
          file,
          progress: 0,
          status: error ? "error" : "pending",
          error: error || undefined,
        });
        if (!error) validFiles.push(file);
      }

      setUploads((prev) => [...prev, ...newUploads]);

      // Upload valid files
      for (const file of validFiles) {
        setUploads((prev) =>
          prev.map((u) =>
            u.file === file ? { ...u, status: "uploading" } : u
          )
        );

        try {
          // Simulate upload progress
          for (let i = 0; i <= 100; i += 10) {
            await new Promise((r) => setTimeout(r, 100));
            setUploads((prev) =>
              prev.map((u) =>
                u.file === file ? { ...u, progress: i } : u
              )
            );
            options.onProgress?.(file.name, i);
          }

          setUploads((prev) =>
            prev.map((u) =>
              u.file === file ? { ...u, status: "success", progress: 100 } : u
            )
          );
        } catch (error) {
          setUploads((prev) =>
            prev.map((u) =>
              u.file === file
                ? { ...u, status: "error", error: String(error) }
                : u
            )
          );
        }
      }

      await options.onUpload(validFiles);
    },
    [options]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      uploadFiles(e.dataTransfer.files);
    },
    [uploadFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        uploadFiles(e.target.files);
      }
    },
    [uploadFiles]
  );

  const removeUpload = useCallback((file: File) => {
    setUploads((prev) => prev.filter((u) => u.file !== file));
  }, []);

  const clearUploads = useCallback(() => {
    setUploads([]);
  }, []);

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return {
    uploads,
    isDragging,
    inputRef,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileSelect,
    removeUpload,
    clearUploads,
    openFileDialog,
  };
}

/**
 * File upload zone component
 */
export function FileUploadZone({
  uploads,
  isDragging,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileSelect,
  onRemove,
  inputRef,
  accept,
  multiple,
}: {
  uploads: UploadProgress[];
  isDragging: boolean;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (file: File) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  accept?: string;
  multiple?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-purple-500 bg-purple-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 mb-2">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-sm text-gray-400">
          {accept && `Accepted: ${accept}`}
          {multiple === false && " (single file only)"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple !== false}
          onChange={onFileSelect}
          className="hidden"
        />
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              {upload.file.type.startsWith("image/") ? (
                <ImageIcon className="w-8 h-8 text-purple-500" />
              ) : (
                <File className="w-8 h-8 text-gray-400" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {upload.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(upload.file.size / 1024).toFixed(1)} KB
                </p>
                {upload.status === "uploading" && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  upload.status === "success"
                    ? "bg-green-100 text-green-700"
                    : upload.status === "error"
                    ? "bg-red-100 text-red-700"
                    : upload.status === "uploading"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {upload.status === "uploading"
                  ? `${upload.progress}%`
                  : upload.status}
              </span>
              <button
                onClick={() => onRemove(upload.file)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Upload to server with progress
 */
export async function uploadFileWithProgress(
  file: File,
  url: string,
  onProgress: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.url);
      } else {
        reject(new Error(xhr.statusText));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed"));
    });

    const formData = new FormData();
    formData.append("file", file);

    xhr.open("POST", url);
    xhr.send(formData);
  });
}

/**
 * Get file icon based on type
 */
export function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.includes("pdf")) return File;
  if (type.includes("word") || type.includes("document")) return File;
  if (type.includes("sheet") || type.includes("excel")) return File;
  if (type.includes("presentation") || type.includes("powerpoint")) return File;
  return File;
}
