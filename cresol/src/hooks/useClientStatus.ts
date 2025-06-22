import { useEffect, useRef } from 'react';

interface ClientStatusHook {
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

export const useClientStatus = (): ClientStatusHook => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef<boolean>(false);
  const clientIdRef = useRef<string | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const pendingStatusRef = useRef<'online' | 'offline' | null>(null);
  const failureCountRef = useRef<number>(0);

  // Função para limpar clientId inválido
  const clearInvalidClientId = (): void => {
    console.log('ClientId inválido detectado - limpando localStorage');
    localStorage.removeItem('clientId');
    clientIdRef.current = null;
    failureCountRef.current = 0;
    
    // Disparar evento customizado para notificar outras partes da aplicação
    const event = new CustomEvent('invalidClientId');
    window.dispatchEvent(event);
  };

  // Função para atualizar status do cliente
  const updateClientStatus = async (status: 'online' | 'offline'): Promise<void> => {
    const clientId = localStorage.getItem('clientId');
    
    if (!clientId) {
      console.log('ClientId não encontrado no localStorage');
      return;
    }

    // Verificar se realmente precisa atualizar (evitar updates desnecessários)
    if (isOnlineRef.current === (status === 'online')) {
      console.log(`Status já é ${status}, não enviando update desnecessário`);
      return;
    }

    try {
      console.log(`Atualizando status do cliente ${clientId} para: ${status}`);
      
      const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status
        })
      });

      if (response.status === 404) {
        console.log('Cliente não encontrado (404) - clientId inválido');
        failureCountRef.current += 1;
        
        // Se 3 tentativas consecutivas falham com 404, limpar clientId
        if (failureCountRef.current >= 3) {
          clearInvalidClientId();
        }
        return;
      }

      if (response.ok) {
        console.log(`Status do cliente atualizado para: ${status}`);
        isOnlineRef.current = status === 'online';
        lastUpdateRef.current = Date.now();
        failureCountRef.current = 0; // Reset failure count on success
      } else {
        console.log(`Erro ao atualizar status para ${status}:`, response.status);
        failureCountRef.current += 1;
      }
    } catch (error) {
      console.log(`Erro durante atualização de status para ${status}:`, error);
      failureCountRef.current += 1;
    }
  };

  // Função throttled para enviar updates (máximo 1 por 10 segundos)
  const throttledUpdate = (status: 'online' | 'offline'): void => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    
    // Se já enviou um update há menos de 10 segundos, armazenar para enviar depois
    if (timeSinceLastUpdate < 10000) {
      pendingStatusRef.current = status;
      
      // Limpar throttle anterior se existir
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
      
      // Configurar novo throttle para enviar o update pendente
      const remainingTime = 10000 - timeSinceLastUpdate;
      throttleRef.current = setTimeout(() => {
        if (pendingStatusRef.current) {
          updateClientStatus(pendingStatusRef.current);
          pendingStatusRef.current = null;
        }
      }, remainingTime);
      
      console.log(`Update throttled - aguardando ${Math.ceil(remainingTime/1000)}s para próximo update`);
      return;
    }
    
    // Pode enviar imediatamente
    updateClientStatus(status);
  };

  // Função para resetar o timer de inatividade
  const resetInactivityTimer = (): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Configurar timer de 20 segundos para inatividade
    timeoutRef.current = setTimeout(() => {
      if (isOnlineRef.current) {
        throttledUpdate('offline');
      }
    }, 20000); // 20 segundos
  };

  // Função para marcar como online (com throttling)
  const setOnline = (): void => {
    // Só enviar update se realmente mudou o status
    if (!isOnlineRef.current) {
      throttledUpdate('online');
    }
    resetInactivityTimer();
  };

  // Função para marcar como offline (imediato, sem throttling)
  const setOffline = (): void => {
    if (isOnlineRef.current) {
      // Offline é crítico, enviar imediatamente
      updateClientStatus('offline');
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startMonitoring = (): void => {
    const clientId = localStorage.getItem('clientId');
    
    if (!clientId) {
      console.log('ClientId não encontrado - não iniciando monitoramento de status');
      return;
    }

    clientIdRef.current = clientId;
    failureCountRef.current = 0; // Reset failure count when starting monitoring
    console.log(`Iniciando monitoramento de status para cliente: ${clientId}`);

    updateClientStatus('online');

    let activityTimeout: NodeJS.Timeout | null = null;
    
    const debouncedActivity = () => {
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      
      activityTimeout = setTimeout(() => {
        setOnline();
      }, 2000);
    };

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    activityEvents.forEach(event => {
      document.addEventListener(event, debouncedActivity, true);
    });

    const handleBeforeUnload = () => {
      setOffline();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        setOnline();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const cleanup = () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, debouncedActivity, true);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
    };

    (window as any).clientStatusCleanup = cleanup;
  };

  const stopMonitoring = (): void => {
    console.log('Parando monitoramento de status do cliente');
    setOffline();
    
    if ((window as any).clientStatusCleanup) {
      (window as any).clientStatusCleanup();
      delete (window as any).clientStatusCleanup;
    }
  };

  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, []);

  return {
    startMonitoring,
    stopMonitoring
  };
};
