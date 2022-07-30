import fs from 'fs'
import path from 'path'
import { JSDOM } from 'jsdom'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const documentContent = fs.readFileSync(path.join(__dirname, '../test.html'))
const { window } = new JSDOM(documentContent)

window.matchMedia = () => ({ matches: false, addEventListener: () => {} })

// @ts-ignore
global.self = global
// @ts-ignore
global.navigator = { userAgent: 'Node' }
// @ts-ignore
global.window = window
// @ts-ignore
global.document = window.document
// @ts-ignore
global.innerHeight = 0
// @ts-ignore
document.getSelection = () => ({ })
// @ts-ignore
document.queryCommandSupported = () => false

import('../dist/test.js').then(() => {
  console.log('all done!')
})
