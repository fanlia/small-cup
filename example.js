
import cup from './index.js'

const context = {
    count: 0,
}

const components = {
    counter: (el, ctx) => {
        el.onupdate = () => {
            el.textContent = ctx.count
        }
    },
    inc: (el, ctx, render) => {
        el.onclick = () => {
            ctx.count++
            render()
        }
    },
    echarts: (el, ctx, render) => {
        const myChart = echarts.init(el)

        const option = {
            title: {
                text: 'ECharts Getting Started Example'
            },
            tooltip: {},
            legend: {
                data: ['sales']
            },
            xAxis: {
                data: ['Shirts', 'Cardigans', 'Chiffons', 'Pants', 'Heels', 'Socks']
            },
            yAxis: {},
            series: [
                {
                    name: 'sales',
                    type: 'bar',
                    data: [5, 20, 36, 10, 10, 20]
                }
            ]
        }

        myChart.setOption(option)

        el.onunload = () => {
            myChart.dispose()
            console.log('unloaded')
        }
    },
}

const nav = `
<p>
<a href='#/'>home</a>
<a href='#/about'>abount</a>
</p>
`

const home = `
    ${nav}
    <h1>home</h1>
    <p>count is <span component='counter'></span></p>
    <p><button component='inc'>+</button></p>
`

const about = `
    ${nav}
    <h1>about</h1>
    <div component='echarts' style='width: 100%;height:400px;'></div>
`

const routes = [
    {
        name: 'home',
        path: '/',
        before: (ctx) => {
            ctx.$root.innerHTML = home
        },
    },
    {
        name: 'about',
        path: '/about',
        before: async (ctx) => {
            ctx.$root.innerHTML = about
            window.echarts = await import('echarts')
        },
    },
]

const app = cup({
    context,
    components,
    routes,
})

window.onhashchange = () => {
    const hash = window.location.hash.replace('#', '') || '/'
    app(hash)
}

window.onhashchange()
