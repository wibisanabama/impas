-- ============================================================================
-- IMPAS - Database Schema, RLS Policies, SQL RPC Functions, & Storage Policies
-- Target: Supabase (PostgreSQL 15+)
-- Project: Impas (Catatan Pinjam-Meminjam Uang & Barang Antar Teman)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. CUSTOM ENUMS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loan_type') THEN
    CREATE TYPE public.loan_type AS ENUM ('MONEY', 'ITEM');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loan_status') THEN
    CREATE TYPE public.loan_status AS ENUM (
      'PENDING_CONFIRMATION',
      'ACTIVE',
      'PARTIAL',
      'SETTLED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'actor_type') THEN
    CREATE TYPE public.actor_type AS ENUM ('OWNER', 'COUNTERPARTY', 'SYSTEM');
  END IF;
END $$;

-- 3. HELPER FUNCTION: AUTO-UPDATE updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. TABLES
-- ============================================================================

-- 4.1 Profiles (mirrors auth.users for display name & email)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 1),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.2 Contacts (friends list per user)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 1),
  whatsapp_number TEXT NOT NULL CHECK (char_length(trim(whatsapp_number)) >= 8),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.3 Loans (core money & item lending records)
CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE RESTRICT,
  counterparty_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type public.loan_type NOT NULL,
  amount NUMERIC(14, 2),
  remaining_amount NUMERIC(14, 2),
  item_name TEXT,
  photo_url TEXT,
  return_photo_url TEXT,
  due_date DATE NOT NULL,
  note TEXT,
  return_note TEXT,
  status public.loan_status NOT NULL DEFAULT 'PENDING_CONFIRMATION',
  confirmation_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  confirmed_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Domain integrity constraints
  CONSTRAINT loans_money_fields_check CHECK (
    (type = 'MONEY' AND amount IS NOT NULL AND amount > 0 AND remaining_amount IS NOT NULL AND remaining_amount >= 0 AND remaining_amount <= amount)
    OR
    (type = 'ITEM' AND item_name IS NOT NULL AND char_length(trim(item_name)) >= 1 AND amount IS NULL AND remaining_amount IS NULL)
  )
);

-- 4.4 Loan Payments (installment records for MONEY loans)
CREATE TABLE IF NOT EXISTS public.loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  proof_url TEXT,
  note TEXT,
  paid_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.5 Activity Logs (audit trail for each loan)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  actor_type public.actor_type NOT NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. INDEXES (Performance Optimization)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON public.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_counterparty_user_id ON public.loans(counterparty_user_id);
CREATE INDEX IF NOT EXISTS idx_loans_contact_id ON public.loans(contact_id);
CREATE INDEX IF NOT EXISTS idx_loans_status_due_date ON public.loans(status, due_date);
CREATE INDEX IF NOT EXISTS idx_loans_confirmation_token ON public.loans(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON public.loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_loan_id ON public.activity_logs(loan_id, created_at DESC);

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- 6.1 Auto-create profile on Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''), split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6.2 Auto-update updated_at timestamps
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON public.contacts;
CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_loans_updated_at ON public.loans;
CREATE TRIGGER trg_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6.3 Auto-log when a new loan is created
CREATE OR REPLACE FUNCTION public.log_loan_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_name TEXT;
  v_label TEXT;
BEGIN
  SELECT full_name INTO v_owner_name FROM public.profiles WHERE id = NEW.user_id;
  v_label := CASE WHEN NEW.type = 'MONEY' THEN 'pinjaman uang' ELSE 'pinjaman barang' END;

  INSERT INTO public.activity_logs (loan_id, actor_type, actor_name, action, description)
  VALUES (
    NEW.id,
    'OWNER',
    COALESCE(v_owner_name, 'Pemilik'),
    'CREATED',
    format('Catatan %s dibuat oleh %s', v_label, COALESCE(v_owner_name, 'Pemilik'))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_loans_log_created ON public.loans;
CREATE TRIGGER trg_loans_log_created
  AFTER INSERT ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.log_loan_created();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 7.1 Profiles policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Allow reading lender's display name if user is a linked counterparty on any loan
DROP POLICY IF EXISTS "profiles_select_lender_for_counterparty" ON public.profiles;
CREATE POLICY "profiles_select_lender_for_counterparty" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.loans l
      WHERE l.user_id = profiles.id
        AND l.counterparty_user_id = auth.uid()
    )
  );

-- 7.2 Contacts policies (strictly private to owner)
DROP POLICY IF EXISTS "contacts_crud_own" ON public.contacts;
CREATE POLICY "contacts_crud_own" ON public.contacts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7.3 Loans policies
-- Owner has full CRUD; linked counterparty (Hybrid mode) has read-only SELECT
DROP POLICY IF EXISTS "loans_select_owner_or_counterparty" ON public.loans;
CREATE POLICY "loans_select_owner_or_counterparty" ON public.loans
  FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = counterparty_user_id
  );

DROP POLICY IF EXISTS "loans_insert_own" ON public.loans;
CREATE POLICY "loans_insert_own" ON public.loans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "loans_update_own" ON public.loans;
CREATE POLICY "loans_update_own" ON public.loans
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "loans_delete_own" ON public.loans;
CREATE POLICY "loans_delete_own" ON public.loans
  FOR DELETE USING (auth.uid() = user_id);

-- 7.4 Loan Payments policies
DROP POLICY IF EXISTS "loan_payments_select_owner_or_counterparty" ON public.loan_payments;
CREATE POLICY "loan_payments_select_owner_or_counterparty" ON public.loan_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.loans l
      WHERE l.id = loan_payments.loan_id
        AND (l.user_id = auth.uid() OR l.counterparty_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "loan_payments_insert_own" ON public.loan_payments;
CREATE POLICY "loan_payments_insert_own" ON public.loan_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7.5 Activity Logs policies
DROP POLICY IF EXISTS "activity_logs_select_owner_or_counterparty" ON public.activity_logs;
CREATE POLICY "activity_logs_select_owner_or_counterparty" ON public.activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.loans l
      WHERE l.id = activity_logs.loan_id
        AND (l.user_id = auth.uid() OR l.counterparty_user_id = auth.uid())
    )
  );

-- ============================================================================
-- 8. POSTGRESQL RPC FUNCTIONS (Atomic Business Logic & Secure Public Access)
-- ============================================================================

-- 8.1 Public Loan Lookup by Token (no login required, never exposes other rows)
CREATE OR REPLACE FUNCTION public.get_loan_by_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loan RECORD;
  v_payments JSONB;
  v_logs JSONB;
BEGIN
  SELECT
    l.id,
    l.type,
    l.amount,
    l.remaining_amount,
    l.item_name,
    l.photo_url,
    l.return_photo_url,
    l.due_date,
    l.note,
    l.return_note,
    l.status,
    l.confirmed_at,
    l.settled_at,
    l.created_at,
    (l.counterparty_user_id IS NOT NULL) AS is_linked_to_account,
    p.full_name AS lender_name,
    c.name AS borrower_name
  INTO v_loan
  FROM public.loans l
  JOIN public.profiles p ON p.id = l.user_id
  JOIN public.contacts c ON c.id = l.contact_id
  WHERE l.confirmation_token = p_token;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', lp.id,
        'amount', lp.amount,
        'proof_url', lp.proof_url,
        'note', lp.note,
        'paid_at', lp.paid_at,
        'created_at', lp.created_at
      ) ORDER BY lp.paid_at DESC, lp.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_payments
  FROM public.loan_payments lp
  WHERE lp.loan_id = v_loan.id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', al.id,
        'actor_type', al.actor_type,
        'actor_name', al.actor_name,
        'action', al.action,
        'description', al.description,
        'created_at', al.created_at
      ) ORDER BY al.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_logs
  FROM public.activity_logs al
  WHERE al.loan_id = v_loan.id;

  RETURN jsonb_build_object(
    'loan', to_jsonb(v_loan),
    'payments', v_payments,
    'activity_logs', v_logs
  );
END;
$$;

-- 8.2 Public Confirmation by Token (Hybrid: auto-links auth.uid() if logged in)
CREATE OR REPLACE FUNCTION public.confirm_loan_by_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loan RECORD;
  v_borrower_name TEXT;
  v_uid UUID := auth.uid();
BEGIN
  SELECT l.*, c.name AS contact_name
  INTO v_loan
  FROM public.loans l
  JOIN public.contacts c ON c.id = l.contact_id
  WHERE l.confirmation_token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LINK_NOT_FOUND';
  END IF;

  IF v_uid IS NOT NULL AND v_uid = v_loan.user_id THEN
    RAISE EXCEPTION 'OWNER_CANNOT_SELF_CONFIRM';
  END IF;

  -- If already confirmed, allow linking account later if logged in and not yet linked
  IF v_loan.confirmed_at IS NOT NULL THEN
    IF v_uid IS NOT NULL AND v_loan.counterparty_user_id IS NULL THEN
      UPDATE public.loans
      SET counterparty_user_id = v_uid
      WHERE id = v_loan.id;
    END IF;
    RETURN public.get_loan_by_token(p_token);
  END IF;

  v_borrower_name := v_loan.contact_name;

  UPDATE public.loans
  SET
    status = CASE WHEN status = 'PENDING_CONFIRMATION' THEN 'ACTIVE' ELSE status END,
    confirmed_at = NOW(),
    counterparty_user_id = CASE
      WHEN v_uid IS NOT NULL AND v_uid <> user_id THEN v_uid
      ELSE counterparty_user_id
    END
  WHERE id = v_loan.id;

  INSERT INTO public.activity_logs (loan_id, actor_type, actor_name, action, description)
  VALUES (
    v_loan.id,
    'COUNTERPARTY',
    v_borrower_name,
    'CONFIRMED',
    format('Dikonfirmasi oleh %s via link publik', v_borrower_name)
  );

  RETURN public.get_loan_by_token(p_token);
END;
$$;

-- 8.3 Atomic Installment Recording (MONEY loans only)
CREATE OR REPLACE FUNCTION public.record_loan_payment(
  p_loan_id UUID,
  p_amount NUMERIC,
  p_paid_at DATE DEFAULT CURRENT_DATE,
  p_proof_url TEXT DEFAULT NULL,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_loan RECORD;
  v_owner_name TEXT;
  v_new_remaining NUMERIC(14, 2);
  v_new_status public.loan_status;
  v_payment_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT * INTO v_loan
  FROM public.loans
  WHERE id = p_loan_id AND user_id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LOAN_NOT_FOUND';
  END IF;

  IF v_loan.type <> 'MONEY' THEN
    RAISE EXCEPTION 'INVALID_LOAN_TYPE';
  END IF;

  IF v_loan.status = 'SETTLED' THEN
    RAISE EXCEPTION 'LOAN_ALREADY_SETTLED';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > v_loan.remaining_amount THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_AMOUNT';
  END IF;

  v_new_remaining := v_loan.remaining_amount - p_amount;
  v_new_status := CASE WHEN v_new_remaining = 0 THEN 'SETTLED' ELSE 'PARTIAL' END;

  INSERT INTO public.loan_payments (loan_id, user_id, amount, proof_url, note, paid_at)
  VALUES (p_loan_id, v_uid, p_amount, p_proof_url, p_note, COALESCE(p_paid_at, CURRENT_DATE))
  RETURNING id INTO v_payment_id;

  UPDATE public.loans
  SET
    remaining_amount = v_new_remaining,
    status = v_new_status,
    settled_at = CASE WHEN v_new_status = 'SETTLED' THEN NOW() ELSE settled_at END
  WHERE id = p_loan_id;

  SELECT full_name INTO v_owner_name FROM public.profiles WHERE id = v_uid;

  INSERT INTO public.activity_logs (loan_id, actor_type, actor_name, action, description)
  VALUES (
    p_loan_id,
    'OWNER',
    COALESCE(v_owner_name, 'Pemilik'),
    CASE WHEN v_new_status = 'SETTLED' THEN 'SETTLED' ELSE 'PAYMENT_RECORDED' END,
    CASE
      WHEN v_new_status = 'SETTLED' THEN
        format('Pelunasan Rp %s dicatat oleh %s (Pinjaman Impas)', to_char(p_amount, 'FM999,999,999'), COALESCE(v_owner_name, 'Pemilik'))
      ELSE
        format('Cicilan Rp %s dicatat oleh %s', to_char(p_amount, 'FM999,999,999'), COALESCE(v_owner_name, 'Pemilik'))
    END
  );

  RETURN jsonb_build_object(
    'payment_id', v_payment_id,
    'remaining_amount', v_new_remaining,
    'status', v_new_status
  );
END;
$$;

-- 8.4 Atomic Item Return Marking (ITEM loans only)
CREATE OR REPLACE FUNCTION public.mark_item_returned(
  p_loan_id UUID,
  p_return_photo_url TEXT DEFAULT NULL,
  p_return_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_loan RECORD;
  v_owner_name TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT * INTO v_loan
  FROM public.loans
  WHERE id = p_loan_id AND user_id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LOAN_NOT_FOUND';
  END IF;

  IF v_loan.type <> 'ITEM' THEN
    RAISE EXCEPTION 'INVALID_LOAN_TYPE';
  END IF;

  IF v_loan.status = 'SETTLED' THEN
    RAISE EXCEPTION 'LOAN_ALREADY_SETTLED';
  END IF;

  UPDATE public.loans
  SET
    status = 'SETTLED',
    return_photo_url = COALESCE(p_return_photo_url, return_photo_url),
    return_note = COALESCE(p_return_note, return_note),
    settled_at = NOW()
  WHERE id = p_loan_id;

  SELECT full_name INTO v_owner_name FROM public.profiles WHERE id = v_uid;

  INSERT INTO public.activity_logs (loan_id, actor_type, actor_name, action, description)
  VALUES (
    p_loan_id,
    'OWNER',
    COALESCE(v_owner_name, 'Pemilik'),
    'ITEM_RETURNED',
    format('Barang "%s" ditandai sudah kembali oleh %s (Impas)', v_loan.item_name, COALESCE(v_owner_name, 'Pemilik'))
  );

  RETURN jsonb_build_object(
    'loan_id', p_loan_id,
    'status', 'SETTLED'
  );
END;
$$;

-- Grant execute permissions on RPCs
GRANT EXECUTE ON FUNCTION public.get_loan_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_loan_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_loan_payment(UUID, NUMERIC, DATE, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_item_returned(UUID, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- 9. SUPABASE STORAGE BUCKET & POLICIES (loan-proofs)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'loan-proofs',
  'loan-proofs',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "loan_proofs_public_read" ON storage.objects;
CREATE POLICY "loan_proofs_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'loan-proofs');

DROP POLICY IF EXISTS "loan_proofs_auth_upload_own_folder" ON storage.objects;
CREATE POLICY "loan_proofs_auth_upload_own_folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'loan-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "loan_proofs_auth_delete_own_folder" ON storage.objects;
CREATE POLICY "loan_proofs_auth_delete_own_folder" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'loan-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
