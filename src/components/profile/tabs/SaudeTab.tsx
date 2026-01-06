import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { step4Schema, Step4FormData } from '@/schemas/profileWizard';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function SaudeTab() {
  const { user, profile, refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Step4FormData>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      saude: profile?.saude || {
        doenca_cronica: false,
        doenca_cronica_qual: '',
        alergias: '',
        medicamentos_uso: '',
        restricao_fisica: '',
        observacoes_medicas: '',
        consentimento_data: new Date().toISOString()
      }
    }
  });

  const doencaCronica = form.watch('saude.doenca_cronica');

  const onSubmit = async (data: Step4FormData) => {
    setIsSubmitting(true);
    try {
      // Atualizar timestamp de consentimento
      const saudeComConsentimento = {
        ...data.saude,
        consentimento_data: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          saude: saudeComConsentimento
        })
        .eq('id', user!.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Dados de saúde atualizados com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atualizar dados: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacidade e Segurança:</strong> Seus dados de saúde são confidenciais e serão acessíveis apenas por administradores autorizados. Nunca serão compartilhados sem sua autorização.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-destructive" />
              Informações de Saúde
            </CardTitle>
            <CardDescription>
              Informações médicas importantes (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="saude.doenca_cronica"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Possui doença crônica?
                    </FormLabel>
                    <FormDescription>
                      Marque se possui alguma condição médica crônica
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {doencaCronica && (
              <FormField
                control={form.control}
                name="saude.doenca_cronica_qual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qual doença crônica? *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva a condição"
                        {...field}
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="saude.alergias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alergias</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Liste alergias conhecidas (medicamentos, alimentos, etc)"
                      {...field}
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="saude.medicamentos_uso"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medicamentos em uso</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Liste medicamentos que usa regularmente"
                      {...field}
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="saude.restricao_fisica"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restrições físicas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva limitações ou restrições físicas"
                      {...field}
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="saude.observacoes_medicas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações médicas adicionais</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Outras informações médicas relevantes"
                      {...field}
                      rows={3}
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
