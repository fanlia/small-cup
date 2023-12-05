
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

function create_vnode(tag, props = {}, children = []) {
  children = Array.isArray(children) ? children : [children]
  children = children.map(d => {
    if (typeof d === 'object' && d) {
      return d
    }
    return {
      type: 'text',
      data: String(d),
    }
  })

  return {
    type: 'element',
    data: {
      tag,
      props,
      children,
    },
  }
}

function create_node({type, data}, parent) {
  switch (type) {
    case 'text': {
      const node = document.createTextNode(data)
      if (parent) {
        parent.appendChild(node)
      }
      return node
    }
    case 'element': {
      const { tag, props, children } = data
      const node = document.createElement(tag)
      if (parent) {
        parent.appendChild(node)
      }
      patch_props(node, props)
      patch_children(node, children)
      return node
    }
    default: {
      throw new Error(`unkown vnode type: ${type}`)
    }
  }
}

function patch_props(node, props) {
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
}

function child_onload(next_child) {
  (next_child.onload || nope)(next_child)
}

function patch_children(node, next_children) {

  const current_children = Array.from(node.childNodes)
  const current_length = current_children.length
  const next_length = next_children.length
  const length = current_length > next_length ? next_length : current_length

  let index = 0

  while (index < length) {
    const current_child = current_children[index]
    const next = next_children[index]

    if (next.type === 'element') {
      const { tag, props, children } = next.data
      if (current_child.nodeType === 1 && current_child.tagName.toLowerCase() === tag.toLowerCase()) {
        patch_node(current_child, props, children)
      } else {
        const next_child = create_node(next)
        node.replaceChild(next_child, current_child)
        child_onload(next_child)
      }
    } else if (next.type === 'text') {
      if (current_child.nodeType === 3) {
        if (current_child.textContent !== next.data) {
          current_child.textContent = next.data
        }
      } else {
        const next_child = create_node(next)
        node.replaceChild(next_child, current_child)
      }
    }
    index++
  }

  while (index < current_length) {
    const current_child = current_children[index]
    node.removeChild(current_child)
    index++
  }

  while (index < next_length) {
    const next_child = create_node(next_children[index], node)
    child_onload(next_child)
    index++
  }
}

function patch_node(node, props, children) {
  patch_props(node, props)
  patch_children(node, children)
  return node
}

export function h(tag, props, children) {
  if (typeof tag === 'string') {
    return create_vnode(tag, props, children)
  }
  return patch_node(tag, props, children)
}

