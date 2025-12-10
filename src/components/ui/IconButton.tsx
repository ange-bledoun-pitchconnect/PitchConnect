import { LucideIcon } from 'lucide-react';
import { ButtonHTMLAttributes } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string; // Required for accessibility
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function IconButton({
  icon: Icon,
  label,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const variantClasses = {
    primary: 'bg-gold-500 hover:bg-gold-600 text-white',
    secondary: 'bg-neutral-200 hover:bg-neutral-300 text-charcoal-900',
    ghost: 'hover:bg-neutral-100 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300'
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-lg transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
    </button>
  );
}
