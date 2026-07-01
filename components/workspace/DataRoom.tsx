"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase/client";

interface FileEntry {
  id: string;
  name: string;
  size: number;
  contentType: string;
  url: string;
  path: string;
  uploaded_at: number;
  uploadedByName: string;
}

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

function humanSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function fileIcon(contentType: string): string {
  if (contentType.includes("pdf")) return "📕";
  if (contentType.startsWith("image/")) return "🖼️";
  if (contentType.includes("sheet") || contentType.includes("excel") || contentType.includes("csv")) return "📊";
  if (contentType.includes("presentation") || contentType.includes("powerpoint")) return "📽️";
  return "📄";
}

export function DataRoom({
  workspaceId,
  locale,
  canManage,
  uploaderName,
}: {
  workspaceId: string;
  locale: string;
  canManage: boolean;
  uploaderName: string;
}) {
  const t = useTranslations("workspace_pages.dataroom");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "workspaces", workspaceId, "dataroom"));
      const rows: FileEntry[] = snap.docs.map((d) => {
        const data = d.data();
        const ts = data.uploaded_at;
        return {
          id: d.id,
          name: data.name ?? "",
          size: data.size ?? 0,
          contentType: data.contentType ?? "",
          url: data.url ?? "",
          path: data.path ?? "",
          uploaded_at: ts?.toMillis ? ts.toMillis() : 0,
          uploadedByName: data.uploadedByName ?? "",
        };
      });
      rows.sort((a, b) => b.uploaded_at - a.uploaded_at);
      setFiles(rows);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(file: File) {
    setError(null);
    if (file.size > MAX_SIZE) {
      setError(t("too_large"));
      return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setUploading(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 40);
      const fileId = `${files.length}_${Date.now()}_${safe}`;
      const path = `datarooms/${workspaceId}/${fileId}`;
      await uploadBytes(storageRef(storage, path), file, { contentType: file.type });
      const url = await getDownloadURL(storageRef(storage, path));
      await setDoc(doc(db, "workspaces", workspaceId, "dataroom", fileId), {
        name: file.name,
        size: file.size,
        contentType: file.type,
        url,
        path,
        uploaded_at: serverTimestamp(),
        uploadedBy: uid,
        uploadedByName: uploaderName,
      });
      await load();
    } catch {
      setError(t("upload_error"));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(f: FileEntry) {
    if (!confirm(t("confirm_delete"))) return;
    try {
      await deleteObject(storageRef(storage, f.path)).catch(() => {});
      await deleteDoc(doc(db, "workspaces", workspaceId, "dataroom", f.id));
      await load();
    } catch {
      /* ignore */
    }
  }

  return (
    <div>
      {canManage && (
        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500 mb-3">{t("manage_hint")}</p>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <label
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 ${
              uploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {uploading ? t("uploading") : t("upload_button")}
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-400">
          {t("loading")}
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
          <span className="text-4xl">📂</span>
          <p className="mt-4 font-semibold text-zinc-700">{t("empty_title")}</p>
          <p className="mt-2 text-sm text-zinc-400">{t("empty_description")}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <span className="text-2xl">{fileIcon(f.contentType)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-800">{f.name}</p>
                <p className="text-xs text-zinc-400">
                  {t("size_label")}: {humanSize(f.size)}
                  {f.uploaded_at > 0 && ` · ${new Date(f.uploaded_at).toLocaleDateString(locale)}`}
                  {f.uploadedByName && ` · ${t("uploaded_by")} ${f.uploadedByName}`}
                </p>
              </div>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
              >
                {t("download")}
              </a>
              {canManage && (
                <button
                  type="button"
                  onClick={() => handleDelete(f)}
                  className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  {t("delete")}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
