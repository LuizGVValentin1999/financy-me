export function extractReceiptUrlFromQrPayload(payload: string) {
    const normalizedPayload = payload.trim();

    if (!normalizedPayload) {
        return '';
    }

    const matchedUrl = normalizedPayload.match(/https?:\/\/[^\s]+/i);

    return matchedUrl ? matchedUrl[0] : '';
}
