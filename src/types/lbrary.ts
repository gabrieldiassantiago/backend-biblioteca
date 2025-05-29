export interface Library {
    id: string;
    name: string;
    location?: string | null;
    contact_email?: string | null;
    created_at: string;
    updated_at: string;
  }
  
  export interface Book {
    id: string;
    library_id: string;
    title: string;
    author: string;
    isbn?: string | null;
    stock: number;
    available: number;
    created_at: string;
    image_url?: string | null;
    updated_at: string;
  }
  
  export interface User {
    id: string;
    email: string | undefined;
    full_name?: string | undefined;
  }
  
  export interface LibraryClientProps {
    library: Library;
    books: Book[];
    count: number | null;
    params: { slug: string };
    searchQuery: string;
    page: number;
    limit: number;
    user: User | null;
    isSearched: boolean;
  }