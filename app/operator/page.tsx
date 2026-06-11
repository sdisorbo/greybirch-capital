import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Nav from "@/components/Nav";
import OperatorTabs from "@/components/OperatorTabs";

export default async function OperatorPage() {
  const session = await getSession();
  if (!session.user)                    redirect("/login");
  if (session.user.role !== "operator") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white">
      <Nav role="operator" />

      {/* Green header band matching nav */}
      <div style={{ background: "#3C443D" }} className="pt-20 pb-10 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase font-sans mb-2" style={{ color: "rgba(231,220,70,0.7)" }}>
            Operator View
          </p>
          <h1 className="font-serif text-3xl font-medium text-white">Command Center</h1>
          <div className="w-6 h-1 mt-4 rounded-full" style={{ background: "#E7DC46" }} />
        </div>
      </div>

      <main className="pt-8 pb-20">
        <OperatorTabs />
      </main>
    </div>
  );
}
