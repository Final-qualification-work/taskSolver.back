
function clampBusinessPriority(value) {
    const p = Math.round(Number(value));
    if (!Number.isFinite(p)) return 2;
    return Math.min(3, Math.max(1, p));
}

function withClampedBusinessPriority(body) {
    if (!body || body.business_priority === undefined) {
        return body;
    }
    return { ...body, business_priority: clampBusinessPriority(body.business_priority) };
}

module.exports = { clampBusinessPriority, withClampedBusinessPriority };
