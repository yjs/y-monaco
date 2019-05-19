# y-monaco
> [Monaco](https://microsoft.github.io/monaco-editor/index.html) Editor Binding for [Yjs](https://github.com/y-js/yjs) - [Demo](https://yjs-demos.now.sh/monaco/)

This binding maps a Y.Text to a Monaco editor.

### Features

* Shared Cursors

### Example

```js
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { MonacoBinding } from 'y-monaco'
import * as monaco from 'monaco-editor'

const ydocument = new Y.Doc()
const provider = new WebsocketProvider(`${location.protocol === 'http:' ? 'ws:' : 'wss:'}//localhost:1234`, 'monaco', ydocument)
const type = ydocument.getText('monaco')

const editor = monaco.editor.create(document.getElementById('monaco-editor'), {
  value: '',
  language: "javascript"
})

// Bind Yjs to the editor model
const monacoBinding = new MonacoBinding(type, editor.getModel())
```

Also look [here](https://github.com/y-js/yjs-demos/tree/master/monaco) for a working example.

### License

[The MIT License](./LICENSE) © Kevin Jahns