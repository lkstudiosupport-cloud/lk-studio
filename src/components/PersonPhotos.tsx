"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { MAX_PERSON_PHOTOS, parsePersonPhotos } from "@/lib/person-photos";
import { addPersonPhotos, deletePersonPhoto } from "@/app/customer/actions";
import { initialActionState } from "@/lib/action-state";
import { PhotoSlotsUpload } from "@/components/PhotoSlotsUpload";

export function PersonPhotos({
  personId,
  locale,
  photosJson,
}: {
  personId: string;
  locale: Locale;
  photosJson: string | null;
}) {
  const router = useRouter();
  const saved = parsePersonPhotos(photosJson);
  const [files, setFiles] = useState<File[]>([]);
  const [state, action, pending] = useActionState(addPersonPhotos, initialActionState);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, startDelete] = useTransition();

  useEffect(() => {
    if (state.ok) {
      setFiles([]);
      router.refresh();
    }
  }, [state.ok, router]);

  const room = MAX_PERSON_PHOTOS - saved.length;

  function onDeletePhoto(imagePath: string) {
    setDeleteError("");
    const fd = new FormData();
    fd.set("personId", personId);
    fd.set("imagePath", imagePath);
    startDelete(async () => {
      try {
        const result = await deletePersonPhoto(initialActionState, fd);
        if (!result.ok) {
          setDeleteError(result.error ?? t(locale, "deletePhotoFailed"));
          return;
        }
        router.refresh();
      } catch (e) {
        setDeleteError(e instanceof Error ? e.message : t(locale, "deletePhotoFailed"));
      }
    });
  }

  return (
    <div className="mb-4 rounded-xl border border-brand-green/10 bg-brand-cream/40 p-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-green">
        {t(locale, "personPhotos")}
      </p>

      {saved.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {saved.map((path) => (
            <div
              key={path}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-brand-green/15"
            >
              <Image src={path} alt="" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => onDeletePhoto(path)}
                disabled={deleting}
                className="absolute right-0.5 top-0.5 rounded-full bg-red-600 p-0.5 text-white disabled:opacity-60"
                aria-label={t(locale, "removePhoto")}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {room > 0 ? (
        <form action={action} className="space-y-2">
          <input type="hidden" name="personId" value={personId} />
          <PhotoSlotsUpload
            locale={locale}
            max={room}
            files={files}
            onFilesChange={setFiles}
            fieldPrefix="personPhoto"
            showCount={files.length > 0}
            compress
            slotSize="h-20 w-20"
          />
          {files.length > 0 && (
            <button type="submit" disabled={pending} className="btn-primary text-sm">
              {pending ? "..." : t(locale, "savePhotos")}
            </button>
          )}
        </form>
      ) : (
        <p className="text-xs text-zinc-500">{t(locale, "personPhotosMax")}</p>
      )}

      {state.error && (
        <p className="mt-2 text-xs text-red-600">
          {state.error === "personPhotosMax" ? t(locale, "personPhotosMax") : state.error}
        </p>
      )}
      {deleteError && <p className="mt-2 text-xs text-red-600">{deleteError}</p>}
    </div>
  );
}
