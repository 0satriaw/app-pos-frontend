<template>
    <div>Redirecting...</div>
</template>

<script setup>
const authStore = useAuthStore()

onMounted(() =>{
    if(authStore.initAuth() && authStore.isAuthenticated){
        navigateTo('/dashboard')
    }else{
        navigateTo('/login')
    }
})

</script>

<style scoped>
/* Your styles go here */
</style>