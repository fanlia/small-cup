# small-cup
a small javascript front end framework

## Demo

```
npm start
```

## Core

- context
- components
- routes
- bootstrap

## Usage

```sh
npm i small-cup
```

```javascript

import cup, { onpathname } from 'small-cup'

const context = {
    count: 0,
}

const components = {
    counter: (el, ctx, render) => {
        el.onupdate = () => {
            el.textContent = ctx.count
        }

        el.onclick = () => {
            ctx.count++
            render()
        }
    },
}

const home = `
    <h1>home</h1>
    <p>count is <button component='counter'></button></p>
`

const routes = [
    {
        name: 'home',
        path: '/',
        before: (ctx) => {
            ctx.$root.innerHTML = home
        },
    },
]

const app = cup({
    context,
    components,
    routes,
})

onpathname(app)

```

## License

MIT
