
import { render, mount } from './index.js'

const counter = {
  onload: (el, ctx, dom) => {
    el.onupdate = () => {
      el.textContent = ctx.count
    }
    el.onunload = () => {
      console.log('unload counter')
    }
    el.onclick = () => {
      ctx.count++
      dom.update()
    }
  },
}

const nav = {
  template: `
<a href='#/'>home</a>
<a href='#/about'>about</a>
  `,
  onload: (el) => {
    const hash = location.hash || '#/'
    for (const a of el.querySelectorAll('a')) {
      if (a.hash === hash) {
        a.style.color = 'red'
      }
    }
  },
}

const home = {
  template: `
    <p component='nav'></p>
    <h1>home</h1>
    <p><button component='counter'></button></p>
  `,
  components: {
    nav,
    counter,
  },
}

const about = {
  template: `
    <p component='nav'></p>
    <h1>about</h1>
  `,
  components: {
    nav,
  },
}

const router = {
  onload: (el, ctx) => {
    const hash = location.hash
    let component = home
    switch (location.hash) {
      case "#/home": {
        component = home
        break
      }
      case "#/about": {
        component = about
        break
      }
    }
    return component
  },
}

const context = {
  count: 0,
}

const root = document.querySelector('[app]')

mount(root, router, context)
