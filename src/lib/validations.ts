import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Nama lengkap minimal 2 karakter")
      .max(100, "Nama lengkap maksimal 100 karakter"),
    email: z
      .string()
      .trim()
      .min(1, "Email wajib diisi")
      .email("Format email tidak valid"),
    password: z.string().min(6, "Kata sandi minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Kata sandi baru minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama teman wajib diisi")
    .max(100, "Nama maksimal 100 karakter"),
  whatsapp_number: z
    .string()
    .trim()
    .min(8, "Nomor WhatsApp minimal 8 digit")
    .max(20, "Nomor WhatsApp maksimal 20 karakter")
    .regex(/^[0-9+\-\s()]+$/, "Nomor WhatsApp hanya boleh berisi angka"),
  note: z
    .string()
    .trim()
    .max(300, "Catatan maksimal 300 karakter")
    .optional()
    .or(z.literal("")),
});

export const createLoanSchema = z
  .object({
    type: z.enum(["MONEY", "ITEM"]),
    contact_id: z.string().uuid("Pilih teman dari daftar kontak"),
    amount: z.number().positive("Nominal harus lebih dari 0").optional().nullable(),
    item_name: z.string().trim().optional().nullable(),
    due_date: z.string().min(1, "Tanggal jatuh tempo wajib diisi"),
    note: z.string().trim().max(500, "Catatan maksimal 500 karakter").optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "MONEY") {
      if (!data.amount || Number.isNaN(data.amount) || data.amount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nominal pinjaman wajib lebih dari Rp 0",
          path: ["amount"],
        });
      }
    } else {
      if (!data.item_name || data.item_name.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nama barang wajib diisi",
          path: ["item_name"],
        });
      }
    }
  });

export const createRecordPaymentSchema = (remainingAmount: number) =>
  z.object({
    amount: z
      .number({ invalid_type_error: "Nominal cicilan tidak valid" })
      .positive("Nominal harus lebih dari Rp 0")
      .max(
        remainingAmount,
        `Nominal tidak boleh melebihi sisa tagihan (${remainingAmount.toLocaleString("id-ID")})`
      ),
    paid_at: z.string().min(1, "Tanggal bayar wajib diisi"),
    note: z.string().trim().max(300, "Catatan maksimal 300 karakter").optional(),
  });

export const markItemReturnedSchema = z.object({
  return_note: z
    .string()
    .trim()
    .max(300, "Catatan pengembalian maksimal 300 karakter")
    .optional(),
});

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Nama lengkap minimal 2 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter"),
});
