import { useState } from 'react';
import { signInWithGoogle } from '../../lib/auth-client.ts';

type Props = {
  disabled?: boolean;
  onError: (message: string) => void;
  className?: string;
  callbackUrl?: string;
};

export function GoogleSignInButton({ disabled = false, onError, className = '', callbackUrl }: Props) {
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    onError('');
    try {
      await signInWithGoogle(callbackUrl || window.location.href);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'La connexion avec Google a échoué.');
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={disabled || busy}
      className={`inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-[#343a46] bg-[#10141d] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#626777] hover:bg-[#1c2028] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 4)" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.39-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.75 7.18l7.73 5.99c4.51-4.16 7.06-10.29 7.06-17.64Z" />
        <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.55 2.56 10.78l7.97-6.19Z" transform="translate(0 4)" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.81l-7.73-5.99c-2.14 1.44-4.88 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(0 -4)" />
      </svg>
      {busy ? 'Redirection vers Google…' : 'Continuer avec Google'}
    </button>
  );
}
