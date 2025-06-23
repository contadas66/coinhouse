import { useState, useEffect, useRef } from 'react';

// Função que captura IP e localização usando IPWHOIS como principal e IPAPI como fallback
const getIPAndLocation = async () => {
  // Primeiro tenta IPWHOIS API com HTTPS
  try {
    console.log('Tentando IPWHOIS API...');
    
    // Criar timeout manual para compatibilidade
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch('https://ipwho.is/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('IPWHOIS API funcionou:', data);
      
      // Verifica se os dados são válidos
      if (data && data.ip && data.success !== false) {
        return {
          ip: data.ip,
          country: data.country_code || 'BR',
          city: data.city || 'São Paulo'
        };
      } else {
        throw new Error('IPWHOIS retornou dados inválidos');
      }
    } else {
      throw new Error(`IPWHOIS API falhou: ${response.status}`);
    }
  } catch (error) {
    console.log('IPWHOIS API falhou, tentando IPAPI como fallback:', error);
    
    // Fallback para IPAPI
    try {
      console.log('Tentando IPAPI como fallback...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('IPAPI fallback funcionou:', data);
        
        // Verifica se os dados são válidos
        if (data && data.ip && !data.error) {
          return {
            ip: data.ip,
            country: data.country_code || 'BR',
            city: data.city || 'São Paulo'
          };
        } else {
          throw new Error('IPAPI retornou dados inválidos');
        }
      } else {
        throw new Error(`IPAPI falhou: ${response.status}`);
      }
    } catch (fallbackError) {
      console.log('Ambas as APIs falharam:', fallbackError);
      
      // Retorna dados padrão se ambas falharem
      return {
        ip: 'Unknown',
        country: 'BR',
        city: 'São Paulo'
      };
    }
  }
};

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

// Função que detecta navegador e versão
const getBrowser = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'Unknown';
  
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
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'Unknown';
  
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

// Função que cria ID único baseado no navegador
const generateUserId = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Math.random().toString(36).substr(2, 9);
  }
  
  try {
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
    
    // Hash simples
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(36);
  } catch (error) {
    console.log('Erro ao gerar fingerprint, usando ID aleatório:', error);
    return Math.random().toString(36).substr(2, 9);
  }
};

// Hook useMetrics.ts
export const useMetrics = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const hasRegistered = useRef(false);

  // ✅ VERIFICA SE JÁ FOI ENVIADO
  useEffect(() => {
    // Só executa no cliente
    if (typeof window === 'undefined') return;
    
    try {
      // Verifica se já foi registrado por client ID
      const clientId = localStorage.getItem('client_id');
      const sessionRegistered = sessionStorage.getItem('metrics_registered');
      const metricsRegistered = localStorage.getItem(`metrics_registered_${clientId}`);
      
      if (sessionRegistered === 'true' || metricsRegistered === 'true') {
        setIsRegistered(true);
        hasRegistered.current = true;
      }
    } catch (error) {
      console.log('Erro ao verificar registro de métricas:', error);
    }
  }, []);

  const registerVisit = async () => {
    console.log('🚀 registerVisit chamado');
    
    // Só executa no cliente
    if (typeof window === 'undefined') {
      console.log('❌ Não está no cliente, saindo');
      return;
    }
    
    // 🚫 EVITA ENVIOS DUPLICADOS
    if (hasRegistered.current || isRegistered) {
      console.log('❌ Visita já registrada, não enviando novamente');
      return;
    }

    try {
      // 🔒 DUPLA VERIFICAÇÃO ANTES DE ENVIAR
      const clientId = localStorage.getItem('client_id') || generateUserId();
      const alreadyRegistered = localStorage.getItem(`metrics_registered_${clientId}`);
      
      console.log('🔍 Verificando client:', { clientId, alreadyRegistered });
      
      if (alreadyRegistered === 'true') {
        console.log(`❌ Métricas já enviadas para client ${clientId}, pulando envio`);
        setIsRegistered(true);
        hasRegistered.current = true;
        return;
      }

      console.log('✅ Iniciando registro de visita...');
      
      // 🔍 COLETA DADOS DO CLIENTE (usar o mesmo clientId da verificação)
      console.log('📍 Coletando dados de localização...');
      const ipLocationData = await getIPAndLocation();
      console.log('📍 Dados de localização coletados:', ipLocationData);
      
      // 💾 SALVA dados para reutilização pelo registerClient (FLUXO CORRETO)
      const locationData = {
        ip: ipLocationData.ip,
        country: ipLocationData.country,
        city: ipLocationData.city
      };
      sessionStorage.setItem('metrics_data', JSON.stringify(locationData));
      console.log('💾 Dados salvos para reutilização:', locationData);
      
      const metricsData = {
        page: window.location.pathname || '/',
        referrer: document.referrer || 'direct',
        ip: ipLocationData.ip,
        userAgent: navigator.userAgent,
        device: getDeviceType(),
        browser: getBrowser(),
        os: getOS(),
        country: ipLocationData.country,
        city: ipLocationData.city
      };

      console.log('📊 Dados de métricas preparados:', metricsData);

      // 🚀 ENVIA PARA API DE MÉTRICAS
      console.log('🌐 Enviando para API...');
      const response = await fetch('https://servidoroperador.onrender.com/api/metrics/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metricsData)
      });

      console.log('🌐 Resposta da API:', response.status, response.statusText);

      if (response.ok) {
        console.log('✅ Visita registrada com sucesso');
        
        // ✅ MARCA COMO ENVIADO POR CLIENT ID
        sessionStorage.setItem('metrics_registered', 'true');
        localStorage.setItem(`metrics_registered_${clientId}`, 'true');
        
        setIsRegistered(true);
        hasRegistered.current = true;
      } else {
        const errorData = await response.text();
        console.log('❌ Erro ao registrar visita:', response.status, errorData);
      }

    } catch (error) {
      console.log('❌ Erro durante registro de visita:', error);
    }
  };

  return {
    registerVisit,
    isRegistered
  };
}; 