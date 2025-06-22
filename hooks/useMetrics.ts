import { useState, useEffect, useRef } from 'react';

export const useMetrics = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const hasRegistered = useRef(false);

  // Verifica se já foi enviado
  useEffect(() => {
    // Verifica se está no navegador
    if (typeof window === 'undefined') return;
    
    // Verifica se já foi registrado nesta sessão
    const sessionRegistered = sessionStorage.getItem('metrics_registered');
    const userId = generateUserId(); // Fingerprint único
    const localRegistered = localStorage.getItem(`metrics_registered_${userId}`);
    
    if (sessionRegistered === 'true' || localRegistered === 'true') {
      setIsRegistered(true);
      hasRegistered.current = true;
    }
  }, []);

  const registerVisit = async () => {
    // Verifica se está no navegador
    if (typeof window === 'undefined') return;
    
    // Evita envios duplicados
    if (hasRegistered.current || isRegistered) {
      console.log('Visita já registrada, não enviando novamente');
      return;
    }

    try {
      console.log('Registrando visita...');
      
      // Coleta dados do cliente
      const userId = generateUserId();
      const ip = await getClientIP();
      const location = ip ? await getLocationData(ip) : { country: 'BR', city: 'São Paulo' };
      
      const metricsData = {
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

      // Envia para API de métricas
      const response = await fetch('https://servidoroperador.onrender.com/api/metrics/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metricsData)
      });

      if (response.ok) {
        console.log('Visita registrada com sucesso');
        
        // Marca como enviado
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

// Função que captura IP real do usuário
const getClientIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.log('Erro ao capturar IP:', error);
    return '';
  }
};

// Função que pega país e cidade pelo IP
const getLocationData = async (ip: string) => {
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

// Função que detecta se é Mobile, Tablet ou Desktop
const getDeviceType = () => {
  if (typeof window === 'undefined') return 'Unknown';
  
  const userAgent = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'Tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    return 'Mobile';
  }
  return 'Desktop';
};

// Função que detecta navegador e versão
const getBrowser = () => {
  if (typeof window === 'undefined') return 'Unknown';
  
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

// Função que detecta Windows, Mac, Linux, Android, iOS
const getOS = () => {
  if (typeof window === 'undefined') return 'Unknown';
  
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
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    const version = userAgent.match(/OS (\d+_\d+)/)?.[1]?.replace(/_/g, '.') || '';
    return `iOS ${version}`;
  }
  return 'Unknown';
};

// Gera ID único para o usuário
const generateUserId = () => {
  if (typeof window === 'undefined') return 'server-side';
  
  // Coleta informações do navegador
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.width,
    screen.height,
    screen.colorDepth,
    // @ts-ignore - deviceMemory não existe em todos os navegadores
    navigator.hardwareConcurrency || 'unknown',
    // @ts-ignore - deviceMemory não existe em todos os navegadores
    navigator.deviceMemory || 'unknown',
    navigator.platform || 'unknown'
  ].join('|');
  
  // Hash simples
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
}; 