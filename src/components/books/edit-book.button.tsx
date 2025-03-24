'use client';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { BookForm } from "./book-form";

type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  stock: number;
  available: number;
  library_id: string;
  created_at: string;
  updated_at: string;
};

type EditBookButtonProps = {
  book: Book;
};

export function EditBookButton({ book }: EditBookButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <BookForm book={book} open={open} onOpenChange={setOpen} />
    </>
  );
}