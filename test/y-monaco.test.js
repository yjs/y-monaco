
import * as t from 'lib0/testing'
import * as prng from 'lib0/prng'
import * as math from 'lib0/math'
import * as Y from 'yjs'
import { applyRandomTests } from 'yjs/tests/testHelper.js'
import { MonacoBinding } from '../src/y-monaco.js'
import * as monaco from 'monaco-editor'

/**
 * @typedef {Object} EditorSetup
 * @property {monaco.editor.ITextModel} model
 * @property {Y.Text} type
 * @property {MonacoBinding} binding
 */

/**
 * @param {Y.Doc} y
 * @return {EditorSetup}
 */
const createMonacoEditor = y => {
  const model = monaco.editor.createModel('')
  const type = y.getText('monaco')
  const binding = new MonacoBinding(type, model)
  return {
    model,
    binding,
    type
  }
}

const createTestSetup = () => {
  const doc = new Y.Doc()
  return {
    s1: createMonacoEditor(doc),
    s2: createMonacoEditor(doc)
  }
}

/**
 * @param {t.TestCase} tc
 */
export const testMonacoInsert = tc => {
  const { s1, s2 } = createTestSetup()
  const pos = s1.model.getPositionAt(0)
  const range = new monaco.Selection(pos.lineNumber, pos.column, pos.lineNumber, pos.column)
  s1.model.pushEditOperations([], [{ range, text: 'some content' }], () => null)
  t.assert(s1.model.getValue() === 'some content')
  t.assert(s1.type.toString() === 'some content')
  t.assert(s2.model.getValue() === 'some content')
}

/**
 * @param {t.TestCase} tc
 */
export const testMonacoConcurrentInsert = tc => {
  const { s1, s2 } = createTestSetup()
  const pos = s1.model.getPositionAt(0)
  const range = new monaco.Selection(pos.lineNumber, pos.column, pos.lineNumber, pos.column)
  s1.model.pushEditOperations([], [{ range, text: 'A' }], () => null)
  s2.model.pushEditOperations([], [{ range, text: 'B' }], () => null)
  t.assert(s1.model.getValue().length === 2)
  t.assert(s1.type.toString() === s1.model.getValue())
  t.assert(s2.model.getValue() === s1.model.getValue())
}

/**
 * @param {t.TestCase} tc
 */
export const testMonacoManyEditOps = tc => {
  const { s1, s2 } = createTestSetup()
  const pos = s1.model.getPositionAt(0)
  const range = new monaco.Selection(pos.lineNumber, pos.column, pos.lineNumber, pos.column)
  s1.model.pushEditOperations([], [{ range, text: 'A' }, { range, text: 'bc' }], () => null)
  s2.model.pushEditOperations([], [{ range, text: 'B' }], () => null)
  t.assert(s1.model.getValue().length === 4)
  t.assert(s1.type.toString() === s1.model.getValue())
  t.assert(s2.model.getValue() === s1.model.getValue())
}

/**
 * @param {monaco.editor.ITextModel} model
 * @param {number} from
 * @param {number} to
 */
const createRangeFromIndex = (model, from, to) => {
  const fromPos = model.getPositionAt(from)
  const toPos = model.getPositionAt(to)
  return new monaco.Selection(fromPos.lineNumber, fromPos.column, toPos.lineNumber, toPos.column)
}

/**
 * @param {t.TestCase} tc
 */
export const testMonacoManyEdits = tc => {
  const { s1, s2 } = createTestSetup()
  const range = createRangeFromIndex(s1.model, 0, 0)
  s1.model.pushEditOperations([], [{ range, text: 'A' }, { range, text: 'b' }], () => null)
  s2.model.pushEditOperations([], [{ range, text: 'B123456789' }], () => null)
  s2.model.pushEditOperations([], [{ range: createRangeFromIndex(s2.model, 1, 3), text: 'Z' }, { range: createRangeFromIndex(s2.model, 4, 5), text: 'K' }], () => null)
  t.assert(s1.type.toString() === s1.model.getValue())
  t.assert(s2.model.getValue() === s1.model.getValue())
}

/**
 * @param {t.TestCase} tc
 */
export const testMonacoManyYEdits = tc => {
  const { s1, s2 } = createTestSetup()
  s1.type.insert(0, 'abcde')
  s1.binding.doc.transact(() => {
    s1.type.insert(1, '1')
    s1.type.insert(3, '3')
  })
  t.assert(s1.type.toString() === s1.model.getValue())
  t.assert(s2.model.getValue() === s1.model.getValue())
  t.assert(s1.model.getValue() === 'a1b3cde')
}

let charCounter = 0
const monacoChanges = [
  /**
   * @param {Y.Doc} y
   * @param {prng.PRNG} gen
   * @param {EditorSetup} setup
   */
  (y, gen, setup) => { // insert text
    const val = setup.model.getValue()
    const insertPos = prng.int32(gen, 0, val.length)
    const text = charCounter++ + prng.word(gen)
    setup.model.pushEditOperations([], [{ range: createRangeFromIndex(setup.model, insertPos, insertPos), text }], () => null)
  },
  /**
   * @param {Y.Doc} y
   * @param {prng.PRNG} gen
   * @param {EditorSetup} setup
   */
  (y, gen, setup) => { // delete text
    const val = setup.model.getValue()
    const insertPos = prng.int32(gen, 0, val.length)
    const overwrite = math.min(prng.int32(gen, 0, val.length - insertPos), 2)
    setup.model.pushEditOperations([], [{ range: createRangeFromIndex(setup.model, insertPos, insertPos + overwrite), text: '' }], () => null)
  },
  /**
   * @param {Y.Doc} y
   * @param {prng.PRNG} gen
   * @param {EditorSetup} setup
   */
  (y, gen, setup) => { // replace text
    const val = setup.model.getValue()
    const insertPos = prng.int32(gen, 0, val.length)
    const overwrite = math.min(prng.int32(gen, 0, val.length - insertPos), 2)
    const text = charCounter++ + prng.word(gen)
    setup.model.pushEditOperations([], [{ range: createRangeFromIndex(setup.model, insertPos, insertPos + overwrite), text }], () => null)
  },
  /**
   * @param {Y.Doc} y
   * @param {prng.PRNG} gen
   * @param {EditorSetup} setup
   */
  (y, gen, setup) => { // insert newline
    const val = setup.model.getValue()
    const insertPos = prng.int32(gen, 0, val.length)
    const text = charCounter++ + '\n'
    setup.model.pushEditOperations([], [{ range: createRangeFromIndex(setup.model, insertPos, insertPos), text }], () => null)
  }
]

/**
 * @param {any} result
 */
const checkResult = result => {
  for (let i = 1; i < result.testObjects.length; i++) {
    const setup1 = result.testObjects[i - 1]
    const setup2 = result.testObjects[i]
    t.assert(setup1.type.toString() === setup2.type.toString())
    const v1 = setup1.model.getValue()
    const v2 = setup2.model.getValue()
    t.assert(v1 === v2)
  }
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGenerateMonacoChanges3 = tc => {
  checkResult(applyRandomTests(tc, monacoChanges, 3, createMonacoEditor))
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGenerateMonacoChanges30 = tc => {
  checkResult(applyRandomTests(tc, monacoChanges, 30, createMonacoEditor))
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGenerateMonacoChanges40 = tc => {
  checkResult(applyRandomTests(tc, monacoChanges, 40, createMonacoEditor))
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGenerateMonacoChanges70 = tc => {
  checkResult(applyRandomTests(tc, monacoChanges, 70, createMonacoEditor))
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGenerateMonacoChanges100 = tc => {
  checkResult(applyRandomTests(tc, monacoChanges, 100, createMonacoEditor))
}

/**
 * @param {t.TestCase} tc
 */
export const testRepeatGenerateMonacoChanges300 = tc => {
  checkResult(applyRandomTests(tc, monacoChanges, 300, createMonacoEditor))
}
