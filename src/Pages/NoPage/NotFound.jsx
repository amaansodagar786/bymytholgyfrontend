import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.scss';

function NotFound() {
  const navigate = useNavigate();
  
  return (
    <div className="not-found">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <button onClick={() => navigate('/')}>Go Home</button>
    </div>
  );
}

export default NotFound;