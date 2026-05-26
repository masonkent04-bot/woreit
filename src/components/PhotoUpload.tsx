"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, ImageIcon, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  bucket: "item-photos" | "outfit-photos" | "avatars";
  userId: string;
  initialPath?: string | null;
  onUploaded: (path: string, publicUrl: string) => void;
  aspect?: "square" | "portrait";
}

// Two file inputs: cameraRef forces device camera with capture="environment",
// libraryRef opens the OS file/photo picker (no capture attr).
// Splitting them is the only reliable cross-browser way to give users a choice;
// a single input with capture forces camera-only on iOS Safari.
export default function PhotoUpload({
  bucket,
  userId,
  initialPath,
  onUploaded,
  aspect = "square",
}: Props) {
  const supabase = createClient();
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(
    initialPath ? supabase.storage.from(bucket).getPublicUrl(initialPath).data.publicUrl : null
  );
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setUploading(true);

    setPreview(URL.createObjectURL(file));

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false, contentType: file.type });

    if (error) {
      setErr(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    onUploaded(path, data.publicUrl);
    setUploading(false);
  }

  const aspectCls = aspect === "portrait" ? "aspect-[3/4]" : "aspect-square";

  return (
    <div className="space-y-2">
      <div className={`relative ${aspectCls} w-full card overflow-hidden flex items-center justify-center`}>
        {preview ? (
          <>
            <Image src={preview} alt="Preview" fill className="object-cover" sizes="100vw" />
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreview(null);
                if (cameraRef.current) cameraRef.current.value = "";
                if (libraryRef.current) libraryRef.current.value = "";
              }}
              aria-label="Remove photo"
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 flex items-center justify-center z-10"
            >
              <X size={16} />
            </span>
          </>
        ) : (
          <div className="flex flex-col items-center text-muted">
            <Camera size={32} />
            <span className="text-sm mt-1">Add a photo</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center text-sm">
            Uploading…
          </div>
        )}
      </div>

      {/* Two clear actions instead of one ambiguous tap */}
      {!uploading && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="h-10 rounded-full border border-border bg-card text-sm font-medium flex items-center justify-center gap-1.5"
          >
            <Camera size={14} /> Take photo
          </button>
          <button
            type="button"
            onClick={() => libraryRef.current?.click()}
            className="h-10 rounded-full border border-border bg-card text-sm font-medium flex items-center justify-center gap-1.5"
          >
            <ImageIcon size={14} /> Upload
          </button>
        </div>
      )}

      {/* Two hidden inputs — camera vs library */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      {err && <p className="text-xs text-danger">{err}</p>}
    </div>
  );
}
