'use client';

import React, { useState, useEffect } from 'react';
import {
    Modal, Form, Input, Select, DatePicker, InputNumber, Button, Row, Col, App
} from 'antd';
import { ViewingRecord } from '@/types';
import {
    BUSINESS_TYPE_TEXT, ROOM_TYPE_TEXT, CITY_LIST
} from '@/utils/constants';
import dayjs, { Dayjs } from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface EditViewingModalProps {
    visible: boolean;
    record: ViewingRecord | null;
    onCancel: () => void;
    onSuccess: () => void;
}

export default function EditViewingModal({ visible, record, onCancel, onSuccess }: EditViewingModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const { message } = App.useApp();

    // 当记录变化时，更新表单数据
    useEffect(() => {
        if (record && visible) {
            form.setFieldsValue({
                property_name: record.property_name,
                property_address: record.property_address,
                cityName: record.cityName,
                viewing_time: record.viewing_time ? dayjs(record.viewing_time) : null,
                room_type: record.room_type,
                room_tag: record.room_tag,
                viewer_name: record.viewer_name,
                viewing_status: record.viewing_status,
                commission: record.commission,
                viewing_feedback: record.viewing_feedback,
                business_type: record.business_type,
                notes: record.notes,
            });
        }
    }, [record, visible, form]);

    const toISOString = (value?: Dayjs | null): string | null => {
        if (!value) return null;
        const d = value.toDate();
        return isNaN(d.getTime()) ? null : d.toISOString();
    };

    const handleSubmit = async (values: Record<string, unknown>) => {
        if (!record) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/viewing-records/${record.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...values,
                    viewing_time: toISOString(values.viewing_time as Dayjs | null) || record.viewing_time,
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                message.success('带看记录更新成功');
                form.resetFields();
                onSuccess();
                onCancel();
            } else {
                message.error(result.error || '更新带看记录失败');
            }
        } catch (error) {
            console.error('更新带看记录失败:', error);
            message.error('网络请求失败');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            title="编辑带看记录"
            open={visible}
            onCancel={handleCancel}
            footer={null}
            width={700}
            destroyOnHidden
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="物业地址"
                            name="property_name"
                            rules={[{ required: true, message: '请输入物业地址' }]}
                        >
                            <Input placeholder="请输入物业地址" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="城市"
                            name="cityName"
                        >
                            <Select placeholder="请选择城市" showSearch allowClear>
                                {CITY_LIST.map(city => (
                                    <Option key={city} value={city}>{city}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="详细地址"
                            name="property_address"
                        >
                            <Input placeholder="请输入详细地址" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="带看时间"
                            name="viewing_time"
                            rules={[{ required: true, message: '请选择带看时间' }]}
                        >
                            <DatePicker 
                                showTime 
                                style={{ width: '100%' }}
                                placeholder="请选择带看时间"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="带看状态"
                            name="viewing_status"
                            rules={[{ required: true, message: '请选择带看状态' }]}
                        >
                            <Select placeholder="请选择带看状态">
                                <Option value={1}>待确认</Option>
                                <Option value={2}>已确认</Option>
                                <Option value={3}>已取消</Option>
                                <Option value={4}>已带看</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            label="房型"
                            name="room_type"
                            rules={[{ required: true, message: '请选择房型' }]}
                        >
                            <Select placeholder="请选择房型">
                                {Object.entries(ROOM_TYPE_TEXT).map(([key, value]) => (
                                    <Option key={key} value={key}>{value}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label="房型标签"
                            name="room_tag"
                        >
                            <Select placeholder="请选择房型标签" allowClear>
                                <Option value="studio">开间</Option>
                                <Option value="loft">复式</Option>
                                <Option value="flat">平层</Option>
                                <Option value="two_bath">双卫</Option>
                                <Option value="bungalow">平房</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label="业务类型"
                            name="business_type"
                            rules={[{ required: true, message: '请选择业务类型' }]}
                        >
                            <Select placeholder="请选择业务类型">
                                {Object.entries(BUSINESS_TYPE_TEXT).map(([key, value]) => (
                                    <Option key={key} value={key}>{value}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            label="带看人"
                            name="viewer_name"
                            rules={[{ required: true, message: '请选择带看人' }]}
                        >
                            <Select placeholder="请选择带看人">
                                <Option value="internal">内部管家</Option>
                                <Option value="external">外部管家</Option>
                                <Option value="external_sales">外销管家</Option>
                                <Option value="creator">录入人</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label="佣金"
                            name="commission"
                            rules={[{ required: true, message: '请输入佣金' }]}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                placeholder="请输入佣金"
                                min={0}
                                precision={2}
                                addonAfter="元"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label="带看反馈"
                            name="viewing_feedback"
                        >
                            <Select placeholder="请选择带看反馈" allowClear>
                                <Option value={0}>未成交</Option>
                                <Option value={1}>已成交</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    label="备注"
                    name="notes"
                >
                    <TextArea
                        rows={4}
                        placeholder="请输入备注信息"
                        maxLength={500}
                        showCount
                    />
                </Form.Item>

                <div style={{ textAlign: 'right', marginTop: 24 }}>
                    <Button onClick={handleCancel} style={{ marginRight: 8 }}>
                        取消
                    </Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        更新
                    </Button>
                </div>
            </Form>
        </Modal>
    );
} 