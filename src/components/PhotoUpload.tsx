"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  bucket: "item-photos" | "outfit-photos" | "avatars";
  userId: string;
  initialPath?: string | null;
  onUploaded: (path: string, publicUrl: string) => void;
  aspect?: "square" | "portrait";
}

export default function PhotoUpload({
  bucket,
  userId,
  initialPath,
  onUploaded,
  aspect = "square",
}: Props) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
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

    // Show local preview immediately
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
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`relative ${aspectCls} w-full card overflow-hidden flex items-center justify-center`}
      >
        {preview ? (
          <Image src={preview} alt="Preview" fill className="object-cover" sizes="100vw" />
        ) : (
          <div className="flex flex-col items-center text-muted">
            <Camera size={32} />
            <span className="text-sm mt-1">Take or upload photo</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center text-sm">
            Uploading…
          </div>
        )}
        {preview && !uploading && (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              setPreview(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 flex items-center justify-center"
          >
            <X size={16} />
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      {err && <p className="text-xs text-danger">{err}</p>}
    </div>
  );
}
