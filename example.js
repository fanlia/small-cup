
import cup from './index.js'

const context = {
    count: 0,
}

const components = {
    counter: (el, ctx) => {
        el.textContent = ctx.count
    },
    inc: (el, ctx, render) => {
        el.onclick = () => {
            ctx.count++
            render()
        }
    },
}

const nav = `
<p>
<a href='#/'>home</a>
<a href='#/about'>abount</a>
</p>
`

const home = `
    ${nav}
    <h1>home</h1>
    <p>count is <span component='counter'></span></p>
    <p><button component='inc'>+</button></p>
`

const about = `
    ${nav}
    <h1>about</h1>
`

const routes = [
    {
        name: 'home',
        path: '/',
        before: (ctx) => {
            ctx.$root.innerHTML = home
        },
    },
    {
        name: 'about',
        path: '/about',
        before: (ctx) => {
            ctx.$root.innerHTML = about
        },
    },
]

const app = cup({
    context,
    components,
    routes,
})

window.onhashchange = () => {
    const hash = window.location.hash.replace('#', '') || '/'
    app(hash)
}

window.onhashchange()
