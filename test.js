
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import * as bootstrap from 'bootstrap'
import { render, mount } from './index.js'

const counter = {
  onload: (el, ctx, dom) => {
    el.onupdate = () => {
      el.textContent = `count is ${ctx.count}`
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
    <div class="d-flex">
      <ul class="navbar-nav">
        <li class="nav-item">
          <a class="nav-link" href='#/login'>Login</a>
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

const login = {
  template: `
    <div component='nav'></div>
    <h1>Login</h1>
<form class="w-50 mx-auto">
  <div class="mb-3">
    <label for="exampleInputEmail1" class="form-label">Email address</label>
    <input type="email" class="form-control" id="exampleInputEmail1" aria-describedby="emailHelp">
    <div id="emailHelp" class="form-text">We'll never share your email with anyone else.</div>
  </div>
  <div class="mb-3">
    <label for="exampleInputPassword1" class="form-label">Password</label>
    <input type="password" class="form-control" id="exampleInputPassword1">
  </div>
  <div class="mb-3 form-check">
    <input type="checkbox" class="form-check-input" id="exampleCheck1">
    <label class="form-check-label" for="exampleCheck1">Check me out</label>
  </div>
  <button type="submit" class="btn btn-primary">Submit</button>
</form>
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
      case "#/login": {
        component = login
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
