import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Button, Input, Space, Modal, Divider, Tag, Collapse } from 'antd';
import { PlusOutlined, MinusCircleOutlined, EyeOutlined, BookOutlined } from '@ant-design/icons';

import { BaseForm } from '@components/common/form/BaseForm';
import CropImageField from '@components/common/form/CropImageField';
import SelectField from '@components/common/form/SelectField';
import TextField from '@components/common/form/TextField';
import NumericField from '@components/common/form/NumericField';

import useBasicForm from '@hooks/useBasicForm';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';

import { AppConstants, TaskTypes, storageKeys } from '@constants';
import apiConfig from '@constants/apiConfig';
import { taskKindOptions } from '@constants/masterData';
import { commonMessage } from '@locales/intl';
import { getData } from '@utils/localStorage';

const { TextArea } = Input;
const { Panel } = Collapse;

const TaskForm = (props) => {
    const translate = useTranslate();
    const kindValues = translate.formatKeys(taskKindOptions, ['label']);

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
    const [imagePath, setImagePath] = useState(null);
    const [videoPath, setVideoPath] = useState(null);
    const [filePath, setFilePath] = useState(null);
    const [selectedKind, setSelectedKind] = useState(null);
    const [previewVisible, setPreviewVisible] = useState(false);

    // State cho Introduction (array of objects)
    const [introductionSections, setIntroductionSections] = useState([
        { title: '', content: '' },
    ]);

    const { form, mixinFuncs, onValuesChange } = useBasicForm({
        onSubmit,
        setIsChangedFormValues,
    });

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

    // Thêm introduction section
    const addIntroductionSection = () => {
        setIntroductionSections([...introductionSections, { title: '', content: '' }]);
        setIsChangedFormValues(true);
    };

    // Xóa introduction section
    const removeIntroductionSection = (index) => {
        const newSections = introductionSections.filter((_, i) => i !== index);
        setIntroductionSections(newSections.length > 0 ? newSections : [{ title: '', content: '' }]);
        setIsChangedFormValues(true);
    };

    // Update introduction section
    const updateIntroductionSection = (index, field, value) => {
        const newSections = [...introductionSections];
        newSections[index][field] = value;
        setIntroductionSections(newSections);
        setIsChangedFormValues(true);
    };

    // Helper function để chuẩn hóa introduction data
    const normalizeIntroduction = (sections) => {
        // Loại bỏ các section rỗng (cả title và content đều rỗng)
        const validSections = sections.filter(
            section => section.title.trim() !== '' || section.content.trim() !== '',
        );
        
        // Nếu không có section nào valid, trả về array rỗng
        return validSections.length > 0 ? validSections : [];
    };

    const handleSubmit = (values) => {
        // Chuẩn hóa introduction trước khi stringify
        const normalizedIntroduction = normalizeIntroduction(introductionSections);
        
        // Tạo introduction JSON string (hoặc null nếu rỗng)
        const introductionJson = normalizedIntroduction.length > 0 
            ? JSON.stringify(normalizedIntroduction) 
            : null;

        // Tạo base submit data
        let submitData = {
            name: values.name?.trim() || '',
            title: values.title?.trim() || '',
            description: values.description?.trim() || null,
            content: values.content?.trim() || null,
            kind: values.kind,
            maxErrors: values.maxErrors || 0,
            simulationId: simulationId,
            introduction: introductionJson,
            imagePath: imagePath || null,
            videoPath: videoPath || null,
            filePath: filePath || null,
            parentId: null, // Default null
        };

        // Nếu kind = SubTask (2), thêm parentId và điều chỉnh name
        if (values.kind === TaskTypes.SUBTASK) {
            const parentTaskInfo = getData(storageKeys.PARENT_TASK_INFO);
            
            if (parentTaskInfo && parentTaskInfo.id) {
                submitData.parentId = parentTaskInfo.id;
                // Chỉ thêm prefix nếu chưa có
                if (!submitData.name.startsWith(parentTaskInfo.name)) {
                    submitData.name = `${parentTaskInfo.name} - ${submitData.name}`;
                }
            }
        }

        // Log để debug (có thể xóa trong production)
        console.log('Submit Data:', JSON.stringify(submitData, null, 2));

        return mixinFuncs.handleSubmit(submitData);
    };

    // Handle khi thay đổi kind
    const handleKindChange = (value) => {
        setSelectedKind(value);
        
        // Reset parentId khi chuyển sang Task thường
        if (value === TaskTypes.TASK) {
            form.setFieldsValue({ parentId: null });
        }
    };

    // Get preview data
    const getPreviewData = () => {
        const formValues = form.getFieldsValue();
        const parentTaskInfo = getData(storageKeys.PARENT_TASK_INFO);
        
        return {
            ...formValues,
            imagePath,
            videoPath,
            filePath,
            introduction: normalizeIntroduction(introductionSections),
            kind: kindValues.find(k => k.value === formValues.kind),
            parentTask: selectedKind === TaskTypes.SUBTASK ? parentTaskInfo : null,
        };
    };

    // Parse introduction an toàn hơn
    const parseIntroduction = (introData) => {
        if (!introData) return [{ title: '', content: '' }];
        
        try {
            const parsed = typeof introData === 'string' 
                ? JSON.parse(introData) 
                : introData;
            
            // Validate structure
            if (!Array.isArray(parsed)) {
                console.warn('Introduction is not an array');
                return [{ title: '', content: '' }];
            }
            
            // Filter và validate các phần tử
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
        if (dataDetail) {
            form.setFieldsValue({
                name: dataDetail?.name || '',
                title: dataDetail?.title || '',
                description: dataDetail?.description || '',
                content: dataDetail?.content || '',
                kind: dataDetail?.kind,
                maxErrors: dataDetail?.maxErrors || 0,
                parentId: dataDetail?.parentId || null,
            });
            
            setImagePath(dataDetail?.imagePath || null);
            setVideoPath(dataDetail?.videoPath || null);
            setFilePath(dataDetail?.filePath || null);
            setSelectedKind(dataDetail?.kind);

            // Parse introduction
            const parsedIntro = parseIntroduction(dataDetail?.introduction);
            setIntroductionSections(parsedIntro);
        }
    }, [dataDetail]);

    return (
        <>
            <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={onValuesChange}>
                <Card className="card-form" bordered={false}>
                    {/* Hiển thị thông tin Parent Task nếu đang tạo SubTask */}
                    {selectedKind === TaskTypes.SUBTASK && (() => {
                        const parentTaskInfo = getData(storageKeys.PARENT_TASK_INFO);
                        if (parentTaskInfo) {
                            return (
                                <Row gutter={16} style={{ marginBottom: 16 }}>
                                    <Col span={24}>
                                        <div style={{
                                            padding: '12px',
                                            background: '#e6f7ff',
                                            border: '1px solid #91d5ff',
                                            borderRadius: '4px',
                                        }}>
                                            <strong>Parent Task:</strong> {parentTaskInfo.name}
                                        </div>
                                    </Col>
                                </Row>
                            );
                        }
                        return null;
                    })()}

                    {/* Basic Info */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <TextField
                                label={translate.formatMessage(commonMessage.name)}
                                required
                                name="name"
                                requiredMsg={translate.formatMessage(commonMessage.required)}
                                placeholder={
                                    selectedKind === TaskTypes.SUBTASK 
                                        ? "Tên SubTask (sẽ tự động thêm prefix parent task)"
                                        : "Tên Task"
                                }
                            />
                        </Col>
                        <Col span={12}>
                            <TextField
                                label={translate.formatMessage(commonMessage.title)}
                                required
                                name="title"
                                requiredMsg={translate.formatMessage(commonMessage.required)}
                            />
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <SelectField
                                label={translate.formatMessage(commonMessage.kind)}
                                required
                                name="kind"
                                requiredMsg={translate.formatMessage(commonMessage.required)}
                                options={kindValues}
                                allowClear={false}
                                onChange={handleKindChange}
                            />
                        </Col>
                        <Col span={12}>
                            <NumericField
                                label={translate.formatMessage(commonMessage.maxErrors)}
                                name="maxErrors"
                                min={0}
                                max={100}
                            />
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={24}>
                            <TextField
                                label={translate.formatMessage(commonMessage.description)}
                                required
                                name="description"
                                type="textarea"
                                rows={3}
                            />
                        </Col>
                    </Row>

                    <Divider orientation="left">Giới thiệu bài học</Divider>

                    {/* Introduction Sections */}
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

                    {/* Media */}
                    <Row gutter={16}>
                        <Col span={8}>
                            <CropImageField
                                label={translate.formatMessage(commonMessage.image)}
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

            {/* Preview Modal */}
            <TaskPreviewModal
                visible={previewVisible}
                onClose={() => setPreviewVisible(false)}
                data={getPreviewData()}
            />
        </>
    );
};

// Component Preview Modal - Giống trang làm bài của học viên
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
                {/* Header như trang học của học viên */}
                <div style={{ 
                    background: 'white', 
                    padding: '24px', 
                    borderRadius: '8px',
                    marginBottom: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}>
                    {/* Parent Task Info */}
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

                    {/* Title và Kind */}
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

                    {/* Image */}
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

                    {/* Description */}
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

                {/* Introduction Sections - Collapse như bài học thật */}
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

                {/* Media Links */}
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

                {/* Nút bắt đầu làm bài - giống giao diện thật */}
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