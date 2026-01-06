import React, { createContext, useContext, useState, useCallback } from 'react';
import { WizardStep, WizardContextType } from '@/types/wizard';

const WizardContext = createContext<WizardContextType | undefined>(undefined);

interface WizardProviderProps {
  children: React.ReactNode;
  totalSteps: number;
  initialStep?: WizardStep;
}

export function WizardProvider({
  children,
  totalSteps,
  initialStep = 1
}: WizardProviderProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(initialStep);
  const [canGoNext, setCanGoNext] = useState(false);

  const goToStep = useCallback((step: WizardStep) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step as WizardStep);
    }
  }, [totalSteps]);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
      setCanGoNext(false);
    }
  }, [currentStep, totalSteps]);

  const previousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  }, [currentStep]);

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <WizardContext.Provider
      value={{
        currentStep,
        goToStep,
        nextStep,
        previousStep,
        isFirstStep,
        isLastStep,
        canGoNext,
        setCanGoNext
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider');
  }
  return context;
}
