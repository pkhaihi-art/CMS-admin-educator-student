import { commonMessage } from '@locales/intl';
import { notification } from 'antd';

const showSucsessMessage = (content, translate) => {
    notification.success({
        message: translate.formatMessage(commonMessage.success) || translate?.t(`${translate.ns}:success`, 'Success'),
        description: content,
    });
};

const showErrorMessage = (content, translate) => {
    notification.error({
        message: translate.formatMessage(commonMessage.error) || translate?.t(`${translate.ns}:error`, 'Lỗi'),
        description: content,
    });
};

const showWarningMessage = (content, translate) => {
    notification.warning({
        message:
            translate.formatMessage(commonMessage.warning) || translate?.t(`${translate.ns}:error`, 'Error Message'),
        description: content,
    });
};

export { showErrorMessage, showWarningMessage, showSucsessMessage };
