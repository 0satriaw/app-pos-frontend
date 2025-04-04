<template>
    <div class="min-h-screen flex flex-col">
        <Toast/>

        <!--Top Nav Bar-->
        <nav class="bg-gray-700 text-white shadow-md p-4">
            <div class="container mx-auto flex justify-between items-center">
                <div class="flex items-center space-x-4">
                    <!-- <img src="/logo.png" alt="Logo" class="h-8 w-8 rounded-full"/> -->
                    <NuxtLink to="/" class="text-xl font-bold">POS System</NuxtLink>

                </div>

                <div class="flex items-center space-x-4">
                    <span>{{ user?.name }}</span>
                    <Menu :model="menuItems" :popup="true" ref="menu" />
                    <Button icon="pi pi-user" @click="toggleMenu" class="p-button-rounded p-button-text p-button-plain"/>
                    
                    <!-- <Button @click="logout" icon="pi pi-sign-out" class="p-button-rounded p-button-danger p-button-text"/> -->
                </div>
            </div>
        </nav>

        <div class="flex flex-1">
            <!--Side Bar for authenticated user-->
            <aside v-if="isAuthenticated" class="shadow-md w-64">
                <div class="p-4">
                    <div class="font-medium text-gray-200">MENU</div>
                
                    <div class="mt-4 space-y-2">
                        <NuxtLink to="/dashboard" class="block p-2 rounded hover:bg-gray-200">
                            <i class="pi pi-home mr-2"></i> Dashboard
                        </NuxtLink>
                        <!-- Admin Links -->
                        <template v-if="isAdmin">
                            <NuxtLink to="/users" class="block p-2 rounded hover:bg-gray-200">
                                <i class="pi pi-users mr-2"></i> Users
                            </NuxtLink>
                            <NuxtLink to="/stores" class="block p-2 rounded hover:bg-gray-200">
                                <i class="pi pi-building mr-2"></i> Stores
                            </NuxtLink>

                            <NuxtLink to="/categories" class="block p-2 rounded hover:bg-gray-200">
                                <i class="pi pi-box mr-2"></i> Categories
                            </NuxtLink>
                        </template>

                        <!-- Owner Link -->
                        <template v-if="isOwner">
                            <NuxtLink to="/my-stores" class="block p-2 rounded hover:bg-gray-200">
                                <i class="pi pi-users mr-2"></i> My Stores
                            </NuxtLink>
                            <NuxtLink to="/products" class="block p-2 rounded hover:bg-gray-200">
                                <i class="pi pi-box mr-2"></i> Products
                            </NuxtLink>
                        </template>
                    
                        <!-- Cashier and Owner Links -->
                        <template v-if="isCashier || isOwner">
                            <NuxtLink to="/orders" class="block p-2 rounded hover:bg-gray-200">
                                <i class="pi pi-shopping-cart mr-2"></i> Orders
                            </NuxtLink>
                            <NuxtLink to="/new-order" class="block p-2 rounded hover:bg-gray-200">
                                <i class="pi pi-plus-circle
                                mr-2"></i> New Order
                            </NuxtLink>
                        </template>     
                    </div>
                </div>
            </aside>

            <!--Main Content-->
            <main class="flex-1 p-6 bg-gray-500 text-white">
                <slot/>
            </main>
        </div>
    </div>
</template>

<script setup>
import { NuxtLink } from '#components';
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '#imports';

const authStore = useAuthStore();
const menu =ref(null);

const isAuthenticated = computed(() => authStore.isAuthenticated);
const user = computed(() => authStore.user);
const isAdmin = computed(() => authStore.isAdmin);
const isOwner = computed(() => authStore.isOwner);
const isCashier = computed(() => authStore.isCashier);


const menuItems = [
    {
        label: 'Profile',
        icon: 'pi pi-user',
        command: () => navigateTo('/profile')
    },
    {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: () => logout()
    }
];

const toggleMenu = (event) => {
    menu.value.toggle(event);
};

const logout = () => {
    authStore.logout();
};

onMounted(() => {
    authStore.initAuth();
    
});
</script>
