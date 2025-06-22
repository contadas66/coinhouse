
import { useState, useCallback } from 'react';

export const useCpfValidation = () => {
  const [isValid, setIsValid] = useState<boolean | null>(null);

  // Função para formatar CPF com máscara
  const formatCpf = useCallback((value: string): string => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limitedNumbers = numbers.slice(0, 11);
    
    // Aplica a máscara
    return limitedNumbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }, []);

  // Função para validar CPF usando algoritmo oficial
  const validateCpf = useCallback((cpf: string): boolean => {
    // Remove pontos, traços e espaços
    const cleanCpf = cpf.replace(/[^\d]/g, '');
    
    // Verifica se tem 11 dígitos
    if (cleanCpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
    
    // Calcula o primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    // Verifica o primeiro dígito
    if (parseInt(cleanCpf.charAt(9)) !== digit1) return false;
    
    // Calcula o segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    // Verifica o segundo dígito
    return parseInt(cleanCpf.charAt(10)) === digit2;
  }, []);

  // Função para processar mudança no CPF
  const handleCpfChange = useCallback((value: string): { formatted: string; isValid: boolean | null } => {
    const formatted = formatCpf(value);
    const cleanValue = formatted.replace(/[^\d]/g, '');
    
    let validationResult: boolean | null = null;
    
    if (cleanValue.length === 11) {
      validationResult = validateCpf(formatted);
      setIsValid(validationResult);
    } else if (cleanValue.length > 0) {
      validationResult = null;
      setIsValid(null);
    } else {
      validationResult = null;
      setIsValid(null);
    }
    
    return { formatted, isValid: validationResult };
  }, [formatCpf, validateCpf]);

  // Função para resetar o estado de validação
  const reset = useCallback(() => {
    setIsValid(null);
  }, []);

  return {
    isValid,
    formatCpf,
    validateCpf,
    handleCpfChange,
    setIsValid,
    reset
  };
};
