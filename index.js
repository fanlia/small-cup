
import { match, compile } from 'path-to-regexp'

function road (routes = []) {

    const routesObj = {}

    for (const route of routes) {
        if (!route.name || !route.path) continue
        routesObj[route.name] = {
            match: match(route.path, { decode: decodeURIComponent }),
            compile: compile(route.path, { encode: encodeURIComponent }),
            route,
        }
    }

    function parse (path) {
        if (!path) return
        for (const name in routesObj) {
            const route = routesObj[name]
            const result = route.match(path)
            if (result) {
                return { ...route.route, params: result.params }
            }
        }
    }

    function stringify (name, params) {
        const route = routesObj[name]
        return route && route.compile(params)
    }

    return { parse, stringify }
}

function nope () {}

function isFunction (fn) { return typeof fn === 'function' }

function view (context, components = {}) {

    let elements  = []

    function render () {
        elements.forEach(element => {
            element.onupdate()
        })
    }

    function load (doms = []) {
        doms.forEach(dom => {
            const { name, node } = dom
            if (!name || !node) return
            const component = components[name]
            if (!isFunction(component)) return

            const onload = () => component(node, context, render)

            onload()

            const onupdate = node.onupdate || nope
            const onunload = node.onunload || nope

            onupdate()

            elements.push({ name, onupdate, onunload })
        })
    }

    function unload () {
        elements.forEach(element => {
            element.onunload()
        })
        elements = []
    }

    function reset (doms) {
        unload()
        load(doms)
    }

    return {
        render,
        load,
        unload,
        reset,
    }
}

async function serially (context, steps = []) {
    let data
    for (const step of steps) {
        if (!isFunction(step)) continue
        data = await step(context)
    }
    return data
}

export default function cup (options = {}) {
    const {
        context,
        components,
        routes,
        doc = document,
        callback,
    } = options

    const router = road(routes)

    const root = doc.querySelector('[app]') || doc.body
    const attr = 'component'
    const selector = `[${attr}]`
    const viewer = view(context, components)
    const render = () => {
        const doms = Array.from(root.querySelectorAll(selector)).map(node => ({
            name: node.getAttribute(attr),
            node,
        }))
        viewer.reset(doms)
    }

    return function app (path) {
        const route = router.parse(path)

        const flow = [
            route && route.before,
            render,
            route && route.after,
            callback,
        ]

        context.$route = route
        context.$router = router
        context.$root = root
        context.$render = render

        return serially(context, flow)
    }
}

export function h(tag, props = {}, children) {
    const node = typeof tag === 'string' ? document.createElement(tag) : tag

    for (const key in props) {
        const value = props[key]
        if (key === 'attributes') {
            if (value && typeof value === 'object') {
                for (const attr in value) {
                    node.setAttribute(attr, value[attr])
                }
            }
        } else if (value && typeof value === 'object') {
            for (const nkey in value) {
                node[key][nkey] = value[nkey]
            }
        } else {
            node[key] = props[key]
        }
    }

    children = Array.isArray(children) ? children : children ? [children] : []

    for (let child of children) {
        const childNode = typeof child === 'string' ? document.createTextNode(child) : child
        node.appendChild(childNode)
    }

    return node
}
