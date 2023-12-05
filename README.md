# small-cup
a small javascript front end framework

## Getting started

```sh
mkdir myapp
cd myapp
npm init small-cup@latest
```

## API

```graphql

enum DOMType { static dynamic }

type DOM {
    node: HTMLNode
    children: [DOM]
    map: {[String]: DOM}
    type: DOMType
    root: Boolean
    update: () => {}
    unload: () => {}
}

type Component {
    template: String
    onload: (el: HTMLNode, ctx: Object, rootDom: DOM) => undefined | Component
    components: {[key: String]: Component}
}

type ElementVNodeData {
    tag: String
    props: Object
    children: undefined | [VNodeType]
}

type TextVNodeData = String

type VNodeData = ElementVNodeData | TextVNodeData

enum VNodeType { element text }

type VNode {
    type: VNodeType
    data: VNodeData
}

```

### render(root: HTMLNode, vnode: VNode, context: Object) => DOM

render vnode to root with context

### mount(root: HTMLNode, vnode: VNode, context: Object)

render vnode to root with context when window.onpopstate triggerd

### h(tag: String | HTMLNode, props: {[String]: any}, children: undefined | [VNode]) => VNode | HTMLNode

patch or create HTMLNode

## Usage

```html
<script type="module">
import { render, mount, h } from 'https://unpkg.com/small-cup/index.js'
</script>
```

```sh
npm i small-cup
```

## Test

```sh
npm start
```

## License

MIT
