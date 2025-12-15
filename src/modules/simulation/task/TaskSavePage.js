import React from 'react';
import { useParams, useLocation } from 'react-router-dom';

import PageWrapper from '@components/common/layout/PageWrapper';
import apiConfig from '@constants/apiConfig';
import useSaveBase from '@hooks/useSaveBase';
import useTranslate from '@hooks/useTranslate';
import { commonMessage } from '@locales/intl';
import TaskForm from '@modules/simulation/task/TaskForm';

import { UserTypes } from '@constants';
import { getData } from '@utils/localStorage';
import { storageKeys } from '@constants';

const TaskSavePage = ({ pageOptions }) => {
    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    const translate = useTranslate();
    const { id, simulationId } = useParams();
    const location = useLocation();
    const isCreating = id === 'create';
    
    // Lấy parentTask từ location.state
    const parentTaskFromState = location.state?.parentTask;

    const apiConfiguration = isEducator
        ? {
            getById: apiConfig.task.educatorGet,
            create: apiConfig.task.create,
            update: apiConfig.task.update,
        }
        : {
            getById: apiConfig.task.getById,
        };

    const { detail, mixinFuncs, loading, onSave, setIsChangedFormValues, isEditing, title } = useSaveBase({
        apiConfig: apiConfiguration,
        options: {
            getListUrl: `/simulation/${simulationId}/task`,
            objectName: translate.formatMessage(pageOptions.objectName)?.toLowerCase(),
        },
        override: (funcs) => {
            funcs.prepareUpdateData = (data) => ({
                ...data,
                id: id,
                simulationId: simulationId,
            });

            funcs.prepareCreateData = (data) => ({
                ...data,
                simulationId: simulationId,
            });

            funcs.mappingData = (data) => ({
                ...data.data,
            });
        },
    });

    // Tùy chỉnh title cho breadcrumb
    const getPageTitle = () => {
        if (isCreating) {
            return parentTaskFromState ? 'Tạo Task Con' : 'Tạo Task';
        }
        return title;
    };

    return (
        <PageWrapper
            loading={loading}
            routes={pageOptions.renderBreadcrumbs(commonMessage, translate, getPageTitle(), { simulationId })}
        >
            <TaskForm
                setIsChangedFormValues={setIsChangedFormValues}
                dataDetail={isCreating ? {} : detail || {}}
                formId={mixinFuncs.getFormId()}
                isEditing={isEditing}
                actions={mixinFuncs.renderActions()}
                onSubmit={onSave}
                simulationId={simulationId}
            />
        </PageWrapper>
    );
};

export default TaskSavePage;