<template>
    <div class="min-h-screen flex items-center justify-center">
        <Card class="w-full max-w-md p-4 shadow-lg">
            <template #title>
                <h1 class="text-center text-2xl font-bold">POS System Login</h1>
            </template>
            <template #content>
                <form @submit.prevent="handleLogin" class="space-y-4">
                    <div class="flex flex-col">
                        <label for="email" class="mb-1 text-sm text-gray-600">Email</label>
                        <InputText id="email" v-model="email" type="email" placeholder="Enter you email" class="p-inputtext-sm" :class="{'p-invalid' : errors.email}" />
                        <small v-if="errors.email" class="text-red-500">{{ errors.email }}</small>
                    </div>

                    <div class="flex flex-col">
                        <label for="password" class="mb-1 text-sm text-gray-600">Password</label>
                        <InputText id="password" v-model="password" type="password" placeholder="Enter you password" class="p-inputtext-sm" :class="{'p-invalid' : errors.password}" />
                        <small v-if="errors.password" class="text-red-500">{{ errors.password }}</small>
                    </div>
                    <Button type="submit" label="Login" icon="pi pi-sign-in" class="w-full"  :loading="loading"/>
                    
                    <p class="text-center text-red-500" v-if="errorMessage">{{ errorMessage }}</p>
                </form>
            </template>
        </Card>
    </div>
</template>

<script setup>
import {ref} from 'vue'
import { useToast } from 'primevue/usetoast';
import { useAuthStore } from '#imports';

definePageMeta({
    layout: 'blank',
    title: 'Login'
})

const authStore = useAuthStore()
const toast = useToast()

const email=ref('')
const password=ref('')
const loading=ref(false)
const errors =({})
const errorMessage = ref('')

const validateForm = () =>{
    const newErrors = {}

    if (!email.value) newErrors.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(email.value)) newErrors.email = 'Please enter a valid email'
  
    if (!password.value) newErrors.password = 'Password is required'
    else if (password.value.length < 6) newErrors.password = 'Password must be at least 6 characters'
  
    errors.value = newErrors
    return Object.keys(newErrors).length === 0

}

const handleLogin = async () => {
    if(!validateForm()) return

    loading.value = true
    errorMessage.value=''

    try {
        const result = await authStore.login(email.value, password.value)

        if(result.success==true){
            console.log('inside if');
            console.log('Login successful')
            toast.add({
                severity:'success',
                summary:'Login Successful',
                detail: 'Welcome back',
                life:3000
            })
            console.log('Navigating to dashboard')
            navigateTo('/dashboard')
        }else{
            toast.add({
                severity:'failed',
                summary:'Login Failed',
                detail: 'Invalid credentials',
                life:3000
            })
            errorMessage.value =result.message
        }
    } catch (error) {
        errorMessage.value = 'An unexpected error occured'
        console.error(error)
    }finally{
        
        loading.value=false
    }
}
</script>

<style scoped>

</style>
