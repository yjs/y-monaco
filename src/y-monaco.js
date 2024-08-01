import * as Y from 'yjs'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import * as error from 'lib0/error'
import { createMutex } from 'lib0/mutex'
import { Awareness } from 'y-protocols/awareness' // eslint-disable-line

class RelativeSelection {
  /**
   * @param {Y.RelativePosition} start
   * @param {Y.RelativePosition} end
   * @param {monaco.SelectionDirection} direction
   */
  constructor (start, end, direction) {
    this.start = start
    this.end = end
    this.direction = direction
  }
}

/**
 * @param {monaco.editor.IStandaloneCodeEditor} editor
 * @param {monaco.editor.ITextModel} monacoModel
 * @param {Y.Text} type
 */
const createRelativeSelections = (editor, monacoModel, type) => {
  const selections = editor.getSelections()
  if (!selections || !selections.length) return []
  return selections.map((sel) => {
    const startPos = sel.getStartPosition()
    const endPos = sel.getEndPosition()
    const start = Y.createRelativePositionFromTypeIndex(type, monacoModel.getOffsetAt(startPos))
    const end = Y.createRelativePositionFromTypeIndex(type, monacoModel.getOffsetAt(endPos))
    return new RelativeSelection(start, end, sel.getDirection())
  })
}

/**
 * @param {monaco.editor.IEditor} editor
 * @param {Y.Text} type
 * @param {RelativeSelection} relSel
 * @param {Y.Doc} doc
 * @return {null|monaco.Selection}
 */
const createMonacoSelectionFromRelativeSelection = (editor, type, relSel, doc) => {
  const start = Y.createAbsolutePositionFromRelativePosition(relSel.start, doc)
  const end = Y.createAbsolutePositionFromRelativePosition(relSel.end, doc)
  if (start !== null && end !== null && start.type === type && end.type === type) {
    const model = /** @type {monaco.editor.ITextModel} */ (editor.getModel())
    const startPos = model.getPositionAt(start.index)
    const endPos = model.getPositionAt(end.index)
    return monaco.Selection.createWithDirection(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column, relSel.direction)
  }
  return null
}

/**
 * @param {monaco.editor.ITextModel} monacoModel
 * @param {monaco.Selection} selection
 * @param {Y.Text} ytext
 */
const createSelectionAnchorAndHead = (monacoModel, selection, ytext) => {
  let anchor = monacoModel.getOffsetAt(selection.getStartPosition())
  let head = monacoModel.getOffsetAt(selection.getEndPosition())
  if (selection.getDirection() === monaco.SelectionDirection.RTL) {
    const tmp = anchor
    anchor = head
    head = tmp
  }
  return {
    anchor: Y.createRelativePositionFromTypeIndex(ytext, anchor),
    head: Y.createRelativePositionFromTypeIndex(ytext, head),
  }
}

/**
 * @param {monaco.editor.ITextModel} monacoModel
 * @param {number} clientID
 * @param {Boolean} isSecondarySelection
 * @param {Y.RelativePosition} anchor
 * @param {Y.RelativePosition} head
 * @param {Y.Doc} doc
 * @param {Y.Text} ytext
 * @returns {null|monaco.editor.IModelDeltaDecoration}
 */
const createRemoteSelectionDecoration = (monacoModel, clientID, isSecondarySelection, anchor, head, doc, ytext) => {
  const anchorAbs = Y.createAbsolutePositionFromRelativePosition(anchor, doc)
  const headAbs = Y.createAbsolutePositionFromRelativePosition(head, doc)
  if (anchorAbs !== null && headAbs !== null && anchorAbs.type === ytext && headAbs.type === ytext) {
    let start, end, afterContentClassName, beforeContentClassName
    if (anchorAbs.index < headAbs.index) {
      start = monacoModel.getPositionAt(anchorAbs.index)
      end = monacoModel.getPositionAt(headAbs.index)
      afterContentClassName = `yRemoteSelectionHead yRemoteSelectionHead-${clientID} ${
        isSecondarySelection ? 'yRemoteSelectionHead-secondary' : 'yRemoteSelectionHead-primary'
      }`
      beforeContentClassName = null
    } else {
      start = monacoModel.getPositionAt(headAbs.index)
      end = monacoModel.getPositionAt(anchorAbs.index)
      afterContentClassName = null
      beforeContentClassName = `yRemoteSelectionHead yRemoteSelectionHead-${clientID} ${
        isSecondarySelection ? 'yRemoteSelectionHead-secondary' : 'yRemoteSelectionHead-primary'
      }`
    }
    return {
      range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
      options: {
        className: `yRemoteSelection yRemoteSelection-${clientID} ${
          isSecondarySelection ? 'yRemoteSelection-secondary' : 'yRemoteSelection-primary'
        }`,
        afterContentClassName,
        beforeContentClassName,
      },
    }
  }
  return null
}

export class MonacoBinding {
  /**
   * @param {Y.Text} ytext
   * @param {monaco.editor.ITextModel} monacoModel
   * @param {Set<monaco.editor.IStandaloneCodeEditor>} [editors]
   * @param {Awareness?} [awareness]
   */
  constructor (ytext, monacoModel, editors = new Set(), awareness = null) {
    this.doc = /** @type {Y.Doc} */ (ytext.doc)
    this.ytext = ytext
    this.monacoModel = monacoModel
    this.editors = editors
    this.mux = createMutex()
    /**
     * @type {Map<monaco.editor.IStandaloneCodeEditor, RelativeSelection[]>}
     */
    this._savedSelections = new Map()
    this._beforeTransaction = () => {
      this.mux(() => {
        this._savedSelections = new Map()
        editors.forEach(editor => {
          if (editor.getModel() === monacoModel) {
            const relativeSelections = createRelativeSelections(editor, monacoModel, ytext)
            if (relativeSelections.length) {
              this._savedSelections.set(editor, relativeSelections)
            }
          }
        })
      })
    }
    this.doc.on('beforeAllTransactions', this._beforeTransaction)
    this._decorations = new Map()
    this._rerenderDecorations = () => {
      editors.forEach(editor => {
        if (awareness && editor.getModel() === monacoModel) {
          // render decorations
          const currentDecorations = this._decorations.get(editor) || []
          /**
           * @type {Array<monaco.editor.IModelDeltaDecoration>}
           */
          const newDecorations = []
          awareness.getStates().forEach((state, clientID) => {
            if (clientID !== this.doc.clientID && state.selection != null && state.selection.anchor != null && state.selection.head != null) {
              const decoration = createRemoteSelectionDecoration(
                monacoModel,
                clientID,
                false,
                state.selection.anchor,
                state.selection.head,
                this.doc,
                ytext
              )
              if(decoration) newDecorations.push(decoration)

              /**
               * @type {Array<{anchor: Y.RelativePosition, head: Y.RelativePosition}>}
               */
              const secondarySelections = state.secondarySelections
              secondarySelections &&
                secondarySelections.forEach((secondarySelection) => {
                  const decoration = createRemoteSelectionDecoration(
                    monacoModel,
                    clientID,
                    true,
                    secondarySelection.anchor,
                    secondarySelection.head,
                    this.doc,
                    ytext
                  )
                  if(decoration) newDecorations.push(decoration)
                })
            }
          })
          this._decorations.set(editor, editor.deltaDecorations(currentDecorations, newDecorations))
        } else {
          // ignore decorations
          this._decorations.delete(editor)
        }
      })
    }
    /**
     * @param {Y.YTextEvent} event
     */
    this._ytextObserver = event => {
      this.mux(() => {
        let index = 0
        event.delta.forEach(op => {
          if (op.retain !== undefined) {
            index += op.retain
          } else if (op.insert !== undefined) {
            const pos = monacoModel.getPositionAt(index)
            const range = new monaco.Selection(pos.lineNumber, pos.column, pos.lineNumber, pos.column)
            const insert = /** @type {string} */ (op.insert)
            monacoModel.applyEdits([{ range, text: insert }])
            index += insert.length
          } else if (op.delete !== undefined) {
            const pos = monacoModel.getPositionAt(index)
            const endPos = monacoModel.getPositionAt(index + op.delete)
            const range = new monaco.Selection(pos.lineNumber, pos.column, endPos.lineNumber, endPos.column)
            monacoModel.applyEdits([{ range, text: '' }])
          } else {
            throw error.unexpectedCase()
          }
        })
        this._savedSelections.forEach((relativeSelections, editor) => {
          /**
           * @type {Array<monaco.Selection>}
           */
          const selections = []
          relativeSelections.forEach((relativeSelection) => {
            const selection = createMonacoSelectionFromRelativeSelection(editor, ytext, relativeSelection, this.doc)
            if(selection) selections.push(selection)
          })
          editor.setSelections(selections)
        })
      })
      this._rerenderDecorations()
    }
    ytext.observe(this._ytextObserver)
    {
      const ytextValue = ytext.toString()
      if (monacoModel.getValue() !== ytextValue) {
        monacoModel.setValue(ytextValue)
      }
    }
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
    this._monacoDisposeHandler = monacoModel.onWillDispose(() => {
      this.destroy()
    })
    if (awareness) {
      editors.forEach(editor => {
        editor.onDidChangeCursorSelection((e) => {
          if (editor.getModel() === monacoModel) {
            if (e.selection === null) {
              awareness.setLocalStateField('selection', null)
              return
            }
            awareness.setLocalStateField('selection', createSelectionAnchorAndHead(monacoModel, e.selection, ytext))
            
            if (e.secondarySelections && e.secondarySelections.length) {
              awareness.setLocalStateField(
                'secondarySelections',
                e.secondarySelections.map((secondarySelection) =>
                  createSelectionAnchorAndHead(monacoModel, secondarySelection, ytext)
                )
              )
            } else {
              awareness.setLocalStateField('secondarySelections', [])
            }
          }
        })
        awareness.on('change', this._rerenderDecorations)
      })
      this.awareness = awareness
    }
  }

  destroy () {
    this._monacoChangeHandler.dispose()
    this._monacoDisposeHandler.dispose()
    this.ytext.unobserve(this._ytextObserver)
    this.doc.off('beforeAllTransactions', this._beforeTransaction)
    if (this.awareness) {
      this.awareness.off('change', this._rerenderDecorations)
    }
  }
}
