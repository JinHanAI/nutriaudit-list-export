const MAX_INPUT = 1_000_000_000;
const MAX_RESULT = 1_000_000_000_000;
const massFactors = { mcg: 1, mg: 1000, g: 1_000_000 };
export function readDecimal(value, allowZero = false) {
    const text = value.trim();
    if (!/^\d{1,10}(?:\.\d{1,12})?$/.test(text))
        return null;
    const number = Number(text);
    return Number.isFinite(number) && number <= MAX_INPUT && (allowZero ? number >= 0 : number > 0)
        ? number : null;
}
export function normalizeMassUnit(unit) {
    const normalized = unit.trim().toLowerCase().replace(/[μµ]/g, 'u');
    if (normalized === 'ug' || normalized === 'mcg')
        return 'mcg';
    return normalized === 'mg' || normalized === 'g' ? normalized : null;
}
function bounded(value) {
    return Number.isFinite(value) && value >= 0 && value <= MAX_RESULT
        ? { value: Number(value.toPrecision(12)), error: null }
        : { value: null, error: '结果超出可计算范围，请核对输入。' };
}
export function convertMass(amount, from, to) {
    const number = readDecimal(amount, true);
    const source = normalizeMassUnit(from);
    const target = normalizeMassUnit(to);
    if (number === null)
        return { value: null, error: '请填写有效的非负数字。' };
    if (!source || !target)
        return { value: null, error: '只支持 mcg、mg、g；IU、%DV 和体积不能通用换算。' };
    return bounded(number * massFactors[source] / massFactors[target]);
}
/** Daily units and label units per serving are explicit; never assume one capsule is one serving. */
export function calculateDailyAmount(amount, servingSize, dailyUnits) {
    const perServing = readDecimal(amount, true);
    const unitsPerServing = readDecimal(servingSize);
    const unitsPerDay = readDecimal(dailyUnits);
    if (perServing === null || unitsPerServing === null || unitsPerDay === null) {
        return { value: null, error: '请填写每份含量、每份粒数和每日实际粒数；空值与无效值不能按 0 计算。' };
    }
    return bounded(perServing * (unitsPerDay / unitsPerServing));
}
export const VERIFIED_LABEL_NAMES = [
    { canonical: 'calcium', label: '钙', names: ['calcium', '钙'], source: 'https://ods.od.nih.gov/factsheets/Calcium-Consumer/' },
    { canonical: 'vitamin c', label: '维生素 C', names: ['vitamin c', '维生素c', '维生素 c'], source: 'https://ods.od.nih.gov/factsheets/VitaminC-Consumer/' },
    { canonical: 'vitamin d2', label: '维生素 D2', names: ['vitamin d2', 'ergocalciferol', '维生素d2', '维生素 d2'], source: 'https://ods.od.nih.gov/factsheets/VitaminD-Consumer/' },
    { canonical: 'vitamin d3', label: '维生素 D3', names: ['vitamin d3', 'cholecalciferol', '维生素d3', '维生素 d3'], source: 'https://ods.od.nih.gov/factsheets/VitaminD-Consumer/' },
];
const cleanName = (value) => value.trim().toLowerCase().replace(/\s+/g, ' ');
export function lookupLabelName(name) {
    const normalized = cleanName(name);
    return VERIFIED_LABEL_NAMES.find(entry => entry.names.some(alias => cleanName(alias) === normalized)) ?? null;
}
/** Unverified names are compared literally, never silently mapped to a nutrient or a salt. */
export function summarizeLabels(products) {
    const groups = new Map();
    for (const product of products) {
        for (const item of product.ingredients) {
            if (!item.name.trim())
                continue;
            const known = lookupLabelName(item.name);
            const key = known?.canonical ?? `raw:${cleanName(item.name)}`;
            const group = groups.get(key) ?? { name: known?.label ?? item.name.trim(), known: Boolean(known), entries: [] };
            group.entries.push({ product, item });
            groups.set(key, group);
        }
    }
    return [...groups.entries()].map(([key, group]) => {
        let total = 0;
        let issue = group.known ? null : '未核实名称：仅比较相同原文，不自动汇总或判断安全。';
        for (const { product, item } of group.entries) {
            const daily = calculateDailyAmount(item.amount, product.servingSize, product.dailyUnits);
            if (daily.value === null) {
                issue = daily.error;
                break;
            }
            const mass = normalizeMassUnit(item.unit);
            if (!mass) {
                issue = '存在 IU 或未知单位，不能合并为质量总量。';
                break;
            }
            total += daily.value * massFactors[mass] / massFactors.mg;
        }
        const checked = bounded(total);
        if (checked.error)
            issue = checked.error;
        return {
            key, label: group.name, verified: group.known,
            productIds: [...new Set(group.entries.map(entry => entry.product.id))],
            sourceNames: [...new Set(group.entries.map(entry => entry.product.name || '未命名产品'))],
            totalMg: issue ? null : checked.value, issue,
        };
    });
}
export function findProductOverlaps(products) {
    return summarizeLabels(products).filter(row => row.productIds.length > 1);
}
export function compareLabels(a, b) {
    const left = new Map(summarizeLabels([a]).map(row => [row.key, row]));
    const right = new Map(summarizeLabels([b]).map(row => [row.key, row]));
    return [...new Set([...left.keys(), ...right.keys()])].map(key => {
        const aRow = left.get(key);
        const bRow = right.get(key);
        const aMg = aRow?.totalMg ?? null;
        const bMg = bRow?.totalMg ?? null;
        return {
            key, label: (aRow ?? bRow).label,
            status: aRow && bRow ? 'both' : aRow ? 'only_a' : 'only_b',
            aMg, bMg,
            changeMg: aRow && bRow && aMg !== null && bMg !== null ? Number((bMg - aMg).toPrecision(12)) : null,
            issue: aRow?.issue ?? bRow?.issue ?? null,
        };
    });
}
export function calculateBottleCost(servings, dailyServings, price) {
    const count = readDecimal(servings);
    const daily = readDecimal(dailyServings);
    const cost = price.trim() ? readDecimal(price, true) : null;
    if (count === null || daily === null || (price.trim() && cost === null)) {
        return { days: null, costPerDay: null, error: '总份数和每日份数须大于 0，价格须为有效非负数字或留空。' };
    }
    const days = bounded(count / daily);
    const costPerDay = cost === null ? { value: null, error: null } : bounded(cost * daily / count);
    return { days: days.value, costPerDay: costPerDay.value, error: days.error ?? costPerDay.error };
}
/** CSV cells starting with formula characters are neutralized for spreadsheet import. */
export function safeCsvCell(value) {
    const safe = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
    return `"${safe.replace(/"/g, '""')}"`;
}
export function exportInventoryCsv(products, language = 'zh') {
    const rows = [language === 'en' ? ['Product', 'Units per serving', 'Units per day', 'Ingredient', 'Amount per serving', 'Unit', 'Notes'] : ['产品', '每份粒数', '每日粒数', '成分', '每份含量', '单位', '备注']];
    for (const product of products) {
        for (const item of product.ingredients.length ? product.ingredients : [{ name: '', amount: '', unit: '' }]) {
            rows.push([product.name, product.servingSize, product.dailyUnits, item.name, item.amount, item.unit, product.notes ?? '']);
        }
    }
    return '\uFEFF' + rows.map(row => row.map(safeCsvCell).join(',')).join('\r\n');
}
export function labelToolEvent(tool, mode, stage) {
    return { tool: `label-${tool}`, checkMode: mode === 'own' ? 'manual' : 'source_example', stage, draft_version: 1 };
}
