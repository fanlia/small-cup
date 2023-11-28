
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
    this.map[id] = child_dom
    if (this.root) return
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

export function h (tag, props = {}, children) {
  if (!tag) return

  let node
  let isOld = false

  if (typeof tag === 'string') {
    if (tag === '<>') {
        node = document.createDocumentFragment()
    } else {
        node = document.createElement(tag)
    }
  } else {
    node = tag
    isOld = true
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

  if (isOld) {
    node.innerHTML = ''
  }

  children = Array.isArray(children) ? children : children ? [children] : []

  for (let child of children) {
    if (!child) continue
    const childNode = typeof child === 'object' ? child :  document.createTextNode(String(child))
    node.appendChild(childNode)
  }

  return node
}
