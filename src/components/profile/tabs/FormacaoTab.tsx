import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { step3Schema, Step3FormData } from '@/schemas/profileWizard';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Briefcase, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function FormacaoTab() {
  const { user, profile, refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Step3FormData>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      cursos_operacionais: profile?.cursos_operacionais || [],
      cursos_operacionais_outros: profile?.cursos_operacionais_outros || '',
      formacao_academica: profile?.formacao_academica || [],
      experiencia_profissional: profile?.experiencia_profissional || []
    }
  });

  const onSubmit = async (data: Step3FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          cursos_operacionais: data.cursos_operacionais,
          cursos_operacionais_outros: data.cursos_operacionais_outros,
          formacao_academica: data.formacao_academica,
          experiencia_profissional: data.experiencia_profissional
        })
        .eq('id', user!.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Formação e experiência atualizadas com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atualizar dados: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Cursos Operacionais
            </CardTitle>
            <CardDescription>
              Cursos profissionais e técnicos realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="cursos_operacionais_outros"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cursos Realizados</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Liste cursos operacionais realizados (ex: Combate a Incêndio, Salvamento, Resgate, etc)"
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    Liste os cursos operacionais que você já realizou, um por linha
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Formação e Experiência
            </CardTitle>
            <CardDescription>
              Informações acadêmicas e profissionais (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
              <p className="font-medium mb-2">Esta seção está em desenvolvimento</p>
              <p>Em breve você poderá adicionar sua formação acadêmica e experiência profissional de forma detalhada.</p>
            </div>
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
