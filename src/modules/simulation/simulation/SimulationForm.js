import React, { useEffect, useState, useMemo } from 'react';
import { Card, Col, Row, Button, Space, Modal, Divider, Input } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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

    // Description fields
    const [descriptionTitle, setDescriptionTitle] = useState('');
    const [descriptionContent, setDescriptionContent] = useState('');

    // Overview fields
    const [overviewTitle, setOverviewTitle] = useState('');
    const [overviewContent, setOverviewContent] = useState('');

    const { execute: executeUpFile } = useFetch(apiConfig.file.upload, { immediate: false });
    const { form, mixinFuncs, onValuesChange } = useBasicForm({ onSubmit, setIsChangedFormValues });

    const quillModules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link'],
            ['clean'],
        ],
    }), []);

    const quillFormats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet',
        'color', 'background',
        'link',
    ];

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

    const isJsonString = (str) => {
        if (!str || typeof str !== 'string') return false;
        const trimmed = str.trim();
        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false;
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    };

    // Parse JSON to extract title and content
    const parseJsonData = (jsonData) => {
        if (!jsonData) return { title: '', content: '' };
        
        // If already HTML, try to extract
        if (!isJsonString(jsonData)) {
            if (typeof jsonData === 'string' && jsonData.includes('<')) {
                // Try to extract h2 and remaining content
                const h2Match = jsonData.match(/<h2>(.*?)<\/h2>/);
                const title = h2Match ? h2Match[1] : '';
                const content = jsonData.replace(/<h2>.*?<\/h2>/, '').trim();
                return { title, content };
            }
            return { title: '', content: jsonData };
        }

        try {
            const parsed = JSON.parse(jsonData);
            
            // Format: {title: "...", content: "..."}
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return {
                    title: parsed.title || '',
                    content: parsed.content || '',
                };
            }
            
            // Format: [{title: "...", content: "..."}, ...]
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Take first item as main, or combine all
                if (parsed.length === 1) {
                    return {
                        title: parsed[0].title || '',
                        content: parsed[0].content || '',
                    };
                } else {
                    // Combine multiple sections into HTML
                    let html = '';
                    parsed.forEach((section, index) => {
                        if (section.title && index > 0) {
                            html += `<h3>${section.title}</h3>`;
                        }
                        if (section.content) {
                            if (section.content.includes('<')) {
                                html += section.content;
                            } else {
                                html += `<p>${section.content.replace(/\n/g, '<br>')}</p>`;
                            }
                        }
                    });
                    return {
                        title: parsed[0].title || '',
                        content: html,
                    };
                }
            }
            
            return { title: '', content: '' };
        } catch (e) {
            console.error('Error parsing JSON:', e);
            return { title: '', content: jsonData };
        }
    };

    // Convert plain text content to HTML for Quill
    const convertContentToHtml = (content) => {
        if (!content) return '';
        
        // If already HTML
        if (content.includes('<')) {
            return content;
        }
        
        // Convert plain text with bullets to HTML
        const lines = content.split('\n').filter(line => line.trim());
        let html = '';
        let inList = false;
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                const text = trimmed.replace(/^[•\-*]\s*/, '');
                html += `<li>${text}</li>`;
            } else if (trimmed) {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                html += `<p>${trimmed}</p>`;
            }
        });
        
        if (inList) {
            html += '</ul>';
        }
        
        return html || '<p><br></p>';
    };

    // Clean up Quill HTML - remove empty tags but keep the HTML structure
    const cleanQuillHtml = (html) => {
        if (!html || html === '<p><br></p>') return '';
        
        // Remove empty paragraphs at the end
        let cleaned = html.trim();
        
        // Remove trailing <p><br></p> or <p></p>
        cleaned = cleaned.replace(/(<p><br><\/p>|<p><\/p>)+$/g, '');
        
        return cleaned;
    };

    useEffect(() => {
        if (dataDetail && Object.keys(dataDetail).length > 0) {
            form.setFieldsValue({
                ...dataDetail,
                specializationId: dataDetail.specialization?.id,
            });
            setImagePath(dataDetail.imagePath);
            setVideoPath(dataDetail.videoPath);

            // Parse Description
            if (dataDetail.description) {
                const descData = parseJsonData(dataDetail.description);
                console.log('📝 Description parsed:', descData);
                setDescriptionTitle(descData.title);
                setDescriptionContent(convertContentToHtml(descData.content));
            }

            // Parse Overview
            if (dataDetail.overview) {
                const overviewData = parseJsonData(dataDetail.overview);
                console.log('📋 Overview parsed:', overviewData);
                setOverviewTitle(overviewData.title);
                setOverviewContent(convertContentToHtml(overviewData.content));
            }
        }
    }, [dataDetail]);

    const handleSubmit = (values) => {
        // Keep HTML content - just clean it up
        const cleanedDescriptionContent = cleanQuillHtml(descriptionContent);
        const cleanedOverviewContent = cleanQuillHtml(overviewContent);

        // Create JSON objects with HTML content
        const descriptionJson = JSON.stringify({
            title: descriptionTitle || '',
            content: cleanedDescriptionContent || '',
        });

        const overviewJson = JSON.stringify([{
            title: overviewTitle || '',
            content: cleanedOverviewContent || '',
        }]);

        console.log('📤 Sending data:', {
            ...values,
            description: descriptionJson,
            overview: overviewJson,
        });

        mixinFuncs.handleSubmit({
            ...values,
            imagePath: imagePath || null,
            videoPath: videoPath || null,
            description: descriptionJson,
            overview: overviewJson,
        });
    };

    const getPreviewData = () => {
        const formValues = form.getFieldsValue();
        return {
            ...formValues,
            imagePath,
            videoPath,
            descriptionTitle,
            descriptionContent,
            overviewTitle,
            overviewContent,
            specialization: specializations?.find(s => s.value === formValues.specializationId),
            level: levels?.find(l => l.value === formValues.level),
        };
    };

    return (
        <>
            <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={onValuesChange}>
                <Card className="card-form" bordered={false}>
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

                    {/* Description Title */}
                    <Row gutter={16}>
                        <Col span={24}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                                    Tiêu đề mô tả <span style={{ color: 'red' }}>*</span>
                                </label>
                                <Input
                                    value={descriptionTitle}
                                    onChange={(e) => {
                                        setDescriptionTitle(e.target.value);
                                        setIsChangedFormValues(true);
                                    }}
                                    placeholder="VD: Tại sao phải hoàn thành Mô phỏng công việc này"
                                    size="large"
                                />
                            </div>
                        </Col>
                    </Row>

                    {/* Description Content */}
                    <Row gutter={16}>
                        <Col span={24}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                                    Nội dung mô tả <span style={{ color: 'red' }}>*</span>
                                </label>
                                <ReactQuill
                                    theme="snow"
                                    value={descriptionContent}
                                    onChange={(value) => {
                                        setDescriptionContent(value);
                                        setIsChangedFormValues(true);
                                    }}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    placeholder="Nhập nội dung mô tả chi tiết về khóa học..."
                                    style={{ 
                                        background: 'white',
                                        borderRadius: '4px',
                                        minHeight: '200px',
                                    }}
                                />
                                <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
                                    💡 Tip: Sử dụng thanh công cụ để định dạng text, tạo heading, bullet list, và nhiều hơn nữa.
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Divider orientation="left">Tổng quan khóa học</Divider>

                    {/* Overview Title */}
                    <Row gutter={16}>
                        <Col span={24}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                                    Tiêu đề tổng quan <span style={{ color: 'red' }}>*</span>
                                </label>
                                <Input
                                    value={overviewTitle}
                                    onChange={(e) => {
                                        setOverviewTitle(e.target.value);
                                        setIsChangedFormValues(true);
                                    }}
                                    placeholder="VD: Nó hoạt động như thế nào"
                                    size="large"
                                />
                            </div>
                        </Col>
                    </Row>

                    {/* Overview Content */}
                    <Row gutter={16}>
                        <Col span={24}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                                    Nội dung tổng quan <span style={{ color: 'red' }}>*</span>
                                </label>
                                <ReactQuill
                                    theme="snow"
                                    value={overviewContent}
                                    onChange={(value) => {
                                        setOverviewContent(value);
                                        setIsChangedFormValues(true);
                                    }}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    placeholder="Nhập nội dung tổng quan về khóa học..."
                                    style={{ 
                                        background: 'white',
                                        borderRadius: '4px',
                                        minHeight: '200px',
                                    }}
                                />
                                <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
                                    💡 Tip: Sử dụng thanh công cụ để định dạng text, tạo bullet list, numbered list, và nhiều hơn nữa.
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Divider orientation="left">Media</Divider>

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

            <SimulationPreviewModal
                visible={previewVisible}
                onClose={() => setPreviewVisible(false)}
                data={getPreviewData()}
            />
        </>
    );
};

const SimulationPreviewModal = ({ visible, onClose, data }) => {
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

                {data.imagePath && (
                    <img
                        src={`${AppConstants.contentRootUrl}${data.imagePath}`}
                        alt="Preview"
                        style={{ width: '100%', borderRadius: '8px', marginBottom: 24 }}
                    />
                )}

                {/* Description Preview */}
                {(data.descriptionTitle || data.descriptionContent) && (
                    <Card title="Mô tả khóa học" style={{ marginBottom: 16 }}>
                        {data.descriptionTitle && (
                            <h2 style={{ marginTop: 0, marginBottom: 16 }}>{data.descriptionTitle}</h2>
                        )}
                        {data.descriptionContent && data.descriptionContent !== '<p><br></p>' && (
                            <div 
                                className="ql-editor" 
                                style={{ padding: 0 }}
                                dangerouslySetInnerHTML={{ __html: data.descriptionContent }}
                            />
                        )}
                    </Card>
                )}

                {/* Overview Preview */}
                {(data.overviewTitle || data.overviewContent) && (
                    <Card title="Tổng quan khóa học" style={{ marginBottom: 16 }}>
                        {data.overviewTitle && (
                            <h3 style={{ marginTop: 0, marginBottom: 16 }}>{data.overviewTitle}</h3>
                        )}
                        {data.overviewContent && data.overviewContent !== '<p><br></p>' && (
                            <div 
                                className="ql-editor" 
                                style={{ padding: 0 }}
                                dangerouslySetInnerHTML={{ __html: data.overviewContent }}
                            />
                        )}
                    </Card>
                )}

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
                            title: data.descriptionTitle || '',
                            content: data.descriptionContent || '',
                        }),
                        overview: JSON.stringify([{
                            title: data.overviewTitle || '',
                            content: data.overviewContent || '',
                        }]),
                        imagePath: data.imagePath || null,
                        videoPath: data.videoPath || null,
                    }, null, 2)}
                </pre>
            </div>
        </Modal>
    );
};

export default SimulationForm;