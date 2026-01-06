import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, MapPin, GraduationCap, Heart, IdCard, Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProfileViewProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export function ProfileView({ open, onClose, userId }: ProfileViewProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && userId) {
      loadProfile();
    }
  }, [open, userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return date;
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil Completo - {profile.nome}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basico" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basico">
              <User className="h-4 w-4 mr-2" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="pessoais">
              <IdCard className="h-4 w-4 mr-2" />
              Pessoais
            </TabsTrigger>
            <TabsTrigger value="endereco">
              <MapPin className="h-4 w-4 mr-2" />
              Endereço
            </TabsTrigger>
            <TabsTrigger value="formacao">
              <GraduationCap className="h-4 w-4 mr-2" />
              Formação
            </TabsTrigger>
            <TabsTrigger value="saude">
              <Heart className="h-4 w-4 mr-2" />
              Saúde
            </TabsTrigger>
          </TabsList>

          {/* Aba Básico */}
          <TabsContent value="basico">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome Completo</p>
                    <p className="font-medium">{profile.nome || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profile.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{profile.telefone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Matrícula</p>
                    <p className="font-medium">{profile.matricula || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cargo/Função</p>
                    <Badge variant="secondary" className="capitalize">
                      {profile.role === 'admin' ? 'Administrador' : profile.role === 'instrutor' ? 'Instrutor' : 'Aluno'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Perfil Completo</p>
                    <Badge variant={profile.perfil_completo ? 'default' : 'destructive'}>
                      {profile.perfil_completo ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Dados Pessoais */}
          <TabsContent value="pessoais">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Identificação Pessoal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">CPF</p>
                      <p className="font-medium">{profile.cpf || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                      <p className="font-medium">{formatDate(profile.data_nascimento)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sexo</p>
                      <p className="font-medium">{profile.sexo || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo Sanguíneo</p>
                      <p className="font-medium">{profile.tipo_sanguineo || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contato de Emergência</CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.contato_emergencia ? (
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nome</p>
                        <p className="font-medium">{profile.contato_emergencia.nome}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Parentesco</p>
                        <p className="font-medium">{profile.contato_emergencia.parentesco}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Telefone</p>
                        <p className="font-medium">{profile.contato_emergencia.telefone}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Não informado</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Endereço */}
          <TabsContent value="endereco">
            <Card>
              <CardHeader>
                <CardTitle>Endereço Residencial</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.endereco ? (
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">CEP</p>
                        <p className="font-medium">{profile.endereco.cep}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Logradouro</p>
                        <p className="font-medium">{profile.endereco.logradouro}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Número</p>
                        <p className="font-medium">{profile.endereco.numero}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Complemento</p>
                        <p className="font-medium">{profile.endereco.complemento || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bairro</p>
                        <p className="font-medium">{profile.endereco.bairro}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cidade</p>
                        <p className="font-medium">{profile.endereco.cidade}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">UF</p>
                        <p className="font-medium">{profile.endereco.uf}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Endereço não informado</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Formação */}
          <TabsContent value="formacao">
            <Card>
              <CardHeader>
                <CardTitle>Cursos e Formação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Cursos Operacionais</p>
                    {profile.cursos_operacionais_outros ? (
                      <p className="whitespace-pre-line">{profile.cursos_operacionais_outros}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Não informado</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Saúde */}
          <TabsContent value="saude">
            <Alert className="mb-4">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Dados Sensíveis:</strong> As informações de saúde são confidenciais e devem ser tratadas com total sigilo.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-destructive" />
                  Informações de Saúde
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.saude ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Doença Crônica</p>
                      <p className="font-medium">
                        {profile.saude.doenca_cronica ? 'Sim' : 'Não'}
                      </p>
                      {profile.saude.doenca_cronica && profile.saude.doenca_cronica_qual && (
                        <p className="text-sm mt-1">{profile.saude.doenca_cronica_qual}</p>
                      )}
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Alergias</p>
                      <p className="whitespace-pre-line">{profile.saude.alergias || 'Não informado'}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Medicamentos em Uso</p>
                      <p className="whitespace-pre-line">{profile.saude.medicamentos_uso || 'Não informado'}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Restrições Físicas</p>
                      <p className="whitespace-pre-line">{profile.saude.restricao_fisica || 'Não informado'}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Observações Médicas</p>
                      <p className="whitespace-pre-line">{profile.saude.observacoes_medicas || 'Não informado'}</p>
                    </div>
                    {profile.saude.consentimento_data && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm text-muted-foreground">Consentimento em</p>
                          <p className="text-sm">{formatDate(profile.saude.consentimento_data)}</p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Dados de saúde não informados</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
