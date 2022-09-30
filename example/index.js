
if (module.hot) {
    module.hot.accept()
}

import 'bootstrap/dist/css/bootstrap.css'
import * as bootstrap from 'bootstrap'

import cup, { h, a, link, onpathname } from '../index.js'
import xlsx2csv from '@ailnaf/xlsx2csv'

const context = {
    count: 0,
    items: ['1', '2', '3'],
}

const button = (props = {}, children) => {

    const onunload = () => {
        console.log('unloaded button')
    }

    const onload = (el) => {
        console.log('loaded button')
    }

    return h('button', {
        ...props,
        onunload,
        onload,
    }, children)
}

const components = {
    a,
    counter: (el, ctx) => {
        el.onupdate = () => {
            el.textContent = ctx.count
        }
    },
    inc: (el, ctx, render) => {
        el.onclick = () => {
            ctx.items.unshift(ctx.items.pop())
            ctx.count++
            render()
        }
    },
    vnode: (el, ctx, render) => {
        let ul = h('ul')

        h(el, {
            className: 'vnode',
            attributes: {
                'data-id': '1',
            },
        }, [
            h("span", { style: { fontWeight: "bold" } }, "This is bold"),
            " and this is just normal text ",
            link({ href: "/about" }, "go to about"),
            h('input', { type: 'checkbox', checked: true, onclick: console.log }),
            ul,
            h('<>', {}, [
                h("p", {}, 'abc'),
                h("p", {}, 'efg'),
            ]),
            button({ className: 'btn btn-primary' }, 'button'),
        ])

        el.onupdate = () => {
            h(ul, {}, ctx.items.map(item => h('li', {}, item)))
        }

    },
    xlsx2csv: (el, ctx, render) => {
        let tbody = h('tbody')

        let max = 100

        const onchange = async (e) => {
            const file = e.target.files[0]

            let data = []
            await xlsx2csv(file, (row) => {
                data.push(row)
            }, { sheet: { max } })

            const cellStyle = {
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
            }

            h(tbody, {}, data.map((row, i) => {
                return h('tr', {}, row.map((col, j) => {
                    if (i === 0) return h('th', { style: cellStyle, attributes: { title: col } }, col)
                    return h('td', { style: cellStyle, attributes: { title: col } }, col)
                }))
            }))
        }

        h(el, {}, [
            h('h2', {}, 'xlsx2csv'),
            h('input', { type: 'number', step: 100, onchange: e => max = e.target.value, value: max }),
            h('input', { type: 'file', accept: '.xlsx', onchange }),
            h('div', { className: 'table-responsive' }, [
                h('table', {
                    className: 'table table-hover',
                    style: {
                        tableLayout: 'fixed',
                    }
                }, [
                    tbody,
                ]),
            ])
        ])
    },
}

const nav = `
<p>
<a href='/' component='a' data-active-route-class='link-danger'>home</a>
<a href='/about' component='a' data-active-route-class='link-danger'>about</a>
</p>
`

const home = `
    ${nav}
    <h1>home</h1>
    <p>count is <span component='counter'></span></p>
    <p><button component='inc' class='btn btn-primary'>++</button></p>
    <div component='vnode'></div>
`

const about = `
    ${nav}
    <h1>about</h1>
    <div component='xlsx2csv'></div>
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
        before: async (ctx) => {
            ctx.$root.innerHTML = about
        },
    },
]

const app = cup({
    context,
    components,
    routes,
})

window.context = context

onpathname(app)
