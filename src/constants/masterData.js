import {
    STATUS_ACTIVE,
    STATUS_INACTIVE,
    STATUS_PENDING,
    STATUS_WAITING_APPROVE,
    STATUS_WAITING_APPROVE_DELETE,
    STATUS_REJECT,
    PROVINCE_KIND,
    DISTRICT_KIND,
    VILLAGE_KIND,
    GENDER_MALE,
    GENDER_FEMALE,
    GENDER_OTHER,
    DURATION_TYPE_HOUR,
    DURATION_TYPE_MINUTE,
    DURATION_TYPE_SECOND,
    PHONE_CALL_TYPE_OUTGOING,
    PHONE_CALL_TYPE_COMING,
    PHONE_CALL_TYPE_MISSING,
    PLATFORM_ANDROID,
    PLATFORM_IOS,
    MESSAGE_TYPE_SEND,
    MESSAGE_TYPE_RECEIVE,
    MESSAGE_STATUS_READ,
    MESSAGE_STATUS_UNREAD,
    STATUS_LOCK,
    PHONE_CALL_TYPE_DONE,
    PHONE_CALL_TYPE_CANCELED,
    PHONE_CALL_TYPE_TAKLING,
    DEVICE_EMPLOYEE_LOG_TRANSFER,
    DEVICE_EMPLOYEE_LOG_RETURN,
    STATE_WAITING_OTP,
    TaskTypes,
} from '@constants';
import { defineMessages } from 'react-intl';
import { nationKindMessage, actionMessage } from './intl';
import { commonMessage } from '@locales/intl';


export const languageOptions = [
    { value: 1, label: 'EN' },
    { value: 2, label: 'VN' },
    { value: 3, label: 'Other' },
];

export const orderOptions = [
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
];

export const commonStatus = [
    { value: STATUS_ACTIVE, label: 'Active', color: 'green' },
    { value: STATUS_PENDING, label: 'Pending', color: 'warning' },
    { value: STATUS_INACTIVE, label: 'Inactive', color: 'red' },
];

export const statusOptions = [
    { value: STATUS_ACTIVE, label: commonMessage.statusActive, color: '#00A648' },
    { value: STATUS_PENDING, label: commonMessage.statusPending, color: '#FFBF00' },
    { value: STATUS_INACTIVE, label: commonMessage.statusInactive, color: '#CC0000' },
];

export const educatorStatusOptions = [
    { value: STATUS_ACTIVE, label: commonMessage.statusActive, color: '#00A648' },
    { value: STATUS_PENDING, label: commonMessage.statusPending, color: '#FFBF00' },
    { value: STATUS_LOCK, label: commonMessage.statusLock, color: '#CC0000' },
    { value: STATE_WAITING_OTP, label: commonMessage.statusWaitingOtp, color: '#007accff' },
];

export const levelOptions = [
    { value: STATUS_ACTIVE, label: commonMessage.level_1, color: '#00A648' },
    { value: STATUS_PENDING, label: commonMessage.level_2, color: '#FFBF00' },
    { value: STATUS_INACTIVE, label: commonMessage.level_3, color: '#CC0000' },
];



// Simulation status options
export const simulationStatusOptions = [
    { value: STATUS_ACTIVE, label: commonMessage.statusActive, color: '#00A648' },
    { value: STATUS_PENDING, label: commonMessage.statusPending, color: '#FFBF00' },
    { value: STATUS_WAITING_APPROVE, label: commonMessage.statusWaitingApprove, color: '#1890ff' },
    { value: STATUS_WAITING_APPROVE_DELETE, label: commonMessage.statusWaitingApproveDelete, color: '#fa8c16' },
    { value: STATUS_LOCK, label: commonMessage.statusLock, color: '#CC0000' },
    { value: STATUS_REJECT, label: commonMessage.statusReject, color: '#8c8c8c' },
];

export const formSize = {
    small: '700px',
    normal: '800px',
    big: '900px',
    large: '1200px',
    extraLarge: '1500px',
};

export const nationKindOptions = [
    {
        value: PROVINCE_KIND,
        label: nationKindMessage.province,
    },
    {
        value: DISTRICT_KIND,
        label: nationKindMessage.district,
    },
    {
        value: VILLAGE_KIND,
        label: nationKindMessage.village,
    },
];

export const kindPost = [
    {
        value: 1,
        label: 'Post',
        color: 'green',
    },
    {
        value: 2,
        label: 'Story',
        color: 'blue',
    },
];

export const settingGroups = {
    GENERAL: 'general',
    PAGE: 'page_config',
    REVENUE: 'revenue_config',
    TRAINING: 'training_config',
};
export const dataTypeSetting = {
    INT: 'int',
    STRING: 'string',
    BOOLEAN: 'boolean',
    DOUBLE: 'double',
    RICHTEXT: 'richtext',
};

export const settingKeyName = {
    MONEY_UNIT: 'money_unit',
    TRAINING_UNIT: 'training_percent',
    BUG_UNIT: 'training_project_percent',
    NUMBER_OF_TRAINING_PROJECT: 'number_of_training_projects',
};

export const actionOptions = [
    {
        value: 1,
        label: actionMessage.contactForm,
    },
    { value: 2, label: actionMessage.navigation },
];

export const genderOptions = [
    { value: GENDER_MALE, label: commonMessage.genderMale, color: '#00A648' },
    { value: GENDER_FEMALE, label: commonMessage.genderFemale, color: '#FFBF00' },
    { value: GENDER_OTHER, label: commonMessage.genderOther, color: '#FFBF00' },
];

export const durationTypeOptions = [
    { value: DURATION_TYPE_HOUR, label: commonMessage.durationTypeHour },
    { value: DURATION_TYPE_MINUTE, label: commonMessage.durationTypeMinute },
    { value: DURATION_TYPE_SECOND, label: commonMessage.durationTypeSecond },
];

export const phoneCallTypeOptions = [
    { value: PHONE_CALL_TYPE_OUTGOING, label: commonMessage.phoneCallTypeOutGoing },
    { value: PHONE_CALL_TYPE_COMING, label: commonMessage.phoneCallTypeComing },
    { value: PHONE_CALL_TYPE_MISSING, label: commonMessage.phoneCallTypeMissing },
    { value: PHONE_CALL_TYPE_TAKLING, label: commonMessage.phoneCallTypeTalking },
    { value: PHONE_CALL_TYPE_DONE, label: commonMessage.phoneCallTypeDone },
    { value: PHONE_CALL_TYPE_CANCELED, label: commonMessage.phoneCallTypeCanceled },
];
export const DEVICE_PLATFORMS = [
    { label: 'Android', value: PLATFORM_ANDROID },
    { label: 'iOS', value: PLATFORM_IOS },
];

export const messageTypeOptions = [
    { value: MESSAGE_TYPE_SEND, label: commonMessage.messageTypeSend },
    { value: MESSAGE_TYPE_RECEIVE, label: commonMessage.messageTypeReceive },
];

export const messageStatusOptions = [
    { value: MESSAGE_STATUS_READ, label: commonMessage.messageStatusRead },
    { value: MESSAGE_STATUS_UNREAD, label: commonMessage.messageStatusUnread },
];

export const deviceEmployeeLogOptions = [
    { value: DEVICE_EMPLOYEE_LOG_TRANSFER, label: commonMessage.deviceEmployeeLogTransfer },
    { value: DEVICE_EMPLOYEE_LOG_RETURN, label: commonMessage.deviceEmployeeLogReturn },
];

// export const statusOptions = [
//     {
//         value: 1,
//         label: 'Active',
//         color: '#00A648',
//     },
//     {
//         value: 0,
//         label: 'Inactive',
//         color: '#CC0000',
//     },
// ];

// // Educator status options (đã có sẵn)
// export const educatorStatusOptions = [
//     {
//         value: 1,
//         label: 'Active',
//         color: '#00A648',
//     },
//     {
//         value: 2,
//         label: 'Pending',
//         color: '#FFBF00',
//     },
//     {
//         value: 3,
//         label: 'Lock',
//         color: '#CC0000',
//     },
// ];

// Task Kind Options
export const taskKindOptions = [
    { value: TaskTypes.TASK, label: { id: 'task', defaultMessage: 'task' }, color: '#00A648' },
    { value: TaskTypes.SUBTASK, label: { id: 'subtask', defaultMessage: 'subtask' }, color: '#FFBF00' },
];

export const questionTypeOptions = [
    {
        value: 1,
        label: { id: 'question.type.file', defaultMessage: 'File Upload' },
        color: 'blue',
    },
    {
        value: 2,
        label: { id: 'question.type.text', defaultMessage: 'Text Answer' },
        color: 'green',
    },
    {
        value: 3,
        label: { id: 'question.type.choice', defaultMessage: 'Multiple Choice' },
        color: 'orange',
    },
];



// Simulation Status Options
// export const simulationStatusOptions = [
//     { value: 1, label: 'statusActive', color: '#00A648' },
//     { value: 2, label: 'statusPending', color: '#FFBF00' },
//     { value: 3, label: 'statusLock', color: '#CC0000' },
//     { value: 4, label: 'statusDraft', color: '#808080' },
//     { value: 5, label: 'statusRequestDelete', color: '#FF6B6B' },
// ];
//
// Level Options
// export const levelOptions = [
//     { value: 1, label: 'levelBeginner', color: 'green' },
//     { value: 2, label: 'levelIntermediate', color: 'blue' },
//     { value: 3, label: 'levelAdvanced', color: 'orange' },
//     { value: 4, label: 'levelExpert', color: 'red' },
// ];

// Subtask Progress Status
export const subtaskProgressStatusOptions = [
    { value: 1, label: 'progressNotStarted', color: 'default' },
    { value: 2, label: 'progressInProgress', color: 'processing' },
    { value: 3, label: 'progressCompleted', color: 'success' },
    { value: 4, label: 'progressFailed', color: 'error' },
];