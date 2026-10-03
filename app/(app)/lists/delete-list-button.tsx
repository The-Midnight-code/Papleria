"use client";

import { createPortal } from "react-dom";
import { useState } from "react";

import { deleteList } from "./actions";

type DeleteListButtonProps = {
  listId: string;
  listName: string;
};

type DeleteListModalProps = {
  listName: string;
  error: string | null;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function DeleteListModal({
  listName,
  error,
  isPending,
  onCancel,
  onConfirm,
}: DeleteListModalProps) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-xl">
            🗑️
          </div>

          <h2 className="text-lg font-bold text-gray-900">Eliminar lista</h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            ¿Deseas eliminar la lista{" "}
            <span className="font-semibold text-gray-900">{listName}</span>?
          </p>

          <p className="mt-2 text-sm leading-6 text-red-600">
            Esta acción no se puede deshacer.
          </p>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Eliminando..." : "Eliminar lista"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function DeleteListButton({ listId, listName }: DeleteListButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function handleClick() {
    if (isPending) return;

    setError(null);
    setShowConfirmation(true);
  }

  async function handleDelete() {
    setIsPending(true);
    setError(null);

    try {
      const result = await deleteList(listId);

      if (result?.error) {
        setError(result.error);
        return;
      }

      setShowConfirmation(false);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Eliminando..." : "Eliminar"}
      </button>

      {showConfirmation && (
        <DeleteListModal
          listName={listName}
          error={error}
          isPending={isPending}
          onCancel={() => setShowConfirmation(false)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
