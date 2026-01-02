import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Aula, Avaliacao, Tarefa } from '@/types/database';

type EventType = 'aula' | 'avaliacao' | 'tarefa';

interface CalendarEvent {
  id: string;
  titulo: string;
  data: Date;
  tipo: EventType;
  cor: string;
  detalhes?: string;
}

export default function CalendarioPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterType, setFilterType] = useState<string>('todos');

  const { data: aulas } = useQuery({
    queryKey: ['aulas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aulas')
        .select('*, disciplina:disciplinas(*), instrutor:profiles(*)');
      if (error) throw error;
      return data as unknown as Aula[];
    },
  });

  const { data: avaliacoes } = useQuery({
    queryKey: ['avaliacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('*, disciplina:disciplinas(*)');
      if (error) throw error;
      return data as unknown as Avaliacao[];
    },
  });

  const { data: tarefas } = useQuery({
    queryKey: ['tarefas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarefas')
        .select('*, disciplina:disciplinas(*)');
      if (error) throw error;
      return data as unknown as Tarefa[];
    },
  });

  const events: CalendarEvent[] = [
    ...(aulas?.map(aula => ({
      id: aula.id,
      titulo: aula.titulo,
      data: new Date(aula.data_hora_inicio),
      tipo: 'aula' as EventType,
      cor: aula.disciplina?.cor || '#1e3a5f',
      detalhes: aula.local || undefined,
    })) || []),
    ...(avaliacoes?.map(avaliacao => ({
      id: avaliacao.id,
      titulo: avaliacao.titulo,
      data: new Date(avaliacao.data_hora),
      tipo: 'avaliacao' as EventType,
      cor: '#dc2626',
      detalhes: avaliacao.disciplina?.nome,
    })) || []),
    ...(tarefas?.map(tarefa => ({
      id: tarefa.id,
      titulo: tarefa.titulo,
      data: new Date(tarefa.prazo),
      tipo: 'tarefa' as EventType,
      cor: '#f59e0b',
      detalhes: tarefa.disciplina?.nome,
    })) || []),
  ];

  const filteredEvents = events.filter(event => {
    if (filterType === 'todos') return true;
    return event.tipo === filterType;
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = monthStart.getDay();
  const paddingDays = Array(startDayOfWeek).fill(null);

  const getEventsForDay = (date: Date) => {
    return filteredEvents.filter(event => isSameDay(event.data, date));
  };

  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  const getEventTypeLabel = (tipo: EventType) => {
    switch (tipo) {
      case 'aula': return 'Aula';
      case 'avaliacao': return 'Avaliação';
      case 'tarefa': return 'Tarefa';
    }
  };

  const getEventTypeColor = (tipo: EventType) => {
    switch (tipo) {
      case 'aula': return 'bg-primary';
      case 'avaliacao': return 'bg-fire';
      case 'tarefa': return 'bg-warning';
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Calendário</h1>
          <p className="text-muted-foreground">Aulas, avaliações e prazos do curso</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="aula">Aulas</SelectItem>
              <SelectItem value="avaliacao">Avaliações</SelectItem>
              <SelectItem value="tarefa">Tarefas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-xl">
                {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Hoje
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {paddingDays.map((_, index) => (
                <div key={`padding-${index}`} className="aspect-square" />
              ))}
              {daysInMonth.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`aspect-square p-1 rounded-lg transition-all duration-200 hover:bg-muted relative ${
                      isToday ? 'bg-primary/10 ring-2 ring-primary' : ''
                    } ${isSelected ? 'bg-primary text-primary-foreground' : ''}`}
                  >
                    <span className={`text-sm ${isToday && !isSelected ? 'font-bold text-primary' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayEvents.slice(0, 3).map((event, i) => (
                          <div
                            key={i}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: event.cor }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">Aulas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-fire" />
                <span className="text-sm text-muted-foreground">Avaliações</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-warning" />
                <span className="text-sm text-muted-foreground">Tarefas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate ? (
                format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
              ) : (
                'Selecione um dia'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedDate ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Clique em um dia para ver os eventos</p>
              </div>
            ) : selectedDateEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum evento neste dia</p>
              </div>
            ) : (
              selectedDateEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg bg-muted/50 border-l-4"
                  style={{ borderColor: event.cor }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge className={getEventTypeColor(event.tipo)}>
                      {getEventTypeLabel(event.tipo)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(event.data, 'HH:mm')}
                    </span>
                  </div>
                  <p className="font-medium">{event.titulo}</p>
                  {event.detalhes && (
                    <p className="text-sm text-muted-foreground">{event.detalhes}</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
