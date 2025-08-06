'use client';

import React, { useState } from 'react';
import { Layout, Menu, Button, Typography, Avatar, Dropdown } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

const menuItems: MenuProps['items'] = [
  {
    key: '/customers',
    icon: <TeamOutlined />,
    label: '客户管理',
  },
];

const userMenuItems: MenuProps['items'] = [
  {
    key: 'profile',
    icon: <UserOutlined />,
    label: '个人设置',
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: '系统设置',
  },
  {
    type: 'divider',
  },
  {
    key: 'logout',
    icon: <LogoutOutlined />,
    label: '退出登录',
    danger: true,
  },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        // 处理个人设置
        break;
      case 'settings':
        // 处理系统设置
        break;
      case 'logout':
        // 处理退出登录
        break;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={220}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div className="flex items-center justify-center h-16 bg-blue-600">
          <Title
            level={4}
            style={{
              color: 'white',
              margin: 0,
              fontSize: collapsed ? '14px' : '16px'
            }}
          >
            {collapsed ? 'CRM' : 'CRM 管理系统'}
          </Title>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)'
          }}
        >
          <div className="flex items-center">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-gray-600">管理员</span>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick
              }}
              placement="bottomRight"
            >
              <Avatar
                size="default"
                icon={<UserOutlined />}
                style={{ cursor: 'pointer' }}
              />
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#f8fafc',
            minHeight: 'calc(100vh - 112px)',
            overflow: 'auto',
            borderRadius: '12px',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
} 