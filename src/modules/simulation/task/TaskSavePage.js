import React from 'react';
import { useParams } from 'react-router-dom';

import PageWrapper from '@components/common/layout/PageWrapper';
import apiConfig from '@constants/apiConfig';
import useSaveBase from '@hooks/useSaveBase';
import useTranslate from '@hooks/useTranslate';
import { commonMessage } from '@locales/intl';
import TaskForm from '@modules/simulation/task/TaskForm';

const TaskSavePage = ({ pageOptions }) => {
    const translate = useTranslate();
    const { id, simulationId } = useParams();
    const isCreating = id === 'create';

    const { detail, mixinFuncs, loading, onSave, setIsChangedFormValues, isEditing, title } = useSaveBase({
        apiConfig: {
            getById: apiConfig.task.educatorGet,
            create: apiConfig.task.create,
            update: apiConfig.task.update,
        },
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

    return (
        <PageWrapper
            loading={loading}
            routes={pageOptions.renderBreadcrumbs(commonMessage, translate, title, { simulationId })}
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
