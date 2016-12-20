/**
 * Created by yuricus on 20.12.16.
 */
export function computeMinMax(nodes, accessFn) {
    //this is not efficient for compute time
    const mn = _.minBy(nodes, accessFn);
    const mx = _.maxBy(nodes, accessFn);
    return {mn: accessFn(mn), mx: accessFn(mx)};
}

/**
 * Normalized value from min and max to
 * @param value
 * @returns {number}
 */
export function normalizeCoeff(value, mn, mx, limit) {
    return (value - mn) * mn/mx * (limit - 1) + 20;
}