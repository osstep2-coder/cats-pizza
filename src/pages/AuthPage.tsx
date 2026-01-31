import type { FormEvent } from 'react';
import { useState } from 'react';
import './Forms.css';

type AuthMode = 'login' | 'register';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const resetMessages = () => {
    setMessage('');
    setError('');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    resetMessages();

    if (!email.trim() || !password.trim()) {
      setError('Введите email и пароль.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Введите имя.');
        return;
      }
      if (password !== confirm) {
        setError('Пароли не совпадают.');
        return;
      }
      setMessage('Регистрация прошла успешно (мок). Теперь вы можете войти.');
      setMode('login');
      setPassword('');
      setConfirm('');
      return;
    }

    setMessage('Вход выполнен (мок). Здесь могла бы быть интеграция с API.');
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    resetMessages();
  };

  return (
    <section>
      <h1>Авторизация</h1>

      <div className="page-tabs" style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => switchMode('login')}
          disabled={mode === 'login'}
          className={`page-tabs__button ${mode === 'login' ? 'page-tabs__button--active' : ''}`}>
          Вход
        </button>
        <button
          type="button"
          onClick={() => switchMode('register')}
          disabled={mode === 'register'}
          className={`page-tabs__button ${mode === 'register' ? 'page-tabs__button--active' : ''}`}>
          Регистрация
        </button>
      </div>

      <form onSubmit={handleSubmit} className="page-card__form" style={{ maxWidth: 360 }}>
        {mode === 'register' && (
          <div>
            <label>
              Имя:
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
          </div>
        )}

        <div>
          <label>
            Email:
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        </div>

        <div>
          <label>
            Пароль:
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
        </div>

        {mode === 'register' && (
          <div>
            <label>
              Повторите пароль:
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
          </div>
        )}

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}

        <button type="submit">{mode === 'login' ? 'Войти' : 'Зарегистрироваться'}</button>
      </form>
    </section>
  );
}
