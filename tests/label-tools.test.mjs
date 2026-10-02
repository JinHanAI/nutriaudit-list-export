import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateDailyAmount, convertMass, summarizeLabels, findProductOverlaps, compareLabels, lookupLabelName, exportInventoryCsv, calculateBottleCost } from '../label-tools.mjs'
import { evaluateLabelTask, labelExample } from '../label-task-results.mjs'
const product = (id, amount = '100', unit = 'mg', name = 'calcium') => ({ id, name: `Synthetic ${id}`, servingSize: '1', dailyUnits: '1', ingredients: [{ name, amount, unit }] })
test('serving arithmetic respects actual units and does not invent missing or zero denominators', () => {
  assert.equal(calculateDailyAmount('250', '2', '1').value, 125)
  for (const input of ['', '0', '-1', '1e3', 'Infinity']) assert.equal(calculateDailyAmount('250', input, '1').value, null)
  assert.equal(calculateDailyAmount('0', '1', '1').value, 0)
})
test('mass conversion supports microgram symbols but does not guess IU, volume or DV', () => {
  assert.equal(convertMass('1', 'mg', 'μg').value, 1000)
  assert.equal(convertMass('1000', 'mcg', 'mg').value, 1)
  for (const unit of ['IU', '%DV', 'mL', 'unknown']) assert.equal(convertMass('1', unit, 'mg').value, null)
  assert.equal(convertMass('1000000000', 'g', 'mcg').value, null)
})
test('overlap is a name overlap; known daily totals normalize mass', () => {
  const rows = [product('a','200'), product('b','0.5','g')]
  assert.equal(findProductOverlaps(rows).length, 1)
  assert.equal(summarizeLabels(rows)[0].totalMg, 700)
  assert.equal(summarizeLabels([product('a','100','mg','unverified herb')])[0].totalMg, null)
})
test('one missing amount invalidates the total rather than becoming zero', () => {
  assert.equal(summarizeLabels([product('a'), product('b','')])[0].totalMg, null)
})
test('one-sided comparison remains unknown and D2/D3 remain separate', () => {
  const rows = compareLabels(product('a'), product('b','50','mg','vitamin c'))
  assert.ok(rows.every(row => row.changeMg === null))
  assert.notEqual(lookupLabelName('ergocalciferol').canonical, lookupLabelName('cholecalciferol').canonical)
  assert.equal(lookupLabelName('calcium carbonate'), null)
})
test('inventory preserves local notes but neutralizes formula prefixes and quotes', () => {
  const row = { ...product('a'), name: '=2+2', notes: '"Quoted", private synthetic note' }
  const csv = exportInventoryCsv([row], 'en')
  assert.ok(csv.includes("'=2+2")); assert.ok(csv.includes('""Quoted""'))
  assert.ok(csv.includes('private synthetic note')); assert.ok(csv.startsWith('\uFEFF'))
})
test('bottle cost allows an unknown price; invalid duration is not computed', () => {
  assert.equal(calculateBottleCost('60','2','30').days,30)
  assert.equal(calculateBottleCost('60','2','').costPerDay,null)
  assert.equal(calculateBottleCost('60','0','30').days,null)
})
test('English task validation is localized and useful examples stay explicitly synthetic', () => {
  const base = { task:'duplicate',products:[],amount:'',servingSize:'',dailyUnits:'',fromUnit:'mg',toUnit:'mcg',alias:'',bottleServings:'',dailyServings:'',price:'',currency:'USD' }
  assert.match(evaluateLabelTask(base,'en').error,/Enter your products/)
  assert.match(evaluateLabelTask({...base,products:[product('a')]},'en').error,/two products/i)
  assert.equal(evaluateLabelTask({...base,products:labelExample('en')},'en').error,null)
})
