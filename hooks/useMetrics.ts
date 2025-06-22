import { useState, useEffect } from 'react';

// Interface para os dados de métricas
interface MetricsData {
  ip?: string;
  location?: string;
  device?: string;
  browser?: string;
  os?: string;
}

export const useMetrics = () => {
  const [metrics, setMetrics] = useState<MetricsData>({});
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar se as métricas já foram registradas para este cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const metricsRegistered = localStorage.getItem('metrics_registered');
      if (metricsRegistered === 'true') {
        setIsRegistered(true);
      }
    }
  }, []);

  // Função para coletar dados do dispositivo
  const collectDeviceData = async (): Promise<MetricsData> => {
    // Verifica se está rodando no navegador (não no servidor)
    if (typeof window === 'undefined') {
      return {};
    }

    // Dados do navegador e sistema operacional
    const userAgent = navigator.userAgent;
    const browser = detectBrowser(userAgent);
    const os = detectOS(userAgent);
    const device = detectDevice(userAgent);

    // Primeiro tenta IPWHOIS API
    try {
      console.log('Tentando IPWHOIS API...');
      const response = await fetch('http://ipwho.is/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('IPWHOIS API funcionou:', data);
        
        return {
          ip: data.ip,
          location: `${data.city}, ${data.region}, ${data.country}`,
          device,
          browser,
          os,
        };
      } else {
        throw new Error(`IPWHOIS API falhou: ${response.status}`);
      }
    } catch (error) {
      console.error('IPWHOIS API falhou, tentando IPAPI como fallback:', error);
      
      // Fallback para IPAPI
      try {
        console.log('Tentando IPAPI como fallback...');
        const response = await fetch('https://ipapi.co/json/');
        
        if (response.ok) {
          const data = await response.json();
          console.log('IPAPI fallback funcionou:', data);
          
          return {
            ip: data.ip,
            location: `${data.city}, ${data.region}, ${data.country_name}`,
            device,
            browser,
            os,
          };
        } else {
          throw new Error(`IPAPI falhou: ${response.status}`);
        }
      } catch (fallbackError) {
        console.error('Ambas as APIs falharam:', fallbackError);
        
        // Retorna apenas os dados do dispositivo se ambas as APIs falharem
        return {
          device,
          browser,
          os,
        };
      }
    }
  };

  // Função para detectar o navegador
  const detectBrowser = (userAgent: string): string => {
    if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
    if (userAgent.indexOf('Safari') > -1) return 'Safari';
    if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
    if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident/') > -1) return 'Internet Explorer';
    if (userAgent.indexOf('Edge') > -1) return 'Edge';
    return 'Unknown';
  };

  // Função para detectar o sistema operacional
  const detectOS = (userAgent: string): string => {
    if (userAgent.indexOf('Windows') > -1) return 'Windows';
    if (userAgent.indexOf('Mac') > -1) return 'MacOS';
    if (userAgent.indexOf('Linux') > -1) return 'Linux';
    if (userAgent.indexOf('Android') > -1) return 'Android';
    if (userAgent.indexOf('iOS') > -1 || userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1) return 'iOS';
    return 'Unknown';
  };

  // Função para detectar o tipo de dispositivo
  const detectDevice = (userAgent: string): string => {
    if (userAgent.indexOf('Mobile') > -1) return 'Mobile';
    if (userAgent.indexOf('Tablet') > -1) return 'Tablet';
    return 'Desktop';
  };

  // Função para registrar a visita
  const registerVisit = async () => {
    // Verifica se já foi registrado para evitar múltiplos registros
    if (isRegistered || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const deviceData = await collectDeviceData();
      setMetrics(deviceData);

      // Enviar dados para o backend (simulado por console.log)
      console.log('Métricas registradas:', deviceData);
      
      // Marcar como registrado no localStorage para evitar múltiplos envios
      if (typeof window !== 'undefined') {
        localStorage.setItem('metrics_registered', 'true');
        setIsRegistered(true);
      }
    } catch (error) {
      console.error('Erro ao registrar métricas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    metrics,
    registerVisit,
    isRegistered,
    isLoading
  };
}; 