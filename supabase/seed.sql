-- ============================================================================
-- IMPAS - Seed Data (Generic Indonesian Fictional Data)
-- Jalankan setelah minimal 1 akun terdaftar via halaman /register (atau Auth).
-- Script ini mengambil user pertama dari public.profiles sebagai pemilik data.
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_owner_name TEXT;
  v_c_budi UUID := gen_random_uuid();
  v_c_siti UUID := gen_random_uuid();
  v_c_andi UUID := gen_random_uuid();
  v_c_ratna UUID := gen_random_uuid();

  v_l_money_partial UUID := gen_random_uuid();
  v_l_money_active_overdue UUID := gen_random_uuid();
  v_l_money_pending UUID := gen_random_uuid();
  v_l_money_settled UUID := gen_random_uuid();
  v_l_item_active UUID := gen_random_uuid();
  v_l_item_pending UUID := gen_random_uuid();
  v_l_item_settled UUID := gen_random_uuid();
BEGIN
  SELECT id, full_name INTO v_user_id, v_owner_name
  FROM public.profiles
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Belum ada data di public.profiles. Silakan daftar akun terlebih dahulu di /register sebelum menjalankan seed.sql.';
    RETURN;
  END IF;

  -- 1. Kontak Teman
  INSERT INTO public.contacts (id, user_id, name, whatsapp_number, note)
  VALUES
    (v_c_budi, v_user_id, 'Budi Santoso', '081234567801', 'Teman kantor tim produk'),
    (v_c_siti, v_user_id, 'Siti Aminah', '081234567802', 'Tetangga komplek'),
    (v_c_andi, v_user_id, 'Andi Wijaya', '081234567803', 'Teman kuliah'),
    (v_c_ratna, v_user_id, 'Ratna Dewi', '081234567804', 'Komunitas fotografi');

  -- 2. Catatan Pinjaman (Uang & Barang across all statuses)
  INSERT INTO public.loans (
    id, user_id, contact_id, type, amount, remaining_amount, item_name,
    due_date, note, status, confirmed_at, settled_at
  )
  VALUES
    -- Uang: Dicicil (jatuh tempo 2 hari lagi -> Amber)
    (
      v_l_money_partial, v_user_id, v_c_budi, 'MONEY', 1500000, 1000000, NULL,
      CURRENT_DATE + INTERVAL '2 days', 'Talangan tiket pesawat dinas luar kota', 'PARTIAL',
      NOW() - INTERVAL '10 days', NULL
    ),
    -- Uang: Aktif tapi sudah lewat jatuh tempo (Overdue -> Rose)
    (
      v_l_money_active_overdue, v_user_id, v_c_andi, 'MONEY', 500000, 500000, NULL,
      CURRENT_DATE - INTERVAL '3 days', 'Pinjam uang tunai saat makan malam', 'ACTIVE',
      NOW() - INTERVAL '14 days', NULL
    ),
    -- Uang: Menunggu Konfirmasi
    (
      v_l_money_pending, v_user_id, v_c_siti, 'MONEY', 350000, 350000, NULL,
      CURRENT_DATE + INTERVAL '7 days', 'Patungan kado ulang tahun teman', 'PENDING_CONFIRMATION',
      NULL, NULL
    ),
    -- Uang: Impas (Lunas)
    (
      v_l_money_settled, v_user_id, v_c_budi, 'MONEY', 250000, 0, NULL,
      CURRENT_DATE - INTERVAL '20 days', 'Bayar patungan kopi & makan siang', 'SETTLED',
      NOW() - INTERVAL '25 days', NOW() - INTERVAL '18 days'
    ),
    -- Barang: Aktif
    (
      v_l_item_active, v_user_id, v_c_ratna, 'ITEM', NULL, NULL, 'Kamera Mirrorless Sony A6400 + Lensa Kit',
      CURRENT_DATE + INTERVAL '1 day', 'Dipinjam untuk liputan acara kampus akhir pekan', 'ACTIVE',
      NOW() - INTERVAL '4 days', NULL
    ),
    -- Barang: Menunggu Konfirmasi
    (
      v_l_item_pending, v_user_id, v_c_andi, 'ITEM', NULL, NULL, 'Obeng Set & Bor Listrik Portable',
      CURRENT_DATE + INTERVAL '10 days', 'Untuk pasang rak buku di kosan', 'PENDING_CONFIRMATION',
      NULL, NULL
    ),
    -- Barang: Impas (Sudah Kembali)
    (
      v_l_item_settled, v_user_id, v_c_siti, 'ITEM', NULL, NULL, 'Tenda Camping Kapasitas 4 Orang',
      CURRENT_DATE - INTERVAL '12 days', 'Kondisi bersih dan lengkap dengan pasak', 'SETTLED',
      NOW() - INTERVAL '16 days', NOW() - INTERVAL '10 days'
    );

  -- 3. Riwayat Cicilan
  INSERT INTO public.loan_payments (loan_id, user_id, amount, note, paid_at)
  VALUES
    (v_l_money_partial, v_user_id, 500000, 'Cicilan pertama via transfer BCA', CURRENT_DATE - INTERVAL '5 days'),
    (v_l_money_settled, v_user_id, 250000, 'Transfer lunas via QRIS', CURRENT_DATE - INTERVAL '18 days');

  -- 4. Log Aktivitas tambahan (selain trigger CREATED)
  INSERT INTO public.activity_logs (loan_id, actor_type, actor_name, action, description, created_at)
  VALUES
    (v_l_money_partial, 'COUNTERPARTY', 'Budi Santoso', 'CONFIRMED', 'Dikonfirmasi oleh Budi Santoso via link publik', NOW() - INTERVAL '10 days'),
    (v_l_money_partial, 'OWNER', v_owner_name, 'PAYMENT_RECORDED', format('Cicilan Rp 500,000 dicatat oleh %s', v_owner_name), NOW() - INTERVAL '5 days'),
    (v_l_money_active_overdue, 'COUNTERPARTY', 'Andi Wijaya', 'CONFIRMED', 'Dikonfirmasi oleh Andi Wijaya via link publik', NOW() - INTERVAL '14 days'),
    (v_l_money_settled, 'COUNTERPARTY', 'Budi Santoso', 'CONFIRMED', 'Dikonfirmasi oleh Budi Santoso via link publik', NOW() - INTERVAL '25 days'),
    (v_l_money_settled, 'OWNER', v_owner_name, 'SETTLED', format('Pelunasan Rp 250,000 dicatat oleh %s (Pinjaman Impas)', v_owner_name), NOW() - INTERVAL '18 days'),
    (v_l_item_active, 'COUNTERPARTY', 'Ratna Dewi', 'CONFIRMED', 'Dikonfirmasi oleh Ratna Dewi via link publik', NOW() - INTERVAL '4 days'),
    (v_l_item_settled, 'COUNTERPARTY', 'Siti Aminah', 'CONFIRMED', 'Dikonfirmasi oleh Siti Aminah via link publik', NOW() - INTERVAL '16 days'),
    (v_l_item_settled, 'OWNER', v_owner_name, 'ITEM_RETURNED', format('Barang "Tenda Camping Kapasitas 4 Orang" ditandai sudah kembali oleh %s (Impas)', v_owner_name), NOW() - INTERVAL '10 days');
END $$;
