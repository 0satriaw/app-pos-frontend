import { defineNuxtPlugin } from '#app';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import 'primeicons/primeicons.css'; //icons
export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(PrimeVue, { 
        theme: 'none',
        ripple: true 
    });
    nuxtApp.vueApp.use(ToastService);

});