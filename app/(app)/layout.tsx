import Navbar from "./navbar";
import { requireUser } from "@/lib/auth/authorization";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#7F27A8]">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Círculos */}
        <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-[#FFD400] opacity-90" />
        <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-[#53B0C9] opacity-80" />
        <div className="absolute right-1/4 top-24 h-40 w-40 rounded-full bg-[#F76400] opacity-70" />
        <div className="absolute bottom-24 left-1/4 h-32 w-32 rounded-full bg-[#E885CF] opacity-70" />
        {/* Triángulo */}
        <div
          className="absolute left-[8%] top-[42%] h-0 w-0 opacity-60"
          style={{
            borderLeft: "70px solid transparent",
            borderRight: "70px solid transparent",
            borderBottom: "120px solid #FFD400",
            transform: "rotate(18deg)",
          }}
        />
        {/* Espiral */}
        <div className="absolute right-[8%] top-[55%] h-40 w-40 opacity-50">
          <div className="absolute inset-0 rounded-full border-[8px] border-[#E885CF]" />
          <div className="absolute inset-5 rounded-full border-[8px] border-[#E885CF]" />
          <div className="absolute inset-10 rounded-full border-[8px] border-[#E885CF]" />
          <div className="absolute inset-[60px] rounded-full border-[8px] border-[#E885CF]" />
        </div>
        {/* Rombo */}
        <div
          className="absolute bottom-[18%] right-[28%] h-24 w-24 rotate-45 opacity-35"
          style={{
            backgroundColor: "#53B0C9",
          }}
        />
        {/* Línea diagonal */}
        <div
          className="absolute left-[32%] top-[18%] h-2 w-32 -rotate-45 rounded-full opacity-40"
          style={{
            backgroundColor: "#F76400",
          }}
        />
      </div>

      {/* Navbar */}
      <Navbar user={user} />

      {/* Content */}
      <main className="relative z-10 mx-auto max-w-7xl">{children}</main>
    </div>
  );
}
