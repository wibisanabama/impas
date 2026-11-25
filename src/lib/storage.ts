import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadLoanProof(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<string> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("Format file harus JPG, PNG, atau WEBP");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Ukuran file maksimal 5 MB");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const fileName = `${crypto.randomUUID()}.${safeExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from("loan-proofs")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Gagal mengunggah foto: ${error.message}`);
  }

  const { data } = supabase.storage.from("loan-proofs").getPublicUrl(filePath);
  return data.publicUrl;
}
