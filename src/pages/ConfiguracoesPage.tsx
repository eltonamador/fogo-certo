import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminToggle } from '@/hooks/useAdminToggle';
import { User, Bell, Moon, Shield, LogOut, ShieldCheck, Loader2, MapPin, GraduationCap, Heart, IdCard } from 'lucide-react';
import { useEffect } from 'react';
import { PerfilBasicoTab } from '@/components/profile/tabs/PerfilBasicoTab';
import { DadosPessoaisTab } from '@/components/profile/tabs/DadosPessoaisTab';
import { EnderecoTab } from '@/components/profile/tabs/EnderecoTab';
import { FormacaoTab } from '@/components/profile/tabs/FormacaoTab';
import { SaudeTab } from '@/components/profile/tabs/SaudeTab';

export default function ConfiguracoesPage() {
  const { profile, role, signOut } = useAuth();
  const { canToggle, isToggling, checkCanToggle, toggleAdminRole } = useAdminToggle();

  useEffect(() => {
    checkCanToggle();
  }, [role]);

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas preferências e conta</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Settings with Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="basico" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basico" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Básico</span>
              </TabsTrigger>
              <TabsTrigger value="pessoais" className="flex items-center gap-1">
                <IdCard className="h-4 w-4" />
                <span className="hidden sm:inline">Pessoais</span>
              </TabsTrigger>
              <TabsTrigger value="endereco" className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Endereço</span>
              </TabsTrigger>
              <TabsTrigger value="formacao" className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Formação</span>
              </TabsTrigger>
              <TabsTrigger value="saude" className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Saúde</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basico">
              <PerfilBasicoTab />
            </TabsContent>

            <TabsContent value="pessoais">
              <DadosPessoaisTab />
            </TabsContent>

            <TabsContent value="endereco">
              <EnderecoTab />
            </TabsContent>

            <TabsContent value="formacao">
              <FormacaoTab />
            </TabsContent>

            <TabsContent value="saude">
              <SaudeTab />
            </TabsContent>
          </Tabs>
        </div>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <User className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold">{profile?.nome || 'Usuário'}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {role === 'admin' ? 'Administrador' : role === 'instrutor' ? 'Instrutor' : 'Aluno'}
              </p>
            </div>
            <Separator />

            {/* Admin Toggle Button - Only visible for bootstrap admin */}
            {canToggle && (
              <>
                <Button
                  variant={role === 'admin' ? 'outline' : 'default'}
                  className="w-full"
                  onClick={toggleAdminRole}
                  disabled={isToggling}
                >
                  {isToggling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Alternando...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      {role === 'admin' ? 'Voltar para Instrutor' : 'Alternar para Admin'}
                    </>
                  )}
                </Button>
                <Separator />
              </>
            )}

            <Button variant="destructive" className="w-full" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair da Conta
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notificações por Email</p>
                <p className="text-sm text-muted-foreground">Receba avisos importantes</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Novos Materiais</p>
                <p className="text-sm text-muted-foreground">Quando materiais são publicados</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Prazos de Tarefas</p>
                <p className="text-sm text-muted-foreground">Lembretes de entregas</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Modo Escuro</p>
                <p className="text-sm text-muted-foreground">Tema escuro para o sistema</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
