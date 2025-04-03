import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import ParamInputs from './components/workflow/node-props/param-inputs';
import ModuleIcon from './components/common/ModuleIcon.vue';

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Antd)
app.use(ParamInputs)
app.component('ModuleIcon', ModuleIcon)
app.mount('#app')
