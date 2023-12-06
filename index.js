
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

function create_node({type, data}, appended = []) {
  switch (type) {
    case 'text': {
      const node = document.createTextNode(data)
      return node
    }
    case 'element': {
      const { tag, props, children } = data
      const node = document.createElement(tag)
      patch_props(node, props)
      patch_children(node, children, appended)
      if (typeof node.onload === 'function') {
        appended.push(node)
      }
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

// patch children on the fly
function patch_children(node, next_children, appended = []) {

  const current_children = node.childNodes
  let current_length = current_children.length
  const next_length = next_children.length

  const current_children_id_map = Array.from(node.childNodes).reduce((m, d) => d.id ? {...m, [d.id]: d} : m, {})

  let current_index = 0
  let next_index = 0

  while (current_index < current_length && next_index < next_length) {
    const current_child = current_children[current_index]
    const next = next_children[next_index]

    if (next.type === 'element') {
      // element
      const { tag, props = {}, children } = next.data
      if (current_child.nodeType === 1 && current_child.tagName.toLowerCase() === tag.toLowerCase()) {
        // a element and tagName is same
        const next_id = String(props.id)
        if (current_child.id && next_id) {
          // use id
          if (current_child.id === next_id) {
            // the same id node
            patch_node(current_child, props, children, appended)
          } else {
            const found = current_children_id_map[next_id]
            if (found === undefined) {
              // create a node
              const next_child = create_node(next, appended)
              node.insertBefore(next_child, current_child)
              current_length++
            } else {
              // move a node
              node.insertBefore(found, current_child)
              patch_node(found, props, children, appended)
            }
          }
        } else {
          // no id
          patch_node(current_child, props, children, appended)
        }
      } else {
        // not a element or tagName is different
        const next_child = create_node(next, appended)
        node.replaceChild(next_child, current_child)
      }
    } else if (next.type === 'text') {
      // text
      if (current_child.nodeType === 3) {
        // a text node
        if (current_child.textContent !== next.data) {
          // text content changed
          current_child.textContent = next.data
        }
      } else {
        // not a text node
        const next_child = create_node(next, appended)
        node.replaceChild(next_child, current_child)
      }
    }
    current_index++
    next_index++
  }

  // remove unused node
  while (current_index < current_length) {
    const current_child = current_children[current_index]
    node.removeChild(current_child)
    current_index++
  }

  // create new node
  while (next_index < next_length) {
    const next = next_children[next_index]
    const next_child = create_node(next, appended)
    node.appendChild(next_child)
    next_index++
  }
}

function patch_node(node, props, children, appended) {
  patch_props(node, props)
  patch_children(node, children, appended)
  return node
}

export function h(tag, props, children) {
  if (typeof tag === 'string') {
    return create_vnode(tag, props, children)
  }

  // collect node with node.onload defined
  const appended = []
  patch_node(tag, props, children, appended)

  appended.forEach(node => node.onload(node))

  return tag
}

