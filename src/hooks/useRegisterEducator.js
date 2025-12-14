import useFetch from './useFetch';
import apiConfig from '@constants/apiConfig';
import { message } from 'antd';

const useRegisterEducator = () => {
    const { loading, execute } = useFetch(apiConfig.educator.register, {
        immediate: false,
    });

    const register = async (payload, onSuccess, onError) => {
        await execute({
            method: 'POST',
            data: payload,
            onCompleted: (res) => {
                if (res?.result === true) {
                    message.success(res.message || 'Đăng ký thành công');
                    onSuccess?.(res);
                } else {
                    message.error(res.message || 'Đăng ký thất bại');
                    onError?.(res);
                }
            },
            onError: (err) => {
                message.error(err?.message || 'Lỗi không xác định');
                onError?.(err);
            },
        });
    };

    return {
        register,
        loading,
    };
};

export default useRegisterEducator;
