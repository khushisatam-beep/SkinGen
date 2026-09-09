import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import UserForm from './components/UserForm';
import About from './components/About';

export default function App() {
  return (
    <BrowserRouter>
      {/* Simple Navigation Bar matching viva requirements: Home | User Form | About */}
      <nav
        style={{
          backgroundColor: '#1b3b2b',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 600,
          borderBottom: '1px solid #142e21'
        }}
      >
        <Link
          to="/"
          style={{
            color: '#ffffff',
            textDecoration: 'none'
          }}
        >
          Home
        </Link>
        <span style={{ color: '#88a695' }}>|</span>
        <Link
          to="/form"
          style={{
            color: '#ffffff',
            textDecoration: 'none'
          }}
        >
          User Form
        </Link>
        <span style={{ color: '#88a695' }}>|</span>
        <Link
          to="/about"
          style={{
            color: '#ffffff',
            textDecoration: 'none'
          }}
        >
          About
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/form"
          element={
            <div style={{ padding: '24px 16px', minHeight: 'calc(100vh - 50px)', backgroundColor: '#f4f7f5' }}>
              <UserForm />
            </div>
          }
        />
        <Route
          path="/about"
          element={
            <div style={{ padding: '24px 16px', minHeight: 'calc(100vh - 50px)', backgroundColor: '#f4f7f5' }}>
              <About />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
