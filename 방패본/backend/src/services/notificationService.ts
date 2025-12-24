import axios from 'axios';
import prisma from '../utils/prisma';

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

    /**
     * 특정 영역(Geofencing) 사용자들에게 알림 발송
     * @param lat 위도
     * @param lng 경도
     * @param radiusKm 반경 (km)
     * @param title 제목
     * @param body 내용
     * @param data 전달 데이터
     */
    async sendNearbyNotification(
        lat: number,
        lng: number,
        radiusKm: number,
        title: string,
        body: string,
        data?: any
    ): Promise<void> {
        try {
            // 1. 반경 내에 있는 사용자들을 찾으려면? 
            // 실제 구현에서는 사용자들의 '현재 위치' 테이블이 있거나 가장 최근 요청/습득물 기반으로 필터링
            // 여기서는 시뮬레이션을 위해 "IdentityStatus가 VERIFIED인 사용자들 중 푸시 토큰이 있는 사람"에게 보냄
            // (실제 프로덕션에서는 PostGIS나 Haversine 수식을 Prisma raw query로 사용하여 위치 기반 필터링 권장)
            const recipients = await prisma.user.findMany({
                where: {
                    pushToken: { not: null },
                    identityStatus: 'VERIFIED'
                },
                select: { pushToken: true }
            });

            if (recipients.length === 0) return;

            const messages: PushMessage[] = recipients.map(r => ({
                to: r.pushToken!,
                title: `[내 주변 습득 도움 요청] ${title}`,
                body,
                data,
                sound: 'default'
            }));

            await this.sendMultiplePushNotifications(messages);
            console.log(`Sent nearby notification to ${recipients.length} users`);
        } catch (error) {
            console.error('Nearby notification failed:', error);
        }
    }
}

export default new NotificationService();
