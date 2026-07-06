// src/modules/users/components/AppButton.tsx
import React from 'react';

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg',
};

export const AppButton: React.FC<AppButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled,
  className = '',
  ...rest
}) => {
  const base = 'rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const classes = `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  return <button className={classes} disabled={disabled} {...rest} />;
};

// Provide a default export for easier imports
export default AppButton;




