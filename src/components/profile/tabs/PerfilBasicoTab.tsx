import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MaskedInput } from '@/components/ui/masked-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const perfilBasicoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  matricula: z.string().optional(),
  posto_graduacao: z.string().optional(),
  nome_guerra: z.string().optional(),
  tipo_sanguineo: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  possui_cnh: z.boolean().optional(),
  categoria_cnh: z.string().optional(),
  lotacao: z.string().optional()
});

type PerfilBasicoFormData = z.infer<typeof perfilBasicoSchema>;

export function PerfilBasicoTab() {
  const { user, profile, role, refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PerfilBasicoFormData>({
    resolver: zodResolver(perfilBasicoSchema),
    defaultValues: {
      nome: profile?.nome || '',
      telefone: profile?.telefone || '',
      matricula: profile?.matricula || '',
      posto_graduacao: profile?.posto_graduacao || '',
      nome_guerra: profile?.nome_guerra || '',
      tipo_sanguineo: profile?.tipo_sanguineo || undefined,
      possui_cnh: (profile as any)?.possui_cnh || false,
      categoria_cnh: (profile as any)?.categoria_cnh || '',
      lotacao: (profile as any)?.lotacao || ''
    }
  });

  // Atualizar formulário quando o perfil mudar
  useEffect(() => {
    if (profile) {
      form.reset({
        nome: profile.nome || '',
        telefone: profile.telefone || '',
        matricula: profile.matricula || '',
        posto_graduacao: profile.posto_graduacao || '',
        nome_guerra: profile.nome_guerra || '',
        tipo_sanguineo: profile.tipo_sanguineo || undefined,
        possui_cnh: (profile as any)?.possui_cnh || false,
        categoria_cnh: (profile as any)?.categoria_cnh || '',
        lotacao: (profile as any)?.lotacao || ''
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: PerfilBasicoFormData) => {
    setIsSubmitting(true);
    try {
      // Preparar dados de atualização
      const updateData: any = {
        nome: data.nome,
        telefone: data.telefone,
        matricula: data.matricula,
      };

      // Tentar adicionar campos opcionais se tiverem valor
      if (data.posto_graduacao && data.posto_graduacao.trim()) {
        updateData.posto_graduacao = data.posto_graduacao.trim();
      }
      if (data.nome_guerra && data.nome_guerra.trim()) {
        updateData.nome_guerra = data.nome_guerra.trim();
      }
      if (data.tipo_sanguineo) {
        updateData.tipo_sanguineo = data.tipo_sanguineo;
      }
      if (data.possui_cnh !== undefined) {
        updateData.possui_cnh = data.possui_cnh;
      }
      if (data.categoria_cnh && data.categoria_cnh.trim()) {
        updateData.categoria_cnh = data.categoria_cnh.trim();
      }
      if (data.lotacao && data.lotacao.trim()) {
        updateData.lotacao = data.lotacao.trim();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user!.id);

      if (error) {
        // Verificar se o erro é especificamente sobre coluna não encontrada no schema cache
        // O erro do Supabase geralmente vem como: "Could not find the 'nome_campo' column of 'profiles' in the schema cache"
        const errorMsg = error.message.toLowerCase();
        const isColumnNotFoundError = 
          (errorMsg.includes('could not find') || errorMsg.includes('column') || errorMsg.includes('schema cache')) &&
          (errorMsg.includes('nome_guerra') || 
           errorMsg.includes('posto_graduacao') || 
           errorMsg.includes('possui_cnh') || 
           errorMsg.includes('categoria_cnh') || 
           errorMsg.includes('lotacao') ||
           errorMsg.includes('tipo_sanguineo'));

        if (isColumnNotFoundError) {
          // Identificar qual campo específico está causando o problema
          const problematicFields: string[] = [];
          if (errorMsg.includes('nome_guerra')) problematicFields.push('nome_guerra');
          if (errorMsg.includes('posto_graduacao')) problematicFields.push('posto_graduacao');
          if (errorMsg.includes('possui_cnh')) problematicFields.push('possui_cnh');
          if (errorMsg.includes('categoria_cnh')) problematicFields.push('categoria_cnh');
          if (errorMsg.includes('lotacao')) problematicFields.push('lotacao');
          if (errorMsg.includes('tipo_sanguineo')) problematicFields.push('tipo_sanguineo');

          // Remover apenas os campos problemáticos
          problematicFields.forEach(field => {
            delete updateData[field];
          });
          
          const { error: retryError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user!.id);

          if (retryError) {
            // Se ainda der erro, mostrar o erro real
            throw retryError;
          }
          
          await refreshProfile();
          toast.warning(
            `Perfil atualizado! Os campos ${problematicFields.join(', ')} ainda não estão disponíveis. ` +
            'Verifique se a migração SQL foi executada corretamente no Supabase.'
          );
        } else {
          // Se não for erro de coluna não encontrada, mostrar o erro real
          throw error;
        }
      } else {
        await refreshProfile();
        toast.success('Perfil atualizado com sucesso!');
      }
    } catch (error: any) {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone *</FormLabel>
                <FormControl>
                  <MaskedInput
                    maskType="telefone"
                    placeholder="(00) 00000-0000"
                    onValueChange={field.onChange}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="matricula"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Matrícula</FormLabel>
                <FormControl>
                  <Input {...field} disabled={role === 'aluno'} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="posto_graduacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Posto/Graduação</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Soldado, Cabo, Sargento" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nome_guerra"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome de Guerra</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Soldado Silva" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipo_sanguineo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo Sanguíneo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lotacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lotação</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: 1º Batalhão, Companhia Alpha" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="possui_cnh"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Possui CNH?</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {form.watch('possui_cnh') && (
            <FormField
              control={form.control}
              name="categoria_cnh"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria CNH</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A">A - Motocicleta</SelectItem>
                      <SelectItem value="B">B - Carro</SelectItem>
                      <SelectItem value="AB">AB - Carro e Motocicleta</SelectItem>
                      <SelectItem value="C">C - Caminhão</SelectItem>
                      <SelectItem value="D">D - Ônibus</SelectItem>
                      <SelectItem value="E">E - Carreta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
