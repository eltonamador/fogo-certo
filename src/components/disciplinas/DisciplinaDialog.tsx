import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Disciplina } from '@/types/database';

const disciplinaSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  descricao: z.string().optional(),
  carga_horaria: z.coerce.number().min(1, 'Carga horária deve ser maior que 0'),
  cor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve ser um código hexadecimal válido'),
});

type DisciplinaFormData = z.infer<typeof disciplinaSchema>;

interface DisciplinaDialogProps {
  open: boolean;
  onClose: () => void;
  disciplina?: Disciplina | null;
}

const CORES_PREDEFINIDAS = [
  '#1e3a5f', // Azul marinho
  '#d35230', // Laranja fogo
  '#2d7a3e', // Verde militar
  '#8b4513', // Marrom
  '#4a5568', // Cinza escuro
  '#9333ea', // Roxo
  '#dc2626', // Vermelho
  '#0891b2', // Ciano
];

export function DisciplinaDialog({ open, onClose, disciplina }: DisciplinaDialogProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<DisciplinaFormData>({
    resolver: zodResolver(disciplinaSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      carga_horaria: 40,
      cor: '#1e3a5f',
    },
  });

  const corSelecionada = watch('cor');

  // Preencher formulário ao editar
  useEffect(() => {
    if (disciplina && open) {
      reset({
        nome: disciplina.nome,
        descricao: disciplina.descricao || '',
        carga_horaria: disciplina.carga_horaria,
        cor: disciplina.cor,
      });
    } else if (!open) {
      reset({
        nome: '',
        descricao: '',
        carga_horaria: 40,
        cor: '#1e3a5f',
      });
    }
  }, [disciplina, open, reset]);

  // Mutation para criar/editar
  const saveMutation = useMutation({
    mutationFn: async (data: DisciplinaFormData) => {
      if (disciplina) {
        const { error } = await supabase
          .from('disciplinas')
          .update(data)
          .eq('id', disciplina.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('disciplinas').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disciplinas'] });
      toast.success(disciplina ? 'Disciplina atualizada com sucesso!' : 'Disciplina criada com sucesso!');
      onClose();
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar disciplina: ' + error.message);
    },
  });

  const onSubmit = (data: DisciplinaFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{disciplina ? 'Editar Disciplina' : 'Nova Disciplina'}</DialogTitle>
          <DialogDescription>
            {disciplina ? 'Atualize as informações da disciplina.' : 'Crie uma nova disciplina do curso.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              {...register('nome')}
              placeholder="Ex: Ordem Unida, Armamento e Tiro, etc."
            />
            {errors.nome && (
              <p className="text-sm text-destructive mt-1">{errors.nome.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              {...register('descricao')}
              placeholder="Descrição da disciplina (opcional)"
              rows={3}
            />
            {errors.descricao && (
              <p className="text-sm text-destructive mt-1">{errors.descricao.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="carga_horaria">Carga Horária (horas) *</Label>
            <Input
              id="carga_horaria"
              type="number"
              {...register('carga_horaria')}
              placeholder="40"
              min="1"
            />
            {errors.carga_horaria && (
              <p className="text-sm text-destructive mt-1">{errors.carga_horaria.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="cor">Cor da Disciplina *</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  id="cor"
                  {...register('cor')}
                  placeholder="#1e3a5f"
                  maxLength={7}
                  className="flex-1"
                />
                <div
                  className="h-10 w-10 rounded border border-border flex-shrink-0"
                  style={{ backgroundColor: corSelecionada }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {CORES_PREDEFINIDAS.map((cor) => (
                  <button
                    key={cor}
                    type="button"
                    className={`h-8 w-8 rounded border-2 transition-all ${
                      corSelecionada === cor ? 'border-primary scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: cor }}
                    onClick={() => setValue('cor', cor)}
                    title={cor}
                  />
                ))}
              </div>
            </div>
            {errors.cor && (
              <p className="text-sm text-destructive mt-1">{errors.cor.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : disciplina ? 'Atualizar' : 'Criar Disciplina'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
