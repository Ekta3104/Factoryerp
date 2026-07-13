import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  RiUserLine,
  RiLockPasswordLine,
  RiLoginBoxLine,
  RiErrorWarningFill,
  RiSettings4Fill,
  RiCarLine,
  RiTruckLine,
  RiBarChartBoxLine,
  RiShieldCheckLine,
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/ui/InputField';

/* ── Feature pills shown on the left panel ─────────────────── */
const PANEL_FEATURES = [
  { icon: <RiCarLine />,        label: 'Module',  value: 'Vehicle Inward Tracking' },
  { icon: <RiSettings4Fill />,  label: 'Module',  value: 'Production Management' },
  { icon: <RiTruckLine />,      label: 'Module',  value: 'Dispatch & Logistics' },
  { icon: <RiBarChartBoxLine />, label: 'Module', value: 'Reports & Analytics' },
];

/* ── Factory SVG illustration (inline, no external asset) ──── */
const FactoryIllustration = () => (
  <svg
    viewBox="0 0 360 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', maxWidth: 360, marginBottom: '2rem', opacity: 0.9 }}
    aria-hidden="true"
  >
    {/* Ground */}
    <rect x="0" y="160" width="360" height="4" rx="2" fill="rgba(59,130,246,0.25)" />

    {/* Building body */}
    <rect x="60" y="80" width="240" height="80" rx="4" fill="rgba(30,64,175,0.45)" stroke="rgba(59,130,246,0.4)" strokeWidth="1" />

    {/* Chimneys */}
    <rect x="90"  y="50" width="22" height="34" rx="3" fill="rgba(37,99,235,0.5)" stroke="rgba(96,165,250,0.4)" strokeWidth="1" />
    <rect x="130" y="38" width="22" height="46" rx="3" fill="rgba(37,99,235,0.5)" stroke="rgba(96,165,250,0.4)" strokeWidth="1" />
    <rect x="220" y="55" width="22" height="29" rx="3" fill="rgba(37,99,235,0.5)" stroke="rgba(96,165,250,0.4)" strokeWidth="1" />

    {/* Smoke puffs */}
    <circle cx="101" cy="44" r="8" fill="rgba(148,163,184,0.18)" />
    <circle cx="108" cy="38" r="6" fill="rgba(148,163,184,0.12)" />
    <circle cx="141" cy="30" r="9" fill="rgba(148,163,184,0.18)" />
    <circle cx="149" cy="24" r="6" fill="rgba(148,163,184,0.12)" />

    {/* Windows row */}
    {[80, 115, 150, 195, 230, 265].map((x) => (
      <rect key={x} x={x} y="96" width="28" height="20" rx="3"
        fill="rgba(59,130,246,0.20)" stroke="rgba(96,165,250,0.35)" strokeWidth="1" />
    ))}

    {/* Glowing window highlights */}
    {[80, 150, 230].map((x) => (
      <rect key={`glow-${x}`} x={x + 5} y="100" width="8" height="4" rx="1"
        fill="rgba(147,197,253,0.6)" />
    ))}

    {/* Door */}
    <rect x="158" y="130" width="44" height="30" rx="3"
      fill="rgba(30,58,138,0.7)" stroke="rgba(59,130,246,0.4)" strokeWidth="1" />
    <circle cx="196" cy="146" r="3" fill="rgba(147,197,253,0.8)" />

    {/* Conveyor belt line */}
    <line x1="60" y1="164" x2="300" y2="164" stroke="rgba(59,130,246,0.35)" strokeWidth="2" strokeDasharray="6 4" />

    {/* Accent glow line */}
    <line x1="0" y1="164" x2="360" y2="164" stroke="rgba(59,130,246,0.15)" strokeWidth="8" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════ */
/*  LOGIN PAGE                                                  */
/* ═══════════════════════════════════════════════════════════ */
const Login = () => {
  const { login, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm({ mode: 'onTouched' });

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  /* ── Form submit handler ─────────────────────────────────── */
  const onSubmit = async (data) => {
    clearErrors('root');
    try {
      await login({
        username: data.username.trim(),
        password: data.password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        'Unable to sign in. Please check your credentials and try again.';
      setError('root', { type: 'server', message });
    }
  };

  /* ── Full-page loading shimmer while session check runs ──── */
  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #0f172a 0%, #1d3461 100%)',
        }}
        aria-label="Checking session…"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48, height: 48,
              border: '3px solid rgba(59,130,246,0.25)',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ color: 'rgba(148,163,184,0.8)', fontSize: 14, fontWeight: 500 }}>
            Verifying session…
          </p>
        </div>
      </div>
    );
  }

  const isFormLoading = isSubmitting;

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="login-root">

      {/* ── Left Brand Panel ─────────────────────────────── */}
      <aside className="login-panel" aria-hidden="true">
        <div className="login-panel-orb" />

        <div className="login-panel-content">
          <div className="login-panel-badge">
            <span className="login-panel-badge-dot" />
            Enterprise ERP Platform
          </div>

          <h1 className="login-panel-title">
            Manage your<br />
            factory with <span>precision</span>.
          </h1>

          <p className="login-panel-desc">
            End-to-end visibility across vehicle inward, production,
            dispatch, and expenses — all in one unified platform.
          </p>

          <FactoryIllustration />

          <div className="login-panel-stats">
            {PANEL_FEATURES.map((feat) => (
              <div key={feat.value} className="login-stat-pill">
                <span className="login-stat-icon">{feat.icon}</span>
                <div>
                  <div className="login-stat-label">{feat.label}</div>
                  <div className="login-stat-value">{feat.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Right Form Panel ─────────────────────────────── */}
      <main className="login-form-side">
        <div className="login-card animate-fade-up">

          {/* Logo */}
          <div className="login-logo">
            <div className="login-logo-icon" aria-hidden="true">
              <RiSettings4Fill />
            </div>
            <div>
              <div className="login-logo-name">
                Factory<span>ERP</span>
              </div>
            </div>
          </div>

          {/* Headings */}
          <h2 className="login-heading">Welcome back</h2>
          <p className="login-subheading">Sign in to your account to continue</p>

          {/* Server-level error alert */}
          {errors.root && (
            <div className="login-alert" role="alert">
              <RiErrorWarningFill className="login-alert-icon" />
              <p className="login-alert-text">{errors.root.message}</p>
            </div>
          )}

          {/* ── Form ───────────────────────────────────── */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-label="Login form"
          >
            {/* Username */}
            <InputField
              id="username"
              label="Username"
              type="text"
              placeholder="Enter your username"
              icon={<RiUserLine />}
              autoComplete="username"
              autoFocus
              error={errors.username?.message}
              {...register('username', {
                required: 'Username is required',
                minLength: {
                  value: 2,
                  message: 'Username must be at least 2 characters',
                },
              })}
            />

            {/* Password */}
            <InputField
              id="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              icon={<RiLockPasswordLine />}
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />

            {/* Remember me + Forgot password */}
            <div className="login-form-row">
              <label className="login-remember" htmlFor="remember-me">
                <input
                  id="remember-me"
                  type="checkbox"
                  {...register('rememberMe')}
                />
                <span className="login-remember-label">Remember me</span>
              </label>

              <a href="#forgot" className="login-forgot" tabIndex={0}>
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              id="btn-login-submit"
              type="submit"
              className="btn-login"
              disabled={isFormLoading}
              aria-busy={isFormLoading}
            >
              {isFormLoading ? (
                <>
                  <span className="btn-spinner" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                <>
                  <RiLoginBoxLine aria-hidden="true" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="login-divider">
            <span>Secured Access</span>
          </div>

          <p className="login-footer-note">
            <RiShieldCheckLine
              style={{ display: 'inline', marginRight: 4, color: '#22c55e', verticalAlign: 'middle' }}
            />
            Protected by end-to-end encryption. Contact your administrator
            if you have trouble signing in.
          </p>

        </div>
      </main>
    </div>
  );
};

export default Login;
