import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Button, Input, Space, Modal, Divider } from 'antd';
import { PlusOutlined, MinusCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { BaseForm } from '@components/common/form/BaseForm';
import CropImageField from '@components/common/form/CropImageField';
import SelectField from '@components/common/form/SelectField';
import TextField from '@components/common/form/TextField';
import useBasicForm from '@hooks/useBasicForm';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';
import { AppConstants } from '@constants';
import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';
import FileUploadField from '@components/common/form/FileUploadField';

const { TextArea } = Input;

const SimulationForm = (props) => {
    const {
        formId,
        actions,
        dataDetail,
        onSubmit,
        setIsChangedFormValues,
        specializations,
        levels,
        isEditing,
    } = props;

    const translate = useTranslate();
    const [imagePath, setImagePath] = useState(null);
    const [videoPath, setVideoPath] = useState(null);
    const [previewVisible, setPreviewVisible] = useState(false);

    // State cho Description (object)
    const [descriptionTitle, setDescriptionTitle] = useState('');
    const [descriptionContent, setDescriptionContent] = useState('');

    // State cho Overview (array of objects)
    const [overviewSections, setOverviewSections] = useState([
        { title: '', content: '' },
    ]);

    const { execute: executeUpFile } = useFetch(apiConfig.file.upload, { immediate: false });
    const { form, mixinFuncs, onValuesChange } = useBasicForm({ onSubmit, setIsChangedFormValues });

    // Upload file handler
    const uploadFile = (file, onSuccess, onError, type) => {
        executeUpFile({
            data: { file, type },
            onCompleted: (response) => {
                if (response.result === true) {
                    onSuccess();
                    if (type === 'SIMULATION_IMAGE') {
                        setImagePath(response.data.filePath);
                        form.setFieldsValue({ imagePath: response.data.filePath });
                    } else if (type === 'SIMULATION_VIDEO') {
                        setVideoPath(response.data.filePath);
                        form.setFieldsValue({ videoPath: response.data.filePath });
                    }
                    setIsChangedFormValues(true);
                }
            },
            onError,
        });
    };

    // Parse data khi edit
    useEffect(() => {
        if (dataDetail && Object.keys(dataDetail).length > 0) {
            form.setFieldsValue({
                ...dataDetail,
                specializationId: dataDetail.specialization?.id,
            });
            setImagePath(dataDetail.imagePath);
            setVideoPath(dataDetail.videoPath);

            // Parse description
            if (dataDetail.description) {
                try {
                    const desc = typeof dataDetail.description === 'string'
                        ? JSON.parse(dataDetail.description)
                        : dataDetail.description;
                    setDescriptionTitle(desc.title || '');
                    setDescriptionContent(desc.content || '');
                } catch (e) {
                    console.error('Error parsing description:', e);
                }
            }

            // Parse overview
            if (dataDetail.overview) {
                try {
                    const overview = typeof dataDetail.overview === 'string'
                        ? JSON.parse(dataDetail.overview)
                        : dataDetail.overview;
                    if (Array.isArray(overview) && overview.length > 0) {
                        setOverviewSections(overview);
                    } else {
                        setOverviewSections([{ title: '', content: '' }]);
                    }
                } catch (e) {
                    console.error('Error parsing overview:', e);
                    setOverviewSections([{ title: '', content: '' }]);
                }
            }
        }
    }, [dataDetail, specializations]);

    // Thêm overview section
    const addOverviewSection = () => {
        setOverviewSections([...overviewSections, { title: '', content: '' }]);
        setIsChangedFormValues(true);
    };

    // Xóa overview section
    const removeOverviewSection = (index) => {
        const newSections = overviewSections.filter((_, i) => i !== index);
        setOverviewSections(newSections.length > 0 ? newSections : [{ title: '', content: '' }]);
        setIsChangedFormValues(true);
    };

    // Update overview section
    const updateOverviewSection = (index, field, value) => {
        const newSections = [...overviewSections];
        newSections[index] = {
            ...newSections[index],
            [field]: value,
        };
        setOverviewSections(newSections);
        setIsChangedFormValues(true);
    };

    // Submit handler
    const handleSubmit = (values) => {
        // Tạo description JSON string đúng format
        const descriptionObj = {
            title: descriptionTitle,
            content: descriptionContent,
        };
        const descriptionJson = JSON.stringify(descriptionObj);

        // Tạo overview JSON string - filter out empty sections
        const validOverviewSections = overviewSections.filter(
            section => section.title.trim() || section.content.trim(),
        );
        const overviewJson = JSON.stringify(validOverviewSections);

        mixinFuncs.handleSubmit({
            ...values,
            imagePath: imagePath || null,
            videoPath: videoPath || null,
            description: descriptionJson,
            overview: overviewJson,
        });
    };

    // Format content với bullet points để hiển thị đúng
    const formatContentForInput = (content) => {
        return content;
    };

    // Get current form data for preview
    const getPreviewData = () => {
        const formValues = form.getFieldsValue();
        return {
            ...formValues,
            imagePath,
            videoPath,
            description: {
                title: descriptionTitle,
                content: descriptionContent,
            },
            overview: overviewSections,
            specialization: specializations?.find(s => s.value === formValues.specializationId),
            level: levels?.find(l => l.value === formValues.level),
        };
    };

    return (
        <>
            <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={onValuesChange}>
                <Card className="card-form" bordered={false}>
                    {/* Basic Info */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <TextField
                                label={translate.formatMessage(commonMessage.title)}
                                name="title"
                                required
                            />
                        </Col>
                        <Col span={12}>
                            <SelectField
                                label={translate.formatMessage(commonMessage.specialization)}
                                name="specializationId"
                                options={specializations}
                                valuePropName="id"
                                labelPropName="name"
                                required
                            />
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <SelectField
                                label={translate.formatMessage(commonMessage.level)}
                                name="level"
                                options={levels}
                                required
                            />
                        </Col>
                        <Col span={12}>
                            <TextField
                                label={translate.formatMessage(commonMessage.totalEstimatedTime)}
                                name="totalEstimatedTime"
                                placeholder="VD: 1 - 2 giờ"
                                required
                            />
                        </Col>
                    </Row>

                    <Divider orientation="left">Mô tả khóa học</Divider>

                    {/* Description Section */}
                    <Row gutter={16}>
                        <Col span={24}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                                    Tiêu đề mô tả <span style={{ color: 'red' }}>*</span>
                                </label>
                                <Input
                                    placeholder="VD: Giới thiệu về hoạt động học tập"
                                    value={descriptionTitle}
                                    onChange={(e) => {
                                        setDescriptionTitle(e.target.value);
                                        setIsChangedFormValues(true);
                                    }}
                                />
                            </div>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={24}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                                    Nội dung mô tả <span style={{ color: 'red' }}>*</span>
                                </label>
                                <TextArea
                                    rows={4}
                                    placeholder="Mô tả chi tiết về khóa học..."
                                    value={descriptionContent}
                                    onChange={(e) => {
                                        setDescriptionContent(e.target.value);
                                        setIsChangedFormValues(true);
                                    }}
                                />
                            </div>
                        </Col>
                    </Row>

                    <Divider orientation="left">Tổng quan khóa học</Divider>

                    {/* Overview Sections */}
                    {overviewSections.map((section, index) => (
                        <Card
                            key={index}
                            size="small"
                            style={{ marginBottom: 16, background: '#fafafa' }}
                            extra={
                                overviewSections.length > 1 && (
                                    <Button
                                        type="text"
                                        danger
                                        icon={<MinusCircleOutlined />}
                                        onClick={() => removeOverviewSection(index)}
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
                                            placeholder="VD: Bạn sẽ học được gì"
                                            value={section.title}
                                            onChange={(e) => updateOverviewSection(index, 'title', e.target.value)}
                                        />
                                    </div>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={24}>
                                    <div>
                                        <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                                            Nội dung
                                        </label>
                                        <TextArea
                                            rows={8}
                                            placeholder={`Nhập nội dung, sử dụng ký tự • để tạo bullet point. VD:
Sau khi hoàn thành khóa học này, bạn sẽ có thể:
 • Mô tả các chức năng cơ bản của máy tính
 • Phân biệt giữa phần cứng và phần mềm
 • Mô tả các loại ngôn ngữ lập trình`}
                                            value={section.content}
                                            onChange={(e) => updateOverviewSection(index, 'content', e.target.value)}
                                        />
                                        <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
                                            💡 Tip: Sử dụng ký tự • (Alt+7 hoặc copy) để tạo bullet point. Mỗi dòng bắt đầu bằng • sẽ được hiển thị như danh sách.
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </Card>
                    ))}

                    <Row>
                        <Col span={24}>
                            <Button
                                type="dashed"
                                onClick={addOverviewSection}
                                block
                                icon={<PlusOutlined />}
                                style={{ marginBottom: 16 }}
                            >
                                Thêm phần tổng quan
                            </Button>
                        </Col>
                    </Row>

                    <Divider orientation="left">Media</Divider>

                    {/* Media */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <CropImageField
                                label={translate.formatMessage(commonMessage.image)}
                                name="imagePath"
                                imageUrl={imagePath && `${AppConstants.contentRootUrl}${imagePath}`}
                                aspect={16 / 9}
                                uploadFile={(file, onSuccess, onError) =>
                                    uploadFile(file, onSuccess, onError, 'SIMULATION_IMAGE')
                                }
                            />
                        </Col>
                        <Col span={12}>
                            <FileUploadField
                                label={translate.formatMessage(commonMessage.video)}
                                name="videoPath"
                                filePath={videoPath}
                                uploadFile={(file, onSuccess, onError) =>
                                    uploadFile(file, onSuccess, onError, 'SIMULATION_VIDEO')
                                }
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
            <SimulationPreviewModal
                visible={previewVisible}
                onClose={() => setPreviewVisible(false)}
                data={getPreviewData()}
            />
        </>
    );
};

// Component Preview Modal
const SimulationPreviewModal = ({ visible, onClose, data }) => {
    // Format content với bullet points và newlines
    const formatContent = (content) => {
        if (!content) return null;
        
        const lines = content.split('\n');
        return (
            <div>
                {lines.map((line, i) => {
                    const trimmedLine = line.trim();
                    
                    // Kiểm tra nếu dòng bắt đầu bằng bullet point
                    if (trimmedLine.startsWith('•')) {
                        return (
                            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', paddingLeft: '8px' }}>
                                <span style={{ color: '#1890ff' }}>•</span>
                                <span>{trimmedLine.substring(1).trim()}</span>
                            </div>
                        );
                    }
                    
                    // Dòng trống
                    if (!trimmedLine) {
                        return <div key={i} style={{ height: '8px' }} />;
                    }
                    
                    // Dòng text thường
                    return (
                        <p key={i} style={{ marginBottom: '8px', fontWeight: line.includes(':') ? 500 : 400 }}>
                            {trimmedLine}
                        </p>
                    );
                })}
            </div>
        );
    };

    return (
        <Modal
            title="Xem trước Simulation"
            open={visible}
            onCancel={onClose}
            width={800}
            footer={[
                <Button key="close" type="primary" onClick={onClose}>
                    Đóng
                </Button>,
            ]}
        >
            <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '16px' }}>
                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <h2 style={{ marginBottom: 8 }}>{data.title || 'Chưa có tiêu đề'}</h2>
                    <Space wrap>
                        {data.level && (
                            <span style={{
                                background: '#e6f7ff',
                                padding: '4px 12px',
                                borderRadius: '4px',
                                color: '#1890ff',
                            }}>
                                Level {data.level.label || data.level}
                            </span>
                        )}
                        {data.totalEstimatedTime && (
                            <span style={{ color: '#666' }}>⏱ {data.totalEstimatedTime}</span>
                        )}
                        {data.specialization && (
                            <span style={{ color: '#666' }}>📚 {data.specialization.label}</span>
                        )}
                    </Space>
                </div>

                {/* Image */}
                {data.imagePath && (
                    <img
                        src={`${AppConstants.contentRootUrl}${data.imagePath}`}
                        alt="Preview"
                        style={{ width: '100%', borderRadius: '8px', marginBottom: 24 }}
                    />
                )}

                {/* Description */}
                {data.description && (data.description.title || data.description.content) && (
                    <Card 
                        title={data.description.title || 'Mô tả'} 
                        style={{ marginBottom: 16 }}
                    >
                        <p style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                            {data.description.content}
                        </p>
                    </Card>
                )}

                {/* Overview */}
                {data.overview && data.overview.length > 0 && data.overview.some(s => s.title || s.content) && (
                    <>
                        {data.overview
                            .filter(section => section.title || section.content)
                            .map((section, index) => (
                                <Card 
                                    key={index} 
                                    title={section.title || `Phần ${index + 1}`} 
                                    style={{ marginBottom: 16 }}
                                >
                                    {formatContent(section.content)}
                                </Card>
                            ))}
                    </>
                )}

                {/* JSON Preview for debugging */}
                <Divider orientation="left" style={{ fontSize: 12, color: '#999' }}>
                    JSON Output (Debug)
                </Divider>
                <pre style={{ 
                    background: '#f5f5f5', 
                    padding: 12, 
                    borderRadius: 4, 
                    fontSize: 11,
                    overflow: 'auto',
                    maxHeight: 200,
                }}>
                    {JSON.stringify({
                        title: data.title,
                        specializationId: data.specialization?.value,
                        level: typeof data.level === 'object' ? data.level.value : data.level,
                        totalEstimatedTime: data.totalEstimatedTime,
                        description: JSON.stringify({
                            title: data.description?.title,
                            content: data.description?.content,
                        }),
                        overview: JSON.stringify(
                            data.overview?.filter(s => s.title || s.content) || [],
                        ),
                        imagePath: data.imagePath || null,
                        videoPath: data.videoPath || null,
                    }, null, 2)}
                </pre>
            </div>
        </Modal>
    );
};

export default SimulationForm;