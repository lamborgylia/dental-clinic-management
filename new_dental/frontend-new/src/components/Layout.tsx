import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  clinicName?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, clinicName }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header clinicName={clinicName} />
      <main style={{ flex: 1, marginTop: 0, paddingTop: 0 }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
