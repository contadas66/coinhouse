
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, ArrowLeft } from "lucide-react";

const keyboardLayout = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "backspace"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["shift", "z", "x", "c", "v", "b", "n", "m", "enter", "cancel"],
];

interface VirtualKeyboardModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  initialValue?: string;
}

export const VirtualKeyboardModal: React.FC<VirtualKeyboardModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialValue = "",
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [shift, setShift] = useState(false);

  // Reset input when modal is opened
  React.useEffect(() => {
    if (open) {
      setInputValue(initialValue || "");
      setShift(false);
    }
  }, [open, initialValue]);

  function handleKey(key: string) {
    if (key === "backspace") {
      setInputValue((v) => v.slice(0, -1));
    } else if (key === "enter") {
      onSubmit(inputValue);
      onClose();
    } else if (key === "cancel") {
      onClose();
    } else if (key === "shift") {
      setShift((v) => !v);
    } else {
      setInputValue((v) => v + (shift ? key.toUpperCase() : key));
      if (shift) setShift(false); // auto-disable shift after a char
    }
  }

  function renderButton(key: string) {
    // Estilo padrão dos botões
    let className = `
      flex justify-center items-center rounded-lg text-sm font-medium 
      mx-1 my-1 shadow-sm bg-white border border-gray-300 
      hover:bg-gray-50 active:bg-gray-200 transition-all duration-150
      h-9 w-9
    `.trim();
    
    // Conteúdo do botão
    let children: React.ReactNode = key;
    
    // Aplicar maiúscula visual quando shift estiver ativo
    if (shift && /^[a-z]$/.test(key)) {
      children = key.toUpperCase();
    }

    if (key === "backspace") {
      className = `
        flex justify-center items-center rounded-lg bg-gray-600 text-white
        h-9 w-9 mx-1 my-1 shadow-sm
        hover:bg-gray-700 active:bg-gray-800 transition-all duration-150
      `.trim();
      children = <ArrowLeft size={16} />;
    }
    
    if (key === "shift") {
      className = `
        flex justify-center items-center rounded-lg mx-1 my-1 shadow-sm
        h-9 w-9 transition-all duration-150 font-bold text-sm
        ${shift 
          ? "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800" 
          : "bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800"
        }
      `.trim();
      children = "⇧";
    }
    
    if (key === "enter") {
      className = `
        flex justify-center items-center rounded-lg bg-green-600 text-white
        h-9 w-9 mx-1 my-1 shadow-sm
        hover:bg-green-700 active:bg-green-800 transition-all duration-150
      `.trim();
      children = <Check size={16} />;
    }
    
    if (key === "cancel") {
      className = `
        flex justify-center items-center rounded-lg bg-red-600 text-white
        h-9 w-9 mx-1 my-1 shadow-sm
        hover:bg-red-700 active:bg-red-800 transition-all duration-150
      `.trim();
      children = <X size={16} />;
    }

    return (
      <button
        key={key}
        type="button"
        tabIndex={-1}
        className={className}
        onClick={() => handleKey(key)}
        aria-label={key}
      >
        {children}
      </button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full mx-auto p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-lg mb-4">Digite sua senha</DialogTitle>
        </DialogHeader>
        
        {/* Input box */}
        <div className="mb-6 flex justify-center">
          <input
            disabled
            className="w-full max-w-xs h-12 bg-white border-2 border-orange-200 rounded-lg text-center text-xl font-bold shadow-inner"
            value={inputValue.replace(/./g, "•")}
            style={{ letterSpacing: "8px" }}
            readOnly
          />
        </div>
        
        {/* Keyboard - Exatamente como na imagem */}
        <div className="flex flex-col items-center justify-center select-none bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
          {keyboardLayout.map((row, rowIdx) => (
            <div key={rowIdx} className="flex flex-row justify-center mb-2 last:mb-0">
              {row.map((key) => renderButton(key))}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
