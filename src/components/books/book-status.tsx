import { Badge } from "@/components/ui/badge"

interface BookStatusProps {
  available: number
  stock: number
}

export function BookStatus({ available, stock }: BookStatusProps) {
  // Determinar o status baseado na disponibilidade
  let variant: "default" | "secondary" | "destructive" | "outline" = "default"
  
  if (available === 0) {
    variant = "destructive"
  } else if (available < stock * 0.3) {
    variant = "secondary"
  }
  
  return (
    <Badge variant={variant} className="min-w-[2.5rem]">
      {available}
    </Badge>
  )
}
