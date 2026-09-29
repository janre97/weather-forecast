import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.scss';

type Variant = 'default' | 'primary' | 'link';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: Variant;
}

export const Button = ({ variant = 'default', className = '', type = 'button', ...props }: ButtonProps) => (
  <button
    type={type}
    className={[styles.button, variant !== 'default' ? styles[variant] : '', className].filter(Boolean).join(' ')}
    {...props}
  />
);
