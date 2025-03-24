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
        userRole: (state) => state.user?.role || null,
        userRole: (state) => state.user?.role === 'ADMIN',
        userRole: (state) => state.user?.role === 'OWNER',
        userRole: (state) => state.user?.role === 'CASHIER',
    },
    actions:{
        async login(email, password){
            try {
                const config = useRuntimeConfig()
                const response = await axios.post(`${config.public.apiBase}/api/auth/login`, {
                    email, 
                    password
                })

                const {token} = response.data
                this.token = token
                this.user = jwtDecode(token)

                localStorage.setItem('token', token)

                return {success: true}
            } catch (error) {
                return{
                    succes:false,
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
           if(token){
               try{
                const decoded = jwtDecode(token)
                const currentTime = Date.now() / 1000
                if(decoded.exp > currentTime){
                    this.token = token
                    this.user = decoded
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