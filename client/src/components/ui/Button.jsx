import './ui.css';

const Button = ({ children, variant = 'primary', type = 'button', onClick, disabled, className = '', ...props }) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  
  return (
    <button 
      type={type} 
      className={`${baseClass} ${variantClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
