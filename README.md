# small-cup
a small javascript front end framework

## Getting started

```sh
mkdir myapp
cd myapp
npm init small-cup@latest
```

[demo](https://codepen.io/fanlia/pen/QWBEEwJ)

## Develop

```
npm start
```

## Core

- context
- components
- routes
- onpathname

## Usage

### cdn

```html
<script src="https://unpkg.com/small-cup/smallcup.min.js"></script>
<script>
    const { cup, onpathname } = smallcup
</script>
```

### esm

```sh
npm i small-cup
```

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>small cup demo</title>
  </head>
  <body>
    <div app></div>
    <script type="module" src="./index.js"></script>
  </body>
</html>

```

```javascript
// index.js

import { cup, onpathname } from 'small-cup'

const context = {
    count: 0,
}

const components = {
    counter: (el, ctx, render) => {
        el.onupdate = () => {
            el.textContent = ctx.count
        }

        el.onunload = () => {
            console.log('unloaded')
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
        before: async (ctx) => {
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
