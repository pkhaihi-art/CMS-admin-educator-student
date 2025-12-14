import React, { useState } from 'react';
import { Form, Button, Input, message as antMessage, DatePicker } from 'antd';
import {
    LockOutlined,
    MailOutlined,
    GoogleOutlined,
    FacebookFilled,
    UserOutlined,
    PhoneOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useNavigate } from 'react-router-dom';
import useRegisterEducator from '@hooks/useRegisterEducator';
import useVerifyOtpEducator from '@hooks/useVerifyOtpEducator';
import { Row, Col } from 'antd';


const RegisterPage = () => {
    const [form] = Form.useForm();
    const [otpForm] = Form.useForm();
    const [step, setStep] = useState('register');
    const [email, setEmail] = useState('');
    const [idHash, setIdHash] = useState('');
    const navigate = useNavigate();

    const { register, loading: registering } = useRegisterEducator();
    const { verifyOtp, loading: verifying } = useVerifyOtpEducator();

    const onRegisterFinish = (values) => {
        const payload = {
            fullName: values.fullName,
            username: values.username,
            email: values.email,
            password: values.password,
            phone: values.phone,
            birthday: dayjs(values.birthday).format('DD/MM/YYYY HH:mm:ss'),
        };

        register(
            payload,
            (res) => {
                antMessage.success(res?.message || 'Register success!');
                setEmail(values.email);
                setIdHash(res?.data?.idHash);
                setStep('otp');
            },
            (err) => {
                antMessage.error(err?.message || 'Register failed!');
            },
        );
    };

    const onOtpFinish = (values) => {
        const payload = {
            idHash,
            otp: values.otp,
        };

        verifyOtp(
            payload,
            () => {
                antMessage.success('OTP verified!');
                navigate('/login');
            },
            (err) => {
                antMessage.error(err?.message || 'OTP verification failed!');
            },
        );
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                {/* Left */}
                <div className={styles.left}>
                    <div className={styles.leftContent}>
                        <h2>Welcome to our largest community</h2>
                        <p>Let`s learn something new today!</p>
                        <img src="/images/element/02.svg" alt="Illustration" className={styles.illustration} />
                        <div className={styles.students}>
                            <img src="/images/avatar/01.jpg" alt="avatar" className={styles.avatar} />
                            <img src="/images/avatar/02.jpg" alt="avatar" className={styles.avatar} />
                            <img src="/images/avatar/03.jpg" alt="avatar" className={styles.avatar} />
                            <img src="/images/avatar/04.jpg" alt="avatar" className={styles.avatar} />
                            <p>4k+ Students joined us, now it`s your turn.</p>
                        </div>
                    </div>
                </div>

                {/* Right */}
                <div className={styles.right}>
                    <div className={styles.formBox}>
                        <img src="/images/element/03.svg" className={styles.waveIcon} alt="icon" />

                        {step === 'register' ? (
                            <>
                                <h2>Sign up for your account!</h2>
                                <p>Nice to see you! Please sign up with your account.</p>

                                <Form layout="vertical" form={form} onFinish={onRegisterFinish}>
                                    <Row gutter={16}>
                                        <Col xs={24} sm={24} md={12}>
                                            <Form.Item name="fullName" label="Full Name *" rules={[{ required: true }]}>
                                                <Input size="large" prefix={<UserOutlined />} placeholder="Full name" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={24} md={12}>
                                            <Form.Item name="username" label="Username *" rules={[{ required: true }]}>
                                                <Input size="large" prefix={<UserOutlined />} placeholder="Username" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col xs={24} sm={24} md={12}>
                                            <Form.Item name="phone" label="Phone number *" rules={[{ required: true }]}>
                                                <Input size="large" prefix={<PhoneOutlined />} placeholder="0987654321" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={24} md={12}>
                                            <Form.Item name="birthday" label="Birthday *" rules={[{ required: true }]}>
                                                <DatePicker
                                                    size="large"
                                                    style={{ width: '100%' }}
                                                    format="YYYY-MM-DD"
                                                    placeholder="Select birthday"
                                                    disabledDate={(current) => current && current > dayjs().endOf('day')}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col xs={24} sm={24} md={12}>
                                            <Form.Item name="email" label="Email address *" rules={[{ required: true }]}>
                                                <Input size="large" prefix={<MailOutlined />} placeholder="E-mail" />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={24} md={12}>
                                            <Form.Item name="password" label="Password *" rules={[{ required: true }]}>
                                                <Input.Password size="large" prefix={<LockOutlined />} placeholder="********" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item
                                        name="confirmPassword"
                                        label="Confirm Password *"
                                        dependencies={['password']}
                                        rules={[
                                            { required: true },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (!value || getFieldValue('password') === value) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error('Passwords do not match!'));
                                                },
                                            }),
                                        ]}
                                    >
                                        <Input.Password size="large" prefix={<LockOutlined />} placeholder="********" />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" size="large" block loading={registering}>
                                            Sign Up
                                        </Button>
                                    </Form.Item>
                                </Form>



                                <div className={styles.divider}>
                                    <hr />
                                    <span>Or</span>
                                    <hr />
                                </div>

                                <div className={styles.socialButtons}>
                                    <Button icon={<GoogleOutlined />} block className={styles.google}>
                                        Signup with Google
                                    </Button>
                                    <Button icon={<FacebookFilled />} block className={styles.facebook}>
                                        Signup with Facebook
                                    </Button>
                                </div>

                                <div className={styles.signInRedirect}>
                                    <span>Already have an account? <a href="/login">Sign in here</a></span>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2>Verify OTP</h2>
                                <p>We’ve sent a verification code to: <strong>{email}</strong></p>
                                <Form form={otpForm} onFinish={onOtpFinish} layout="vertical">
                                    <Form.Item
                                        name="otp"
                                        label="OTP Code"
                                        rules={[{ required: true, message: 'Please input the OTP!' }]}
                                    >
                                        <Input placeholder="Enter your OTP" />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" block loading={verifying}>
                                            Verify
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
