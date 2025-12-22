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
                antMessage.success(res?.message || 'Đăng ký thành công!');
                setEmail(values.email);
                setIdHash(res?.data?.idHash);
                setStep('otp');
            },
            (err) => {
                antMessage.error(err?.message || 'Đăng ký thất bại!');
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
                antMessage.success('Xác thực OTP thành công!');
                navigate('/login');
            },
            (err) => {
                antMessage.error(err?.message || 'Xác thực OTP thất bại!');
            },
        );
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                {/* Left */}
                <div className={styles.left}>
                    <div className={styles.leftContent}>
                        <h2>Chào mừng đến với cộng đồng lớn nhất của chúng tôi</h2>
                        <p>Hãy cùng học điều gì đó mới hôm nay!</p>
                        <img src="/images/element/02.svg" alt="Illustration" className={styles.illustration} />
                        <div className={styles.students}>
                            <img src="/images/avatar/01.jpg" alt="avatar" className={styles.avatar} />
                            <img src="/images/avatar/02.jpg" alt="avatar" className={styles.avatar} />
                            <img src="/images/avatar/03.jpg" alt="avatar" className={styles.avatar} />
                            <img src="/images/avatar/04.jpg" alt="avatar" className={styles.avatar} />
                            <p>Hơn 4 nghìn học viên đã tham gia, giờ là lượt của bạn.</p>
                        </div>
                    </div>
                </div>

                {/* Right */}
                <div className={styles.right}>
                    <div className={styles.formBox}>
                        <img src="/images/element/03.svg" className={styles.waveIcon} alt="icon" />

                        {step === 'register' ? (
                            <>
                                <div className={styles.formHeader}>
                                    <h2>Đăng ký tài khoản của bạn!</h2>
                                    <p>Rất vui được gặp bạn! Vui lòng đăng ký tài khoản.</p>
                                </div>

                                <Form 
                                    layout="vertical" 
                                    form={form} 
                                    onFinish={onRegisterFinish}
                                    requiredMark={false}
                                >
                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item 
                                                name="fullName" 
                                                label="Họ và tên" 
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập họ và tên' },
                                                    { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
                                                ]}
                                            >
                                                <Input 
                                                    size="large" 
                                                    prefix={<UserOutlined className={styles.inputIcon} />} 
                                                    placeholder="Nguyễn Văn A" 
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item 
                                                name="username" 
                                                label="Tên đăng nhập" 
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập tên đăng nhập' },
                                                    { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự' },
                                                ]}
                                            >
                                                <Input 
                                                    size="large" 
                                                    prefix={<UserOutlined className={styles.inputIcon} />} 
                                                    placeholder="nguyenvana" 
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item 
                                                name="email" 
                                                label="Địa chỉ email" 
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập email' },
                                                    { type: 'email', message: 'Vui lòng nhập email hợp lệ' },
                                                ]}
                                            >
                                                <Input 
                                                    size="large" 
                                                    prefix={<MailOutlined className={styles.inputIcon} />} 
                                                    placeholder="example@email.com" 
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item 
                                                name="phone" 
                                                label="Số điện thoại" 
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                                                    { pattern: /^[0-9]{10,11}$/, message: 'Vui lòng nhập số điện thoại hợp lệ' },
                                                ]}
                                            >
                                                <Input 
                                                    size="large" 
                                                    prefix={<PhoneOutlined className={styles.inputIcon} />} 
                                                    placeholder="0987654321" 
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item 
                                                name="birthday" 
                                                label="Ngày sinh" 
                                                rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}
                                            >
                                                <DatePicker
                                                    size="large"
                                                    style={{ width: '100%' }}
                                                    format="DD/MM/YYYY"
                                                    placeholder="Chọn ngày sinh"
                                                    disabledDate={(current) => current && current > dayjs().endOf('day')}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item 
                                                name="password" 
                                                label="Mật khẩu" 
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập mật khẩu' },
                                                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                                                ]}
                                            >
                                                <Input.Password 
                                                    size="large" 
                                                    prefix={<LockOutlined className={styles.inputIcon} />} 
                                                    placeholder="Nhập mật khẩu" 
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item
                                        name="confirmPassword"
                                        label="Xác nhận mật khẩu"
                                        dependencies={['password']}
                                        rules={[
                                            { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (!value || getFieldValue('password') === value) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error('Mật khẩu không khớp!'));
                                                },
                                            }),
                                        ]}
                                    >
                                        <Input.Password 
                                            size="large" 
                                            prefix={<LockOutlined className={styles.inputIcon} />} 
                                            placeholder="Xác nhận mật khẩu" 
                                        />
                                    </Form.Item>

                                    <Form.Item className={styles.submitButton}>
                                        <Button 
                                            type="primary" 
                                            htmlType="submit" 
                                            size="large" 
                                            block 
                                            loading={registering}
                                        >
                                            Tạo tài khoản
                                        </Button>
                                    </Form.Item>
                                </Form>

                                <div className={styles.divider}>
                                    <span>Hoặc tiếp tục với</span>
                                </div>

                                <div className={styles.socialButtons}>
                                    <Button 
                                        icon={<GoogleOutlined />} 
                                        size="large"
                                        block 
                                        className={styles.google}
                                    >
                                        Google
                                    </Button>
                                    <Button 
                                        icon={<FacebookFilled />} 
                                        size="large"
                                        block 
                                        className={styles.facebook}
                                    >
                                        Facebook
                                    </Button>
                                </div>

                                <div className={styles.signInRedirect}>
                                    Đã có tài khoản? <a href="/login">Đăng nhập tại đây</a>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={styles.formHeader}>
                                    <h2>Xác thực email của bạn</h2>
                                    <p>Chúng tôi đã gửi mã xác thực đến</p>
                                    <strong className={styles.emailDisplay}>{email}</strong>
                                </div>

                                <Form 
                                    form={otpForm} 
                                    onFinish={onOtpFinish} 
                                    layout="vertical"
                                    requiredMark={false}
                                >
                                    <Form.Item
                                        name="otp"
                                        label="Mã xác thực"
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập mã xác thực' },
                                            { len: 6, message: 'Mã OTP phải có 6 chữ số' },
                                        ]}
                                    >
                                        <Input 
                                            size="large"
                                            placeholder="Nhập mã 6 chữ số" 
                                            maxLength={6}                                            
                                        />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button 
                                            type="primary" 
                                            htmlType="submit" 
                                            size="large"
                                            block 
                                            loading={verifying}
                                        >
                                            Xác thực email
                                        </Button>
                                    </Form.Item>

                                    <div className={styles.resendSection}>
                                        Không nhận được mã? <a href="#" onClick={(e) => e.preventDefault()}>Gửi lại</a>
                                    </div>
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