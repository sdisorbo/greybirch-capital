import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Nav from "@/components/Nav";
import FundDashboard from "@/components/FundDashboard";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session.user) redirect("/login");

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav role={session.user.role} />

      <main className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
        <div className="mb-10">
          <p className="text-xs tracking-[0.2em] uppercase text-stone-400 mb-3 font-sans">
            Fund Performance
          </p>
          <h1 className="font-serif text-4xl font-medium text-stone-900">
            Grey Birch Capital
          </h1>
          <div className="w-8 h-px bg-stone-300 mt-4" />
        </div>

        <FundDashboard isOperator={session.user.role === "operator"} />

        <p className="mt-10 text-xs text-stone-300 leading-relaxed text-center">
          Fund values are reported in USD. All figures are advisory estimates and do not
          constitute audited financial statements.
        </p>
      </main>
    </div>
  );
}
