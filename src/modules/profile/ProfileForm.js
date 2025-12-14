import TextField from '@components/common/form/TextField';
import DatePickerField from '@components/common/form/DatePickerField';
import React, { useEffect } from 'react';
import dayjs from 'dayjs';
import useBasicForm from '@hooks/useBasicForm';
import { defineMessages } from 'react-intl';
import useTranslate from '@hooks/useTranslate';
import { Card, Form } from 'antd';
import usePasswordValidation from '@hooks/usePasswordValidation'; 
import { DEFAULT_FORMAT } from '@constants';

const messages = defineMessages({
    banner: 'Banner',
    avatarPath: 'Avatar',
    username: 'Username',
    career: 'Career Name',
    fullName: 'Leader',
    email: 'Email',
    hotline: 'Hot line',
    phoneNumber: 'Phone Number',
    birthday: 'Birthday',
    taxNumber: 'Tax Number',
    zipCode: 'Zip Code',
    city: 'City',
    address: 'Address',
    logo: 'Logo',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    passwordLengthError: 'Password must be at least 6 characters',
    passwordMatchError: 'Password does not match',
});

const ProfileForm = (props) => {
    const { formId, dataDetail, onSubmit, setIsChangedFormValues, actions } = props;

    const translate = useTranslate();

    const { form, mixinFuncs, onValuesChange } = useBasicForm({
        onSubmit,
        setIsChangedFormValues,
    });

    // ✔️ Sử dụng hook kiểm tra mật khẩu (min = 6 ký tự để phù hợp rule cũ)
    const { passwordRules, confirmPasswordRules } = usePasswordValidation(6);

    useEffect(() => {
        if (dataDetail) {
            form.setFieldsValue({
                ...dataDetail,
                birthday: dataDetail.birthday
                    ? dayjs(dataDetail.birthday, DEFAULT_FORMAT)
                    : null,
            });
        }
    }, [dataDetail]);

    const handleFinish = (values) => {
        mixinFuncs.handleSubmit({
            ...values,
            fullName: values.fullName,
            oldPassword: values.oldPassword,
            password: values.password,
        });
    };

    return (
        <Card className="card-form" bordered={false} style={{ minHeight: 'calc(100vh - 190px)' }}>
            <Form
                style={{ width: '80%' }}
                labelCol={{ span: 8 }}
                id={formId}
                onFinish={handleFinish}
                form={form}
                layout="horizontal"
                onValuesChange={onValuesChange}
            >
                <TextField readOnly label={translate.formatMessage(messages.username)} name={'username'} />

                <TextField label={translate.formatMessage(messages.email)} name={'email'} />

                <TextField label={translate.formatMessage(messages.fullName)} name={'fullName'} />

                <TextField 
                    label={translate.formatMessage(messages.phoneNumber)} 
                    name={'phone'}
                />

                <DatePickerField
                    name="birthday"
                    label="Ngày sinh"
                    format="DD/MM/YYYY"
                    showTime={false}
                />

                <TextField
                    type="password"
                    required
                    label={translate.formatMessage(messages.currentPassword)}
                    name="oldPassword"
                />


                <TextField
                    type="password"
                    label={translate.formatMessage(messages.newPassword)}
                    name="newPassword"
                    rules={passwordRules}  
                />

                <TextField
                    type="password"
                    label={translate.formatMessage(messages.confirmPassword)}
                    name="confirmPassword"
                    dependencies={['newPassword']}
                    rules={confirmPasswordRules(form.getFieldValue)}  
                />

                <div className="footer-card-form">{actions}</div>
            </Form>
        </Card>
    );
};

export default ProfileForm;
