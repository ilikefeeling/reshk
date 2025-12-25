import vision from '@google-cloud/vision';
import path from 'path';

// Google Vision Client 초기화
// GOOGLE_APPLICATION_CREDENTIALS 환경 변수가 설정되어 있어야 합니다.
const client = new vision.ImageAnnotatorClient();

/**
 * URL이 로컬 서버를 가리키는 경우 로컬 파일 경로로 변환합니다.
 */
const resolveToLocalPath = (imagePath: string): string => {
    if (imagePath.includes('/uploads/')) {
        const filename = imagePath.split('/uploads/').pop();
        if (filename) {
            return path.join(process.cwd(), 'uploads', filename);
        }
    }
    return imagePath;
};

/**
 * 두 이미지 간의 시각적 유사성을 분석합니다.
 * @param imagePath1 첫 번째 이미지 경로 또는 URL
 * @param imagePath2 두 번째 이미지 경로 또는 URL
 * @returns 0에서 1 사이의 유사도 점수
 */
export const analyzeImageSimilarity = async (imagePath1: string, imagePath2: string): Promise<number> => {
    try {
        const localPath1 = resolveToLocalPath(imagePath1);
        const localPath2 = resolveToLocalPath(imagePath2);

        // 1. 이미지 주석 요청 생성
        const [result1] = await client.labelDetection(localPath1);
        const [result2] = await client.labelDetection(localPath2);

        const labels1 = result1.labelAnnotations || [];
        const labels2 = result2.labelAnnotations || [];

        if (labels1.length === 0 || labels2.length === 0) return 0.5; // 정보 부족 시 기본값

        // 2. 라벨 기반 유사도 계산 (공통 라벨 및 가중치 계산)
        const labelMap1 = new Map(labels1.map(l => [l.description?.toLowerCase(), l.score]));

        let intersectionScore = 0;
        let unionScore = 0;

        // Jaccard 유사도 변형 (Score 가중치 적용)
        const allLabelDescriptions = new Set([
            ...labels1.map(l => l.description?.toLowerCase()),
            ...labels2.map(l => l.description?.toLowerCase())
        ]);

        for (const desc of allLabelDescriptions) {
            if (!desc) continue;

            const score1 = labelMap1.get(desc) || 0;
            const label2 = labels2.find(l => l.description?.toLowerCase() === desc);
            const score2 = label2 ? (label2.score || 0) : 0;

            intersectionScore += Math.min(score1, score2);
            unionScore += Math.max(score1, score2);
        }

        const similarity = unionScore > 0 ? (intersectionScore / unionScore) : 0;

        // 추가: 물체 감지(Object Localization) 등으로 보강 가능하지만 우선 Label 기반으로 구현
        console.log(`AI Similarity calculated: ${similarity} between ${imagePath1} and ${imagePath2}`);

        return Math.min(1, Math.max(0, similarity));
    } catch (error) {
        console.error('AI Image Analysis error:', error);
        return 0.5; // 오류 발생 시 기본값 반환 (관리자 검토 유도)
    }
};
