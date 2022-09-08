
import { match, compile } from 'path-to-regexp'

function road (routes = []) {

    const routesObj = {}

    for (const { name, path } of routes) {
        if (!name || !path) continue
        routesObj[name] = {
            match: match(path, { decode: decodeURIComponent }),
            compile: compile(path, { encode: encodeURIComponent }),
        }
    }

    function parse (path) {
        let result = {
            route: {},
            routeResult: {},
        }

        if (path) {
            for (const route of routes) {
                const ro = routesObj[route.name]
                const routeResult = ro && ro.match(path)
                if (routeResult) {
                    result = { route, routeResult }
                    break
                }
            }
        }

        return result
    }

    function stringify (name, params) {
        const ro = routesObj[name]
        return ro && ro.compile(params)
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

            elements.push({ onupdate, onunload })
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
    for (const step of steps) {
        if (!isFunction(step)) continue
        await step(context)
    }
}

export default function cup (options = {}) {
    const {
        context,
        components,
        routes,
        doc = document,
    } = options

    const { parse, stringify } = road(routes)

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
        const { route, routeResult } = parse(path)

        const flow = [
            route.before,
            render,
            route.after,
        ]

        context.$route = routeResult
        context.$router = stringify
        context.$root = root

        return serially(context, flow)
    }
}

export function h (tag, props = {}, children) {
    if (!tag) return

    let node

    if (typeof tag === 'string') {
        node = tag === '<>' ? document.createDocumentFragment() : document.createElement(tag)
    } else {
        node = tag
        node.innerHTML = ''
    }

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
        if (!child) continue
        const childNode = typeof child === 'object' ? child :  document.createTextNode(String(child))
        node.appendChild(childNode)
    }

    return node
}

export function navigate (path, replace = false) {
    if (replace) {
        history.replaceState(null, null, path)
    } else {
        history.pushState(null, null, path)
    }
    dispatchEvent(new Event('popstate'))
}

function clicka (e) {
    e.preventDefault()
    navigate(e.target.href)
}

export function a (el) {
    el.onclick = clicka
}

export function link (props = {}, children) {
    return h('a', {
        ...props,
        onclick: clicka,
    }, children)
}

export function onpathname (app) {
    onpopstate = () => {
        app(location.pathname)
    }
    onpopstate()
}
