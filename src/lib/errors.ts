export function translateSupabaseError(
  err: unknown,
  fallback = "Terjadi kesalahan. Silakan coba lagi."
): string {
  if (!err || typeof err !== "object") {
    return typeof err === "string" && err.trim() ? err : fallback;
  }

  const record = err as { message?: string; code?: string };
  const msg = (record.message ?? "").toLowerCase();
  const code = (record.code ?? "").toLowerCase();

  // Supabase Auth error codes & messages
  if (
    code === "same_password" ||
    msg.includes("new password should be different from the old password")
  ) {
    return "Kata sandi baru harus berbeda dari kata sandi sebelumnya.";
  }

  if (
    code === "invalid_credentials" ||
    msg.includes("invalid login credentials")
  ) {
    return "Email atau kata sandi salah.";
  }

  if (
    code === "user_already_exists" ||
    msg.includes("user already registered") ||
    msg.includes("already been registered")
  ) {
    return "Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.";
  }

  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) {
    return "Email belum diverifikasi. Silakan periksa kotak masuk email kamu.";
  }

  if (
    code === "weak_password" ||
    msg.includes("password should be at least")
  ) {
    return "Kata sandi terlalu lemah. Gunakan minimal 6 karakter.";
  }

  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("for security purposes, you can only request this after")
  ) {
    return "Terlalu banyak percobaan. Silakan tunggu beberapa saat lalu coba lagi.";
  }

  if (
    code === "session_not_found" ||
    code === "session_expired" ||
    msg.includes("auth session missing")
  ) {
    return "Sesi kamu telah berakhir. Silakan masuk kembali.";
  }

  if (msg.includes("invalid email") || msg.includes("unable to validate email")) {
    return "Format alamat email tidak valid.";
  }

  // PostgreSQL & Impas RPC errors
  if (code === "23503") {
    return "Data ini masih terhubung dengan catatan pinjaman lain dan tidak bisa dihapus.";
  }
  if (code === "23505") {
    return "Data yang sama sudah tercatat sebelumnya.";
  }

  if (msg.includes("owner_cannot_self_confirm")) {
    return "Kamu adalah pembuat catatan ini. Bagikan tautan ini kepada teman peminjam agar mereka yang menekan tombol konfirmasi.";
  }
  if (msg.includes("link_not_found")) {
    return "Tautan konfirmasi tidak ditemukan.";
  }
  if (msg.includes("loan_already_settled")) {
    return "Pinjaman ini sudah berstatus Impas.";
  }
  if (msg.includes("invalid_payment_amount")) {
    return "Nominal pembayaran tidak valid atau melebihi sisa tagihan.";
  }
  if (msg.includes("loan_not_found")) {
    return "Catatan pinjaman tidak ditemukan.";
  }
  if (msg.includes("unauthorized")) {
    return "Kamu tidak memiliki izin untuk melakukan tindakan ini.";
  }

  // Network / fetch errors
  if (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("fetcherror")
  ) {
    return "Koneksi internet bermasalah. Periksa jaringan kamu dan coba lagi.";
  }

  return fallback;
}
