"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Funções auxiliares comuns a livros
async function getUserLibraryId() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/login');
  const { data: userData } = await supabase
    .from('users')
    .select('library_id')
    .eq('id', user.id)
    .single();
  return userData?.library_id;
}

export async function handleSubmitBook(formData: FormData) {
  const supabase = await createClient();
  const libraryId = await getUserLibraryId();
  const bookId = formData.get('id') as string | null;
  const title = formData.get('title') as string;
  const author = formData.get('author') as string;
  const isbn = formData.get('isbn') as string;
  const stock = parseInt(formData.get('stock') as string, 10);
  const available = parseInt(formData.get('available') as string, 10);

  if (isNaN(stock) || stock < 0 || isNaN(available) || available < 0 || available > stock) {
    throw new Error('Quantidades inválidas');
  }

  // 1. Lógica para salvar a imagem (via upload ou URL)
  let imageUrl = formData.get("image_url") as string;
  const file = formData.get("image_file") as File | null;

  if (file && file.size > 0) {
    const filename = `${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase
      .storage
      .from("book-covers") // Nome do bucket no Supabase
      .upload(filename, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw new Error("Erro ao subir imagem: " + uploadError.message);
    }

    imageUrl = supabase.storage.from("book-covers").getPublicUrl(filename).data.publicUrl;
  }

  // 2. Inserir ou atualizar o livro no banco
  if (bookId) {
    const { data: existing } = await supabase.from('books').select('library_id').eq('id', bookId).single();
    if (!existing) throw new Error('Livro não encontrado');

    await supabase
      .from('books')
      .update({
        title,
        author,
        isbn,
        stock,
        available,
        updated_at: new Date().toISOString(),
        image_url: imageUrl || null,
      })
      .eq('id', bookId)
      .eq('library_id', libraryId);
  } else {
    await supabase.from('books').insert({
      title,
      author,
      isbn,
      stock,
      available,
      library_id: libraryId,
      image_url: imageUrl || null,
    });
  }

  revalidatePath('/admin/books');
  revalidatePath('/dashboard');
}

export async function handleDeleteBook(bookId: string) {
  const supabase = await createClient();
  const libraryId = await getUserLibraryId();
  const { data: book } = await supabase.from('books').select('library_id').eq('id', bookId).single();
    if (!book) throw new Error('Livro não encontrado');

  const { data: loans } = await supabase
    .from('loans')
    .select('id')
    .eq('book_id', bookId)
    .eq('status', 'active')
    .limit(1);
if (loans && loans.length > 0) throw new Error('Não é possível excluir um livro com empréstimos ativos.');  

  await supabase.from('books').delete().eq('id', bookId).eq('library_id', libraryId);
  revalidatePath('/admin/books');
  revalidatePath('/dashboard');
}