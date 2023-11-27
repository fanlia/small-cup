
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import * as bootstrap from 'bootstrap'
import { render, mount } from './index.js'

const KEY = 'access_token'

const AccessToken = {
  set: access_token => access_token ? localStorage.setItem(KEY, access_token) : localStorage.removeItem(KEY),
  get: access_token => localStorage.getItem(KEY),
}

export class Auth {
  constructor(options = {}) {
    this.options = options
    this.user = null
    this.access_token = null
  }

  async me (access_token, autoLogin) {
    if (!access_token) return null
    try {
      this.user = await this.options.fetchUser(access_token)
      this.access_token = access_token
      if (autoLogin) AccessToken.set(access_token)
      return this.user
    } catch (e) {
      // ignore error
      return null
    }
  }

  getUser () {
    return this.user
  }

  async login (signData = {}) {
    const access_token = await this.options.signin(signData)
    return this.me(access_token, signData.autoLogin)
  }

  async logout () {
    AccessToken.set(null)
    this.access_token = null
    this.user = null
  }

  async checkin () {
    if (this.access_token && this.user) {
      return this.user
    }
    const access_token = AccessToken.get()
    return this.me(access_token)
  }
}
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
        <li class="nav-item" id="login">
          <a class="nav-link" href='#/login'>Login</a>
        </li>
        <li class="nav-item dropdown" id="user">
          <button class="nav-link dropdown-toggle" id="username" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            Dropdown
          </button>
          <ul class="dropdown-menu">
            <li><button class="dropdown-item" id="logout">Logout</button></li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</nav>
  `,
  onload: async (el, ctx) => {
    const hash = location.hash || '#/'
    for (const a of el.querySelectorAll('a.nav-link')) {
      if (a.hash === hash) {
        a.classList.add('active')
      }
    }

    const $login = el.querySelector('#login')
    const $user = el.querySelector('#user')

    if (!ctx.user) {
      $login.style.display = ''
      $user.style.display = 'none'

      return
    }

    $login.style.display = 'none'
    $user.style.display = ''

    const $username = el.querySelector('#username')
    $username.innerHTML = `<i class="bi bi-person-circle"></i><span class="ms-1">${ctx.user.username}<span>`
    const $logout = el.querySelector('#logout')
    $logout.onclick = async () => {
      try {
        await auth.logout()
        ctx.user = null
        location.hash = '#/login'
      } catch (e) {
        console.error('logout failed', e)
        alert('logout failed')
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

const auth = new Auth({
  fetchUser: async (access_token) => {
    return {
      username: 'username',
    }
  },

  signin: async (signData) => {
    return 'access_token sample'
  },
})

const login = {
  template: `
    <div component='nav'></div>
    <h1>Login</h1>
<form class="w-50 mx-auto">
  <div class="mb-3">
    <label for="exampleInputEmail1" class="form-label">Email address</label>
    <input type="email" class="form-control" id="exampleInputEmail1" name="email" aria-describedby="emailHelp">
    <div id="emailHelp" class="form-text">We'll never share your email with anyone else.</div>
  </div>
  <div class="mb-3">
    <label for="exampleInputPassword1" class="form-label">Password</label>
    <input type="password" class="form-control" id="exampleInputPassword1" name="password">
  </div>
  <div class="mb-3 form-check">
    <input type="checkbox" class="form-check-input" id="exampleCheck1" name="autoLogin">
    <label class="form-check-label" for="exampleCheck1">Rememeber me</label>
  </div>
  <button type="submit" class="btn btn-primary">Submit</button>
</form>
  `,
  onload: async (el, ctx) => {
    const $form = el.querySelector('form')
    $form.onsubmit = async (e) => {
      e.preventDefault()
      const signData = Array.from(new FormData(e.target)).reduce((m, d) => ({...m, [d[0]]: d[1]}), {})
      try {
        await auth.login(signData)
        location.hash = ctx.login_redirect || '#/'
      } catch (e) {
        console.error('login failed', e)
        alert('login failed')
      }
    }
  },
  components: {
    nav,
  },
}

const checkin = async (ctx) => {
  const user = await auth.checkin()
  if (user) {
    ctx.user = user
  } else {
    if (location.hash !== '#/login') {
      ctx.login_redirect = location.hash
      history.replaceState(null, null, '#/login')
    }
  }
}

const router = {
  onload: async (el, ctx) => {
    await checkin(ctx)
    switch (location.hash) {
      case "":
      case "#/":
      case "#/home": {
        return home
      }
      case "#/about": {
        return about
      }
      case "#/login": {
        return ctx.user ? home : login
      }
    }
  },
}

const context = {
  count: 0,
}

const root = document.querySelector('[app]')

mount(root, router, context)
