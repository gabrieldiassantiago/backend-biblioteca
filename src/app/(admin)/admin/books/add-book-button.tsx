"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BookForm } from "./book-form";

export function AddBookButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Livro
      </Button>
      <BookForm open={open} onOpenChange={setOpen} />
    </>
  );
}