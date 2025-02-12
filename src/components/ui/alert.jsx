import PropTypes from 'prop-types';

export const Alert = ({ children, variant, className }) => {
  const variantClasses = {
    destructive: 'bg-red-100 text-red-800 border-red-200',
    // ...otros variantes si es necesario
  };

  return (
    <div className={`border-l-4 p-4 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

Alert.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export const AlertDescription = ({ children }) => (
  <div className="ml-2">{children}</div>
);

AlertDescription.propTypes = {
  children: PropTypes.node.isRequired,
};
