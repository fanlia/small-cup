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
    type: DOMType
    update: () => {}
    unload: () => {}
}

type VNode {
    template: String
    onload: (el: HTMLNode, ctx: Object, dom: DOM) => undefined | VNode
    components: {[key: String]: VNode}
}

```

### render(root: HTMLNode, vnode: VNode, context: Object)

render vnode to root with context

### render(root: HTMLNode, vnode: VNode, context: Object)

render vnode to root with context when window.onpopstate triggerd

## Usage

```html
<script type="module">
import { render, mount } from 'https://unpkg.com/small-cup/index.js'
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
