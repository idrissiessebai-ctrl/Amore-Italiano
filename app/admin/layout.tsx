import Link from "next/link";
import Image from "next/image";
import { SignOutButton, UserButton } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { assertAdmin } from "@/lib/auth";
import { getPublicImageUrl } from "@/lib/utils/image";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await assertAdmin();

  return (
    <div className="min-h-screen bg-[#f7f2e8] pt-24">
      <header className="mx-auto flex w-[92%] max-w-[1180px] items-center justify-between border-b border-[#ded8cc] py-4">
        <Link href="/admin/dashboard" className="flex items-center gap-4">
          <Image
            src={getPublicImageUrl("/images/amore-33-png.webp")}
            alt="Amore Italiano Safi"
            width={940}
            height={327}
            sizes="140px"
            className="h-10 w-[115px] object-contain object-left"
          />
          <span className="hidden text-sm font-bold uppercase tracking-[.16em] text-[#4a4741] sm:inline">
            Administration
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <SignOutButton redirectUrl="/admin/sign-in">
            <button className="text-xs font-bold uppercase tracking-wider text-[#4a4741] transition hover:text-[#a92e27]">
              Déconnexion
            </button>
          </SignOutButton>
          <UserButton />
        </div>
      </header>
      <nav className="mx-auto flex w-[92%] max-w-[1180px] gap-5 border-b border-[#ded8cc] py-5 text-sm font-semibold">
        <Link href="/admin/dashboard">Dashboard</Link>
        <Link href="/admin/menu">Menu</Link>
        <Link href="/admin/applications">Candidatures</Link>
        <Link href="/admin/safi">Safi</Link>
        <Link href="/admin/settings">Paramètres</Link>
      </nav>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
