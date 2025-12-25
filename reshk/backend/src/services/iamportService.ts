import axios from 'axios';

const PORTONE_API_URL = 'https://api.iamport.kr';
const API_KEY = process.env.PORTONE_API_KEY || '';
const API_SECRET = process.env.PORTONE_API_SECRET || '';

export class IamportService {
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    /**
     * Access Token 발급
     * 토큰이 없거나 만료된 경우에만 새로 발급
     */
    async getAccessToken(): Promise<string> {
        const now = Date.now();
        // 토큰이 유효하면 재사용
        if (this.accessToken && this.tokenExpiry > now) {
            return this.accessToken;
        }
        try {
            const response = await axios.post(`${PORTONE_API_URL}/users/getToken`, {
                imp_key: API_KEY,
                imp_secret: API_SECRET,
            });
            if (response.data.code !== 0) {
                throw new Error(response.data.message || 'Failed to get access token');
            }
            // 토큰은 30분 유효, 25분 후 재발급
            this.accessToken = response.data.response.access_token as string;
            this.tokenExpiry = now + 25 * 60 * 1000;
            return this.accessToken;
        } catch (error: any) {
            console.error('Get access token error:', error.response?.data || error.message);
            throw new Error('Failed to get access token from PortOne');
        }
    }

    /**
     * 결제 정보 조회
     */
    async getPayment(imp_uid: string) {
        try {
            const token = await this.getAccessToken();
            const response = await axios.get(`${PORTONE_API_URL}/payments/${imp_uid}`, {
                headers: { Authorization: token },
            });
            if (response.data.code !== 0) {
                throw new Error(response.data.message || 'Failed to get payment');
            }
            return response.data.response;
        } catch (error: any) {
            console.error('Get payment error:', error.response?.data || error.message);
            throw new Error('Failed to get payment information');
        }
    }

    /**
     * 결제 취소 (환불)
     * @param imp_uid - PortOne 결제 고유번호
     * @param amount - 환불 금액 (부분 환불 시 지정, 전액 환불 시 생략)
     * @param reason - 환불 사유
     */
    async cancelPayment(imp_uid: string, amount?: number, reason?: string) {
        try {
            const token = await this.getAccessToken();
            const requestData: any = {
                imp_uid,
                reason: reason || '사용자 요청',
            };
            // 부분 환불인 경우 금액 지정
            if (amount) {
                requestData.amount = amount;
            }
            const response = await axios.post(`${PORTONE_API_URL}/payments/cancel`, requestData, {
                headers: { Authorization: token },
            });
            if (response.data.code !== 0) {
                throw new Error(response.data.message || 'Failed to cancel payment');
            }
            return response.data.response;
        } catch (error: any) {
            console.error('Cancel payment error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to cancel payment');
        }
    }

    /**
     * 결제 금액 검증
     */
    async verifyPaymentAmount(imp_uid: string, expectedAmount: number): Promise<boolean> {
        const payment = await this.getPayment(imp_uid);
        return payment.amount === expectedAmount && payment.status === 'paid';
    }
}

export default new IamportService();
