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
import { Tarefa } from '@/types/database';

const tarefaSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  descricao: z.string().optional(),
  disciplina_id: z.string().min(1, 'Selecione uma disciplina'),
  prazo: z.string().min(1, 'Informe o prazo'),
});

type TarefaFormData = z.infer<typeof tarefaSchema>;

interface TarefaDialogProps {
  open: boolean;
  onClose: () => void;
  tarefa?: Tarefa | null;
}

export function TarefaDialog({ open, onClose, tarefa }: TarefaDialogProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TarefaFormData>({
    resolver: zodResolver(tarefaSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      disciplina_id: '',
      prazo: '',
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
    if (tarefa && open) {
      reset({
        titulo: tarefa.titulo,
        descricao: tarefa.descricao || '',
        disciplina_id: tarefa.disciplina_id,
        prazo: tarefa.prazo.slice(0, 16),
      });
    } else if (!open) {
      reset({ titulo: '', descricao: '', disciplina_id: '', prazo: '' });
    }
  }, [tarefa, open, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: TarefaFormData) => {
      if (tarefa) {
        const { error } = await supabase.from('tarefas').update(data).eq('id', tarefa.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tarefas').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
      toast.success(tarefa ? 'Tarefa atualizada!' : 'Tarefa criada!');
      onClose();
    },
    onError: (error: any) => toast.error('Erro: ' + error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tarefa ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
          <DialogDescription>
            {tarefa ? 'Atualize as informações da tarefa.' : 'Crie uma nova tarefa/atividade.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" {...register('titulo')} placeholder="Ex: Trabalho em Grupo, Pesquisa, etc." />
            {errors.titulo && <p className="text-sm text-destructive mt-1">{errors.titulo.message}</p>}
          </div>
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" {...register('descricao')} placeholder="Descreva a tarefa..." rows={5} />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <Label htmlFor="prazo">Prazo de Entrega *</Label>
              <Input id="prazo" type="datetime-local" {...register('prazo')} />
              {errors.prazo && <p className="text-sm text-destructive mt-1">{errors.prazo.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : tarefa ? 'Atualizar' : 'Criar Tarefa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
