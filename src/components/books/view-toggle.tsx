"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Grid3X3, List } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface ViewToggleProps {
  currentView: string
}

export function ViewToggle({ currentView }: ViewToggleProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateView = (view: string) => {
    if (view && view !== currentView) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("view", view)
      // Don't reset page when changing view
      router.push(`/admin/books?${params.toString()}`)
    }
  }

  return (
    <ToggleGroup type="single" value={currentView} onValueChange={updateView}>
      <ToggleGroupItem value="grid" aria-label="Visualização em grade" className="px-3">
        <Grid3X3 className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="Visualização em lista" className="px-3">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
