import { FC } from "react";

//Componente de "pensando" otimizado com animação mais suave
export const Thinking: FC = () => (
  <div className="flex items-center gap-2">
    <div className="flex items-end gap-1">
      <span className="block w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '0.6s' }} />
      <span className="block w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '0.6s' }} />
      <span className="block w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '0.6s' }} />
    </div>
    <span className="text-sm text-gray-500">Pensando...</span>
  </div>
);

