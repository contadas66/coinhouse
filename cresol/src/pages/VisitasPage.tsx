
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Eye, Users, Activity, Calendar } from 'lucide-react';

interface VisitData {
  id: string;
  page: string;
  referrer: string;
  ip: string;
  userAgent: string;
  device: string;
  browser: string;
  os: string;
  country: string;
  city: string;
  timestamp: string;
}

const VisitasPage = () => {
  const [visits, setVisits] = useState<VisitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVisits, setTotalVisits] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      console.log('Buscando dados de visitas...');
      
      const response = await fetch('https://servidoroperador.onrender.com/api/metrics/visits', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Dados de visitas recebidos:', data);
        
        setVisits(data.visits || []);
        setTotalVisits(data.total || 0);
        setUniqueVisitors(data.unique || 0);
      } else {
        console.log('Erro ao buscar visitas:', response.status);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados de visitas",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.log('Erro na requisição de visitas:', error);
      toast({
        title: "Erro",
        description: "Erro de conexão ao carregar visitas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const refreshData = () => {
    setLoading(true);
    fetchVisits();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dados de visitas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Relatório de Visitas</h1>
          <p className="text-gray-600">Acompanhe todas as visitas e métricas do site</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Visitas</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVisits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visitantes Únicos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueVisitors}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registros Ativos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visits.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center">
          <Button onClick={refreshData} variant="outline">
            <Activity className="mr-2 h-4 w-4" />
            Atualizar Dados
          </Button>
        </div>

        {/* Visits Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico de Visitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visits.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Página</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead>Navegador</TableHead>
                      <TableHead>Sistema</TableHead>
                      <TableHead>Origem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits.map((visit, index) => (
                      <TableRow key={visit.id || index}>
                        <TableCell className="font-medium">
                          {formatDate(visit.timestamp)}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {visit.page || '/'}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {visit.ip || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {visit.city && visit.country ? `${visit.city}, ${visit.country}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                            {visit.device || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>{visit.browser || 'N/A'}</TableCell>
                        <TableCell>{visit.os || 'N/A'}</TableCell>
                        <TableCell>
                          {visit.referrer === 'direct' ? (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                              Direto
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                              {visit.referrer || 'N/A'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Eye className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>Nenhuma visita registrada ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisitasPage;
