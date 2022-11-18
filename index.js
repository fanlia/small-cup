
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
            const _onunload = node.onunload || nope
            const onunload = () => {
                hUnload(node)
                _onunload()
            }

            onupdate()

            elements.push({ onupdate, onunload })
            hLoad(node)
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
        if (tag === '<>') {
            node = document.createDocumentFragment()
        } else {
            node = document.createElement(tag)
        }
    } else {
        node = tag
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

    node.is_h = true

    if (node.loaded) {
        hUnload(node)
        node.innerHTML = ''
    }

    children = Array.isArray(children) ? children : children ? [children] : []

    for (let child of children) {
        if (!child) continue
        const childNode = typeof child === 'object' ? child :  document.createTextNode(String(child))
        node.appendChild(childNode)
    }

    if (node.loaded) {
        hLoad(node)
    }

    return node
}

const hTranverseAfter = (node, fn) => {
    if (node.nodeType !== 1) return
    for (let child of node.childNodes) {
        if (child.nodeType !== 1 || !child.is_h) continue
        hTranverseAfter(child, fn)
        fn(child)
    }
}

const hTranverseBefore = (node, fn) => {
    if (node.nodeType !== 1) return
    for (let child of node.childNodes) {
        if (child.nodeType !== 1 || !child.is_h) continue
        fn(child)
        hTranverseBefore(child, fn)
    }
}

const hUnload = (parentNode) => {
    hTranverseAfter(parentNode, node => {
        node.loaded = false
        if (!isFunction(node.onunload)) return
        node.onunload(node)
    })
}

const hLoad = (parentNode) => {
    hTranverseBefore(parentNode, node => {
        node.loaded = true
        if (!isFunction(node.onload)) return
        node.onload(node)
    })
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
    if (e.target.href === location.href) return
    navigate(e.target.href)
}

function normalizePathname (pathname = '/') {
    return pathname.replace(/^(#\/|#|\/)?/, '/')
}

let routeType

function getHref (href = '') {
    return routeType === 'hash' && href[0] === '/' ? `#${href}` : href
}

export function a (el, ctx) {

    el.setAttribute('href', getHref(el.getAttribute('href')))

    el.onclick = clicka
    const activeRouteClass = el.dataset.activeRouteClass
    const pathname = normalizePathname(el.getAttribute('href'))
    if (activeRouteClass && pathname === ctx.$route.path) {
        el.classList.add(activeRouteClass)
    }
}

export function link (props = {}, children) {
    return h('a', {
        ...props,
        href: getHref(props.href),
        onclick: clicka,
    }, children)
}

export function onpathname (app, options = {}) {
    routeType = options.routeType || 'pathname'

    onpopstate = () => {
        const pathname = normalizePathname(location[routeType])
        app(pathname)
    }
    onpopstate()
}
