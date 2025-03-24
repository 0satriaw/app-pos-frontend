import { useAuthStore } from "#imports";

export default defineNuxtRouteMiddleware(() => {
    const authStore = useAuthStore();
    const isAuthenticated =authStore.isAuthenticated;

    const publicRoutes = ['/login'];

    if(!isAuthenticated && publicRoutes.includes(to.path)){
        return navigateTo('/login');
    }

    if(isAuthenticated){
        const userRole = authStore.userRole;
        
        const adminRoutes = ['/users','/stores', '/categories','/products'];
        
        const ownnerRoutes = ['/stores','/products'];

        const cashierRoutes = ['/orders'];
        
        if(adminRoutes.some(route => to.path.startsWith(route)) && userRole !== 'ADMIN'){
            return navigateTo('/dashboard');
        }

        if(ownnerRoutes.some(route => to.path.startsWith(route)) && userRole !== 'OWNER'){
            return navigateTo('/dashboard');
        }

        if(cashierRoutes.some(route => to.path.startsWith(route)) && userRole !== 'CASHIER'){
            return navigateTo('/dashboard');
        }


        if(publicRoutes.includes(to.path)){
            return navigateTo('/dashboard');
        }
    }


});