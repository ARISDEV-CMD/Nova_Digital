import { useState, type FormEvent } from 'react';
import { signInWithEmailPassword } from '../../lib/auth-client.ts';
import { PasswordField } from '../ui/PasswordField.tsx';
import { GoogleSignInButton } from './GoogleSignInButton.tsx';

type Props = {
  callbackUrl: string;
  onError: (message: string) => void;
  disabled?: boolean;
  className?: string;
};

const inputClass = 'w-full rounded-lg border border-[#343a46] bg-[#10141d] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#8083ff]';
const buttonClass = 'inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#8083ff] px-4 py-2 text-sm font-semibold text-[#0d1020] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50';

export function EmailAuthPanel({ callbackUrl, onError, disabled = false, className = '' }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const registering = mode === 'signup';

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onError('');
    if (registering && password !== confirmPassword) {
      onError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setBusy(true);
    try {
      if (registering) {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const body = await response.json().catch(() => null) as { error?: string } | null;
        if (!response.ok) throw new Error(body?.error || 'La création du compte a échoué.');
      }
      await signInWithEmailPassword(email, password, callbackUrl);
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : 'La connexion par e-mail a échoué.');
      setBusy(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <form onSubmit={(event) => void submit(event)} className="space-y-3.5">
        {registering && <label className="block space-y-1.5 text-sm text-[#c7c4d7]">
          <span>Nom complet</span>
          <input className={inputClass} type="text" autoComplete="name" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} required />
        </label>}
        <label className="block space-y-1.5 text-sm text-[#c7c4d7]">
          <span>Adresse e-mail</span>
          <input className={inputClass} type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <PasswordField
          label="Mot de passe"
          value={password}
          onChange={setPassword}
          autoComplete={registering ? 'new-password' : 'current-password'}
          minLength={registering ? 8 : undefined}
          className={inputClass}
        />
        {registering && <PasswordField
          label="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          minLength={8}
          className={inputClass}
        />}
        <button type="submit" disabled={disabled || busy} className={buttonClass}>
          {busy ? 'Veuillez patienter…' : registering ? 'Créer mon compte' : 'Se connecter avec mon e-mail'}
        </button>
      </form>

      <p className="text-center text-xs text-[#a9afbf]">
        {registering ? 'Tu as déjà un compte ?' : 'Tu n’as pas encore de compte ?'}{' '}
        <button type="button" disabled={disabled || busy} onClick={() => { setMode(registering ? 'signin' : 'signup'); onError(''); }} className="font-semibold text-[#c0c1ff] hover:text-white disabled:opacity-50">
          {registering ? 'Se connecter' : 'Créer un compte'}
        </button>
      </p>

      <div className="flex items-center gap-3 text-[11px] text-[#8f96a6]" aria-hidden="true">
        <span className="h-px flex-1 bg-[#31353e]" /><span>OU</span><span className="h-px flex-1 bg-[#31353e]" />
      </div>
      <GoogleSignInButton disabled={disabled || busy} onError={onError} callbackUrl={callbackUrl} />
    </div>
  );
}
