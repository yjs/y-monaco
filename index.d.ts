import { mutex } from '@lib/mutex'
import * as monaco from 'monaco-editor'
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'

export class MonacoBinding {
  doc: Y.Doc
  ytext: Y.Text
  monacoModel: monaco.editor.ITextModel
  editors: Set<monaco.editor.IStandaloneCodeEditor>
  mux: mutex
  awareness: Awareness | undefined

  constructor(
    ytext: Y.Text, 
    monacoModel: monaco.editor.ITextModel, 
    editors?: Set<monaco.editor.IStandaloneCodeEditor> | undefined, 
    awareness?: Awareness | undefined,
    className?: string | undefined
  )

  destroy(): void
}
