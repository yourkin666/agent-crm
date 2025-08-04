import { Spin } from 'antd';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Spin size="large" />
      <p className="mt-4 text-gray-600">加载中...</p>
    </div>
  );
} 