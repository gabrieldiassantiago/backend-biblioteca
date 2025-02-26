'use client'; // Marca o componente como Client Component

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function StockInput({ value, onChange, id, name }: { value: string | number; onChange: (value: string) => void; id: string; name: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        Estoque
      </Label>
      <Input
        id={id}
        name={name}
        type="number"
        min="1"
        required
        value={value}
        className="border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        onChange={(e) => {
          const value = e.target.value;
          if (!/^\d+$/.test(value) || parseInt(value, 10) < 1) {
            e.target.value = '1'; // Força o valor mínimo
          } else {
            onChange(value); // Atualiza o valor pai
          }
        }}
      />
    </div>
  );
}