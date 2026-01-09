import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MaskedInput } from '@/components/ui/masked-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Heart, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const dadosPessoaisSchema = z.object({
  cpf: z.string().min(1, 'CPF é obrigatório'),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  sexo: z.enum(['Masculino', 'Feminino', 'Outro', 'Prefiro não informar']).optional(),
  email: z.string().email('Email inválido').optional(),
  estado_civil: z.string().optional(),
  contato_emergencia: z.object({
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    parentesco: z.string().min(2, 'Parentesco é obrigatório'),
    telefone: z.string().min(1, 'Telefone é obrigatório')
  })
});

type DadosPessoaisFormData = z.infer<typeof dadosPessoaisSchema>;

export function DadosPessoaisTab() {
  const { user, profile, refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DadosPessoaisFormData>({
    resolver: zodResolver(dadosPessoaisSchema),
    defaultValues: {
      cpf: profile?.cpf || '',
      data_nascimento: profile?.data_nascimento || '',
      sexo: profile?.sexo || undefined,
      email: profile?.email || '',
      estado_civil: (profile as any)?.estado_civil || '',
      contato_emergencia: profile?.contato_emergencia || {
        nome: '',
        parentesco: '',
        telefone: ''
      }
    }
  });

  // Atualizar formulário quando o perfil mudar
  useEffect(() => {
    if (profile) {
      form.reset({
        cpf: profile.cpf || '',
        data_nascimento: profile.data_nascimento || '',
        sexo: profile.sexo || undefined,
        email: profile.email || '',
        estado_civil: (profile as any)?.estado_civil || '',
        contato_emergencia: profile.contato_emergencia || {
          nome: '',
          parentesco: '',
          telefone: ''
        }
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: DadosPessoaisFormData) => {
    setIsSubmitting(true);
    try {
      const updateData: any = {
        cpf: data.cpf,
        data_nascimento: data.data_nascimento,
        sexo: data.sexo,
        contato_emergencia: data.contato_emergencia
      };

      // Adicionar campos opcionais se existirem
      if (data.email) {
        updateData.email = data.email;
      }
      if (data.estado_civil) {
        updateData.estado_civil = data.estado_civil;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user!.id);

      if (error) {
        // Verificar se o erro é especificamente sobre coluna não encontrada
        const isColumnNotFoundError = 
          error.message.includes('Could not find') && 
          error.message.includes('column') &&
          error.message.includes('estado_civil');

        if (isColumnNotFoundError) {
          delete updateData.estado_civil;
          
          const { error: retryError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user!.id);

          if (retryError) throw retryError;
          
          await refreshProfile();
          toast.warning(
            'Dados atualizados! Alguns campos ainda não estão disponíveis. ' +
            'Execute a migração SQL no Supabase para habilitar todos os campos.'
          );
        } else {
          throw error;
        }
      } else {
        await refreshProfile();
        toast.success('Dados pessoais atualizados com sucesso!');
      }
    } catch (error: any) {
      toast.error('Erro ao atualizar dados: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Identificação Pessoal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Identificação Pessoal
            </CardTitle>
            <CardDescription>
              Informações básicas de identificação
            </CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF *</FormLabel>
                  <FormControl>
                    <MaskedInput
                      maskType="cpf"
                      placeholder="000.000.000-00"
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
              name="data_nascimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sexo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sexo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                      <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estado_civil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Civil</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                      <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                      <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                      <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                      <SelectItem value="União Estável">União Estável</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Contato de Emergência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-destructive" />
              Contato de Emergência
            </CardTitle>
            <CardDescription>
              Pessoa para contatar em caso de emergência
            </CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="contato_emergencia.nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do contato" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contato_emergencia.parentesco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parentesco *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Pai, Mãe, Cônjuge" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contato_emergencia.telefone"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
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
          </CardContent>
        </Card>

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
