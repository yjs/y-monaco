import * as Y from 'yjs'
import * as monaco from 'monaco-editor'
import * as error from 'lib0/error.js'
import { createMutex } from 'lib0/mutex.js'

export class MonacoBinding {
  /**
   * 
   * @param {Y.Text} ytext 
   * @param {monaco.editor.ITextModel|monaco.editor.IEditor} _monaco 
   */
  constructor (ytext, _monaco) {
    /**
     * @type {monaco.editor.ITextModel}
     */
    // @ts-ignore
    const monacoModel = _monaco.getModel !== undefined ? _monaco.getModel() : _monaco
    this.doc = /** @type {Y.Doc} */ (ytext.doc)
    this.ytext = ytext
    this.monacoModel = monacoModel
    this.mux = createMutex()
    this._ytextObserver = event => {
      if (event.transaction.origin === this) {
        return
      }
      this.mux(() => {
        let index = 0
        event.delta.forEach(op => {
          if (op.retain !== undefined) {
            index += op.retain
          } else if (op.insert !== undefined) {
            const pos = monacoModel.getPositionAt(index)
            const range = new monaco.Selection(pos.lineNumber, pos.column, pos.lineNumber, pos.column)
            monacoModel.pushEditOperations([], [{ range, text: op.insert }], () => null)
            index += op.insert.length
          } else if (op.delete !== undefined) {
            const pos = monacoModel.getPositionAt(index)
            const endPos = monacoModel.getPositionAt(index + op.delete)
            const range = new monaco.Selection(pos.lineNumber, pos.column, endPos.lineNumber, endPos.column)
            monacoModel.pushEditOperations([], [{ range, text: '' }], () => null)
          } else {
            throw error.unexpectedCase()
          }
        })
      })
    }
    ytext.observe(this._ytextObserver)
    monacoModel.setValue(ytext.toString())
    this._monacoChangeHandler = monacoModel.onDidChangeContent(event => {
      // apply changes from right to left
      this.mux(() => {
        this.doc.transact(() => {
          event.changes.sort((change1, change2) => change2.rangeOffset - change1.rangeOffset).forEach(change => {
            ytext.delete(change.rangeOffset, change.rangeLength)
            ytext.insert(change.rangeOffset, change.text)
          })
        }, this)
      })
    })
    monacoModel.onWillDispose(() => {
      this.destroy()
    })
  }
  destroy () {
    this._monacoChangeHandler.dispose()
    this.ytext.unobserve(this._ytextObserver)
  }
}