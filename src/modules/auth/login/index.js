import React, { useState } from 'react';
import { Form, Button, Checkbox, Input, message as antMessage, Segmented } from 'antd';
import {
    LockOutlined,
    MailOutlined,
    UserOutlined,
    GoogleOutlined,
    FacebookFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import apiConfig from '@constants/apiConfig';
import { setCacheAccessToken } from '@services/userService';
import { Buffer } from 'buffer';
import useFetch from '@hooks/useFetch';
import useFetchAction from '@hooks/useFetchAction';
import { accountActions } from '@store/actions';
import { setData } from '@utils/localStorage';
import { storageKeys, appAccount, UserTypes } from '@constants';
import styles from './index.module.scss';

window.Buffer = window.Buffer || Buffer;

const LoginPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [userType, setUserType] = useState(UserTypes.STUDENT);

    const base64Credentials = Buffer.from(`${appAccount.APP_USERNAME}:${appAccount.APP_PASSWORD}`).toString('base64');

    const loginOptions = {
        ...apiConfig.account.loginBasic,
        authorization: `Basic ${base64Credentials}`,
    };

    const { execute: loginEducator, loading: loadingEducator } = useFetch(loginOptions);
    const { execute: loginStudent, loading: loadingStudent } = useFetch(loginOptions);
    const { execute: loginAdmin, loading: loadingAdmin } = useFetch(loginOptions);
    const { execute: fetchEducatorProfile } = useFetch(apiConfig.educator.profile);
    const { execute: fetchStudentProfile } = useFetch(apiConfig.student.profile);
    const { execute: fetchProfile } = useFetchAction(accountActions.getProfile, {
        loading: useFetchAction.LOADING_TYPE.APP,
    });

    const loading = loadingEducator || loadingStudent || loadingAdmin;

    const onFinish = (values) => {
        const educatorPayload = {
            email: values.email,
            password: values.password,
            grant_type: 'educator',
        };

        const studentPayload = {
            email: values.email,
            password: values.password,
            grant_type: 'student',
        };

        const adminPayload = {
            username: values.username,
            password: values.password,
            grant_type: 'password',
        };

        const handleLoginSuccess = (res) => {
            setCacheAccessToken(res.access_token);
            setData(storageKeys.USER_KIND, res.user_kind);
            
            // Lưu userType vào localStorage
            setData(storageKeys.USER_TYPE, userType);
            
            // Dispatch action để lưu userType vào Redux store
            dispatch(accountActions.setUserType(userType));

            if (userType === UserTypes.EDUCATOR) {
                fetchEducatorProfile({
                    onCompleted: () => {
                        antMessage.success('Login successful!');
                        navigate('/');
                    },
                    onError: () => {
                        antMessage.error('Failed to load educator profile!');
                    },
                });
            } else if (userType === UserTypes.STUDENT) {
                fetchStudentProfile({
                    onCompleted: () => {
                        antMessage.success('Login successful!');
                        navigate('/');
                    },
                    onError: () => {
                        antMessage.error('Failed to load student profile!');
                    },
                });
            } else {
                fetchProfile({
                    onCompleted: () => {
                        antMessage.success('Login successful!');
                        navigate('/');
                    },
                    onError: () => {
                        antMessage.error('Failed to load admin profile!');
                    },
                });
            }
        };

        if (userType === UserTypes.EDUCATOR) {
            loginEducator({
                data: educatorPayload,
                onCompleted: handleLoginSuccess,
                onError: () => {
                    antMessage.error('Educator login failed!');
                },
            });
        } else if (userType === UserTypes.STUDENT) {
            loginStudent({
                data: studentPayload,
                onCompleted: handleLoginSuccess,
                onError: () => {
                    antMessage.error('Student login failed!');
                },
            });
        } else {
            loginAdmin({
                data: adminPayload,
                onCompleted: handleLoginSuccess,
                onError: () => {
                    antMessage.error('Admin login failed!');
                },
            });
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <div className={styles.left}>
                    <div className={styles.leftContent}>
                        <h2>Welcome to our largest community</h2>
                        <p>Let`s learn something new today!</p>
                        <img src="/images/element/02.svg" alt="Illustration" className={styles.illustration}/>
                        <div className={styles.students}>
                            <div className={styles.avatars}>
                                <img src="/images/avatar/01.jpg" alt="avatar 1" className={styles.avatar}/>
                                <img src="/images/avatar/02.jpg" alt="avatar 2" className={styles.avatar}/>
                                <img src="/images/avatar/03.jpg" alt="avatar 3" className={styles.avatar}/>
                                <img src="/images/avatar/04.jpg" alt="avatar 4" className={styles.avatar}/>
                            </div>
                            <p>4k+ Students joined us, now it`s your turn.</p>
                        </div>
                    </div>
                </div>

                <div className={styles.right}>
                    <div className={styles.formBox}>
                        <div className={styles.wave}>👋</div>
                        <h2>Login into ITDream!</h2>
                        <p>Nice to see you! Please log in with your account.</p>

                        <Segmented
                            options={[
                                { label: 'Student', value: UserTypes.STUDENT },
                                { label: 'Educator', value: UserTypes.EDUCATOR },
                                { label: 'Admin', value: UserTypes.ADMIN },
                            ]}
                            value={userType}
                            onChange={setUserType}
                            style={{ marginBottom: 24 }}
                        />

                        <Form layout="vertical" onFinish={onFinish}>
                            {userType === UserTypes.ADMIN ? (
                                <Form.Item
                                    name="username"
                                    label="Username *"
                                    rules={[{ required: true, message: 'Please input your username!' }]}
                                >
                                    <Input size="large" prefix={<UserOutlined />} placeholder="Username" />
                                </Form.Item>
                            ) : (
                                <Form.Item
                                    name="email"
                                    label="Email address *"
                                    rules={[{ required: true, message: 'Please input your email!' }]}
                                >
                                    <Input size="large" prefix={<MailOutlined />} placeholder="E-mail" />
                                </Form.Item>
                            )}

                            <Form.Item
                                name="password"
                                label="Password *"
                                rules={[{ required: true, message: 'Please input your password!' }]}
                                extra="Your password must be 8 characters at least"
                            >
                                <Input.Password
                                    size="large"
                                    prefix={<LockOutlined />}
                                    placeholder="Password"
                                />
                            </Form.Item>

                            <div className={styles.row}>
                                <span>Forgot password?</span>
                                <a href="/forgot-password" className={styles.forgotLink}>
                                    Click here to reset password
                                </a>
                            </div>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                                    Login
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
                                Login with Google
                            </Button>
                            <Button icon={<FacebookFilled />} block className={styles.facebook}>
                                Login with Facebook
                            </Button>
                        </div>

                        <div className={styles.signUpRedirect}>
                            Don`t have an account? <a href="/register">Signup here</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;