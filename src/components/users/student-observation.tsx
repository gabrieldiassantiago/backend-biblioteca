"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { StickyNote, Save, Check } from "lucide-react"
import { updateStudentObservations } from "@/app/(admin)/admin/users/[id]/actions"
import { toast } from "sonner"

interface StudentObservationsProps {
  studentId: string
  initialObservations: string | null
}

export function StudentObservations({ studentId, initialObservations }: StudentObservationsProps) {
  const [observations, setObservations] = useState(initialObservations || "")
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedValue, setSavedValue] = useState(initialObservations || "")

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await updateStudentObservations(studentId, observations)
      setSavedValue(observations)
      setIsEditing(false)
      toast.success("Observações salvas com sucesso")
    } catch (error) {
      toast.error("Erro ao salvar observações")
      console.error("Erro ao salvar observações:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setObservations(savedValue)
    setIsEditing(false)
  }

  return (
    <Card className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-gray-100">
        <CardTitle className="text-lg font-medium flex items-center text-gray-800">
          <StickyNote className="mr-2 h-5 w-5 text-blue-600" />
          Observações sobre o Aluno
        </CardTitle>
        <CardDescription className="text-gray-500">Registre informações importantes sobre o aluno</CardDescription>
      </CardHeader>
      <CardContent className="p-5">
        {isEditing ? (
          <Textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Adicione observações sobre o aluno..."
            className="min-h-[150px] resize-none border-gray-200 focus-visible:ring-blue-500"
          />
        ) : (
          <div
            className="min-h-[150px] p-3 rounded-md border border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
            onClick={() => setIsEditing(true)}
          >
            {savedValue ? (
              <p className="text-gray-700 whitespace-pre-wrap">{savedValue}</p>
            ) : (
              <p className="text-gray-400 italic">Clique para adicionar observações sobre o aluno...</p>
            )}
          </div>
        )}
      </CardContent>
      {isEditing && (
        <CardFooter className="pt-0 px-5 pb-5 flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} className="border-gray-200">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isSaving ? (
              <>
                <Save className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Salvar Observações
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

