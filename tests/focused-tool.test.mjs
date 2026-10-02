import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { TOOL_CONFIG } from '../tool-config.mjs'
import { evaluateLabelTask, labelExample } from '../label-task-results.mjs'
test('focused tasks run synthetic examples; only selected navigation is exposed', () => {
  for (const task of TOOL_CONFIG.tasks) assert.equal(evaluateLabelTask({ task, products: labelExample('en') }, 'en').error, null)
  const demo = readFileSync(new URL('../demo.mjs', import.meta.url), 'utf8')
  assert.ok(demo.includes('AVAILABLE_TASKS.forEach'))
  assert.ok(!demo.includes('LABEL_TASKS.forEach'))
  assert.ok(demo.includes("utm_content: 'result'"))
  assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/.test(demo))
})
test('MIT source hashes match provenance; all main-site document links carry a campaign and position', () => {
  const provenance = JSON.parse(readFileSync(new URL('../provenance.json', import.meta.url)))
  for (const [name, hash] of Object.entries(provenance.reusedFiles)) assert.equal(createHash('sha256').update(readFileSync(new URL('../' + name, import.meta.url))).digest('hex'), hash)
  for (const name of ['README.md', 'docs/examples-and-faq.md', 'docs/attribution.md']) {
    const text = readFileSync(new URL('../' + name, import.meta.url), 'utf8')
    for (const link of text.matchAll(/https:\/\/www\.nutriaudit\.com\/[^)\s]+/g)) {
      const url = new URL(link[0])
      assert.equal(url.searchParams.get('utm_campaign'), TOOL_CONFIG.campaign)
      assert.ok(url.searchParams.get('utm_content'))
    }
  }
})
