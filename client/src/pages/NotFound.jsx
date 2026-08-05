import { Link } from 'react-router-dom';
import { RiSettings4Fill, RiArrowLeftLine } from 'react-icons/ri';
import '../components/ui/ui.css';

const NotFound = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, var(--color-brand-900) 0%, var(--color-brand-700) 100%)',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          background: 'linear-gradient(135deg, var(--color-brand-600) 0%, var(--color-brand-400) 100%)',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 30,
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
          marginBottom: '2rem',
        }}
        aria-hidden="true"
      >
        <RiSettings4Fill />
      </div>

      <h1
        style={{
          fontSize: 'clamp(3rem, 8vw, 5rem)',
          fontWeight: 800,
          color: '#fff',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          marginBottom: '0.75rem',
        }}
      >
        404
      </h1>

      <p
        style={{
          fontSize: '1.05rem',
          color: 'rgba(203, 213, 225, 0.85)',
          marginBottom: '2rem',
          maxWidth: 420,
        }}
      >
        Sorry, the page you are looking for doesn't exist or has been moved.
      </p>

      <Link
        to="/dashboard"
        className="btn btn-primary"
        style={{ textDecoration: 'none' }}
      >
        <RiArrowLeftLine size={18} />
        Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
