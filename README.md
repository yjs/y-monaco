# y-monaco
> [Monaco](https://microsoft.github.io/monaco-editor/index.html) Editor Binding for [Yjs](https://github.com/y-js/yjs) - [Demo](https://demos.yjs.dev/monaco/monaco.html)

This binding maps a Y.Text to the Monaco editor (the editor that power VS Code).

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
  value: '', // MonacoBinding overwrites this value with the content of type
  language: "javascript"
})

// Bind Yjs to the editor model
const monacoBinding = new MonacoBinding(type, editor.getModel(), new Set([editor]), provider.awareness)
```

Also look [here](https://github.com/y-js/yjs-demos/tree/master/monaco) for a working example.

## API

```js
import { MonacoBinding } from 'y-monaco'

const binding = new MonacoBinding(type, editor.getModel(), new Set([editor]), provider.awareness)
```

### Class:MonacoBinding

<dl>
  <b><code>constructor(Y.Text, monaco.editor.ITextModel, [Set&lt;monaco.editor.IStandaloneCodeEditor&gt;, [Awareness]])</code></b>
  <dd>If the editor(s) are specified, MonacoBinding adjusts selections when remote changes happen. <code>Awareness</code> is an implementation of the awareness protocol of <code>y-protocols/awareness</code>. If Awareness is specified, MonacoBinding renders remote selections.</dd>
  <b><code>destroy()</code></b>
  <dd>Unregister all event listeners. This is automatically called when the model is disposed.</dd>
</dl>

## Styling

You can use the following CSS classes to style remote cursor selections:

- `yRemoteSelection`
- `yRemoteSelectionHead`

See [demo/index.html](demo/index.html) for example styles. Additionally, you can enable per-user styling (e.g.: different colors per user). The recommended approach for this is to listen to `awareness.on("update", () => ...));` and inject custom styles for every available clientId. You can use the following classnames for this:

- `yRemoteSelection-${clientId}`
- `yRemoteSelectionHead-${clientId`

(where `${clientId}` is the Yjs clientId of the specific user).
### License

[The MIT License](./LICENSE) © Kevin Jahns
