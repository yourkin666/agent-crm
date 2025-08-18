'use client';

import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';

interface StatsCardsProps {
    stats: {
        total: number;
        following: number;
        completed: number;
        totalCommission: number;
    };
    loading: boolean;
}

export default function StatsCards({ stats, loading }: StatsCardsProps) {
    return (
        <div className="stats-panel">
            <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="stats-card hover-card">
                        <Statistic
                            title="总客户数"
                            value={stats.total}
                            valueStyle={{ color: '#3b82f6' }}
                            prefix={<div className="w-2 h-2 bg-blue-500 rounded-full inline-block mr-2"></div>}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="stats-card hover-card">
                        <Statistic
                            title="跟进中"
                            value={stats.following}
                            valueStyle={{ color: '#10b981' }}
                            prefix={<div className="w-2 h-2 bg-green-500 rounded-full inline-block mr-2"></div>}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="stats-card hover-card">
                        <Statistic
                            title="已成交"
                            value={stats.completed}
                            valueStyle={{ color: '#8b5cf6' }}
                            prefix={<div className="w-2 h-2 bg-purple-500 rounded-full inline-block mr-2"></div>}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="stats-card hover-card">
                        <Statistic
                            title="总佣金"
                            value={stats.totalCommission}
                            precision={2}
                            suffix="元"
                            valueStyle={{ color: '#f59e0b' }}
                            prefix={<div className="w-2 h-2 bg-amber-500 rounded-full inline-block mr-2"></div>}
                            loading={loading}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
} 