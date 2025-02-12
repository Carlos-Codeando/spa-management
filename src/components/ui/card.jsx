import PropTypes from 'prop-types';

export const Card = ({ children, className }) => (
  <div className={`bg-white shadow rounded ${className}`}>{children}</div>
);

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export const CardContent = ({ children }) => (
  <div className="p-4">{children}</div>
);

CardContent.propTypes = {
  children: PropTypes.node.isRequired,
};

export const CardHeader = ({ children }) => (
  <div className="border-b p-4">{children}</div>
);

CardHeader.propTypes = {
  children: PropTypes.node.isRequired,
};

export const CardTitle = ({ children }) => (
  <h2 className="text-xl font-semibold">{children}</h2>
);

CardTitle.propTypes = {
  children: PropTypes.node.isRequired,
};
