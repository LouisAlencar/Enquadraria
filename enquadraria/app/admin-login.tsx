'use client';
import { useState } from 'react';
export default function AdminLogin({
  onSuccess,
  onClose,
}: {
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <div className="login-overlay">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-heading"
        className="login-box"
      >
        <button className="close" onClick={onClose} aria-label="Fechar login">
          ×
        </button>
        <p className="eyebrow">ÁREA RESTRITA</p>
        <h2 id="login-heading">Entrar na Enquadraria</h2>
        <p>Acesso exclusivo para administrar modelos e pedidos.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            try {
              const r = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
              });
              const d = await r.json();
              if (!r.ok) throw Error(d.error);
              setPassword('');
              onSuccess();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            E-mail
            <input
              autoFocus
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <button className="button dark" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </section>
    </div>
  );
}
