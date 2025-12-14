import React from 'react';
import { Empty, Tag, Button, Modal } from 'antd';
import { UserOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';

import {
    AppConstants,
    commonStatus,
    DEFAULT_TABLE_ITEM_SIZE,
    STATUS_LOCK,
    STATUS_PENDING,
} from '@constants';
import apiConfig from '@constants/apiConfig';
import { FieldTypes } from '@constants/formConfig';
import { educatorStatusOptions, genderOptions } from '@constants/masterData';
import { commonMessage } from '@locales/intl';

import AvatarField from '@components/common/form/AvatarField';
import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';

import { calculateIndex, getColumnWidth } from '@utils';

const EducatorListPage = ({ pageOptions }) => {
    const translate = useTranslate();
    const navigate = useNavigate();

    const formattedStatusOptions = translate.formatKeys(educatorStatusOptions, ['label']);
    const statusMap = Object.fromEntries(
        formattedStatusOptions.map(item => [item.value, item]),
    );

    const labels = {
        fullName:       translate.formatMessage(commonMessage.fullName),
        email:          translate.formatMessage(commonMessage.email),
        phone:          translate.formatMessage(commonMessage.phone),
        avatar:         translate.formatMessage(commonMessage.avatar),
        gender:         translate.formatMessage(commonMessage.gender),
        birthday:       translate.formatMessage(commonMessage.birthday),
        status:         translate.formatMessage(commonMessage.status),
        noData:         translate.formatMessage(commonMessage.noData),
        approve:        translate.formatMessage(commonMessage.approve),
        confirmApprove: translate.formatMessage(commonMessage.confirmApprove),
    };

    const statusValues = formattedStatusOptions.map(item => ({
        value: item.value,
        label: item.label,
    }));

    const { data, mixinFuncs, queryFilter, loading, pagination } = useListBase({
        apiConfig: {
            getList:      apiConfig.educator.getList,
            delete:       apiConfig.educator.delete,
            update:       apiConfig.educator.update,
            changeStatus: apiConfig.educator.changeStatus,
        },
        options: {
            objectName: 'giáo viên',
            pageSize:   DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            const statusMap = {
                1: { label: translate.formatMessage(commonMessage.statusActive), color: '#00A648' },
                2: { label: translate.formatMessage(commonMessage.statusPending), color: '#FFBF00' },
                3: { label: translate.formatMessage(commonMessage.statusLock), color: '#CC0000' },
            };

            // ⚠️ Lưu lại hàm gốc tránh đệ quy vô hạn
            const originalActionColumnButtons = funcs.actionColumnButtons;

            // ✅ Ghi đè hàm renderStatusColumn
            funcs.renderStatusColumn = (columnsProps) => ({
                title: translate.formatMessage(commonMessage.status),
                dataIndex: ['account', 'status'],
                align: 'center',
                ...columnsProps,
                render: (status) => {
                    const item = statusMap[status] || {};
                    return (
                        <Tag color={item.color}>
                            <div style={{ padding: '0 4px', fontSize: 14 }}>{item.label}</div>
                        </Tag>
                    );
                },
            });

            // ✅ Ghi đè nút hành động changeStatus với confirm tuỳ biến
            funcs.actionColumnButtons = (additionalButtons = {}) => ({
                ...originalActionColumnButtons(additionalButtons),
                changeStatus: ({ id, status, ...record }) => {
                    if (record.account?.status !== 2) return null;

                    return (
                        <Button
                            type="link"
                            onClick={(e) => {
                                e.stopPropagation();
                                Modal.confirm({
                                    title: `Bạn có chắc chắn muốn duyệt khoa chuyên môn "${record?.account?.fullName}" không?`,
                                    okText: 'Duyệt',
                                    cancelText: 'Huỷ',
                                    onOk: () => {
                                        funcs.handleChangeStatus(id, 1);
                                    },
                                });
                            }}
                            style={{ padding: 0 }}
                        >
                            <CheckOutlined />
                        </Button>
                    );
                },
            });

            funcs.renderActionBar = () => null;
        },
    });

    const columns = [
        {
            title: '#',
            width: '40px',
            align: 'center',
            render: (_, __, index) => calculateIndex(index, pagination, queryFilter),
        },
        {
            title: labels.avatar,
            dataIndex: ['account', 'avatar'],
            align: 'center',
            render: avatar => (
                <AvatarField
                    size="large"
                    icon={<UserOutlined />}
                    src={avatar ? `${AppConstants.contentRootUrl}${avatar}` : null}
                />
            ),
            width: getColumnWidth({ width: labels.avatar.length * 12 }),
        },
        {
            title: labels.fullName,
            dataIndex: ['account', 'fullName'],
        },
        {
            title: labels.email,
            dataIndex: ['account', 'email'],
            width: getColumnWidth({ data, dataIndex: 'account.email', ratio: 8 }),
        },
        {
            title: labels.phone,
            dataIndex: ['account', 'phone'],
            width: labels.phone.length * 10,
        },
        mixinFuncs.renderStatusColumn({ width: '120px' }),

        mixinFuncs.renderActionColumn(
            {
                edit: record =>
                    mixinFuncs.hasPermission([apiConfig.educator.update.permissionCode]),
                delete: record =>
                    mixinFuncs.hasPermission([apiConfig.educator.delete.permissionCode]) &&
                    !record.isSuperAdmin,
                changeStatus: record =>
                    record.account.status === 2,
            },
            {
                width: '140px',
                title: labels.approve,
            },
        ),
    ];

    const searchFields = [
        { key: 'fullName', placeholder: labels.fullName },
        { key: 'phone',    placeholder: labels.phone, type: FieldTypes.NUMBER },
        { key: 'email',    placeholder: labels.email },
        {
            key: 'status',
            placeholder: labels.status,
            type: FieldTypes.SELECT,
            options: statusValues,
        },
    ];

    return (
        <PageWrapper routes={pageOptions.renderBreadcrumbs(commonMessage, translate)}>
            <ListPage
                searchForm={mixinFuncs.renderSearchForm({
                    fields: searchFields,
                    initialValues: queryFilter,
                })}
                actionBar={mixinFuncs.renderActionBar()}
                baseTable={
                    <BaseTable
                        onChange={mixinFuncs.changePagination}
                        columns={columns}
                        dataSource={data}
                        loading={loading}
                        rowKey={record => record.id}
                        pagination={pagination}
                        onRow={(record, idx) => ({
                            style: { backgroundColor: idx % 2 ? '#f9f9f9' : '#ffffff' },
                        })}
                        locale={{
                            emptyText: <Empty description={labels.noData} />,
                        }}
                    />
                }
            />
        </PageWrapper>
    );
};

export default EducatorListPage;
