const fs = require('node:fs')
const { parseStringPromise } = require('xml2js')

async function testOpmlParsing() {
  try {
    // サンプルOPMLファイルを読み込み
    const opmlPath = './assets/sample'
    const xmlContent = fs.readFileSync(opmlPath, 'utf-8')

    console.log('XML content length:', xmlContent.length)
    console.log('First 200 characters:', xmlContent.substring(0, 200))

    // xml2jsでパース
    const result = await parseStringPromise(xmlContent)

    console.log('\n=== Parsed result structure ===')
    console.log('result.opml:', !!result.opml)
    console.log('result.opml.body:', !!result.opml?.body)
    console.log('result.opml.body keys:', Object.keys(result.opml?.body || {}))
    console.log('Full parsed structure:', JSON.stringify(result, null, 2))

    // extractOutlines関数のロジックをテスト
    function extractOutlines(outlines) {
      const result = []

      for (const outline of outlines) {
        console.log(`Processing outline: ${outline.$.text || outline.$.title}`)
        console.log(`  Type: ${outline.$.type}, xmlUrl: ${outline.$.xmlUrl}`)

        if (outline.$ && outline.$.type === 'rss' && outline.$.xmlUrl) {
          console.log(`  ✓ Adding RSS outline: ${outline.$.xmlUrl}`)
          result.push(outline)
        }

        if (outline.outline && Array.isArray(outline.outline)) {
          console.log(`  → Recursing into ${outline.outline.length} nested outlines`)
          result.push(...extractOutlines(outline.outline))
        }
      }

      return result
    }

    console.log('\n=== Testing extractOutlines ===')
    if (result.opml?.body?.outline) {
      const extractedOutlines = extractOutlines(result.opml.body.outline)
      console.log('Total extracted RSS outlines:', extractedOutlines.length)

      console.log('\nFirst 3 extracted outlines:')
      extractedOutlines.slice(0, 3).forEach((outline, index) => {
        console.log(`${index + 1}. ${outline.$.title || outline.$.text} - ${outline.$.xmlUrl}`)
      })
    } else {
      console.log('No outlines found!')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

testOpmlParsing()
