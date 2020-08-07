import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import postcss from 'rollup-plugin-postcss'
import fs from 'fs'
import path from 'path'

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, './package.json'), { encoding: 'utf8' }))
const dependencies = Object.keys(pkg.peerDependencies).concat(Object.keys(pkg.dependencies))

const customModules = new Set([
  'y-websocket',
  'y-codemirror',
  'y-ace',
  'y-textarea',
  'y-quill',
  'y-dom',
  'y-prosemirror'
])
/**
 * @type {Set<any>}
 */
const customLibModules = new Set([
  'lib0',
  'y-protocols'
])
const debugResolve = {
  resolveId (importee) {
    if (importee === 'yjs/tests/testHelper.js') {
      return `${process.cwd()}/../yjs/tests/testHelper.js`
    }
    if (importee === 'yjs') {
      return `${process.cwd()}/../yjs/src/index.js`
    }
    if (importee === 'y-monaco') {
      return `${process.cwd()}/src/y-monaco.js`
    }
    if (customModules.has(importee.split('/')[0])) {
      return `${process.cwd()}/../${importee}/src/${importee}.js`
    }
    if (customLibModules.has(importee.split('/')[0])) {
      return `${process.cwd()}/../${importee}`
    }
    if (importee === 'monaco-editor') {
      return `${process.cwd()}/node_modules/monaco-editor/esm/vs/editor/editor.api.js`
    }
    return null
  }
}

export default [{
  input: './src/y-monaco.js',
  output: [{
    name: 'Y',
    file: 'dist/y-monaco.js',
    format: 'cjs',
    sourcemap: true,
    paths: path => {
      if (/^lib0\//.test(path)) {
        return `lib0/dist/${path.slice(5)}`
      }
      return path
    }
  }],
  external: id => dependencies.some(dep => dep === id) || /^lib0\//.test(id)
}, {
  input: './test/index.js',
  output: {
    name: 'test',
    file: 'dist/test.cjs',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    debugResolve,
    postcss({
      plugins: [],
      extract: true
    })
  ]
}, {
  input: './test/index.js',
  output: {
    name: 'test',
    file: 'dist/test.js',
    format: 'iife',
    sourcemap: true
  },
  plugins: [
    debugResolve,
    nodeResolve({
      mainFields: ['module', 'browser', 'main']
    }),
    commonjs(),
    postcss({
      plugins: [],
      extract: true
    })
  ]
}]
