import { ReactNode } from 'react';

export type WizardStep = 1 | 2 | 3 | 4;

export interface WizardStepConfig {
  step: WizardStep;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface WizardContextType {
  currentStep: WizardStep;
  goToStep: (step: WizardStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoNext: boolean;
  setCanGoNext: (can: boolean) => void;
}
