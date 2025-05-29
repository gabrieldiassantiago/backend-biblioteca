export interface Library {
    id: string
    name: string
    location: string | null
    contact_email: string | null
  }
  
  export interface Book {
    id: string
    library_id: string
    title: string
    author: string
    isbn: string
    stock: number
    available: number
    created_at: string
    updated_at: string
    image_url: string | null
  }
  
  export interface BookFormData {
    id?: string
    title: string
    author: string
    isbn: string
    stock: number
    available: number
    library_id: string
    image_url: string | null
  }
  