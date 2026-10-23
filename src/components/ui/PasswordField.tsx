import { useId, useState } from 'react';
import { EyeIcon, EyeOffIcon } from '@animateicons/react/lucide';

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  className: string;
  minLength?: number;
};

export function PasswordField({ label, value, onChange, autoComplete, className, minLength }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();

  return (
    <label htmlFor={inputId} className="block space-y-1.5 text-sm text-[#c7c4d7]">
      <span>{label}</span>
      <span className="relative block">
        <input
          id={inputId}
          className={`${className} pr-12`}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          minLength={minLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-[#8f96a6] transition-colors hover:text-[#c0c1ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8083ff]"
        >
          {visible
            ? <EyeOffIcon size={19} duration={0.7} color="currentColor" />
            : <EyeIcon size={19} duration={0.7} color="currentColor" />}
        </button>
      </span>
    </label>
  );
}
