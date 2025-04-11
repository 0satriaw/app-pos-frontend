<template>
    <div class="flex flex-col h-screen">
        <!-- Store Filter -->
        <div class="flex justify-between items-center mb-4 p-4 ">
            <h1 class="text-4xl font-bold">Products</h1>
            <Select
                v-model="selectedStore"
                :options="stores"
                optionLabel="name"
                placeholder="Select a Store"
                class="w-80"
            />
        </div>

        <div class="flex flex-1">
            <!-- Left Section: Product Cards -->
            <div class="flex-1 p-6 bg-gray-50 overflow-y-auto mx-2 rounded-lg shadow-lg">
                <div v-if="selectedStore">
                    <div class="flex justify-between items-center mb-6">
                        <!-- Search Bar -->
                        <InputText
                            v-model="searchQuery"
                            placeholder="Search products..."
                            class="p-inputtext w-2/3 mx-2"
                        />

                        <!-- Category Filter -->
                        <Select
                            v-model="selectedCategory"
                            :options="categories"
                            optionLabel="name"
                            placeholder="All Categories mx-2"
                            class="w-1/3"
                        />
                    </div>

                    <!-- Product Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div
                            v-for="product in filteredProducts"
                            :key="product.id"
                            class="border rounded-lg shadow-lg p-4 bg-white hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between"
                        >
                            <img
                                v-if="product.imageUrl"
                                :src="config.public.apiBaseUrl + product.imageUrl"
                                alt="Product Image"
                                class="object-cover rounded-lg mb-4"
                                style="height: 200px; width: 100%; object-fit: cover;"
                            />
                            <div class="flex-1">
                                <h3 class="text-lg font-bold mb-2 text-gray-800">{{ product.name }}</h3>
                                <p class="text-sm text-gray-600 mb-2">{{ product.description }}</p>
                                <p class="text-lg font-bold text-green-600">Rp {{ product.price.toFixed(2) }}</p>
                                <p class="text-sm font-bold text-gray-500">Stock: {{ product.stock }}</p>
                            </div>
                            <Button
                                label="Add to Order"
                                icon="pi pi-plus"
                                class="p-button-sm p-button-success mt-4"
                                @click="addToOrder(product)"
                            />
                        </div>
                    </div>
                </div>
                <div v-else class="flex items-center justify-center h-full">
                    <p class="text-gray-600 text-lg">Please select a store to view products.</p>
                </div>
            </div>

            <!-- Right Section: Order List and Payment -->
            <div class="w-1/4 bg-gray-100 p-6 flex flex-col mx-2 rounded-lg shadow-lg" style="max-height: 80vh;">
                <h2 class="text-xl font-bold mb-4 text-gray-800">Order List</h2>

                <!-- Order List -->
                <div class="flex-1 overflow-y-auto mb-4">
                    <div
                        v-for="(item, index) in orderList"
                        :key="item.id"
                        class="flex justify-between items-center border-b py-3"
                    >
                        <div>
                            <h3 class="font-bold text-gray-800">{{ item.name }}</h3>
                            <p class="text-sm text-gray-600">Rp {{ item.price.toFixed(2) }}</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <Button
                                icon="pi pi-minus"
                                class="p-button-rounded p-button-text p-button-sm"
                                @click="decreaseQuantity(index)"
                            />
                            <span class="font-bold text-gray-800">{{ item.quantity }}</span>
                            <Button
                                icon="pi pi-plus"
                                class="p-button-rounded p-button-text p-button-sm"
                                @click="increaseQuantity(index)"
                            />
                            <Button
                                icon="pi pi-trash"
                                class="p-button-rounded p-button-danger p-button-text p-button-sm"
                                @click="removeFromOrder(index)"
                            />
                        </div>
                    </div>
                </div>

                <!-- Payment Section -->
                <div class="border-t pt-4">
                    <h3 class="text-lg font-bold mb-2 text-gray-800">Total: Rp {{ totalPrice.toFixed(2) }}</h3>
                    <Button
                        label="Checkout"
                        icon="pi pi-check"
                        class="p-button-success w-full"
                        @click="checkout"
                    />
                </div>
            </div>
        </div>

        <!-- Order Details Dialog -->
        <Dialog v-model:visible="orderDetailsDialogVisible" :header="'Order Details'" :modal="true" :style="{ width: '600px' }">
            <div>
                <h3 class="text-lg font-bold mb-4">Order Summary</h3>
                <p><strong>Order ID:</strong> {{ orderDetails.id }}</p>
                <p><strong>Store:</strong> {{ orderDetails.storeName }}</p>
                <p><strong>User:</strong> {{ orderDetails.userName }}</p>
                <p><strong>Total Price:</strong> Rp {{ orderDetails.totalPrice.toFixed(2) }}</p>
                <p><strong>Status:</strong> {{ orderDetails.status }}</p>

                <h4 class="text-lg font-bold mt-4 mb-2">Items</h4>
                <ul>
                    <li v-for="item in orderDetails.items" :key="item.id" class="mb-2">
                        <div class="flex items-center space-x-4">
                            <img
                                v-if="item.productImageUrl"
                                :src="config.public.apiBaseUrl + item.productImageUrl"
                                alt="Product Image"
                                class="object-cover rounded-lg"
                                style="height: 50px; width: 50px; object-fit: cover;"
                            />
                            <div>
                                <p class="font-bold">{{ item.productName }}</p>
                                <p class="text-sm text-gray-600">{{ item.quantity }} x Rp {{ item.price.toFixed(2) }}</p>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>

            <template #footer>
                <Button label="Pay Now" icon="pi pi-credit-card" class="p-button-success" @click="payNow" />
                <Button label="Pay Later" icon="pi pi-clock" class="p-button-secondary" @click="payLater" />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import axios from "axios";
import { useAuthStore } from "#imports";

const authStore = useAuthStore();
const config = useRuntimeConfig();
const toast = useToast();

// State
const products = ref([]);
const categories = ref([]);
const stores = ref([]);
const orderList = ref([]);
const searchQuery = ref("");
const selectedCategory = ref(null);
const selectedStore = ref(null);
const loading = ref(false);
const orderDetailsDialogVisible = ref(false); // State for order details dialog visibility
const orderDetails = ref({}); // State for order details

const user = computed(() => authStore.user);

// Computed properties
const filteredProducts = computed(() => {
    if (!selectedStore.value) return [];
    return products.value.filter((product) => {
        let matchesSearch = true;
        let matchesCategory = true;
        let matchesStore = true;

        // Filter by search query
        if (searchQuery.value) {
            matchesSearch =
                product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                (product.description &&
                    product.description.toLowerCase().includes(searchQuery.value.toLowerCase()));
        }

        // Filter by category
        if (selectedCategory.value && selectedCategory.value.id) {
            matchesCategory = product.categoryId === selectedCategory.value.id;
        }

        if (selectedStore.value && selectedStore.value.id) {
            matchesStore = product.storeId === selectedStore.value.id;
        }

        return matchesSearch && matchesCategory && matchesStore;
    });
});

const totalPrice = computed(() => {
    return orderList.value.reduce((total, item) => total + item.price * item.quantity, 0);
});

// Load data on mount
onMounted(async () => {
    authStore.initAuth();
    loading.value = true;

    try {
        // Load products
        const productResponse = await axios.get(`${config.public.apiBaseUrl}/api/products/${authStore.user.id}`, {
            headers: { Authorization: `Bearer ${authStore.token}` },
        });
        products.value = productResponse.data.data || [];

        // Load categories
        const categoryResponse = await axios.get(`${config.public.apiBaseUrl}/api/categories`, {
            headers: { Authorization: `Bearer ${authStore.token}` },
        });
        categories.value = [{ id: null, name: "All Categories" }, ...categoryResponse.data.data] || [];

        // Load stores
        const storeResponse = await axios.get(`${config.public.apiBaseUrl}/api/stores`, {
            headers: { Authorization: `Bearer ${authStore.token}` },
        });
        stores.value = storeResponse.data.data.content || [];
    } catch (error) {
        console.error("Error loading data:", error);
        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load data",
            life: 3000,
        });
    } finally {
        loading.value = false;
    }
});

// Methods
const addToOrder = (product) => {
    // Ensure all products in the order are from the same store
    if (orderList.value.length > 0 && orderList.value[0].storeId !== product.storeId) {
        toast.add({
            severity: "warn",
            summary: "Warning",
            detail: "You cannot mix products from different stores.",
            life: 3000,
        });
        return;
    }

    const existingItem = orderList.value.find((item) => item.id === product.id);
    if (existingItem) {
        // Validate stock before increasing quantity
        if (existingItem.quantity + 1 > product.stock) {
            toast.add({
                severity: "warn",
                summary: "Warning",
                detail: `Only ${product.stock} items available in stock.`,
                life: 3000,
            });
            return;
        }
        existingItem.quantity++;
    } else {
        // Validate stock before adding to the order
        if (product.stock < 1) {
            toast.add({
                severity: "warn",
                summary: "Warning",
                detail: "This product is out of stock.",
                life: 3000,
            });
            return;
        }
        orderList.value.push({ ...product, quantity: 1 });
    }
};

const removeFromOrder = (index) => {
    orderList.value.splice(index, 1);
};

const increaseQuantity = (index) => {
    const item = orderList.value[index];
    const product = products.value.find((p) => p.id === item.id);

    // Validate stock before increasing quantity
    if (item.quantity + 1 > product.stock) {
        toast.add({
            severity: "warn",
            summary: "Warning",
            detail: `Only ${product.stock} items available in stock.`,
            life: 3000,
        });
        return;
    }

    item.quantity++;
};

const decreaseQuantity = (index) => {
    if (orderList.value[index].quantity > 1) {
        orderList.value[index].quantity--;
    } else {
        removeFromOrder(index);
    }
};

const checkout = async () => {
    if (!orderList.value.length) {
        toast.add({
            severity: "warn",
            summary: "Warning",
            detail: "No items in the order list",
            life: 3000,
        });
        return;
    }

    if (!selectedStore.value || !selectedStore.value.id) {
        toast.add({
            severity: "warn",
            summary: "Warning",
            detail: "Please select a store",
            life: 3000,
        });
        return;
    }

    try {
        const orderData = {
            storeId: selectedStore.value.id, // Use the selected store ID
            items: orderList.value.map((item) => ({
                productId: item.id,
                quantity: item.quantity,
            })),
        };

        const response = await axios.post(`${config.public.apiBaseUrl}/api/orders`, orderData, {
            headers: { Authorization: `Bearer ${authStore.token}` },
        });

        toast.add({
            severity: "success",
            summary: "Success",
            detail: "Order placed successfully",
            life: 3000,
        });

        // Set order details and show dialog
        orderDetails.value = response.data.data;
        orderDetailsDialogVisible.value = true;

        // Clear the order list
        orderList.value = [];
    } catch (error) {
        console.error("Error placing order:", error);
        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to place order",
            life: 3000,
        });
    }
};

const payNow = () => {
    toast.add({
        severity: "info",
        summary: "Payment",
        detail: "Redirecting to payment gateway...",
        life: 3000,
    });
    // Add logic for payment gateway redirection
};

const payLater = () => {
    toast.add({
        severity: "info",
        summary: "Payment",
        detail: "You can pay later from the orders page.",
        life: 3000,
    });
    orderDetailsDialogVisible.value = false;
};
</script>

<style scoped>
/* Add any custom styles here */
</style>