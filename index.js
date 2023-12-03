
function nope () {}
const attr = 'component'
const selector = `[${attr}]`

class DOM {
  constructor(node) {
    this.node = node
    this.children = []
    this.type = 'static'
    this.root = false
    this.map = {}
  }
  async node_onupdate() {
    await (this.node.onupdate || nope)()
  }
  async node_onunload() {
    await (this.node.onunload || nope)()
  }
  async update() {
    for (const child of this.children) {
      await child.update()
    }
    await this.node_onupdate()
  }
  async unload() {
    for (const child of this.children) {
      await child.unload()
    }
    await this.node_onunload()
    this.children = []
    this.map = {}
  }

  push(child_dom, root_dom) {
    this.children.push(child_dom)
    const id = child_dom.node.id
    if (!id) return
    root_dom.map[id] = child_dom
  }
}

export const render = async (node, vnode = {}, context, root) => {
  const {
    template,
    components = {},

    onload = nope,
  } = vnode

  const dom = new DOM(node)
  if (!root) {
    root = dom
    dom.root = true
  }

  if (typeof template === 'string') {
    node.innerHTML = template
  }

  const maybe_child_vnode = await onload(node, context, root)
  if (maybe_child_vnode) {
    const child_dom = await render(node, maybe_child_vnode, context, root)
    dom.push(child_dom, root)
    dom.type = 'dynamic'
    return dom
  }

  for (const child of node.querySelectorAll(selector)) {
    const name = child.getAttribute(attr)
    const child_vnode = components[name]
    if (!child_vnode) {
      continue
    }
    const child_dom = await render(child, child_vnode, context, root)
    dom.push(child_dom, root)
  }

  await dom.node_onupdate()

  return dom
}

export const mount = async (root, vnode, context) => {
  let dom

  window.onpopstate = async () => {
    if (dom) {
      await dom.unload()
    }
    dom = await render(root, vnode, context)
  }
  await window.onpopstate()
}

import {
  init,
  classModule,
  propsModule,
  styleModule,
  eventListenersModule,
  attributesModule,
  datasetModule,
  h as hh,
} from "snabbdom"

const patch = init([
  classModule,
  propsModule,
  styleModule,
  eventListenersModule,
  attributesModule,
  datasetModule,
])

export function h (node, props, children) {

  if (typeof node === 'string') {
    return hh(node, props, children)
  }

  node.old = patch(node.old || node, hh(node.tagName, props, children))

  return node
}
