import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';
import SimulationListPage from "@modules/student/simulation/SimulationListPage";
import SimulationDetailPage from "@modules/student/simulation/SimulationDetailPage";
import TaskDetailPage from "@modules/student/task/TaskDetailPage";
import DoExercisePage from "@modules/student/exercise/DoExercisePage";
import AchievementPage from "@modules/student/achievement/AchievementPage";

const paths = {
    simulationListPage: '/simulations',
    simulationDetailPage: '/simulations/:id',
    taskDetailPage: '/simulations/:simulationId/tasks/:taskId',
    doExercisePage: '/simulations/:simulationId/tasks/:taskId/exercise',
    achievementPage: '/achievements',
};

export default {
    simulationListPage: {
        path: paths.simulationListPage,
        auth: true,
        component: SimulationListPage,
        pageOptions: {
            objectName: 'Danh sách bài mô phỏng',
            renderBreadcrumbs: (messages, t) => {
                return [{ breadcrumbName: 'Bài mô phỏng' }];
            },
        },
    },
    
    simulationDetailPage: {
        path: paths.simulationDetailPage,
        auth: true,
        component: SimulationDetailPage,
        pageOptions: {
            objectName: 'Chi tiết bài mô phỏng',
            renderBreadcrumbs: (messages, t, title) => {
                return [
                    { breadcrumbName: 'Bài mô phỏng', path: paths.simulationListPage },
                    { breadcrumbName: title || 'Chi tiết' },
                ];
            },
        },
    },
    
    taskDetailPage: {
        path: paths.taskDetailPage,
        auth: true,
        component: TaskDetailPage,
        pageOptions: {
            objectName: 'Chi tiết nhiệm vụ',
            renderBreadcrumbs: (messages, t, title) => {
                return [
                    { breadcrumbName: 'Bài mô phỏng', path: paths.simulationListPage },
                    { breadcrumbName: title || 'Nhiệm vụ' },
                ];
            },
        },
    },
    
    doExercisePage: {
        path: paths.doExercisePage,
        auth: true,
        component: DoExercisePage,
        pageOptions: {
            objectName: 'Làm bài tập',
            renderBreadcrumbs: (messages, t) => {
                return [
                    { breadcrumbName: 'Bài mô phỏng', path: paths.simulationListPage },
                    { breadcrumbName: 'Làm bài tập' },
                ];
            },
        },
    },
    
    achievementPage: {
        path: paths.achievementPage,
        auth: true,
        component: AchievementPage,
        pageOptions: {
            objectName: 'Thành tích',
            renderBreadcrumbs: (messages, t) => {
                return [{ breadcrumbName: 'Thành tích của tôi' }];
            },
        },
    },
};