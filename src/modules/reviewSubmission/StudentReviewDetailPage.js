import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Collapse, Tag, Button, Space, Modal, Spin, Avatar, Descriptions, Divider } from 'antd';
import { UserOutlined, CheckCircleOutlined, CloseCircleOutlined, SaveOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';

import PageWrapper from '@components/common/layout/PageWrapper';
import { BaseForm } from '@components/common/form/BaseForm';
import TextField from '@components/common/form/TextField';

import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';
import useBasicForm from '@hooks/useBasicForm';

import apiConfig from '@constants/apiConfig';
import { AppConstants } from '@constants';
import { commonMessage } from '@locales/intl';
import useNotification from '@hooks/useNotification';

const { Panel } = Collapse;

const StudentReviewDetailPage = ({ pageOptions }) => {
    const translate = useTranslate();
    const notify = useNotification();
    const navigate = useNavigate();
    const { simulationId, username } = useParams();
    const [reviewId, setReviewId] = useState(null);
    const [studentInfo, setStudentInfo] = useState(null);

    const { form } = useBasicForm();

    // Fetch danh sách Task/SubTask
    const { data: tasks, loading: loadingTasks } = useFetch(apiConfig.task.educatorList, {
        immediate: true,
        params: { simulationId },
        mappingData: (res) => res.data?.content || [],
    });

    // Fetch câu trả lời của student
    const { data: answers, loading: loadingAnswers } = useFetch(
        apiConfig.taskQuestionProgress.answerList,
        {
            immediate: true,
            params: { simulationId, username },
            mappingData: (res) => res.data?.content || [],
        },
    );

    // Fetch nhận xét hiện có
    const { data: existingReview, loading: loadingReview, execute: refetchReview } = useFetch(
        apiConfig.reviewSubmission.getForEducator,
        {
            immediate: true,
            pathParams: { simulationId, username },
            mappingData: (res) => res.data,
        },
    );

    const { execute: createReview, loading: creating } = useFetch(apiConfig.reviewSubmission.create, {
        immediate: false,
    });

    const { execute: updateReview, loading: updating } = useFetch(apiConfig.reviewSubmission.update, {
        immediate: false,
    });

    const { execute: deleteReview, loading: deleting } = useFetch(apiConfig.reviewSubmission.delete, {
        immediate: false,
    });

    useEffect(() => {
        if (existingReview) {
            setReviewId(existingReview.id);
            form.setFieldsValue({ content: existingReview.content });
        }
    }, [existingReview]);

    // Lấy thông tin student từ answers
    useEffect(() => {
        if (answers && answers.length > 0) {
            const firstAnswer = answers[0];
            setStudentInfo({
                username: username,
                fullName: firstAnswer.studentSubTaskProgress?.student?.account?.fullName || username,
                email: firstAnswer.studentSubTaskProgress?.student?.account?.email,
                avatar: firstAnswer.studentSubTaskProgress?.student?.account?.avatar,
            });
        }
    }, [answers, username]);

    // Nhóm câu trả lời theo Task ID
    const groupedAnswersByTask = {};
    answers?.forEach(answer => {
        const taskId = answer.taskQuestion?.task?.id;
        if (taskId) {
            if (!groupedAnswersByTask[taskId]) {
                groupedAnswersByTask[taskId] = [];
            }
            groupedAnswersByTask[taskId].push(answer);
        }
    });

    // Tính toán thống kê cho mỗi task
    const getTaskStats = (taskId) => {
        const taskAnswers = groupedAnswersByTask[taskId] || [];
        const correctCount = taskAnswers.filter(a => a.isCorrect).length;
        const totalCount = taskAnswers.length;
        const percentage = totalCount > 0 ? ((correctCount / totalCount) * 100).toFixed(1) : 0;
        return { correctCount, totalCount, percentage };
    };

    const handleSaveReview = (values) => {
        if (!values.content || values.content.trim() === '') {
            notify({ type: 'error', message: 'Vui lòng nhập nội dung nhận xét!' });
            return;
        }

        const apiCall = reviewId ? updateReview : createReview;
        const payload = reviewId 
            ? { id: reviewId, content: values.content }
            : { simulationId: Number(simulationId), username, content: values.content };

        apiCall({
            data: payload,
            onCompleted: () => {
                notify({
                    type: 'success',
                    message: reviewId ? 'Cập nhật nhận xét thành công!' : 'Tạo nhận xét thành công!',
                });
                refetchReview();
            },
            onError: (error) => {
                notify({ 
                    type: 'error', 
                    message: error?.message || 'Có lỗi xảy ra!',
                });
            },
        });
    };

    const handleDeleteReview = () => {
        Modal.confirm({
            title: 'Xác nhận xóa nhận xét',
            content: 'Bạn có chắc chắn muốn xóa nhận xét này không?',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            onOk: () => {
                deleteReview({
                    pathParams: { id: reviewId },
                    onCompleted: () => {
                        notify({ type: 'success', message: 'Xóa nhận xét thành công!' });
                        setReviewId(null);
                        form.resetFields();
                        refetchReview();
                    },
                    onError: (error) => {
                        notify({ type: 'error', message: error?.message || 'Có lỗi xảy ra!' });
                    },
                });
            },
        });
    };

    const loading = loadingTasks || loadingAnswers || loadingReview;

    // Phân loại task và subtask
    const mainTasks = tasks?.filter(t => t.kind === 1) || [];
    const getSubTasks = (parentId) => tasks?.filter(t => t.kind === 2 && t.parent?.id === parentId) || [];

    return (
        <PageWrapper 
            loading={loading}
            routes={pageOptions.renderBreadcrumbs(commonMessage, translate, simulationId, username)}
        >
            <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/simulation-review')}
                style={{ marginBottom: 16 }}
            >
                Quay lại danh sách
            </Button>

            <Spin spinning={loading}>
                {/* Thông tin học viên */}
                <Card title="📋 Thông tin học viên" style={{ marginBottom: 16 }}>
                    <Row gutter={16} align="middle">
                        <Col span={4} style={{ textAlign: 'center' }}>
                            <Avatar
                                size={100}
                                icon={<UserOutlined />}
                                src={studentInfo?.avatar ? `${AppConstants.contentRootUrl}${studentInfo.avatar}` : null}
                            />
                        </Col>
                        <Col span={20}>
                            <Descriptions column={2} bordered>
                                <Descriptions.Item label="Họ tên" span={1}>
                                    <strong>{studentInfo?.fullName || username}</strong>
                                </Descriptions.Item>
                                <Descriptions.Item label="Username" span={1}>
                                    {username}
                                </Descriptions.Item>
                                <Descriptions.Item label="Email" span={1}>
                                    {studentInfo?.email || '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Tổng câu hỏi" span={1}>
                                    <strong>{answers?.length || 0}</strong> câu
                                </Descriptions.Item>
                            </Descriptions>
                        </Col>
                    </Row>
                </Card>

                {/* Danh sách Task & câu trả lời */}
                <Card title="📝 Chi tiết bài làm" style={{ marginBottom: 16 }}>
                    <Collapse accordion defaultActiveKey={mainTasks[0]?.id}>
                        {mainTasks.map((task, taskIndex) => {
                            const taskStats = getTaskStats(task.id);
                            const subTasks = getSubTasks(task.id);
                            
                            return (
                                <Panel 
                                    header={
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>
                                                <strong>Task {taskIndex + 1}:</strong> {task.name || task.title}
                                            </span>
                                            {taskStats.totalCount > 0 && (
                                                <Tag color={taskStats.percentage >= 70 ? 'green' : taskStats.percentage >= 50 ? 'orange' : 'red'}>
                                                    Đúng: {taskStats.correctCount}/{taskStats.totalCount} ({taskStats.percentage}%)
                                                </Tag>
                                            )}
                                        </div>
                                    }
                                    key={task.id}
                                >
                                    {task.description && (
                                        <p><strong>📄 Mô tả:</strong> {task.description}</p>
                                    )}
                                    {task.introduction && (
                                        <p><strong>💡 Giới thiệu:</strong> {task.introduction}</p>
                                    )}

                                    <Divider />

                                    {/* SubTasks */}
                                    {subTasks.length > 0 ? (
                                        <Collapse>
                                            {subTasks.map((subtask, subIndex) => {
                                                const subtaskAnswers = groupedAnswersByTask[subtask.id] || [];
                                                const subtaskStats = getTaskStats(subtask.id);
                                                
                                                return (
                                                    <Panel 
                                                        header={
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span>
                                                                    <strong>SubTask {subIndex + 1}:</strong> {subtask.name || subtask.title}
                                                                </span>
                                                                {subtaskStats.totalCount > 0 && (
                                                                    <Tag color={subtaskStats.percentage >= 70 ? 'green' : subtaskStats.percentage >= 50 ? 'orange' : 'red'}>
                                                                        {subtaskStats.correctCount}/{subtaskStats.totalCount}
                                                                    </Tag>
                                                                )}
                                                            </div>
                                                        }
                                                        key={subtask.id}
                                                    >
                                                        {subtask.description && (
                                                            <p><strong>Mô tả:</strong> {subtask.description}</p>
                                                        )}
                                                        
                                                        <Divider>Câu trả lời</Divider>
                                                        
                                                        {subtaskAnswers.length > 0 ? (
                                                            subtaskAnswers.map((answer, idx) => (
                                                                <Card 
                                                                    key={answer.id} 
                                                                    size="small" 
                                                                    style={{ 
                                                                        marginBottom: 12,
                                                                        borderLeft: answer.isCorrect ? '4px solid #52c41a' : '4px solid #ff4d4f',
                                                                    }}
                                                                    title={
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                            <span>Câu {idx + 1}</span>
                                                                            {answer.isCorrect ? (
                                                                                <Tag color="green" icon={<CheckCircleOutlined />}>Đúng</Tag>
                                                                            ) : (
                                                                                <Tag color="red" icon={<CloseCircleOutlined />}>Sai</Tag>
                                                                            )}
                                                                        </div>
                                                                    }
                                                                >
                                                                    <p><strong>❓ Câu hỏi:</strong> {answer.taskQuestion?.question}</p>
                                                                    {answer.taskQuestion?.questionType && (
                                                                        <p><strong>📋 Loại:</strong> <Tag>{answer.taskQuestion.questionType}</Tag></p>
                                                                    )}
                                                                    <p><strong>✍️ Câu trả lời:</strong> <Tag color="blue">{answer.answer || '(Không có câu trả lời)'}</Tag></p>
                                                                </Card>
                                                            ))
                                                        ) : (
                                                            <p style={{ textAlign: 'center', color: '#999' }}>Chưa có câu trả lời</p>
                                                        )}
                                                    </Panel>
                                                );
                                            })}
                                        </Collapse>
                                    ) : (
                                        <p style={{ textAlign: 'center', color: '#999' }}>Task này không có SubTask</p>
                                    )}
                                </Panel>
                            );
                        })}
                    </Collapse>
                </Card>

                {/* Form nhận xét */}
                <Card title="💬 Nhận xét chung">
                    <BaseForm form={form} onFinish={handleSaveReview}>
                        <TextField
                            name="content"
                            label="Nội dung nhận xét"
                            required
                            type="textarea"
                            rows={8}
                            placeholder="Nhập nhận xét của bạn về bài làm của học viên... (Ưu điểm, nhược điểm, góp ý cải thiện...)"
                        />
                        
                        <Space style={{ marginTop: 16 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                icon={<SaveOutlined />}
                                loading={creating || updating}
                                size="large"
                            >
                                {reviewId ? 'Cập nhật nhận xét' : 'Lưu nhận xét'}
                            </Button>
                            
                            {reviewId && (
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={handleDeleteReview}
                                    loading={deleting}
                                    size="large"
                                >
                                    Xóa nhận xét
                                </Button>
                            )}
                            
                            <Button 
                                onClick={() => navigate('/simulation-review')}
                                size="large"
                            >
                                Quay lại
                            </Button>
                        </Space>
                    </BaseForm>
                </Card>
            </Spin>
        </PageWrapper>
    );
};

export default StudentReviewDetailPage;