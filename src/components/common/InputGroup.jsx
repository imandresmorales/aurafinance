import React from 'react';
import './Input.css';

export default function InputGroup({ children, className = '' }) {
  return <div className={`input-group-container ${className}`}>{children}</div>;
}
