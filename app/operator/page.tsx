import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Nav from "@/components/Nav";
import PitchDashboard from "@/components/PitchDashboard";
import FundDashboard from "@/components/FundDashboard";

export default async function OperatorPage() {
  const session = await getSession();
  if (!session.user)                    redirect("/login");
  if (session.user.role !== "operator") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-stone-100">
      <Nav role="operator" />

      <main className="pt-28 pb-20">
        {/* Page header */}
        <div className="max-w-6xl mx-auto px-6 mb-8">
          <p className="text-xs tracking-[0.2em] uppercase text-stone-400 mb-2 font-sans">
            Operator View
          </p>
          <h1 className="font-serif text-3xl font-medium text-stone-900">
            Command Center
          </h1>
          <div className="w-6 h-px bg-stone-300 mt-3" />
        </div>

        {/* Tabs */}
        <OperatorTabs />
      </main>
    </div>
  );
}

// Tab wrapper — client rendered for interactivity
import OperatorTabs from "@/components/OperatorTabs";
