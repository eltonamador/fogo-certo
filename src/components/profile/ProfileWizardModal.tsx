import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { WizardProvider } from '@/contexts/WizardContext';
import { WizardBase } from '@/components/wizard/WizardBase';
import { Step1IdentificacaoContato } from '@/components/wizard/profile/Step1IdentificacaoContato';
import { Step2Endereco } from '@/components/wizard/profile/Step2Endereco';
import { Step3MilitarFormacao } from '@/components/wizard/profile/Step3MilitarFormacao';
import { Step4Saude } from '@/components/wizard/profile/Step4Saude';
import { useAuth } from '@/contexts/AuthContext';
import { useWizard } from '@/contexts/WizardContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, MapPin, GraduationCap, Heart } from 'lucide-react';
import type {
  Step1FormData,
  Step2FormData,
  Step3FormData,
  Step4FormData
} from '@/schemas/profileWizard';

const WIZARD_STEPS = [
  {
    step: 1 as const,
    title: 'Identificação',
    description: 'Dados pessoais',
    icon: User
  },
  {
    step: 2 as const,
    title: 'Endereço',
    description: 'Localização',
    icon: MapPin
  },
  {
    step: 3 as const,
    title: 'Formação',
    description: 'Cursos e experiência',
    icon: GraduationCap
  },
  {
    step: 4 as const,
    title: 'Saúde',
    description: 'Informações médicas',
    icon: Heart
  }
];

interface ProfileWizardModalProps {
  open: boolean;
  onClose?: () => void;
}

export function ProfileWizardModal({ open, onClose }: ProfileWizardModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado local para dados do wizard
  const [step1Data, setStep1Data] = useState<Partial<Step1FormData>>({});
  const [step2Data, setStep2Data] = useState<Partial<Step2FormData>>({});
  const [step3Data, setStep3Data] = useState<Partial<Step3FormData>>({});
  const [step4Data, setStep4Data] = useState<Partial<Step4FormData>>({});

  // Carregar dados existentes do perfil
  useEffect(() => {
    if (profile) {
      setStep1Data({
        cpf: profile.cpf || '',
        data_nascimento: profile.data_nascimento || '',
        sexo: profile.sexo || undefined,
        tipo_sanguineo: profile.tipo_sanguineo || undefined,
        contato_emergencia: profile.contato_emergencia || undefined
      });

      setStep2Data({
        endereco: profile.endereco || undefined
      });

      setStep3Data({
        cursos_operacionais: profile.cursos_operacionais || undefined,
        cursos_operacionais_outros: profile.cursos_operacionais_outros || undefined,
        formacao_academica: profile.formacao_academica || undefined,
        experiencia_profissional: profile.experiencia_profissional || undefined
      });

      setStep4Data({
        saude: profile.saude || undefined
      });
    }
  }, [profile]);

  // Salvar cada step
  const handleSaveStep1 = async (data: Step1FormData) => {
    setStep1Data(data);

    const { error } = await supabase
      .from('profiles')
      .update({
        cpf: data.cpf,
        data_nascimento: data.data_nascimento,
        sexo: data.sexo,
        tipo_sanguineo: data.tipo_sanguineo,
        contato_emergencia: data.contato_emergencia
      })
      .eq('id', user!.id);

    if (error) {
      toast.error('Erro ao salvar dados: ' + error.message);
      throw error;
    }
  };

  const handleSaveStep2 = async (data: Step2FormData) => {
    setStep2Data(data);

    const { error } = await supabase
      .from('profiles')
      .update({
        endereco: data.endereco
      })
      .eq('id', user!.id);

    if (error) {
      toast.error('Erro ao salvar endereço: ' + error.message);
      throw error;
    }
  };

  const handleSaveStep3 = async (data: Step3FormData) => {
    setStep3Data(data);

    const { error } = await supabase
      .from('profiles')
      .update({
        cursos_operacionais: data.cursos_operacionais,
        cursos_operacionais_outros: data.cursos_operacionais_outros,
        formacao_academica: data.formacao_academica,
        experiencia_profissional: data.experiencia_profissional
      })
      .eq('id', user!.id);

    if (error) {
      toast.error('Erro ao salvar formação: ' + error.message);
      throw error;
    }
  };

  const handleSaveStep4 = async (data: Step4FormData) => {
    setStep4Data(data);

    // Adicionar timestamp de consentimento
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

    if (error) {
      toast.error('Erro ao salvar dados de saúde: ' + error.message);
      throw error;
    }
  };

  // Salvar step atual antes de avançar
  const handleBeforeNext = async () => {
    const { currentStep } = { currentStep: 1 }; // Será obtido do WizardStepContent
    // A lógica de salvar será feita dentro de cada Step
  };

  // Finalizar wizard
  const handleFinish = async () => {
    setIsSubmitting(true);

    try {
      // Marcar perfil como completo
      const { error } = await supabase.rpc('marcar_perfil_completo', {
        user_id: user!.id
      });

      if (error) throw error;

      // Atualizar context
      await refreshProfile();

      toast.success('Perfil completado com sucesso!');

      // Fechar modal se callback fornecido
      onClose?.();
    } catch (error: any) {
      toast.error('Erro ao finalizar: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-6xl max-h-[90vh] overflow-y-auto p-0"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <WizardProvider totalSteps={4}>
          <WizardBase
            steps={WIZARD_STEPS}
            onFinish={handleFinish}
            isSubmitting={isSubmitting}
          >
            <WizardStepContent
              step1Data={step1Data}
              step2Data={step2Data}
              step3Data={step3Data}
              step4Data={step4Data}
              onSaveStep1={handleSaveStep1}
              onSaveStep2={handleSaveStep2}
              onSaveStep3={handleSaveStep3}
              onSaveStep4={handleSaveStep4}
            />
          </WizardBase>
        </WizardProvider>
      </DialogContent>
    </Dialog>
  );
}

// Componente interno para renderizar step correto
function WizardStepContent({
  step1Data,
  step2Data,
  step3Data,
  step4Data,
  onSaveStep1,
  onSaveStep2,
  onSaveStep3,
  onSaveStep4
}: any) {
  const { currentStep } = useWizard();

  switch (currentStep) {
    case 1:
      return <Step1IdentificacaoContato initialData={step1Data} onSave={onSaveStep1} />;
    case 2:
      return <Step2Endereco initialData={step2Data} onSave={onSaveStep2} />;
    case 3:
      return <Step3MilitarFormacao initialData={step3Data} onSave={onSaveStep3} />;
    case 4:
      return <Step4Saude initialData={step4Data} onSave={onSaveStep4} />;
    default:
      return null;
  }
}
