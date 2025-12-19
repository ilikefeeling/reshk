import axios from 'axios';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushMessage {
    to: string;  // Expo Push Token
    title: string;
    body: string;
    data?: any;
    sound?: 'default' | null;
    badge?: number;
}

/**
 * Expo Push Notification Service
 */
export class NotificationService {
    /**
     * 단일 푸시 알림 발송
     */
    async sendPushNotification(
        pushToken: string,
        title: string,
        body: string,
        data?: any
    ): Promise<boolean> {
        try {
            if (!pushToken || !pushToken.startsWith('ExponentPushToken')) {
                console.warn('Invalid push token:', pushToken);
                return false;
            }

            const message: PushMessage = {
                to: pushToken,
                title,
                body,
                data,
                sound: 'default',
            };

            const response = await axios.post(EXPO_PUSH_URL, message, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.data.data?.[0]?.status === 'error') {
                console.error('Push notification error:', response.data.data[0].message);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Send push notification failed:', error);
            return false;
        }
    }

    /**
     * 다중 푸시 알림 발송
     */
    async sendMultiplePushNotifications(messages: PushMessage[]): Promise<void> {
        try {
            await axios.post(EXPO_PUSH_URL, messages, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        } catch (error) {
            console.error('Send multiple push notifications failed:', error);
        }
    }

    /**
     * 새 채팅 메시지 알림
     */
    async notifyNewMessage(
        recipientPushToken: string,
        senderName: string,
        messageContent: string,
        chatRoomId: number
    ): Promise<void> {
        await this.sendPushNotification(
            recipientPushToken,
            `${senderName}님의 메시지`,
            messageContent,
            { type: 'chat', chatRoomId }
        );
    }

    /**
     * 요청 상태 변경 알림
     */
    async notifyRequestStatusChange(
        recipientPushToken: string,
        requestTitle: string,
        newStatus: string,
        requestId: number
    ): Promise<void> {
        const statusText = {
            'IN_PROGRESS': '수락되었습니다',
            'COMPLETED': '완료되었습니다',
            'CANCELED': '취소되었습니다',
        }[newStatus] || '변경되었습니다';

        await this.sendPushNotification(
            recipientPushToken,
            '요청 상태 변경',
            `"${requestTitle}" 요청이 ${statusText}`,
            { type: 'request', requestId, status: newStatus }
        );
    }

    /**
     * 결제 완료 알림
     */
    async notifyPaymentComplete(
        recipientPushToken: string,
        amount: number,
        type: string
    ): Promise<void> {
        const typeText = type === 'DEPOSIT' ? '보증금' : '리워드';

        await this.sendPushNotification(
            recipientPushToken,
            '결제 완료',
            `${typeText} ${amount.toLocaleString()}원 결제가 완료되었습니다`,
            { type: 'payment', paymentType: type }
        );
    }
}

export default new NotificationService();
