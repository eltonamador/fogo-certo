import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avaliacao } from '@/types/database';

const avaliacaoSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  descricao: z.string().optional(),
  disciplina_id: z.string().min(1, 'Selecione uma disciplina'),
  data_hora: z.string().min(1, 'Informe a data e hora'),
  duracao_minutos: z.coerce.number().min(1, 'Duração deve ser maior que 0'),
  nota_maxima: z.coerce.number().min(1, 'Nota máxima deve ser maior que 0'),
});

type AvaliacaoFormData = z.infer<typeof avaliacaoSchema>;

interface AvaliacaoDialogProps {
  open: boolean;
  onClose: () => void;
  avaliacao?: Avaliacao | null;
}

export function AvaliacaoDialog({ open, onClose, avaliacao }: AvaliacaoDialogProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AvaliacaoFormData>({
    resolver: zodResolver(avaliacaoSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      disciplina_id: '',
      data_hora: '',
      duracao_minutos: 60,
      nota_maxima: 10,
    },
  });

  const disciplinaId = watch('disciplina_id');

  const { data: disciplinas } = useQuery({
    queryKey: ['disciplinas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('disciplinas').select('*').order('nome');
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (avaliacao && open) {
      reset({
        titulo: avaliacao.titulo,
        descricao: avaliacao.descricao || '',
        disciplina_id: avaliacao.disciplina_id,
        data_hora: avaliacao.data_hora.slice(0, 16),
        duracao_minutos: avaliacao.duracao_minutos,
        nota_maxima: avaliacao.nota_maxima,
      });
    } else if (!open) {
      reset({ titulo: '', descricao: '', disciplina_id: '', data_hora: '', duracao_minutos: 60, nota_maxima: 10 });
    }
  }, [avaliacao, open, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: AvaliacaoFormData) => {
      if (avaliacao) {
        const { error } = await supabase.from('avaliacoes').update(data).eq('id', avaliacao.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('avaliacoes').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avaliacoes'] });
      toast.success(avaliacao ? 'Avaliação atualizada!' : 'Avaliação criada!');
      onClose();
    },
    onError: (error: any) => toast.error('Erro: ' + error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{avaliacao ? 'Editar Avaliação' : 'Nova Avaliação'}</DialogTitle>
          <DialogDescription>
            {avaliacao ? 'Atualize as informações da avaliação.' : 'Crie uma nova avaliação/prova.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" {...register('titulo')} placeholder="Ex: Prova Bimestral, Simulado, etc." />
            {errors.titulo && <p className="text-sm text-destructive mt-1">{errors.titulo.message}</p>}
          </div>
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" {...register('descricao')} placeholder="Descrição opcional" rows={3} />
          </div>
          <div>
            <Label htmlFor="disciplina">Disciplina *</Label>
            <Select value={disciplinaId} onValueChange={(value) => setValue('disciplina_id', value)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {disciplinas?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.disciplina_id && <p className="text-sm text-destructive mt-1">{errors.disciplina_id.message}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="data_hora">Data e Hora *</Label>
              <Input id="data_hora" type="datetime-local" {...register('data_hora')} />
              {errors.data_hora && <p className="text-sm text-destructive mt-1">{errors.data_hora.message}</p>}
            </div>
            <div>
              <Label htmlFor="duracao_minutos">Duração (min) *</Label>
              <Input id="duracao_minutos" type="number" {...register('duracao_minutos')} min="1" />
              {errors.duracao_minutos && <p className="text-sm text-destructive mt-1">{errors.duracao_minutos.message}</p>}
            </div>
            <div>
              <Label htmlFor="nota_maxima">Nota Máxima *</Label>
              <Input id="nota_maxima" type="number" step="0.1" {...register('nota_maxima')} min="1" />
              {errors.nota_maxima && <p className="text-sm text-destructive mt-1">{errors.nota_maxima.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : avaliacao ? 'Atualizar' : 'Criar Avaliação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
