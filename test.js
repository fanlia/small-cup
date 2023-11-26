
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import * as bootstrap from 'bootstrap'
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
<nav class="navbar navbar-expand-lg bg-body-tertiary mb-3">
  <div class="container-fluid">
    <a class="navbar-brand" href="#/"><i class="bi bi-house"></i></a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav">
        <li class="nav-item">
          <a class="nav-link" href='#/'>Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href='#/about'>About</a>
        </li>
      </ul>
    </div>
  </div>
</nav>
  `,
  onload: (el) => {
    const hash = location.hash || '#/'
    for (const a of el.querySelectorAll('a.nav-link')) {
      if (a.hash === hash) {
        a.classList.add('active')
      }
    }
  },
}

const home = {
  template: `
    <div component='nav'></div>
    <h1>Home</h1>
    <p><button component='counter' class="btn btn-primary"></button></p>
  `,
  components: {
    nav,
    counter,
  },
}

const about = {
  template: `
    <div component='nav'></div>
    <h1>About</h1>
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
