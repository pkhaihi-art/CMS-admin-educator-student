import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Empty, Tag, Button } from 'antd';
import { FileTextOutlined, QuestionCircleOutlined, RightOutlined } from '@ant-design/icons';

import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';

import { AppConstants, DEFAULT_TABLE_ITEM_SIZE, storageKeys, UserTypes, TaskTypes } from '@constants';
import apiConfig from '@constants/apiConfig';
import { FieldTypes } from '@constants/formConfig';
import { taskKindOptions } from '@constants/masterData';
import { commonMessage } from '@locales/intl';

import AvatarField from '@components/common/form/AvatarField';
import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';

import { calculateIndex } from '@utils';
import { getData, setData } from '@utils/localStorage';

const TaskListPage = ({ pageOptions }) => {
    const translate = useTranslate();
    const navigate = useNavigate();
    const { simulationId } = useParams();

    // Phát hiện user type
    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;
    const isAdmin = userType === UserTypes.ADMIN;

    const formattedKindOptions = translate.formatKeys(taskKindOptions, ['label']);
    const kindMap = Object.fromEntries(formattedKindOptions.map(item => [item.value, item]));

    const labels = {
        name: translate.formatMessage(commonMessage.name),
        title: translate.formatMessage(commonMessage.title),
        description: translate.formatMessage(commonMessage.description),
        introduction: translate.formatMessage(commonMessage.introduction),
        kind: translate.formatMessage(commonMessage.kind),
        totalQuestion: translate.formatMessage(commonMessage.totalQuestion),
        maxErrors: translate.formatMessage(commonMessage.maxErrors),
        noData: translate.formatMessage(commonMessage.noData),
        action: translate.formatMessage(commonMessage.action),
        task: translate.formatMessage(commonMessage.task),
        image: translate.formatMessage(commonMessage.image),
        question: translate.formatMessage(commonMessage.question),
        viewDetails: translate.formatMessage(commonMessage.viewDetails),
    };

    const kindValues = formattedKindOptions.map(item => ({
        value: item.value,
        label: item.label,
    }));

    // Cấu hình API theo role
    const apiConfiguration = isEducator
        ? {
            getList: apiConfig.task.educatorList,
            delete: apiConfig.task.delete,
            create: apiConfig.task.create,
            update: apiConfig.task.update,
        }
        : {
            getList: apiConfig.task.getList,
        };

    const { data, mixinFuncs, queryFilter, loading, pagination } = useListBase({
        apiConfig: apiConfiguration,
        options: {
            objectName: labels.task,
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            funcs.prepareGetListParams = (params) => ({
                ...params,
                simulationId: simulationId,
            });

            funcs.renderKindColumn = (columnsProps) => ({
                title: labels.kind,
                dataIndex: 'kind',
                align: 'center',
                ...columnsProps,
                render: (kind) => {
                    const item = kindMap[kind] || {};
                    return (
                        <Tag color={item.color || 'default'}>
                            <div style={{ padding: '0 4px', fontSize: 14 }}>{item.label || 'N/A'}</div>
                        </Tag>
                    );
                },
            });

            const originalActionColumnButtons = funcs.actionColumnButtons;
            funcs.actionColumnButtons = (additionalButtons = {}) => ({
                ...originalActionColumnButtons(additionalButtons),
                question: (dataRow) => {
                    // Chỉ hiển thị nút question cho SubTask (kind = 2)
                    if (dataRow.kind !== TaskTypes.SUBTASK) {
                        return null;
                    }
                    
                    return (
                        <Button
                            type="link"
                            style={{ padding: 0 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                // Lưu thông tin Task cha vào localStorage
                                if (dataRow.parent) {
                                    setData(storageKeys.PARENT_TASK_INFO, {
                                        id: dataRow.parent.id,
                                        name: dataRow.parent.name,
                                    });
                                }
                                
                                navigate(`/simulation/${simulationId}/task/${dataRow.id}/question`);
                            }}
                            title={labels.question}
                        >
                            <QuestionCircleOutlined />
                        </Button>
                    );
                },
                viewDetails: (dataRow) => {
                    // Chỉ hiển thị nút view details cho Task cha (kind = 1)
                    if (dataRow.kind !== TaskTypes.TASK) {
                        return null;
                    }
                    
                    return (
                        <Button
                            type="link"
                            style={{ padding: 0 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/simulation/${simulationId}/task/${dataRow.id}`);
                            }}
                            title={labels.viewDetails}
                        >
                            <RightOutlined />
                        </Button>
                    );
                },
            });
        },
    });

    // Tổ chức data thành cấu trúc phân cấp
    const hierarchicalData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const tasksMap = new Map();
        const subTasks = [];

        // Phân loại Tasks và SubTasks
        data.forEach(item => {
            if (item.kind === TaskTypes.TASK) {
                tasksMap.set(item.id, {
                    ...item,
                    children: [],
                });
            } else if (item.kind === TaskTypes.SUBTASK) {
                subTasks.push(item);
            }
        });

        // Gắn SubTasks vào Task cha thông qua parent.id
        subTasks.forEach(subTask => {
            const parentId = subTask.parent?.id || subTask.parentId;
            if (parentId && tasksMap.has(parentId)) {
                const parentTask = tasksMap.get(parentId);
                // Thêm thông tin parent vào SubTask để dễ truy cập sau này
                tasksMap.get(parentId).children.push({
                    ...subTask,
                    parent: {
                        id: parentTask.id,
                        name: parentTask.name,
                    },
                });
            } else {
                // Nếu không tìm thấy parent, hiển thị SubTask như một item độc lập
                tasksMap.set(`orphan_${subTask.id}`, subTask);
            }
        });

        return Array.from(tasksMap.values());
    }, [data]);

    // Handle row click để navigate
    const handleRowClick = (record) => {
        if (record.kind === TaskTypes.TASK) {
            // Click vào Task cha -> navigate to details
            navigate(`/simulation/${simulationId}/task/${record.id}`);
        } else if (record.kind === TaskTypes.SUBTASK) {
            // Lưu thông tin Task cha vào localStorage
            if (record.parent) {
                setData(storageKeys.PARENT_TASK_INFO, {
                    id: record.parent.id,
                    name: record.parent.name,
                });
            }
            
            // Click vào SubTask -> navigate to questions
            navigate(`/simulation/${simulationId}/task/${record.id}/question`);
        }
    };

    const columns = [
        {
            title: '#',
            width: '50px',
            align: 'center',
            render: (_, record, index) => {
                // Chỉ hiển thị số thứ tự cho Task cha
                if (record.kind === TaskTypes.TASK) {
                    const parentIndex = hierarchicalData.findIndex(item => item.id === record.id);
                    return parentIndex + 1;
                }
                return '';
            },
        },
        {
            title: labels.image,
            dataIndex: 'imagePath',
            align: 'center',
            width: '80px',
            render: imagePath => (
                <AvatarField
                    size="large"
                    icon={<FileTextOutlined />}
                    src={imagePath ? `${AppConstants.contentRootUrl}${imagePath}` : null}
                    shape="square"
                />
            ),
        },
        {
            title: labels.name,
            dataIndex: 'name',
            width: '200px',
            render: (text, record) => (
                <div 
                    style={{ 
                        paddingLeft: record.kind === TaskTypes.SUBTASK ? 20 : 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        color: record.kind === TaskTypes.TASK ? '#1890ff' : 'inherit',
                        fontWeight: record.kind === TaskTypes.TASK ? 600 : 400,
                    }}
                >
                    {record.kind === TaskTypes.SUBTASK && <span style={{ color: '#999' }}>└─</span>}
                    {text}
                </div>
            ),
        },
        {
            title: labels.title,
            dataIndex: 'title',
            width: '220px',
        },
        // {
        //     title: labels.description,
        //     dataIndex: 'description',
        //     width: '250px',
        //     ellipsis: true,
        // },
        mixinFuncs.renderKindColumn({ width: '120px' }),
        {
            title: labels.totalQuestion,
            dataIndex: 'totalQuestion',
            align: 'center',
            width: '120px',
            render: (value, record) => {
                // Chỉ hiển thị cho SubTask
                return record.kind === TaskTypes.SUBTASK ? value || 0 : '-';
            },
        },
        {
            title: labels.maxErrors,
            dataIndex: 'maxErrors',
            align: 'center',
            width: '100px',
            render: (value, record) => {
                // Chỉ hiển thị cho SubTask
                return record.kind === TaskTypes.SUBTASK ? value || 0 : '-';
            },
        },
        mixinFuncs.renderActionColumn(
            {
                edit: isEducator 
                    ? () => mixinFuncs.hasPermission([apiConfig.task.update.permissionCode])
                    : false,
                delete: isEducator 
                    ? () => mixinFuncs.hasPermission([apiConfig.task.delete.permissionCode])
                    : false,
                viewDetails: (record) => {
                    // Chỉ hiển thị nút view details cho Task cha
                    return record.kind === TaskTypes.TASK;
                },
                question: (record) => {
                    // Chỉ hiển thị nút question cho SubTask
                    if (record.kind !== TaskTypes.SUBTASK) {
                        return false;
                    }
                    return mixinFuncs.hasPermission([
                        isEducator 
                            ? apiConfig.taskQuestion.getListqForEducator.permissionCode
                            : apiConfig.taskQuestion.getList.permissionCode,
                    ]);
                },
            },
            { width: '180px', title: labels.action },
        ),
    ];

    const searchFields = [
        { key: 'name', placeholder: labels.name },
        { key: 'title', placeholder: labels.title },
        {
            key: 'kind',
            placeholder: labels.kind,
            type: FieldTypes.SELECT,
            options: kindValues,
        },
    ];

    return (
        <PageWrapper
            routes={pageOptions.renderBreadcrumbs(commonMessage, translate, null, { simulationId })}
        >
            <ListPage
                searchForm={mixinFuncs.renderSearchForm({
                    fields: searchFields,
                    initialValues: queryFilter,
                })}
                actionBar={isEducator ? mixinFuncs.renderActionBar() : null}
                baseTable={
                    <BaseTable
                        onChange={mixinFuncs.changePagination}
                        columns={columns}
                        dataSource={hierarchicalData}
                        loading={loading}
                        rowKey={record => record.id}
                        pagination={pagination}
                        expandable={{
                            defaultExpandAllRows: true,
                            expandIcon: ({ expanded, onExpand, record }) => {
                                // Chỉ hiển thị expand icon cho Task cha có children
                                if (record.kind === TaskTypes.TASK && record.children?.length > 0) {
                                    return (
                                        <RightOutlined
                                            rotate={expanded ? 90 : 0}
                                            onClick={e => {
                                                e.stopPropagation();
                                                onExpand(record, e);
                                            }}
                                            style={{ 
                                                cursor: 'pointer',
                                                marginRight: 8,
                                                transition: 'transform 0.3s',
                                            }}
                                        />
                                    );
                                }
                                return null;
                            },
                            indentSize: 0,
                        }}
                        onRow={(record) => ({
                            onClick: () => handleRowClick(record),
                            style: { 
                                cursor: 'pointer',
                                backgroundColor: record.kind === TaskTypes.TASK ? '#fafafa' : '#ffffff',
                            },
                        })}
                        locale={{ emptyText: <Empty description={labels.noData} /> }}
                    />
                }
            />
        </PageWrapper>
    );
};

export default TaskListPage;