'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/customers');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Spin size="large" />
      <p className="mt-4 text-gray-600">正在跳转...</p>
    </div>
  );
}
