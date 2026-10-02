import { calculateBottleCost, calculateDailyAmount, compareLabels, convertMass, findProductOverlaps, lookupLabelName, summarizeLabels, } from './label-tools.mjs';
export const isLabelsTask = (task) => ['duplicate', 'daily-total', 'compare', 'inventory'].includes(task);
export const chooseLabelText = (language, zh, en) => language === 'en' ? en : zh;
export const LABEL_TASKS = [
    { id: 'duplicate', zh: '重复成分', en: 'Ingredient overlap', descriptionZh: '看看两款或多款产品是否含有相同的已识别成分。', descriptionEn: 'Find recognized or identical ingredient names across two or more product labels.' },
    { id: 'daily-total', zh: '每日总量', en: 'Daily label totals', descriptionZh: '按标签每份粒数和实际每日粒数，汇总已输入的补充剂含量。', descriptionEn: 'Total recognized label amounts using units per serving and actual units used per day.' },
    { id: 'compare', zh: '标签对比', en: 'Compare two labels', descriptionZh: '比较两款产品，了解成分重合及按实际使用量计算的含量差异。', descriptionEn: 'Compare two entered labels and known daily amounts. Missing entries remain unknown.' },
    { id: 'daily-dose', zh: '份数换算', en: 'Serving conversion', descriptionZh: '把标签每份含量换成你实际使用量对应的每日含量。', descriptionEn: 'Convert a label amount per serving to the amount corresponding to your actual daily units.' },
    { id: 'units', zh: '单位换算', en: 'Mass conversion', descriptionZh: '统一 mcg、mg、g；不换算 IU、%DV 或体积。', descriptionEn: 'Convert mcg, mg and g. No universal IU, %DV or volume conversion.' },
    { id: 'aliases', zh: '名称查询', en: 'Label name lookup', descriptionZh: '查看已核实的少量中英文标签名称；不猜测化学形式和元素含量。', descriptionEn: 'Look up four sourced name groups. Chemical forms and elemental amounts are not inferred.' },
    { id: 'inventory', zh: '清单导出', en: 'Export a label list', descriptionZh: '整理自己的产品和标签，下载 CSV 或打印；关闭页面后不保留。', descriptionEn: 'Organize entered labels and notes, then download a CSV or print. No cloud storage.' },
    { id: 'cost', zh: '使用天数与成本', en: 'Bottle days and cost', descriptionZh: '根据瓶内总份数、每日份数和价格计算，帮助记录购买信息。', descriptionEn: 'Calculate bottle duration and daily cost from servings and price. No usage recommendation.' },
];
const ISSUES = {
    '结果超出可计算范围，请核对输入。': 'The result exceeds the calculation range. Check your inputs.',
    '请填写有效的非负数字。': 'Enter a valid non-negative decimal number.',
    '只支持 mcg、mg、g；IU、%DV 和体积不能通用换算。': 'Only mcg, mg and g are supported. IU, %DV and volume cannot be universally converted.',
    '请填写每份含量、每份粒数和每日实际粒数；空值与无效值不能按 0 计算。': 'Enter the amount per serving, units per serving and actual units per day. Missing or invalid values are not zero.',
    '未核实名称：仅比较相同原文，不自动汇总或判断安全。': 'Unverified name: identical text can be compared, but amounts are not totaled or judged safe.',
    '存在 IU 或未知单位，不能合并为质量总量。': 'An IU or unknown unit prevents a mass total.',
    '总份数和每日份数须大于 0，价格须为有效非负数字或留空。': 'Bottle and daily servings must be positive; price must be a valid non-negative number or blank.',
};
export const translateLabelIssue = (issue, language) => issue && language === 'en' ? ISSUES[issue] ?? 'Unable to calculate this entry. Check the label and units.' : issue;
export function labelExample(language) {
    return [
        { id: 'a', name: chooseLabelText(language, '复合维生素（示例）', 'Multivitamin (example)'), servingSize: '2', dailyUnits: '2', ingredients: [{ name: 'calcium', amount: '200', unit: 'mg' }, { name: 'vitamin c', amount: '100', unit: 'mg' }] },
        { id: 'b', name: chooseLabelText(language, '钙补充剂（示例）', 'Calcium supplement (example)'), servingSize: '1', dailyUnits: '1', ingredients: [{ name: 'calcium', amount: '0.5', unit: 'g' }] },
    ];
}
/** Shared by the commercial preview and isolated browser demo; no network or storage. */
export function evaluateLabelTask(input, language = 'zh') {
    const t = (zh, en) => chooseLabelText(language, zh, en);
    const failed = (zh, en) => ({ heading: '', lines: [], useful: false, error: t(zh, en) });
    const calculatedError = (error) => ({ heading: '', lines: [], useful: false, error: translateLabelIssue(error, language) ?? t('输入无法计算。', 'Unable to calculate these inputs.') });
    const name = (key, label) => language === 'en' && !key.startsWith('raw:') ? key : label;
    const populated = input.products.filter(product => product.name.trim() || product.ingredients.some(item => item.name.trim() || item.amount.trim()));
    if (isLabelsTask(input.task)) {
        if (!populated.length)
            return failed('请先填写自己的产品，或选择“载入示例”。', 'Enter your products or load the labeled example.');
        if (input.task === 'inventory' && populated.some(product => !product.name.trim()))
            return failed('导出清单前请补齐每款产品名称。', 'Enter a name for every product before exporting.');
        if (input.task !== 'inventory' && populated.some(product => !product.name.trim() || !product.ingredients.some(item => item.name.trim())))
            return failed('每款产品请填写名称和至少一个标签成分。', 'Enter a product name and at least one label ingredient for every product.');
        if (populated.some(product => product.ingredients.some(item => !item.name.trim() && item.amount.trim())))
            return failed('有含量但未填写成分名称，请先补齐名称。', 'An amount is entered without an ingredient name. Add its name first.');
        if (input.task === 'duplicate' && populated.length < 2)
            return failed('重复检查需要至少两款产品。', 'Overlap checking requires at least two products.');
        if (input.task === 'compare' && populated.length !== 2)
            return failed('标签对比需要恰好两款产品；请移除其他产品后再比较。', 'Compare exactly two products. Remove additional products first.');
    }
    let heading = '';
    let lines = [];
    let useful = true;
    if (input.task === 'duplicate') {
        const rows = findProductOverlaps(populated);
        heading = t(`找到 ${rows.length} 个跨产品名称重合`, `Found ${rows.length} overlapping names across products`);
        lines = rows.length ? rows.map(row => `${name(row.key, row.label)}: ${row.sourceNames.join(', ')}. ${row.verified ? t('已识别标签名称；是否适合需要进一步核对。', 'Recognized label name; personal suitability still needs review.') : t('仅原文相同，名称尚未核实。', 'Identical entered text only; the name is not verified.')}`) : [t('已输入的名称没有跨产品重合；未识别内容和未输入产品仍需核对。', 'No entered names overlap across products. Unrecognized and missing entries still need review.')];
    }
    else if (input.task === 'daily-total') {
        const rows = summarizeLabels(populated);
        useful = rows.some(row => row.totalMg !== null);
        heading = t('已输入补充剂的每日含量', 'Daily amounts from entered supplement labels');
        lines = rows.map(row => `${name(row.key, row.label)}${t('：', ': ')}${row.totalMg === null ? t('无法汇总', 'Unable to total') : `${row.totalMg} mg/${t('日', 'day')}`}${t('。', '. ')}${translateLabelIssue(row.issue, language) ?? t('按已填写标签和实际粒数计算，不含饮食。', 'Based on entered labels and daily units; excludes diet.')}`);
    }
    else if (input.task === 'compare') {
        const rows = compareLabels(populated[0], populated[1]);
        useful = rows.some(row => row.aMg !== null || row.bMg !== null);
        heading = t('按已填写使用量比较', 'Comparison using entered daily units');
        const amount = (value) => value === null ? t('未知/未填写', 'Unknown/not entered') : `${value} mg/${t('日', 'day')}`;
        lines = rows.map(row => `${name(row.key, row.label)}: ${row.status === 'both' ? t('两款都有', 'Entered in both') : row.status === 'only_a' ? t('仅产品 A 填写', 'Entered only in A') : t('仅产品 B 填写', 'Entered only in B')}; A ${amount(row.aMg)}, B ${amount(row.bMg)}. ${row.changeMg === null ? translateLabelIssue(row.issue, language) ?? t('未填写不代表成分不存在。', 'Not entered does not mean absent.') : t(`B 比 A ${row.changeMg >= 0 ? '增加' : '减少'} ${Math.abs(row.changeMg)} mg/日。`, `B has ${Math.abs(row.changeMg)} mg/day ${row.changeMg >= 0 ? 'more' : 'less'} than A.`)}`);
    }
    else if (input.task === 'daily-dose') {
        const result = calculateDailyAmount(input.amount, input.servingSize, input.dailyUnits);
        if (result.value === null)
            return calculatedError(result.error);
        heading = t('按实际粒数换算', 'Conversion using actual daily units');
        lines = [`${input.amount} × (${input.dailyUnits} ÷ ${input.servingSize}) = ${result.value} ${input.fromUnit}/${t('日', 'day')}`, t('这是你输入的使用量对应的计算结果，不是推荐用量。', 'This corresponds to the usage you entered; it is not a recommended dose.')];
    }
    else if (input.task === 'units') {
        const result = convertMass(input.amount, input.fromUnit, input.toUnit);
        if (result.value === null)
            return calculatedError(result.error);
        heading = t('质量单位换算', 'Mass-unit conversion');
        lines = [`${input.amount} ${input.fromUnit} = ${result.value} ${input.toUnit}`];
    }
    else if (input.task === 'aliases') {
        if (!input.alias.trim())
            return failed('请输入想核对的成分名称。', 'Enter the ingredient name to look up.');
        const known = lookupLabelName(input.alias);
        useful = Boolean(known);
        heading = known ? t('已核实的标签名称', 'Sourced label name') : t('尚未识别', 'Not recognized');
        lines = known ? [language === 'en' ? known.canonical : `${known.label} / ${known.canonical}`, t(`此组包含：${known.names.join('、')}`, `Names in this group: ${known.names.join(', ')}`), t('这里只核对名称，不计算化学形式的等效剂量。', 'This checks names only, without calculating chemical-form equivalence.')] : [t('这个名称尚未收录，不能自动推断与其他名称等同。', 'This name is not included. Equivalence with another name is not inferred.')];
    }
    else if (input.task === 'cost') {
        const result = calculateBottleCost(input.bottleServings, input.dailyServings, input.price);
        if (result.error || result.days === null)
            return calculatedError(result.error);
        heading = t('预计使用天数与成本', 'Bottle duration and daily cost');
        lines = [t(`预计使用 ${result.days} 天`, `Estimated duration: ${result.days} days`), result.costPerDay === null ? t('价格未填写，每日成本未知。', 'Price not entered; daily cost is unknown.') : t(`每日约 ${result.costPerDay} ${input.currency}；仅作算术，不建议改变使用量。`, `About ${result.costPerDay} ${input.currency}/day. Arithmetic only; no suggestion to change usage.`)];
    }
    else {
        heading = t('清单已整理', 'Label list organized');
        lines = populated.map(product => t(`${product.name}；每份 ${product.servingSize || '未知'} 粒，每日 ${product.dailyUnits || '未知'} 粒；${product.ingredients.filter(item => item.name.trim()).length} 项标签成分。`, `${product.name}; ${product.servingSize || 'unknown'} units/serving, ${product.dailyUnits || 'unknown'} units/day; ${product.ingredients.filter(item => item.name.trim()).length} entered ingredients.`));
    }
    return { heading, lines, useful, error: null };
}
/** Shared result-to-core guidance, also used by the isolated browser demo. */
export function getLabelAuditCopy(task, language) {
    const t = (zh, en) => chooseLabelText(language, zh, en);
    const reasons = {
        duplicate: ['名称重合只是第一步。把实际使用的产品放在一起，再核对重复成分与叠加剂量。', 'Name overlap is one step. Review the products you actually use together for duplicates and combined doses.'],
        'daily-total': ['算出标签总量后，把其他正在使用的产品也加进来，继续核对整个组合。', 'After totaling entered labels, add your other actual products to review the full stack.'],
        compare: ['换产品前，先选实际准备使用的那款，再和其他补充剂一起核对；对比两款不代表同时服用。', 'Before switching, choose the product you intend to use and review it with your other supplements. Comparing two products does not mean taking both.'],
        'daily-dose': ['份数换算回答的是用量怎么算。是否有重复或叠加，还需要核对实际产品标签和整个组合。', 'Serving arithmetic explains the entered amount. Reviewing duplicates and combined doses needs your actual labels and full stack.'],
        units: ['统一单位后，再把实际产品标签放在一起，核对重复成分和叠加剂量。', 'After converting units, review actual product labels together for duplicates and combined doses.'],
        aliases: ['名称查询不能说明整个组合是否适合。带上实际标签，继续核对成分和剂量。', 'A name lookup does not establish suitability. Review actual labels to check ingredients and doses across your stack.'],
        inventory: ['清单已整理好，下一步用实际标签核对重复成分、叠加剂量与待复核项。', 'With your list organized, review actual labels for duplicates, combined doses and items needing a closer look.'],
        cost: ['使用天数与价格只回答购买算术。再核对实际产品标签和组合，看看有哪些重复与待复核项。', 'Duration and cost answer purchase arithmetic. Review actual product labels and your stack for duplicates and items to follow up.'],
    };
    return {
        eyebrow: t('下一步 · NutriAudit 核心功能', 'Next step · NutriAudit stack audit'),
        headline: t('做一次保健品组合审计', 'Review your supplement stack'),
        body: t(...reasons[task]),
        ctaText: t('开始保健品组合审计', 'Start my supplement stack audit'),
        note: t('先看免费预览；完整报告付费。开始前无需注册。', 'Start with a free preview; the full report is paid. No sign-up needed to start.'),
        steps: [t('补齐实际产品标签', 'Add your actual product labels'), t('查看免费审计预览', 'Review the free audit preview'), t('按需购买完整报告', 'Choose a full report if needed')],
    };
}
