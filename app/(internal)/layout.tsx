import { wajibMasuk } from "@/lib/auth/hak-akses";
import { menuUntukSesi } from "@/components/internal/menu";
import { Sidebar } from "@/components/internal/sidebar";
import { Topbar } from "@/components/internal/topbar";

/**
 * Layout zona internal (/dashboard dan /admin).
 * Semua halaman di bawah layout ini wajib login; area /admin dibatasi
 * untuk role admin melalui proxy.ts dan wajibRole() di tiap halaman.
 */
export default async function LayoutInternal({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesi = await wajibMasuk("dashboard");
  const menu = menuUntukSesi(sesi);

  return (
    <div className="flex min-h-dvh bg-navy-50">
      <Sidebar menu={menu} sesi={sesi} />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-sidebar">
        <Topbar sesi={sesi} />
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
        <footer className="border-t border-navy-100 px-6 py-4 text-xs text-navy-500">
          BKPSDM Yahukimo · Badan Kepegawaian dan Pengembangan Sumber Daya Manusia
          Kabupaten Yahukimo
        </footer>
      </div>
    </div>
  );
}
