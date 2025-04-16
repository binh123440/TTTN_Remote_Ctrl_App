import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8000', // Thay đổi nếu backend chạy port khác
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
});

export default axiosClient;
