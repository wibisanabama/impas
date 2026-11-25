import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Plus, ReceiptText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatRupiah, getInitials } from "@/lib/format";
import { DueDateBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { RealtimeSync } from "@/components/ui/RealtimeSync";
import type { LoanWithRelations } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: lentRaw }, { data: profile }] = await Promise.all([
    supabase
      .from("loans")
      .select("*, contact:contacts(id, name, whatsapp_number, note)")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true }),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single(),
  ]);

  const lentLoans = (lentRaw ?? []) as LoanWithRelations[];

  const activeLentMoney = lentLoans.filter(
    (l) => l.type === "MONEY" && l.status !== "SETTLED"
  );
  const totalPiutangAktif = activeLentMoney.reduce(
    (sum, l) => sum + Number(l.remaining_amount ?? 0),
    0
  );

  const pendingConfirmationCount = lentLoans.filter(
    (l) => !l.confirmed_at && l.status !== "SETTLED"
  ).length;

  const activeItemsCount = lentLoans.filter(
    (l) => l.type === "ITEM" && l.status !== "SETTLED"
  ).length;

  const nearestDueLoan = lentLoans
    .filter((l) => l.status !== "SETTLED")
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0];

  const urgentLoans = [...lentLoans]
    .sort((a, b) => {
      const aSettled = a.status === "SETTLED" ? 1 : 0;
      const bSettled = b.status === "SETTLED" ? 1 : 0;
      if (aSettled !== bSettled) return aSettled - bSettled;
      return a.due_date.localeCompare(b.due_date);
    })
    .slice(0, 5);

  const firstName =
    profile?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "Teman";

  const hasPending = lentLoans.some(
    (l) => l.status === "PENDING_CONFIRMATION"
  );

  return (
    <div className="space-y-6">
      <RealtimeSync hasPending={hasPending} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1312] tracking-[-0.03em]">
            Halo, {firstName}
          </h1>
          <p className="text-[14px] text-[#475569] mt-0.5">
            Ringkasan catatan pinjam-meminjam uang dan barang kamu hari ini.
          </p>
        </div>
        <Link
          href="/loans/new"
          className="hidden sm:inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[14px] font-semibold transition-[background-color] duration-150 shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Catat pinjaman
        </Link>
      </div>

      {/* Unified Hairline-Divided 4 KPI Bar */}
      <section
        aria-label="Ringkasan keuangan"
        className="bg-white border border-[#DDE4E2] rounded-2xl grid grid-cols-2 lg:grid-cols-4 overflow-hidden"
      >
        <div className="p-5 flex flex-col justify-between gap-2 border-r border-b lg:border-b-0 border-[#DDE4E2]">
          <span className="text-[13px] font-semibold text-[#475569]">
            Total piutang aktif
          </span>
          <div>
            <p className="text-[20px] font-extrabold text-[#0B1312] tabular-nums truncate">
              {formatRupiah(totalPiutangAktif)}
            </p>
            <p className="text-[13px] text-[#475569] mt-0.5 tabular-nums">
              {activeLentMoney.length} pinjaman uang aktif
            </p>
          </div>
        </div>

        <div className="p-5 flex flex-col justify-between gap-2 border-b lg:border-b-0 lg:border-r border-[#DDE4E2]">
          <span className="text-[13px] font-semibold text-[#475569]">
            Menunggu konfirmasi
          </span>
          <div>
            <p className="text-[20px] font-extrabold text-[#0B1312] tabular-nums">
              {pendingConfirmationCount} catatan
            </p>
            <p className="text-[13px] text-[#475569] mt-0.5 truncate">
              Belum dikonfirmasi
            </p>
          </div>
        </div>

        <div className="p-5 flex flex-col justify-between gap-2 border-r border-[#DDE4E2]">
          <span className="text-[13px] font-semibold text-[#475569]">
            Barang dipinjam
          </span>
          <div>
            <p className="text-[20px] font-extrabold text-[#0B1312] tabular-nums">
              {activeItemsCount} barang
            </p>
            <p className="text-[13px] text-[#475569] mt-0.5">
              Belum dikembalikan
            </p>
          </div>
        </div>

        <div className="p-5 flex flex-col justify-between gap-2">
          <span className="text-[13px] font-semibold text-[#475569]">
            Jatuh tempo terdekat
          </span>
          <div>
            {nearestDueLoan ? (
              <>
                <p className="text-[20px] font-extrabold text-[#0B1312] tabular-nums truncate">
                  {formatDate(nearestDueLoan.due_date)}
                </p>
                <p className="text-[13px] text-[#475569] mt-0.5 truncate">
                  {nearestDueLoan.contact?.name ?? "-"}
                </p>
              </>
            ) : (
              <>
                <p className="text-[20px] font-extrabold text-[#0B1312]">
                  Aman
                </p>
                <p className="text-[13px] text-[#475569] mt-0.5">
                  Tidak ada tagihan aktif
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Pinjaman Mendesak & Terbaru (1 Semantic Responsive Table) */}
      <section className="bg-white border border-[#DDE4E2] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#DDE4E2] flex items-center justify-between gap-3">
          <div>
            <h2
              id="urgent-loans-heading"
              className="text-[16px] font-bold text-[#0B1312]"
            >
              Pinjaman mendesak dan terbaru
            </h2>
            <p className="text-[13px] text-[#475569] mt-0.5">
              Menampilkan maksimal 5 catatan berdasarkan jatuh tempo terdekat
            </p>
          </div>
          <Link
            href="/loans"
            className="inline-flex items-center gap-1 text-[13px] sm:text-[14px] font-semibold text-[#0F766E] hover:text-[#0D655E] whitespace-nowrap"
          >
            Lihat semua
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {urgentLoans.length === 0 ? (
          <div className="px-6 py-12 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F6F8F7] text-[#475569] flex items-center justify-center">
              <ReceiptText className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-[16px] font-bold text-[#0B1312]">
                Belum ada catatan pinjaman
              </h3>
              <p className="text-[14px] text-[#475569]">
                Catat pinjaman uang atau barang pertama kamu dan kirim tautan
                konfirmasi ke teman via WhatsApp.
              </p>
            </div>
            <Link
              href="/loans/new"
              className="inline-flex items-center gap-2 min-h-[48px] px-5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[14px] font-semibold transition-[background-color] duration-150"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Catat pinjaman pertama
            </Link>
          </div>
        ) : (
          <div
            tabIndex={0}
            role="region"
            aria-labelledby="urgent-loans-heading"
            className="impas-table-wrapper"
          >
            <table className="impas-table text-[14px]">
              <thead>
                <tr className="border-b border-[#DDE4E2] text-[13px] font-semibold text-[#475569]">
                  <th scope="col" className="py-3 px-5">
                    Peminjam
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Tipe
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Nominal atau barang
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Jatuh tempo
                  </th>
                  <th scope="col" className="py-3 px-4">
                    Status
                  </th>
                  <th scope="col" className="py-3 px-5 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE4E2]">
                {urgentLoans.map((loan) => {
                  const contactName = loan.contact?.name ?? "Teman";
                  return (
                    <tr key={loan.id}>
                      <th scope="row" className="py-3.5 px-5 font-semibold text-[#0B1312]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#E6F4F1] text-[#0F766E] flex items-center justify-center text-[13px] font-bold shrink-0">
                            {getInitials(contactName)}
                          </div>
                          <span>{contactName}</span>
                        </div>
                      </th>
                      <td data-label="Tipe" className="py-3.5 px-4 text-[#475569] font-medium">
                        {loan.type === "MONEY" ? "Uang" : "Barang"}
                      </td>
                      <td
                        data-label="Nominal / Barang"
                        className="py-3.5 px-4 font-semibold text-[#0B1312] tabular-nums"
                      >
                        {loan.type === "MONEY"
                          ? formatRupiah(loan.remaining_amount)
                          : loan.item_name}
                      </td>
                      <td data-label="Jatuh tempo" className="py-3.5 px-4">
                        <DueDateBadge
                          dueDate={loan.due_date}
                          status={loan.status}
                        />
                      </td>
                      <td data-label="Status" className="py-3.5 px-4">
                        <StatusBadge
                          status={loan.status}
                          dueDate={loan.due_date}
                        />
                      </td>
                      <td data-label="Aksi" className="py-3.5 px-5 text-right">
                        <Link
                          href={`/loans/${loan.id}`}
                          className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0F766E] hover:text-[#0D655E]"
                        >
                          Detail
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
