import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#534AB7] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[#534AB7] text-white hover:bg-[#4239A0]',
        secondary: 'border-transparent bg-[#EEEDFB] text-[#534AB7] hover:bg-[#D5D3F6]',
        outline: 'border-[#534AB7] text-[#534AB7] bg-transparent',
        destructive: 'border-transparent bg-red-500 text-white hover:bg-red-600',
        success: 'border-transparent bg-green-100 text-green-700',
        warning: 'border-transparent bg-amber-100 text-amber-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
