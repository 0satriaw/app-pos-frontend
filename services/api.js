import axios from "axios";
import { error } from "console";
import { config } from "process";

class ApiService{
    constructor(){
        this.axios = axios.create({
            baseURL: useRuntimeConfig().public.apiBaseUrl,
            headers:{
                'Content-Type': 'application/json',
            }
        })

        this.axios.interceptors.request.use(
            config=>{
                const token = localStorage.getItem('token')
                if(token){
                    config.headers['Authorization'] = `Bearer ${token}`
                }
                return config
            },
            error => Promise.reject(error)
        )
        
        this.axios.interceptors.response.use(
            response => response,
            error => {
                if(error.response?.status === 401){
                    localStorage.removeItem('token')
                    navigateTo('/login')
            }
                return Promise.reject(error)
            }
        )
    }

    get(resource, params){
        return this.axios.get(resource, {params})
    }

    post(resource, data){
        return this.axios.post(resource, data)
    }

    put(resource, data){
        return this.axios.put(resource, data)
    }

    delete(resource){
        return this.axios.delete(resource)
    }
}

export default new ApiService();