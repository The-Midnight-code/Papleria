import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#7F27A8] px-4">
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[#FFD400] opacity-90" />

      <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[#53B0C9] opacity-80" />

      <div className="absolute right-1/4 top-20 h-32 w-32 rounded-full bg-[#F76400] opacity-70" />

      <div className="absolute bottom-20 left-1/4 h-24 w-24 rounded-full bg-[#E885CF] opacity-70" />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-700 text-3xl">
            📋
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Papelería</h1>

          <p className="mt-2 text-sm text-gray-500">
            Inicia sesión para continuar
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
