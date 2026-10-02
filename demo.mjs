import { TOOL_CONFIG } from './tool-config.mjs'
import { exportInventoryCsv, lookupLabelName } from './label-tools.mjs'
import { LABEL_TASKS, chooseLabelText, evaluateLabelTask, getLabelAuditCopy, isLabelsTask, labelExample } from './label-task-results.mjs'

const $ = id => document.getElementById(id)
const blankProduct = id => ({ id, name: '', servingSize: '', dailyUnits: '', ingredients: [{ name: '', amount: '', unit: 'mg' }], notes: '' })
let language = 'en'; let mode = 'own'
const AVAILABLE_TASKS = LABEL_TASKS.filter(item => TOOL_CONFIG.tasks.includes(item.id))
const state = { task: TOOL_CONFIG.tasks[0], products: [blankProduct('a'), blankProduct('b')], amount: '', servingSize: '', dailyUnits: '', fromUnit: 'mg', toUnit: 'mcg', alias: '', bottleServings: '', dailyServings: '', price: '', currency: 'USD' }
const t = (zh, en) => chooseLabelText(language, zh, en)
function node(tag, text = '', attributes = {}) {
  const element = document.createElement(tag); element.textContent = text
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value)
  return element
}
function invalidate() { $('result').hidden = true; $('error').hidden = true; $('print-list').replaceChildren() }
function inputField(zh, en, value, update, options, multiline = false) {
  const label = node('label', t(zh, en))
  const field = node(options ? 'select' : multiline ? 'textarea' : 'input')
  if (options) options.forEach(option => field.append(node('option', option === '未知' ? t('未知', 'Unknown') : option, { value: option })))
  else if (!multiline) { field.type = 'text'; field.maxLength = 100; field.inputMode = 'text' }
  else field.maxLength = 500
  field.value = value
  field.addEventListener(options ? 'change' : 'input', () => { update(field.value); invalidate() })
  label.append(field); return label
}
function action(zh, en, run) { const button = node('button', t(zh, en), { type: 'button' }); button.addEventListener('click', run); return button }
function renderFields() {
  const fields = $('fields'); fields.replaceChildren(); const task = state.task
  if (isLabelsTask(task)) {
    state.products.forEach((product, index) => {
      const box = node('fieldset'); box.append(node('legend', `${t('产品', 'Product')} ${String.fromCharCode(65 + index)}`))
      const meta = node('div', '', { class: 'grid' })
      for (const [key, zh, en] of [['name', '产品名称', 'Product name'], ['servingSize', '标签每份粒数', 'Units per label serving'], ['dailyUnits', '每日实际粒数', 'Actual units per day']]) meta.append(inputField(zh, en, product[key], value => { product[key] = value }))
      box.append(meta, node('p', t('每份与每日必须采用相同的粒、勺或毫升等计量单位。', 'Use the same units, such as capsules, scoops or mL, for serving size and daily usage.')))
      product.ingredients.forEach((ingredient, row) => {
        const grid = node('div', '', { class: 'grid' })
        grid.append(inputField('成分名称', 'Ingredient name', ingredient.name, value => { ingredient.name = value }), inputField('每份含量', 'Amount per serving', ingredient.amount, value => { ingredient.amount = value }), inputField('标签单位', 'Label unit', ingredient.unit, value => { ingredient.unit = value }, ['mcg', 'mg', 'g', 'IU', '未知']))
        const remove = action('删除此成分', 'Remove this ingredient', () => { product.ingredients.splice(row, 1); invalidate(); renderFields() }); remove.setAttribute('aria-label', t(`删除产品${index + 1}成分${row + 1}`, `Remove ingredient ${row + 1} of product ${index + 1}`)); grid.append(remove); box.append(grid)
      })
      const add = action('增加成分', 'Add ingredient', () => { product.ingredients.push({ name: '', amount: '', unit: 'mg' }); invalidate(); renderFields() })
      add.disabled = product.ingredients.length >= 20 || state.products.reduce((sum, item) => sum + item.ingredients.length, 0) >= 100
      box.append(add)
      if (task === 'inventory') box.append(inputField('备注（仅留在此页）', 'Notes (stay in this browser)', product.notes ?? '', value => { product.notes = value }, null, true))
      if (state.products.length > 1) box.append(action('移除产品', 'Remove product', () => { state.products.splice(index, 1); invalidate(); renderFields() }))
      fields.append(box)
    })
    const add = action('增加产品', 'Add product', () => { state.products.push(blankProduct(`product-${Date.now()}`)); invalidate(); renderFields() })
    add.disabled = state.products.length >= 10 || (task === 'compare' && state.products.length >= 2); fields.append(add)
  } else {
    const grid = node('div', '', { class: 'grid' })
    const add = (key, zh, en, options) => grid.append(inputField(zh, en, state[key], value => { state[key] = value }, options))
    if (task === 'aliases') add('alias', '成分名称', 'Ingredient name')
    else if (task === 'cost') { add('bottleServings', '一瓶总份数', 'Bottle servings'); add('dailyServings', '每日实际份数', 'Actual daily servings'); add('price', '价格（未知留空）', 'Price (blank if unknown)'); add('currency', '币种', 'Currency', ['USD', 'EUR', 'GBP', 'CNY']) }
    else {
      add('amount', task === 'units' ? '待换算数值' : '每份含量', task === 'units' ? 'Amount to convert' : 'Amount per serving')
      add('fromUnit', '原单位', 'From unit', ['mcg', 'mg', 'g', 'IU'])
      if (task === 'units') add('toUnit', '目标单位', 'To unit', ['mcg', 'mg', 'g'])
      else { add('servingSize', '标签每份粒数', 'Units per label serving'); add('dailyUnits', '每日实际粒数', 'Actual units per day') }
    }
    fields.append(grid)
  }
}
function render() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
  for (const [id, zh, en] of [
    ['eyebrow', 'NutriAudit · 开源标签工具', 'NutriAudit · Open-source label tools'], ['title', TOOL_CONFIG.titleZh, TOOL_CONFIG.title],
    ['intro', TOOL_CONFIG.introZh, TOOL_CONFIG.intro + '. No account needed.'],
    ['privacy', '计算与备注只在此页处理，不发送、不保存。不是安全或个人适用性结论。', 'Calculations and notes stay on this page, without sending or saving them. This is not a safety or suitability finding.'],
    ['own', '填写自己的标签', 'Use my labels'], ['example', '载入示例', 'Load example'], ['calculate', '查看结果', 'Show result'],
    ['continue', '开始保健品组合审计', 'Start my supplement stack audit'],
    ['footer-note', '回站链接不携带标签或备注。到主站补齐实际标签，先看免费预览；完整报告付费。', 'The link carries no labels or notes. Add actual labels on NutriAudit; start with a free preview. The full report is paid.'],
  ]) $(id).textContent = t(zh, en)
  $('language').textContent = language === 'zh' ? 'English' : '中文'
  $('mode').textContent = mode === 'own' ? t('当前填写：自己的信息', 'Current inputs: your information') : t('当前填写：示例，不代表你的情况', 'Current inputs: example, not your situation')
  $('tasks').setAttribute('aria-label', t('工具任务', 'Label tasks')); $('result').setAttribute('aria-label', t('检查结果', 'Task result')); $('print-list').setAttribute('aria-label', t('可打印清单', 'Printable list'))
  $('tasks').replaceChildren()
  AVAILABLE_TASKS.forEach(item => { const button = action(item.zh, item.en, () => { state.task = item.id; invalidate(); render() }); button.setAttribute('aria-pressed', String(item.id === state.task)); $('tasks').append(button) })
  const item = AVAILABLE_TASKS.find(entry => entry.id === state.task)
  $('task-title').textContent = t(item.zh, item.en); $('description').textContent = t(item.descriptionZh, item.descriptionEn)
  renderFields()
}
function printList() {
  $('print-list').replaceChildren()
  state.products.filter(product => product.name.trim()).forEach(product => {
    const block = node('article', '', { class: 'print-product' }); block.append(node('h3', product.name), node('p', `${product.servingSize || t('未知', 'Unknown')} ${t('粒/份', 'units/serving')}; ${product.dailyUnits || t('未知', 'Unknown')} ${t('粒/日', 'units/day')}`))
    product.ingredients.filter(item => item.name.trim()).forEach(item => block.append(node('p', `${item.name}: ${item.amount || t('未知', 'Unknown')} ${item.unit}`)))
    if (product.notes) block.append(node('p', product.notes)); $('print-list').append(block)
  })
}
$('form').addEventListener('submit', event => {
  event.preventDefault(); invalidate()
  const value = evaluateLabelTask(state, language)
  if (value.error) { $('error').textContent = value.error; $('error').hidden = false; return }
  const result = $('result'); result.replaceChildren(node('h3', value.heading)); result.className = 'result-card'
  if (value.lines[0]) result.append(node('p', value.lines[0]))
  const copy = getLabelAuditCopy(state.task, language)
  const audit = node('section', '', { class: 'audit-cta', 'aria-label': t('下一步组合审计', 'Next step: stack audit') })
  audit.append(node('p', copy.eyebrow), node('h3', copy.headline), node('p', copy.body))
  const steps = node('ol'); copy.steps.forEach(step => steps.append(node('li', step))); audit.append(steps)
  const target = new URL('https://www.nutriaudit.com/scan')
  for (const [key, value] of Object.entries({ source: 'github_' + TOOL_CONFIG.campaign, utm_source: 'github', utm_medium: 'referral', utm_campaign: TOOL_CONFIG.campaign, utm_content: 'result', task_source: 'label_tools', intent: state.task === 'compare' ? 'before_adding' : 'stack_overlap', task_context: `label-${state.task}` })) target.searchParams.set(key, value)
  audit.append(node('a', copy.ctaText, { href: target.href, class: 'audit-primary', target: '_blank', rel: 'noopener noreferrer' }), node('p', copy.note), node('p', t('独立演示不传标签；下一步在主站补齐自己的实际产品，示例不带入。', 'This standalone demo transfers no labels. Add your actual products on NutriAudit; examples are not carried forward.')))
  result.append(audit)
  const list = node('ul'); value.lines.slice(1).forEach(line => list.append(node('li', line))); result.append(list)
  result.append(node('p', mode === 'example' ? t('示例结果不能代表你的情况。', 'Example results do not describe your situation.') : t('结果只涵盖已输入内容，不排除所有风险。', 'Results cover entered information only and do not rule out every risk.')))
  if (state.task === 'inventory') {
    result.append(action('下载CSV', 'Download CSV', () => { try { const blob = new Blob([exportInventoryCsv(state.products.filter(product => product.name.trim()), language)], { type: 'text/csv;charset=utf-8' }); const href = URL.createObjectURL(blob); const link = node('a', '', { href, download: 'supplement-label-list.csv' }); document.body.append(link); try { link.click() } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(href), 1000) } } catch { $('error').textContent = t('下载未成功，请使用打印清单。', 'Download failed. Try printing the list.'); $('error').hidden = false } }), action('打印清单', 'Print list', () => window.print())); printList()
  }
  const known = state.task === 'aliases' && lookupLabelName(state.alias)
  if (known) result.append(node('a', t('NIH ODS原始来源', 'Original NIH ODS source'), { href: known.source, target: '_blank', rel: 'noopener noreferrer' }))
  result.hidden = false; result.focus(); result.scrollIntoView({ block: 'nearest' })
})
$('own').addEventListener('click', () => { mode = 'own'; state.products = [blankProduct('a'), blankProduct('b')]; for (const key of ['amount', 'servingSize', 'dailyUnits', 'alias', 'bottleServings', 'dailyServings', 'price']) state[key] = ''; invalidate(); render() })
$('example').addEventListener('click', () => { mode = 'example'; Object.assign(state, { products: labelExample(language), amount: '250', servingSize: '2', dailyUnits: '1', fromUnit: 'mg', toUnit: 'mcg', alias: 'cholecalciferol', bottleServings: '60', dailyServings: '2', price: '30', currency: 'USD' }); invalidate(); render() })
$('language').addEventListener('click', () => { language = language === 'zh' ? 'en' : 'zh'; invalidate(); render() })
render()
