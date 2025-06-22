
import { useState, useEffect, useRef } from 'react';

interface MetricsData {
  page?: string;
  referrer?: string;
  ip?: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
}

interface UseMetricsReturn {
  registerVisit: () => Promise<void>;
  isRegistered: boolean;
}

// Função para detectar tipo de dispositivo
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

// Função para detectar browser
const getBrowser = (): string => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Firefox')) {
    const version = userAgent.match(/Firefox\/(\d+)/)?.[1] || '';
    return `Firefox ${version}`;
  }
  if (userAgent.includes('Chrome')) {
    const version = userAgent.match(/Chrome\/(\d+)/)?.[1] || '';
    return `Chrome ${version}`;
  }
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const version = userAgent.match(/Version\/(\d+)/)?.[1] || '';
    return `Safari ${version}`;
  }
  if (userAgent.includes('Edge')) {
    const version = userAgent.match(/Edge\/(\d+)/)?.[1] || '';
    return `Edge ${version}`;
  }
  return 'Unknown';
};

// Função para detectar OS
const getOS = (): string => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Windows NT 10.0')) return 'Windows 10';
  if (userAgent.includes('Windows NT 6.3')) return 'Windows 8.1';
  if (userAgent.includes('Windows NT 6.1')) return 'Windows 7';
  if (userAgent.includes('Mac OS X')) {
    const version = userAgent.match(/Mac OS X (\d+_\d+_?\d*)/)?.[1]?.replace(/_/g, '.') || '';
    return `macOS ${version}`;
  }
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) {
    const version = userAgent.match(/Android (\d+\.?\d*)/)?.[1] || '';
    return `Android ${version}`;
  }
  if (userAgent.includes('iPhone OS')) {
    const version = userAgent.match(/OS (\d+_\d+_?\d*)/)?.[1]?.replace(/_/g, '.') || '';
    return `iOS ${version}`;
  }
  return 'Unknown';
};

// Função para capturar IP público
const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.log('Erro ao capturar IP:', error);
    return '';
  }
};

// Função para capturar dados de localização
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

// Função para gerar ID único do usuário baseado em fingerprint
const generateUserId = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Fingerprint test', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
};

export const useMetrics = (): UseMetricsReturn => {
  const [isRegistered, setIsRegistered] = useState(false);
  const hasRegistered = useRef(false);

  useEffect(() => {
    // Verificar se já foi registrado nesta sessão
    const sessionRegistered = sessionStorage.getItem('metrics_registered');
    const userId = generateUserId();
    const localRegistered = localStorage.getItem(`metrics_registered_${userId}`);
    
    if (sessionRegistered === 'true' || localRegistered === 'true') {
      setIsRegistered(true);
      hasRegistered.current = true;
    }
  }, []);

  const registerVisit = async (): Promise<void> => {
    // Evitar registros duplicados
    if (hasRegistered.current || isRegistered) {
      console.log('Visita já registrada, não enviando novamente');
      return;
    }

    try {
      console.log('Registrando visita...');
      
      const userId = generateUserId();
      const ip = await getClientIP();
      const location = ip ? await getLocationData(ip) : { country: 'BR', city: 'São Paulo' };
      
      const metricsData: MetricsData = {
        page: window.location.pathname || '/',
        referrer: document.referrer || 'direct',
        ip: ip,
        userAgent: navigator.userAgent,
        device: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        country: location.country,
        city: location.city
      };

      console.log('Dados de métricas preparados:', metricsData);

      const response = await fetch('https://servidoroperador.onrender.com/api/metrics/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metricsData)
      });

      if (response.ok) {
        console.log('Visita registrada com sucesso');
        
        // Marcar como registrado na sessão e localmente
        sessionStorage.setItem('metrics_registered', 'true');
        localStorage.setItem(`metrics_registered_${userId}`, 'true');
        
        setIsRegistered(true);
        hasRegistered.current = true;
      } else {
        const errorData = await response.text();
        console.log('Erro ao registrar visita:', errorData);
      }

    } catch (error) {
      console.log('Erro durante registro de visita:', error);
    }
  };

  return {
    registerVisit,
    isRegistered
  };
};
