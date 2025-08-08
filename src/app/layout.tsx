import type { Metadata, Viewport } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import './globals.css';

export const metadata: Metadata = {
    title: 'CRM 客户关系管理系统',
    description: '房产中介CRM客户关系管理系统',
    keywords: 'CRM, 客户管理, 房产中介, 带看管理',
    authors: [{ name: 'CRM Team' }],
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
};

// Ant Design 主题配置
const antdTheme = {
    token: {
        colorPrimary: '#1890ff',
        borderRadius: 6,
        wireframe: false,
    },
    components: {
        Layout: {
            siderBg: '#001529',
            triggerBg: '#002140',
        },
        Menu: {
            darkItemBg: '#001529',
            darkSubMenuItemBg: '#000c17',
            darkItemSelectedBg: '#1890ff',
        },
        Table: {
            headerBg: '#fafafa',
            headerColor: '#262626',
            rowHoverBg: '#f5f5f5',
        },
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh-CN">
            <body>
                <AntdRegistry>
                    <ConfigProvider
                        locale={zhCN}
                        theme={antdTheme}
                        componentSize="middle"
                    >
                        <AntApp>
                            {children}
                        </AntApp>
                    </ConfigProvider>
                </AntdRegistry>
            </body>
        </html>
    );
} 