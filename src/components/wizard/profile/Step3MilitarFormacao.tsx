import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useWizard } from '@/contexts/WizardContext';
import { step3Schema, Step3FormData } from '@/schemas/profileWizard';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Briefcase } from 'lucide-react';

interface Step3Props {
  initialData?: Partial<Step3FormData>;
  onSave: (data: Step3FormData) => Promise<void>;
}

export function Step3MilitarFormacao({ initialData, onSave }: Step3Props) {
  const { setCanGoNext } = useWizard();

  const form = useForm<Step3FormData>({
    resolver: zodResolver(step3Schema),
    defaultValues: initialData || {
      cursos_operacionais: [],
      cursos_operacionais_outros: '',
      formacao_academica: [],
      experiencia_profissional: []
    }
  });

  useEffect(() => {
    const subscription = form.watch(async (data) => {
      // Este step é opcional, sempre pode avançar
      setCanGoNext(true);

      // Salvar automaticamente
      try {
        await onSave(data as Step3FormData);
      } catch (error) {
        // Erro já tratado
      }
    });
    return () => subscription.unsubscribe();
  }, [form, setCanGoNext, onSave]);

  return (
    <Form {...form}>
      <form className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Cursos e Formação
            </CardTitle>
            <CardDescription>
              Informações sobre cursos operacionais e formação acadêmica (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="cursos_operacionais_outros"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cursos Operacionais</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Liste cursos operacionais realizados (ex: Combate a Incêndio, Salvamento, etc)"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Liste os cursos operacionais que você já realizou
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
              Experiência (Opcional)
            </CardTitle>
            <CardDescription>
              Formação acadêmica e experiência profissional
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
              Esta seção é opcional. Você pode pular e preencher depois nas configurações.
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
