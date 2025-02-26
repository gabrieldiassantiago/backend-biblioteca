// src/app/(admin)/admin/loans/update-loan-form.tsx
"use server";

import { updateLoanStatus } from "./actions";



export async function UpdateLoanForm({ loanId }: { loanId: string }) {
  return (
    <div className="flex flex-col">
      <form action={updateLoanStatus.bind(null, loanId, "active")}>
        <button type="submit" className="w-full text-left px-2 py-1 hover:bg-gray-100">
          Ativo
        </button>
      </form>
      <form action={updateLoanStatus.bind(null, loanId, "returned")}>
        <button type="submit" className="w-full text-left px-2 py-1 hover:bg-gray-100">
          Devolvido
        </button>
      </form>
      <form action={updateLoanStatus.bind(null, loanId, "overdue")}>
        <button type="submit" className="w-full text-left px-2 py-1 hover:bg-gray-100">
          Atrasado
        </button>
      </form>
    </div>
  );
}