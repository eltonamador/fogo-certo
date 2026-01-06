import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Stepper } from './Stepper';
import { useWizard } from '@/contexts/WizardContext';
import { WizardStepConfig } from '@/types/wizard';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface WizardBaseProps {
  steps: WizardStepConfig[];
  children: ReactNode;
  onFinish: () => Promise<void>;
  onBeforeNext?: () => Promise<void>;
  isSubmitting?: boolean;
}

export function WizardBase({
  steps,
  children,
  onFinish,
  onBeforeNext,
  isSubmitting = false
}: WizardBaseProps) {
  const {
    currentStep,
    goToStep,
    previousStep,
    nextStep,
    isFirstStep,
    isLastStep,
    canGoNext
  } = useWizard();

  const handleNext = async () => {
    try {
      // Chamar callback antes de avançar (para salvar dados)
      if (onBeforeNext) {
        await onBeforeNext();
      }

      if (isLastStep) {
        await onFinish();
      } else {
        nextStep();
      }
    } catch (error) {
      console.error('Erro ao avançar:', error);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <Card>
        <CardHeader className="space-y-6">
          <Stepper
            steps={steps}
            currentStep={currentStep}
            onStepClick={goToStep}
          />
        </CardHeader>

        <CardContent className="min-h-[400px]">
          {children}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={previousStep}
            disabled={isFirstStep || isSubmitting}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <Button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext || isSubmitting}
            data-wizard-next
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : isLastStep ? (
              'Concluir'
            ) : (
              <>
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
