import * as React from 'react';
import { Input } from './input';
import { useMask, MaskType } from '@/hooks/useMask';
import { cn } from '@/lib/utils';

export interface MaskedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  maskType: MaskType;
  onValueChange?: (value: string) => void;
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, maskType, onValueChange, value: propValue, ...props }, ref) => {
    const { handleChange, applyMask } = useMask(maskType);

    const [internalValue, setInternalValue] = React.useState(
      propValue ? applyMask(String(propValue)) : ''
    );

    React.useEffect(() => {
      if (propValue !== undefined) {
        const masked = applyMask(String(propValue));
        setInternalValue(masked);
      }
    }, [propValue, applyMask]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = handleChange(e);
      setInternalValue(masked);
      onValueChange?.(masked);
    };

    return (
      <Input
        ref={ref}
        className={cn(className)}
        value={internalValue}
        onChange={handleInputChange}
        {...props}
      />
    );
  }
);

MaskedInput.displayName = 'MaskedInput';

export { MaskedInput };
