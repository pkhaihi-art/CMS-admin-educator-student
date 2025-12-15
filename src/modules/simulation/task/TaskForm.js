import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Button, Input, Space, Modal, Divider, Tag, Collapse, Alert } from 'antd';
import { PlusOutlined, MinusCircleOutlined, EyeOutlined, BookOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';

import { BaseForm } from '@components/common/form/BaseForm';
import CropImageField from '@components/common/form/CropImageField';
import TextField from '@components/common/form/TextField';
import NumericField from '@components/common/form/NumericField';

import useBasicForm from '@hooks/useBasicForm';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';

import { AppConstants, TaskTypes } from '@constants';
import apiConfig from '@constants/apiConfig';
import { taskKindOptions } from '@constants/masterData';
import { commonMessage } from '@locales/intl';

const { TextArea } = Input;
const { Panel } = Collapse;

const TaskForm = (props) => {
    const translate = useTranslate();
    const kindValues = translate.formatKeys(taskKindOptions, ['label']);
    const location = useLocation();
    
    // Lấy parentTask từ location.state
    const parentTaskFromState = location.state?.parentTask;

    const {
        formId,
        actions,
        dataDetail,
        onSubmit,
        setIsChangedFormValues,
        isEditing,
        simulationId,
    } = props;

    const { execute: executeUpFile } = useFetch(apiConfig.file.upload);
    const { execute: getTaskList } = useFetch(apiConfig.task.getList);
    
    const [imagePath, setImagePath] = useState(null);
    const [videoPath, setVideoPath] = useState(null);
    const [filePath, setFilePath] = useState(null);
    const [taskKind, setTaskKind] = useState(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [parentTaskInfo, setParentTaskInfo] = useState(null);
    const [autoNameGenerated, setAutoNameGenerated] = useState(false);

    const [introductionSections, setIntroductionSections] = useState([
        { title: '', content: '' },
    ]);

    const { form, mixinFuncs, onValuesChange } = useBasicForm({
        onSubmit,
        setIsChangedFormValues,
    });

    // Xác định loại task và parent info từ location.state hoặc dataDetail
    useEffect(() => {
        console.log('Parent Info from location.state:', parentTaskFromState);
        console.log('Is Editing:', isEditing);
        console.log('Data Detail:', dataDetail);
        
        if (!isEditing) {
            // Khi tạo mới
            if (parentTaskFromState) {
                // Đang tạo SubTask
                setTaskKind(TaskTypes.SUBTASK);
                setParentTaskInfo(parentTaskFromState);
                
                // Set name ngay lập tức cho SubTask = tên của Task cha
                setTimeout(() => {
                    form.setFieldsValue({ name: parentTaskFromState.name });
                    console.log('Set form name from state:', parentTaskFromState.name);
                }, 100);
                setAutoNameGenerated(true);
            } else {
                // Đang tạo Task
                setTaskKind(TaskTypes.TASK);
                setParentTaskInfo(null);
            }
        } else {
            // Khi edit, lấy thông tin từ dataDetail
            if (dataDetail?.kind === TaskTypes.SUBTASK && dataDetail?.parent) {
                setTaskKind(TaskTypes.SUBTASK);
                setParentTaskInfo(dataDetail.parent);
            } else if (dataDetail?.kind === TaskTypes.TASK) {
                setTaskKind(TaskTypes.TASK);
                setParentTaskInfo(null);
            }
        }
    }, [parentTaskFromState, isEditing, dataDetail]);

    // Generate auto name cho Task (không phải SubTask)
    const generateAutoName = async () => {
        if (isEditing || autoNameGenerated || taskKind !== TaskTypes.TASK) return;

        try {
            const response = await getTaskList({
                params: {
                    simulationId: simulationId,
                },
            });

            if (response?.data?.data) {
                const tasks = response.data.data;
                const taskCount = tasks.filter(t => t.kind === TaskTypes.TASK).length;
                const autoName = `Nhiệm vụ ${taskCount + 1}`;
                form.setFieldsValue({ name: autoName });
                setAutoNameGenerated(true);
            }
        } catch (error) {
            console.error('Error generating auto name:', error);
        }
    };

    // Chỉ generate auto name cho Task (kind = 1)
    useEffect(() => {
        if (taskKind === TaskTypes.TASK && !isEditing && !autoNameGenerated) {
            generateAutoName();
        }
    }, [taskKind, isEditing, autoNameGenerated]);

    const uploadFile = (file, onSuccess, onError, type = 'AVATAR') => {
        executeUpFile({
            data: { type, file },
            onCompleted: (response) => {
                if (response.result === true) {
                    onSuccess();
                    if (type === 'AVATAR') setImagePath(response.data.filePath);
                    else if (type === 'VIDEO') setVideoPath(response.data.filePath);
                    else setFilePath(response.data.filePath);
                    setIsChangedFormValues(true);
                }
            },
            onError,
        });
    };

    const addIntroductionSection = () => {
        setIntroductionSections([...introductionSections, { title: '', content: '' }]);
        setIsChangedFormValues(true);
    };

    const removeIntroductionSection = (index) => {
        const newSections = introductionSections.filter((_, i) => i !== index);
        setIntroductionSections(newSections.length > 0 ? newSections : [{ title: '', content: '' }]);
        setIsChangedFormValues(true);
    };

    const updateIntroductionSection = (index, field, value) => {
        const newSections = [...introductionSections];
        newSections[index][field] = value;
        setIntroductionSections(newSections);
        setIsChangedFormValues(true);
    };

    const normalizeIntroduction = (sections) => {
        const validSections = sections.filter(
            section => section.title.trim() !== '' || section.content.trim() !== '',
        );
        
        return validSections;
    };

    const handleSubmit = (values) => {
        const normalizedIntroduction = normalizeIntroduction(introductionSections);
        
        const introductionJson = normalizedIntroduction.length > 0 
            ? JSON.stringify(normalizedIntroduction) 
            : '';

        let taskName = values.name?.trim() || '';
        
        let submitData = {
            name: taskName,
            title: values.title?.trim() || '',
            description: values.description?.trim() || '',
            content: values.content?.trim() || '',
            kind: isEditing ? dataDetail.kind : taskKind,
            maxErrors: values.maxErrors || 0,
            simulationId: simulationId || 0,
            introduction: introductionJson,
            imagePath: imagePath || '',
            videoPath: videoPath || '',
            filePath: filePath || '',
        };

        // Thêm parentId nếu là SubTask
        if (submitData.kind === TaskTypes.SUBTASK) {
            if (parentTaskInfo) {
                submitData.parentId = parseInt(parentTaskInfo.id);
            } else if (dataDetail?.parent?.id) {
                submitData.parentId = dataDetail.parent.id;
            }
        }

        console.log('Submit Data:', JSON.stringify(submitData, null, 2));

        return mixinFuncs.handleSubmit(submitData);
    };

    const getPreviewData = () => {
        const formValues = form.getFieldsValue();
        const currentKind = isEditing ? dataDetail.kind : taskKind;
        
        return {
            ...formValues,
            imagePath,
            videoPath,
            filePath,
            introduction: normalizeIntroduction(introductionSections),
            kind: kindValues.find(k => k.value === currentKind),
            parentTask: (taskKind === TaskTypes.SUBTASK || dataDetail?.kind === TaskTypes.SUBTASK) 
                ? parentTaskInfo 
                : null,
        };
    };

    const parseIntroduction = (introData) => {
        if (!introData) return [{ title: '', content: '' }];
        
        try {
            const parsed = typeof introData === 'string' 
                ? JSON.parse(introData) 
                : introData;
            
            if (!Array.isArray(parsed)) {
                console.warn('Introduction is not an array');
                return [{ title: '', content: '' }];
            }
            
            const validParsed = parsed.filter(
                item => item && typeof item === 'object' && 'title' in item && 'content' in item,
            );
            
            return validParsed.length > 0 ? validParsed : [{ title: '', content: '' }];
        } catch (e) {
            console.error('Error parsing introduction:', e);
            return [{ title: '', content: '' }];
        }
    };

    useEffect(() => {
        if (dataDetail && Object.keys(dataDetail).length > 0) {
            form.setFieldsValue({
                name: dataDetail?.name || '',
                title: dataDetail?.title || '',
                description: dataDetail?.description || '',
                content: dataDetail?.content || '',
                maxErrors: dataDetail?.maxErrors || 0,
            });
            
            setImagePath(dataDetail?.imagePath || '');
            setVideoPath(dataDetail?.videoPath || '');
            setFilePath(dataDetail?.filePath || '');
            setAutoNameGenerated(true);

            const parsedIntro = parseIntroduction(dataDetail?.introduction);
            setIntroductionSections(parsedIntro);
        }
    }, [dataDetail]);

    const getCurrentKindLabel = () => {
        const currentKind = isEditing ? dataDetail.kind : taskKind;
        const kindOption = kindValues.find(k => k.value === currentKind);
        return kindOption?.label || 'Task';
    };

    return (
        <>
            <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={onValuesChange}>
                <Card className="card-form" bordered={false}>
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                        <Col span={24}>
                            <Alert
                                message={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <strong>Loại:</strong>
                                        <Tag color={taskKind === TaskTypes.TASK ? 'blue' : 'purple'}>
                                            {getCurrentKindLabel()}
                                        </Tag>
                                        {parentTaskInfo && taskKind === TaskTypes.SUBTASK && (
                                            <>
                                                <span>•</span>
                                                <span>Thuộc Task: <strong>{parentTaskInfo.name}</strong></span>
                                            </>
                                        )}
                                    </div>
                                }
                                type="info"
                                showIcon
                                icon={<BookOutlined />}
                            />
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <TextField
                                label={translate.formatMessage(commonMessage.name)}
                                required
                                name="name"
                                requiredMsg={translate.formatMessage(commonMessage.required)}
                                placeholder={
                                    taskKind === TaskTypes.SUBTASK
                                        ? "Tự động điền theo tên Task cha"
                                        : "Tự động điền: Nhiệm vụ 1, 2, 3..."
                                }
                                disabled={taskKind === TaskTypes.SUBTASK}
                            />
                        </Col>
                        <Col span={12}>
                            <TextField
                                label={translate.formatMessage(commonMessage.title)}
                                required
                                name="title"
                                requiredMsg={translate.formatMessage(commonMessage.required)}
                                placeholder="Tiêu đề nhiệm vụ"
                            />
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={24}>
                            <NumericField
                                label="Số lỗi tối đa"
                                name="maxErrors"
                                min={0}
                                max={100}
                                placeholder="0"
                            />
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={24}>
                            <TextField
                                label="Mô tả"
                                required
                                name="description"
                                type="textarea"
                                rows={3}
                                placeholder="Mô tả ngắn gọn về nhiệm vụ"
                            />
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={24}>
                            <TextField
                                label="Nội dung chi tiết"
                                name="content"
                                type="textarea"
                                rows={5}
                                placeholder="Nhập nội dung chi tiết của nhiệm vụ (tùy chọn)"
                            />
                        </Col>
                    </Row>

                    <Divider orientation="left">Giới thiệu bài học</Divider>

                    {introductionSections.map((section, index) => (
                        <Card
                            key={index}
                            size="small"
                            style={{ marginBottom: 16, background: '#fafafa' }}
                            extra={
                                introductionSections.length > 1 && (
                                    <Button
                                        type="text"
                                        danger
                                        icon={<MinusCircleOutlined />}
                                        onClick={() => removeIntroductionSection(index)}
                                    >
                                        Xóa
                                    </Button>
                                )
                            }
                            title={`Phần ${index + 1}`}
                        >
                            <Row gutter={16}>
                                <Col span={24}>
                                    <div style={{ marginBottom: 12 }}>
                                        <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                                            Tiêu đề phần
                                        </label>
                                        <Input
                                            placeholder="VD: Mục tiêu học tập"
                                            value={section.title}
                                            onChange={(e) => updateIntroductionSection(index, 'title', e.target.value)}
                                        />
                                    </div>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={24}>
                                    <div>
                                        <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                                            Nội dung (mỗi dòng là một mục)
                                        </label>
                                        <TextArea
                                            rows={6}
                                            placeholder="Nhập nội dung, mỗi dòng bắt đầu bằng • sẽ là bullet point. VD:&#10;Sau khi hoàn thành bài học này, bạn sẽ có thể:&#10; • Giải thích bốn chức năng cơ bản của máy tính&#10; • Phân biệt giữa phần cứng và phần mềm"
                                            value={section.content}
                                            onChange={(e) => updateIntroductionSection(index, 'content', e.target.value)}
                                        />
                                    </div>
                                </Col>
                            </Row>
                        </Card>
                    ))}

                    <Row>
                        <Col span={24}>
                            <Button
                                type="dashed"
                                onClick={addIntroductionSection}
                                block
                                icon={<PlusOutlined />}
                                style={{ marginBottom: 16 }}
                            >
                                Thêm phần giới thiệu
                            </Button>
                        </Col>
                    </Row>

                    <Divider orientation="left">Media & Files</Divider>

                    <Row gutter={16}>
                        <Col span={8}>
                            <CropImageField
                                label="Hình ảnh"
                                name="imagePath"
                                imageUrl={imagePath && `${AppConstants.contentRootUrl}${imagePath}`}
                                aspect={16 / 9}
                                uploadFile={(file, onSuccess, onError) => uploadFile(file, onSuccess, onError, 'AVATAR')}
                            />
                        </Col>
                        <Col span={8}>
                            <TextField
                                label="Video URL"
                                name="videoPathInput"
                                placeholder="URL video"
                                value={videoPath}
                                onChange={(e) => {
                                    setVideoPath(e.target.value);
                                    setIsChangedFormValues(true);
                                }}
                            />
                        </Col>
                        <Col span={8}>
                            <TextField
                                label="File URL"
                                name="filePathInput"
                                placeholder="URL file"
                                value={filePath}
                                onChange={(e) => {
                                    setFilePath(e.target.value);
                                    setIsChangedFormValues(true);
                                }}
                            />
                        </Col>
                    </Row>

                    <div className="footer-card-form">
                        <Space>
                            <Button
                                icon={<EyeOutlined />}
                                onClick={() => setPreviewVisible(true)}
                            >
                                Xem trước
                            </Button>
                            {actions}
                        </Space>
                    </div>
                </Card>
            </BaseForm>

            <TaskPreviewModal
                visible={previewVisible}
                onClose={() => setPreviewVisible(false)}
                data={getPreviewData()}
            />
        </>
    );
};

const TaskPreviewModal = ({ visible, onClose, data }) => {
    const formatContent = (content) => {
        if (!content) return null;
        const lines = content.split('\n');
        return lines.map((line, i) => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('•')) {
                return (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ color: '#1890ff', marginTop: '4px' }}>•</span>
                        <span>{trimmedLine.substring(1).trim()}</span>
                    </div>
                );
            }
            return trimmedLine ? <p key={i} style={{ marginBottom: '8px' }}>{trimmedLine}</p> : null;
        });
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOutlined style={{ color: '#1890ff' }} />
                    <span>Xem trước - Giao diện học viên</span>
                </div>
            }
            open={visible}
            onCancel={onClose}
            width={900}
            footer={[
                <Button key="close" type="primary" onClick={onClose}>
                    Đóng
                </Button>,
            ]}
            style={{ top: 20 }}
        >
            <div style={{ 
                maxHeight: '75vh', 
                overflowY: 'auto', 
                padding: '24px',
                background: '#f5f5f5',
            }}>
                <div style={{ 
                    background: 'white', 
                    padding: '24px', 
                    borderRadius: '8px',
                    marginBottom: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}>
                    {data.parentTask && (
                        <div style={{ 
                            marginBottom: '16px',
                            padding: '8px 12px',
                            background: '#e6f7ff',
                            borderRadius: '4px',
                            borderLeft: '3px solid #1890ff',
                        }}>
                            <small style={{ color: '#666' }}>Thuộc:</small> <strong>{data.parentTask.name}</strong>
                        </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <h2 style={{ margin: 0, marginBottom: '8px' }}>
                            {data.title || 'Chưa có tiêu đề'}
                        </h2>
                        <Space>
                            {data.kind && (
                                <Tag color={data.kind.value === 1 ? 'blue' : 'purple'}>
                                    {data.kind.label}
                                </Tag>
                            )}
                            {data.maxErrors > 0 && (
                                <Tag color="orange">
                                    Tối đa {data.maxErrors} lỗi
                                </Tag>
                            )}
                        </Space>
                    </div>

                    {data.imagePath && (
                        <img
                            src={`${AppConstants.contentRootUrl}${data.imagePath}`}
                            alt="Task"
                            style={{ 
                                width: '100%', 
                                borderRadius: '8px', 
                                marginBottom: '16px',
                                maxHeight: '300px',
                                objectFit: 'cover',
                            }}
                        />
                    )}

                    {data.description && (
                        <div style={{ 
                            padding: '16px',
                            background: '#fafafa',
                            borderRadius: '8px',
                            borderLeft: '4px solid #52c41a',
                            marginBottom: '16px',
                        }}>
                            <p style={{ margin: 0, lineHeight: '1.8' }}>{data.description}</p>
                        </div>
                    )}
                </div>

                {data.introduction && data.introduction.length > 0 && (
                    <Collapse 
                        defaultActiveKey={['0']}
                        style={{ marginBottom: '16px' }}
                    >
                        {data.introduction.map((section, index) => (
                            <Panel 
                                key={index} 
                                header={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <BookOutlined style={{ color: '#1890ff' }} />
                                        <span style={{ fontWeight: 600 }}>{section.title}</span>
                                    </div>
                                }
                                style={{ 
                                    background: 'white',
                                    marginBottom: '8px',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                }}
                            >
                                <div style={{ padding: '8px 0' }}>
                                    {formatContent(section.content)}
                                </div>
                            </Panel>
                        ))}
                    </Collapse>
                )}

                {(data.videoPath || data.filePath) && (
                    <div style={{ 
                        background: 'white', 
                        padding: '16px', 
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}>
                        <h4 style={{ marginBottom: '12px' }}>Tài liệu tham khảo</h4>
                        <Space direction="vertical">
                            {data.videoPath && (
                                <a href={data.videoPath} target="_blank" rel="noopener noreferrer">
                                    🎥 Video hướng dẫn
                                </a>
                            )}
                            {data.filePath && (
                                <a href={data.filePath} target="_blank" rel="noopener noreferrer">
                                    📄 Tài liệu đính kèm
                                </a>
                            )}
                        </Space>
                    </div>
                )}

                <div style={{ 
                    marginTop: '24px',
                    padding: '24px',
                    background: 'white',
                    borderRadius: '8px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}>
                    <Button 
                        type="primary" 
                        size="large"
                        style={{ minWidth: '200px' }}
                    >
                        Bắt đầu làm bài
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default TaskForm;