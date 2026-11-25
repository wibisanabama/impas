export type LoanType = "MONEY" | "ITEM";

export type LoanStatus =
  | "PENDING_CONFIRMATION"
  | "ACTIVE"
  | "PARTIAL"
  | "SETTLED";

export type ActorType = "OWNER" | "COUNTERPARTY" | "SYSTEM";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  whatsapp_number: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  user_id: string;
  contact_id: string;
  counterparty_user_id: string | null;
  type: LoanType;
  amount: number | null;
  remaining_amount: number | null;
  item_name: string | null;
  photo_url: string | null;
  return_photo_url: string | null;
  due_date: string;
  note: string | null;
  return_note: string | null;
  status: LoanStatus;
  confirmation_token: string;
  confirmed_at: string | null;
  settled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoanWithRelations extends Loan {
  contact?: Pick<Contact, "id" | "name" | "whatsapp_number" | "note"> | null;
  lender?: Pick<Profile, "id" | "full_name" | "email"> | null;
}

export interface LoanPayment {
  id: string;
  loan_id: string;
  user_id?: string;
  amount: number;
  proof_url: string | null;
  note: string | null;
  paid_at: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  loan_id?: string;
  actor_type: ActorType;
  actor_name: string;
  action: string;
  description: string;
  created_at: string;
}

export interface PublicLoanPayload {
  loan: {
    id: string;
    type: LoanType;
    amount: number | null;
    remaining_amount: number | null;
    item_name: string | null;
    photo_url: string | null;
    return_photo_url: string | null;
    due_date: string;
    note: string | null;
    return_note: string | null;
    status: LoanStatus;
    confirmed_at: string | null;
    settled_at: string | null;
    created_at: string;
    is_linked_to_account: boolean;
    lender_name: string;
    borrower_name: string;
  };
  payments: LoanPayment[];
  activity_logs: ActivityLog[];
}

export interface RecordPaymentResult {
  payment_id: string;
  remaining_amount: number;
  status: LoanStatus;
}

export interface MarkItemReturnedResult {
  loan_id: string;
  status: LoanStatus;
}
