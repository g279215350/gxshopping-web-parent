import Login from './views/Login.vue'
import NotFound from './views/404.vue'
import Home from './views/Home.vue'
import Main from './views/Main.vue'
import Table from './views/nav1/Table.vue'
import Form from './views/nav1/Form.vue'
import user from './views/nav1/user.vue'
import Brand from './views/product/Brand.vue'
import Type from "./views/product/Type";
import Module from "./views/product/Module";
import Manager from "./views/product/Manager";
import Specification from "./views/product/Specification";
import Echarts from './views/charts/echarts.vue'

let routes = [
    {
        path: '/login',
        component: Login,
        name: '',
        hidden: true
    },
    {
        path: '/404',
        component: NotFound,
        name: '',
        hidden: true
    },
    //{ path: '/main', component: Main },
    {
        path: '/',
        component: Home,
        name: '',
        iconCls: 'fa fa-address-card',
        leaf: true,//只有一个节点
        children: [
            { path: '/mainPage', component: Echarts, name: '主页' }
        ]
    },
    {
        path: '/',
        component: Home,
        name: '商品模块',
        iconCls: 'fa fa-id-card-o',
        children: [
            { path: '/brand', component: Brand, name: '商品品牌' },
            { path: '/type', component: Type, name: '商品类型' },
            { path: '/module', component: Module, name: '商品模板' },
            { path: '/specification', component: Specification, name: '商品规格' },
            { path: '/manager', component: Manager, name: '商品管理' }
        ]
    },
    {
        path: '/',
        component: Home,
        name: '导航一',
        iconCls: 'el-icon-message',//图标样式class
        children: [
            { path: '/table', component: Table, name: 'Table' },
            { path: '/form', component: Form, name: 'Form' },
            { path: '/user', component: user, name: '列表' },
        ]
    },
    {
        path: '*',
        hidden: true,
        redirect: { path: '/404' }
    }
];

export default routes;