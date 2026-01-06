import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Aviso } from '@/types/database';

const avisoSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  conteudo: z.string().min(10, 'Conteúdo deve ter no mínimo 10 caracteres'),
  fixado: z.boolean().default(false),
  pelotao_id: z.string().nullable(),
  disciplina_id: z.string().nullable(),
});

type AvisoFormData = z.infer<typeof avisoSchema>;

interface AvisoDialogProps {
  open: boolean;
  onClose: () => void;
  aviso?: Aviso | null;
}

export function AvisoDialog({ open, onClose, aviso }: AvisoDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AvisoFormData>({
    resolver: zodResolver(avisoSchema),
    defaultValues: {
      titulo: '',
      conteudo: '',
      fixado: false,
      pelotao_id: null,
      disciplina_id: null,
    },
  });

  const fixado = watch('fixado');
  const pelotaoId = watch('pelotao_id');
  const disciplinaId = watch('disciplina_id');

  // Carregar pelotões
  const { data: pelotoes } = useQuery({
    queryKey: ['pelotoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pelotoes')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data;
    },
  });

  // Carregar disciplinas
  const { data: disciplinas } = useQuery({
    queryKey: ['disciplinas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disciplinas')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data;
    },
  });

  // Preencher formulário ao editar
  useEffect(() => {
    if (aviso && open) {
      reset({
        titulo: aviso.titulo,
        conteudo: aviso.conteudo,
        fixado: aviso.fixado,
        pelotao_id: aviso.pelotao_id,
        disciplina_id: aviso.disciplina_id,
      });
    } else if (!open) {
      reset({
        titulo: '',
        conteudo: '',
        fixado: false,
        pelotao_id: null,
        disciplina_id: null,
      });
    }
  }, [aviso, open, reset]);

  // Mutation para criar/editar
  const saveMutation = useMutation({
    mutationFn: async (data: AvisoFormData) => {
      const payload = {
        ...data,
        autor_id: user?.id,
        pelotao_id: data.pelotao_id === 'todos' ? null : data.pelotao_id,
        disciplina_id: data.disciplina_id === 'todas' ? null : data.disciplina_id,
      };

      if (aviso) {
        const { error } = await supabase
          .from('avisos')
          .update(payload)
          .eq('id', aviso.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('avisos').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avisos'] });
      toast.success(aviso ? 'Aviso atualizado com sucesso!' : 'Aviso criado com sucesso!');
      onClose();
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar aviso: ' + error.message);
    },
  });

  const onSubmit = (data: AvisoFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{aviso ? 'Editar Aviso' : 'Novo Aviso'}</DialogTitle>
          <DialogDescription>
            {aviso ? 'Atualize as informações do aviso.' : 'Crie um novo aviso para os alunos.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              {...register('titulo')}
              placeholder="Digite o título do aviso"
            />
            {errors.titulo && (
              <p className="text-sm text-destructive mt-1">{errors.titulo.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="conteudo">Conteúdo *</Label>
            <Textarea
              id="conteudo"
              {...register('conteudo')}
              placeholder="Digite o conteúdo do aviso..."
              rows={6}
            />
            {errors.conteudo && (
              <p className="text-sm text-destructive mt-1">{errors.conteudo.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="fixado"
              checked={fixado}
              onCheckedChange={(checked) => setValue('fixado', checked as boolean)}
            />
            <Label htmlFor="fixado" className="cursor-pointer">
              Fixar no topo da lista
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pelotao">Pelotão (opcional)</Label>
              <Select
                value={pelotaoId || 'todos'}
                onValueChange={(value) => setValue('pelotao_id', value === 'todos' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os pelotões</SelectItem>
                  {pelotoes?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="disciplina">Disciplina (opcional)</Label>
              <Select
                value={disciplinaId || 'todas'}
                onValueChange={(value) => setValue('disciplina_id', value === 'todas' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as disciplinas</SelectItem>
                  {disciplinas?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : aviso ? 'Atualizar' : 'Criar Aviso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
