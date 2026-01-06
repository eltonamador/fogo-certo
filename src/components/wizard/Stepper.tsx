import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardStepConfig } from '@/types/wizard';

interface StepperProps {
  steps: WizardStepConfig[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.step}>
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <button
                  type="button"
                  onClick={() => onStepClick?.(stepNumber)}
                  disabled={!isCompleted && !isCurrent}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    "border-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    {
                      "bg-primary border-primary text-primary-foreground": isCompleted,
                      "bg-primary/10 border-primary text-primary": isCurrent,
                      "bg-muted border-muted-foreground/30 text-muted-foreground": !isCompleted && !isCurrent,
                      "cursor-pointer hover:scale-105": isCompleted,
                      "cursor-not-allowed": !isCompleted && !isCurrent
                    }
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </button>

                {/* Step Label */}
                <div className="mt-2 text-center">
                  <p className={cn(
                    "text-sm font-medium",
                    {
                      "text-primary": isCurrent || isCompleted,
                      "text-muted-foreground": !isCurrent && !isCompleted
                    }
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[120px] hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={cn(
                  "h-0.5 flex-1 -mt-10 mx-2",
                  {
                    "bg-primary": stepNumber < currentStep,
                    "bg-muted-foreground/30": stepNumber >= currentStep
                  }
                )}/>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
