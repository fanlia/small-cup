
function nope () {}
const attr = 'component'
const selector = `[${attr}]`

class DOM {
  constructor(node) {
    this.node = node
    this.children = []
    this.type = 'static'
    this.root = false
  }
  node_onupdate() {
    (this.node.onupdate || nope)()
  }
  node_onunload() {
    (this.node.onunload || nope)()
  }
  update() {
    for (const child of this.children) {
      child.update()
    }
    this.node_onupdate()
  }
  unload() {
    for (const child of this.children) {
      child.unload()
    }
    this.node_onunload()
    this.children = []
  }
}

export const render = (node, vnode = {}, context, root) => {
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

  const maybe_child_vnode = onload(node, context, root)
  if (maybe_child_vnode) {
    const child_dom = render(node, maybe_child_vnode, context, root)
    dom.children.push(child_dom)
    dom.type = 'dynamic'
    return dom
  }

  for (const child of node.querySelectorAll(selector)) {
    const name = child.getAttribute(attr)
    const child_vnode = components[name]
    if (!child_vnode) {
      continue
    }
    const child_dom = render(child, child_vnode, context, root)
    dom.children.push(child_dom)
  }

  dom.node_onupdate()

  return dom
}

export const mount = (root, vnode, context) => {
  let dom

  window.onpopstate = () => {
    if (dom) {
      dom.unload()
    }
    dom = render(root, vnode, context)
    console.log(dom)
  }
  window.onpopstate()

  return dom
}
