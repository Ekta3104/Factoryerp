import { forwardRef, useState } from 'react';
import { RiEyeLine, RiEyeOffLine, RiErrorWarningLine } from 'react-icons/ri';

/**
 * InputField — reusable labeled input with icon, error state, and
 * optional password show/hide toggle.
 *
 * Props:
 *   id          string   — unique element ID
 *   label       string   — visible label above the input
 *   icon        ReactNode — left-side icon element
 *   unit        string   — right-side unit badge shown inside the input (e.g. "Bags", "Tons")
 *   error       string   — validation error message (from react-hook-form)
 *   type        string   — input type; 'password' auto-adds the visibility toggle
 *   placeholder string
 *   ...rest              — forwarded to <input>
 */
const InputField = forwardRef(function InputField(
  { id, label, icon, unit, error, type = 'text', placeholder, className = '', ...rest },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="input-group">
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
        </label>
      )}

      <div className="input-wrapper">
        {/* Left icon */}
        {icon && <span className="input-icon">{icon}</span>}

        <input
          id={id}
          ref={ref}
          type={resolvedType}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={[
            'input-field',
            icon ? '' : 'pl-3',
            isPassword ? 'has-suffix' : '',
            unit ? 'has-unit' : '',
            error ? 'input-field--error' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />

        {/* Right-side unit badge — e.g. "Bags", "Tons" */}
        {!isPassword && unit && (
          <span className="input-suffix input-unit-badge" aria-hidden="true">{unit}</span>
        )}

        {/* Right toggle — only for password fields */}
        {isPassword && (
          <button
            type="button"
            className="input-suffix"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
          </button>
        )}
      </div>

      {/* Inline validation error */}
      {error && (
        <p id={`${id}-error`} className="input-error-msg" role="alert">
          <RiErrorWarningLine />
          {error}
        </p>
      )}
    </div>
  );
});

export default InputField;
