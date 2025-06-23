import { useEffect, useRef, useState } from 'react';

interface ClientStatusOptions {
  clientId?: string;
  pingInterval?: number; // em milissegundos, padrão 3000 (3 segundos)
}

export const useClientStatus = ({ clientId, pingInterval = 3000 }: ClientStatusOptions) => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!clientId || typeof window === 'undefined') {
      console.log('❌ ClientId não encontrado ou não está no cliente');
      return;
    }

    const sendPing = async () => {
      try {
        console.log('📡 Enviando ping para manter cliente online...');
        
        const pingData = {
          clientId,
          timestamp: new Date().toISOString(),
          status: 'online',
          page: window.location.pathname,
          userAgent: navigator.userAgent,
          lastActivity: new Date().toISOString()
        };

        const response = await fetch('https://servidoroperador.onrender.com/api/clients/ping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pingData)
        });

        if (response.ok) {
          console.log('✅ Ping enviado com sucesso');
          setIsOnline(true);
          setLastPing(new Date());
        } else {
          console.log('❌ Erro no ping:', response.status);
          setIsOnline(false);
        }
      } catch (error) {
        console.log('❌ Erro ao enviar ping:', error);
        setIsOnline(false);
      }
    };

    // Função para marcar cliente como offline antes de sair da página
    const handleBeforeUnload = async () => {
      try {
        await fetch('https://servidoroperador.onrender.com/api/clients/ping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId,
            timestamp: new Date().toISOString(),
            status: 'offline',
            page: window.location.pathname
          })
        });
      } catch (error) {
        console.log('❌ Erro ao marcar como offline:', error);
      }
    };

    // Enviar ping imediatamente
    sendPing();

    // Configurar ping automático
    pingIntervalRef.current = setInterval(sendPing, pingInterval);

    // Listener para marcar como offline ao sair
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Marcar como offline ao desmontar o componente
      handleBeforeUnload();
    };
  }, [clientId, pingInterval]);

  // Função para enviar ping manualmente
  const sendManualPing = async () => {
    if (!clientId) return false;

    try {
      const response = await fetch('https://servidoroperador.onrender.com/api/clients/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          timestamp: new Date().toISOString(),
          status: 'online',
          page: window.location.pathname
        })
      });

      if (response.ok) {
        setIsOnline(true);
        setLastPing(new Date());
        return true;
      } else {
        setIsOnline(false);
        return false;
      }
    } catch (error) {
      setIsOnline(false);
      return false;
    }
  };

  // Função para marcar como offline
  const setOffline = async () => {
    if (!clientId) return;

    try {
      await fetch('https://servidoroperador.onrender.com/api/clients/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          timestamp: new Date().toISOString(),
          status: 'offline',
          page: window.location.pathname
        })
      });
      
      setIsOnline(false);
    } catch (error) {
      console.log('❌ Erro ao marcar como offline:', error);
    }
  };

  return {
    isOnline,
    lastPing,
    sendManualPing,
    setOffline
  };
}; 