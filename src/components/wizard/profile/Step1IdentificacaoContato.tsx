import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useWizard } from '@/contexts/WizardContext';
import { step1Schema, Step1FormData } from '@/schemas/profileWizard';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MaskedInput } from '@/components/ui/masked-input';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Heart } from 'lucide-react';

interface Step1Props {
  initialData?: Partial<Step1FormData>;
  onSave: (data: Step1FormData) => Promise<void>;
}

export function Step1IdentificacaoContato({ initialData, onSave }: Step1Props) {
  const { setCanGoNext } = useWizard();

  const form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: initialData || {
      cpf: '',
      data_nascimento: '',
      sexo: undefined,
      tipo_sanguineo: undefined,
      contato_emergencia: {
        nome: '',
        parentesco: '',
        telefone: ''
      }
    }
  });

  // Verificar validade inicial
  useEffect(() => {
    setCanGoNext(form.formState.isValid);
  }, [form.formState.isValid, setCanGoNext]);

  // Monitorar validade do form e salvar automaticamente
  useEffect(() => {
    const subscription = form.watch(async (data) => {
      const isValid = form.formState.isValid;
      setCanGoNext(isValid);

      // Salvar automaticamente quando form estiver válido
      if (isValid && data.cpf && data.data_nascimento && data.tipo_sanguineo &&
          data.contato_emergencia?.nome && data.contato_emergencia?.telefone) {
        try {
          await onSave(data as Step1FormData);
        } catch (error) {
          // Erro já tratado no onSave
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, setCanGoNext, onSave]);

  return (
    <Form {...form}>
      <form className="space-y-6">
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
              name="tipo_sanguineo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo Sanguíneo *</FormLabel>
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
      </form>
    </Form>
  );
}
