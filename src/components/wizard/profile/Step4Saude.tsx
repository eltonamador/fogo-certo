import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useWizard } from '@/contexts/WizardContext';
import { step4Schema, Step4FormData } from '@/schemas/profileWizard';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, Shield } from 'lucide-react';

interface Step4Props {
  initialData?: Partial<Step4FormData>;
  onSave: (data: Step4FormData) => Promise<void>;
}

export function Step4Saude({ initialData, onSave }: Step4Props) {
  const { setCanGoNext } = useWizard();

  const form = useForm<Step4FormData>({
    resolver: zodResolver(step4Schema),
    defaultValues: initialData || {
      saude: {
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

  // Verificar validade inicial - Step 4 é opcional, sempre pode concluir
  useEffect(() => {
    setCanGoNext(true);
  }, [setCanGoNext]);

  useEffect(() => {
    const subscription = form.watch(async (data) => {
      const isValid = form.formState.isValid;
      setCanGoNext(true); // Step 4 sempre pode concluir (dados opcionais)

      // Salvar automaticamente
      if (data.saude) {
        // Atualizar timestamp de consentimento
        const dataComConsentimento = {
          ...data,
          saude: {
            ...data.saude,
            consentimento_data: new Date().toISOString()
          }
        };

        try {
          await onSave(dataComConsentimento as Step4FormData);
        } catch (error) {
          // Erro já tratado
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, setCanGoNext, onSave]);

  return (
    <Form {...form}>
      <form className="space-y-6">
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
      </form>
    </Form>
  );
}
