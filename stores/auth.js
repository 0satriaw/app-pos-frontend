import {defineStore } from 'pinia'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        token: null,
    }),
    getters: {
        isAuthenticated: (state) => !!state.user,
        userRole: (state) => state.user?.roleName || null,
        isAdmin: (state) => state.user?.roleName === 'ADMIN',
        isOwner: (state) => state.user?.roleName === 'OWNER',
        isCashier: (state) => state.user?.roleName === 'CASHIER',
    },
    actions:{
        async login(email, password){
            try {
                const config = useRuntimeConfig()
                console.log(config.public.apiBaseUrl);
                const response = await axios.post(`${config.public.apiBaseUrl}/api/auth/login`, {
                    email, 
                    password
                })

                const data = response.data.data
                this.token = data.token
                this.user = JSON.parse(JSON.stringify(data.user));

                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                console.log('User set in state:', this.user);
                console.log('Token set in state:', this.token);
                return {success: true}
            } catch (error) {
                return{
                    success:false,
                    message: error.response?.data?.message || 'Login failed'                
                }
            }
        },
        async logout(){
            this.token = null
            this.user = null
            localStorage.removeItem('token')
            navigateTo('/login')
        },
        async initAuth(){
           const token = localStorage.getItem('token')
           const user = localStorage.getItem('user')
           if(token){
               try{
                const decoded = jwtDecode(token)
                const currentTime = Date.now() / 1000
                if(decoded.exp > currentTime){
                    this.token = token
                    this.user = JSON.parse(user);
                    return true
               }else{
                this.logout()
                return false
               }
           }catch(error){
               this.logout()
               return false
           }
        }
            return false
        }
    }
});