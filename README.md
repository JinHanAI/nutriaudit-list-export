# Supplement List Export — CSV & Print

Make a supplement list for your next appointment. A focused MIT-licensed browser tool: **no account, no dependencies and no label uploads**.

**How can I create a supplement list for an appointment?** Enter products, quantities, serving sizes, daily usage and optional notes. Download a spreadsheet-safe CSV or print locally.

[Try the task on NutriAudit](https://www.nutriaudit.com/tools/supplement-label-tools?task=inventory&utm_source=github&utm_medium=referral&utm_campaign=list_export&utm_content=readme) · [Examples & FAQ](docs/examples-and-faq.md) · [MIT license](LICENSE)

## Run locally

Requires Python 3 to serve static files. Node.js 22 or 24 is only needed for tests.

```sh
git clone https://github.com/JinHanAI/nutriaudit-list-export.git
cd nutriaudit-list-export
python3 -m http.server 8080 --bind 127.0.0.1
```

Open http://127.0.0.1:8080/index.html. Select **Load example** or enter your own labels. Calculation, CSV and print stay in the browser.

## Worked example

Two synthetic products and a note produce one local CSV list. Missing information is not invented.

The sample is synthetic and is not a personal assessment. Changing inputs clears the previous result.

## Included tasks

This project shows only inventory. It reuses the MIT core from [NutriAudit Label Tools](https://github.com/JinHanAI/nutriaudit-label-tools) at commit `ec9615a2212c3cce01c98e2fdf5dbba85dab1f7f`; it is not a new medical algorithm.

## Limits

- A name overlap is not proof of the same chemical form or harmful interaction.
- Verified daily mass arithmetic covers calcium, vitamin C, D2 and D3. Other names can be listed without a numerical total.
- Only mcg/mg/g conversions. IU, %DV and volume are not guessed. Missing amounts stay unknown.
- This cannot assess drug interactions, abnormal lab results, clinical safety or personal suitability.

## Continue with your full supplement stack

The result includes [a NutriAudit stack-audit link](https://www.nutriaudit.com/scan?utm_source=github&utm_medium=referral&utm_campaign=list_export&utm_content=result). It transfers **no labels or notes**. Add actual products on the main site; start with the free preview and decide whether to buy the full report. The hosted service is outside this MIT package.

Links have fixed channel tags: `github`, `list_export` and the link position. The standalone demo sends no analytics requests. Hosted-site analytics can distinguish project referrals; blocking analytics or losing tags can leave the origin unknown.

## Tests and provenance

```sh
node --test tests/*.test.mjs
```

[Source provenance](provenance.json) · [Attribution links](docs/attribution.md) · [Security](SECURITY.md). Never put private labels, notes or credentials in issues.
