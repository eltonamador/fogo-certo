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
import { Material, TipoMaterial } from '@/types/database';

const materialSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  descricao: z.string().optional(),
  tipo: z.enum(['pdf', 'video', 'link', 'documento']),
  url: z.string().url('URL inválida'),
  disciplina_id: z.string().min(1, 'Selecione uma disciplina'),
});

type MaterialFormData = z.infer<typeof materialSchema>;

interface MaterialDialogProps {
  open: boolean;
  onClose: () => void;
  material?: Material | null;
}

export function MaterialDialog({ open, onClose, material }: MaterialDialogProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      tipo: 'pdf',
      url: '',
      disciplina_id: '',
    },
  });

  const tipo = watch('tipo');
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
    if (material && open) {
      reset({
        titulo: material.titulo,
        descricao: material.descricao || '',
        tipo: material.tipo,
        url: material.url,
        disciplina_id: material.disciplina_id,
      });
    } else if (!open) {
      reset({ titulo: '', descricao: '', tipo: 'pdf', url: '', disciplina_id: '' });
    }
  }, [material, open, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: MaterialFormData) => {
      if (material) {
        const { error } = await supabase.from('materiais').update(data).eq('id', material.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('materiais').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais'] });
      toast.success(material ? 'Material atualizado!' : 'Material criado!');
      onClose();
    },
    onError: (error: any) => toast.error('Erro: ' + error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{material ? 'Editar Material' : 'Novo Material'}</DialogTitle>
          <DialogDescription>
            {material ? 'Atualize as informações do material.' : 'Adicione um novo material do curso.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" {...register('titulo')} placeholder="Nome do material" />
            {errors.titulo && <p className="text-sm text-destructive mt-1">{errors.titulo.message}</p>}
          </div>
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" {...register('descricao')} placeholder="Descrição opcional" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={tipo} onValueChange={(value) => setValue('tipo', value as TipoMaterial)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="documento">Documento</SelectItem>
                </SelectContent>
              </Select>
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
          </div>
          <div>
            <Label htmlFor="url">URL *</Label>
            <Input id="url" {...register('url')} placeholder="https://..." />
            {errors.url && <p className="text-sm text-destructive mt-1">{errors.url.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : material ? 'Atualizar' : 'Criar Material'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
