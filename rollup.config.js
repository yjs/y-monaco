import { nodeResolve } from '@rollup/plugin-node-resolve'
// import commonjs from '@rollup/plugin-commonjs'
import postcss from 'rollup-plugin-postcss'
import fs from 'fs'
import path from 'path'

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, './package.json'), { encoding: 'utf8' }))
const dependencies = Object.keys(pkg.peerDependencies).concat(Object.keys(pkg.dependencies))

console.log(dependencies)

const aliases = {
  resolveId (importee) {
    if (importee === 'yjs') {
      return `${process.cwd()}/node_modules/yjs/src/index.js`
    }
    return null
  }
}

export default [{
  input: './src/y-monaco.js',
  output: [{
    name: 'Y',
    file: 'dist/y-monaco.cjs',
    format: 'cjs',
    sourcemap: true
  }],
  external: id => dependencies.some(dep => dep === id) || /^lib0\//.test(id)
}, {
  input: './test/index.js',
  output: {
    name: 'test',
    file: 'dist/test.js',
    format: 'esm',
    sourcemap: true,
    inlineDynamicImports: true
  },
  external: id => /^(lib0|isomorphic\.js)\//.test(id) && id[0] !== '.' && id[0] !== '/',
  plugins: [
    // debugResolve,
    aliases,
    nodeResolve(),
    postcss({
      plugins: [],
      extract: true
    })
  ]
} /* {
  input: './test/index.js',
  output: {
    name: 'test',
    file: 'dist/test.js',
    format: 'esm',
    sourcemap: true,
    inlineDynamicImports: true
  },
  plugins: [
    // debugResolve,
    nodeResolve({
      mainFields: ['module', 'browser', 'main']
    }),
    commonjs(),
    postcss({
      plugins: [],
      extract: true
    })
  ]
} */]
