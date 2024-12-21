// isVerified.js


import axios from 'axios';

const isVerified = async () => {
    try {
        const token = localStorage.getItem('id_token');

        if (!token) {
            console.error("No token found");
            return false;
        }

        const { data: response } = await axios.get(`/api/artist/verified-status`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return response.confirmed === true;
    } catch (err) {
        console.error("Error checking verification status:", err);
        return false;
    }
};

export default isVerified;
