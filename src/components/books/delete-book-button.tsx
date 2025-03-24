"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AlertCircle, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { handleDeleteBook } from "../../app/(admin)/admin/books/actions"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"

interface DeleteBookButtonProps {
  bookId: string
}

export function DeleteBookButton({ bookId }: DeleteBookButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'success' | 'error'>('idle')

  async function onDelete() {
    setIsLoading(true)
    try {
      await handleDeleteBook(bookId)
      setDeleteStatus('success')
      router.refresh()
      setTimeout(() => {
        setDeleteStatus('idle')
      }, 3000)
    } catch (error) {
      console.error(error)
      setDeleteStatus('error')
      setTimeout(() => {
        setDeleteStatus('idle')
      }, 3000)
    } finally {
      setIsLoading(false)
      setOpen(false)
    }
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Toast de Sucesso */}
      {deleteStatus === 'success' && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
          <div className="bg-green-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Livro excluído com sucesso!</span>
          </div>
        </div>
      )}

      {deleteStatus === 'error' && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-bottom-4 bg-white shadow-lg rounded-md p-4">
        <Alert variant="destructive">
         <AlertCircle className="h-4 w-4" />
         <AlertTitle>Ocorreu um erro ao excluir o livro.</AlertTitle>
         <AlertDescription>
         Entre em contato com o suporte para resolver este problema.
         </AlertDescription>
       </Alert>
        </div>
      )}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Você tem certeza?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Esta ação não pode ser desfeita. Isso excluirá permanentemente este livro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={onDelete} 
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 transition-colors text-white"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Excluindo...
                </div>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}