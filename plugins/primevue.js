import { defineNuxtPlugin } from '#app';
import PrimeVue from 'primevue/config';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import Menu from 'primevue/menu';
import Sidebar from 'primevue/sidebar';

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(PrimeVue, { ripple: true });
    nuxtApp.vueApp.use(ToastService);

    nuxtApp.vueApp.component('Button', Button);
    nuxtApp.vueApp.component('InputText', InputText);
    nuxtApp.vueApp.component('Dropdown', Dropdown);
    nuxtApp.vueApp.component('Toast', Toast);
    nuxtApp.vueApp.component('DataTable', DataTable);
    nuxtApp.vueApp.component('Column', Column);
    nuxtApp.vueApp.component('Card', Card);
    nuxtApp.vueApp.component('Dialog', Dialog);
    nuxtApp.vueApp.component('Menu', Menu);
    nuxtApp.vueApp.component('Sidebar', Sidebar);
});