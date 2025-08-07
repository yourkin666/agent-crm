'use client';

import React from 'react';
import { Layout } from 'antd';

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content
        style={{
          padding: '8px',
          background: '#ffffff',
          minHeight: '100vh',
          overflow: 'auto',
        }}
      >
        {children}
      </Content>
    </Layout>
  );
} 