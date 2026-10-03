"use client";

import { useState } from "react";

import { ResetPasswordForm } from "./reset-password-form";

type ResetPasswordButtonProps = {
  userId: string;
  username: string;
};

export function ResetPasswordButton({
  userId,
  username,
}: ResetPasswordButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg px-2 py-1 text-sm font-semibold text-[#176B7A] transition hover:bg-[#53B0C9]/15"
        title="Restablecer contraseña"
        aria-label={`Restablecer contraseña de ${username}`}
      >
        🔑
      </button>

      {isOpen && (
        <ResetPasswordForm
          userId={userId}
          username={username}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
