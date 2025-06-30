import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as XLSX from "xlsx";
import { z } from "zod";

const bookSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  author: z.string().min(1, "Autor é obrigatório"),
  isbn: z.string().max(13, "ISBN deve ter no máximo 13 caracteres").optional().or(z.literal("")),
  stock: z.union([
    z.number().int().nonnegative("Estoque deve ser zero ou um número positivo"),
    z.string().regex(/^\d+$/, "Estoque deve ser um número inteiro ≥ 0").transform(Number),
  ]),
  available: z.union([
    z.number().int().nonnegative("Disponível deve ser zero ou um número positivo"),
    z.string().regex(/^\d+$/, "Disponível deve ser um número inteiro ≥ 0").transform(Number),
  ]),
});

// Expected headers (adjust if your Excel files use different names)
const EXPECTED_HEADERS = ["title", "author", "isbn", "stock", "available"];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    // Check file type (basic check)
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json({ error: "Formato de arquivo inválido. Use .xlsx ou .xls" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });

    const sheetName = workbook.SheetNames[0]; // Use the first sheet
    if (!sheetName) {
      return NextResponse.json({ error: "O arquivo Excel está vazio ou não contém planilhas." }, { status: 400 });
    }
    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON with header mapping
    const jsonData: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Get header row as the first array element
      blankrows: false, // Skip empty rows
    });

    if (jsonData.length < 2) {
      return NextResponse.json({ error: "Planilha não contém dados ou cabeçalhos." }, { status: 400 });
    }

    const headers: string[] = jsonData[0].map((h: string | number | undefined) => String(h).toLowerCase().trim());
    const headerMap: { [key: string]: string } = {}; // Maps expected header to actual header found

    // Validate Headers (Case-insensitive and flexible)
    const missingHeaders = [];
    for (const expectedHeader of EXPECTED_HEADERS) {
      const foundHeader = headers.find(h => h === expectedHeader);
      if (foundHeader) {
        headerMap[expectedHeader] = foundHeader;
      } else {
        // Try partial matches or common variations if needed (optional enhancement)
        missingHeaders.push(expectedHeader);
      }
    }

    if (missingHeaders.length > 0) {
      return NextResponse.json({
        error: `Cabeçalhos ausentes ou incorretos na planilha. Esperado: ${EXPECTED_HEADERS.join(", ")}. Faltando/Diferente: ${missingHeaders.join(", ")}. Encontrado: ${headers.join(", ")}`,
      }, { status: 400 });
    }

    const booksData = jsonData.slice(1).map((row: (string | number | undefined)[]) => {
      const rowData: { [key: string]: string | number | undefined } = {};
      EXPECTED_HEADERS.forEach((expectedHeader) => {
        const actualHeader = headerMap[expectedHeader];
        const headerIndex = headers.indexOf(actualHeader);
        if (headerIndex !== -1) {
          rowData[expectedHeader] = row[headerIndex];
        }
      });
      return rowData;
    });

    const validBooks = [];
    const validationErrors = [];

    for (let i = 0; i < booksData.length; i++) {
      const row = booksData[i];
      const parseResult = bookSchema.safeParse(row);

      if (parseResult.success) {
        // Ensure 'available' is not greater than 'stock' after parsing
        if (parseResult.data.available > parseResult.data.stock) {
          validationErrors.push({ row: i + 2, error: `Disponível (${parseResult.data.available}) não pode ser maior que o Estoque (${parseResult.data.stock}).` });
        } else {
          validBooks.push(parseResult.data);
        }
      } else {
        const errors = parseResult.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ");
        validationErrors.push({ row: i + 2, error: errors }); // i+2 because data starts at row 2 (1-based index)
      }
    }

    if (validBooks.length === 0 && validationErrors.length > 0) {
      return NextResponse.json({
        error: "Nenhum livro válido encontrado no arquivo. Verifique os erros.",
        details: validationErrors,
      }, { status: 400 });
    }

    // Return processed data
    return NextResponse.json({
      success: true,
      fileName: file.name,
      totalRows: booksData.length,
      validBooksCount: validBooks.length,
      errorsCount: validationErrors.length,
      validBooks: validBooks, // Send valid books back to the frontend
      validationErrors: validationErrors, // Send errors back for reporting
    });
  } catch (error) {
    console.error("Erro ao processar arquivo Excel:", error);
    if (error instanceof Error) {
      // Handle specific XLSX errors if needed
      if (error.message.includes("Cannot find file")) {
        return NextResponse.json({ error: "Erro ao ler o arquivo. Pode estar corrompido." }, { status: 400 });
      }
      return NextResponse.json({ error: `Erro interno ao processar: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: "Erro desconhecido ao processar arquivo Excel" }, { status: 500 });
  }
}