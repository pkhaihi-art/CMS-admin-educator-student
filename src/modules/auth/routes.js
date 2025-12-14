import RegisterPage from "@modules/auth/register";
import LoginPage from "@modules/auth/login";
import ForgotPasswordPage from "./forget";

export default {
    registerPage: {
        path: '/register',
        title: 'Register',
        auth: false,
        component: RegisterPage,
    },
    loginPage: {
        path: '/login',
        component: LoginPage,
        auth: false,
        title: 'Login page',
    },
    FogetPage: {
        path: '/forgot-password',
        component: ForgotPasswordPage,
        auth: false,
        title: 'Forgot Password',
    },
};
