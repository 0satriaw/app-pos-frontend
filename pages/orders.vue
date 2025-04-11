<template>
    <div>
        <h1 class="text-3xl font-bold mb-6">Orders</h1>

        <!-- Search and Filter -->
        <div class="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div class="flex flex-wrap items-center gap-4 flex-1">
                <!-- Search Bar -->
                <InputText
                    v-model="searchQuery"
                    placeholder="Search orders..."
                    class="p-inputtext w-full md:w-auto flex-1"
                />

                <!-- Status Filter -->
                <Select
                    v-model="selectedStatus"
                    :options="statuses"
                    optionLabel="label"
                    placeholder="All Statuses"
                    class="w-80"
                />

                <!-- Store Filter (Owner Only) -->
                <Select
                    v-if="isOwner"
                    v-model="selectedStore"
                    :options="stores"
                    optionLabel="name"
                    placeholder="All Stores"
                    class="w-80"
                />
            </div>
        </div>

        <!-- Orders Table -->
        <DataTable
            :value="filteredOrders"
            :paginator="true"
            :rows="10"
            :loading="loading"
            class="p-datatable-sm"
        >
            <Column field="id" header="Order ID" :sortable="true">
                <template #body="slotProps">
                    <span class="font-medium">{{ slotProps.data.id.substring(0, 8) }}</span>
                </template>
            </Column>
            <Column field="storeName" header="Store" :sortable="true" />
            <Column field="userName" header="Created By" :sortable="true" />
            <Column field="totalPrice" header="Total" :sortable="true">
                <template #body="slotProps">
                    Rp {{ slotProps.data.totalPrice.toFixed(2) }}
                </template>
            </Column>
            <Column field="status" header="Status" :sortable="true">
                <template #body="slotProps">
                    <span :class="{
                        'px-2 py-1 rounded text-xs font-medium': true,
                        'bg-yellow-100 text-yellow-800': slotProps.data.status === 'PENDING',
                        'bg-green-100 text-green-800': slotProps.data.status === 'COMPLETED',
                        'bg-red-100 text-red-800': slotProps.data.status === 'CANCELLED',
                        'bg-blue-100 text-blue-800': slotProps.data.status === 'PROCESSING'
                    }">
                        {{ slotProps.data.status }}
                    </span>
                </template>
            </Column>
            <Column field="createdAt" header="Date" :sortable="true">
                <template #body="slotProps">
                    {{ new Date(slotProps.data.createdAt).toLocaleDateString() }}
                </template>
            </Column>
            <Column header="Actions">
                <template #body="slotProps">
                    <Button
                        icon="pi pi-eye"
                        class="p-button-rounded p-button-text p-button-sm"
                        @click="viewOrderDetails(slotProps.data)"
                    />
                    <Button
                        v-if="slotProps.data.status === 'PENDING'"
                        icon="pi pi-dollar"
                        class="p-button-rounded p-button-text p-button-sm p-button-success"
                        @click="payOrder(slotProps.data)"
                    />
                    <Button
                        v-if="slotProps.data.status === 'PROCESSING'"
                        label="Simulate Payment"
                        icon="pi pi-check"
                        class="p-button-rounded p-button-text p-button-sm p-button-info"
                        @click="simulatePayment(slotProps.data)"
                    />
                </template>
            </Column>
        </DataTable>

        <!-- Order Details Dialog -->
        <Dialog v-model:visible="orderDetailsDialogVisible" :header="'Order Details'" :modal="true" :style="{ width: '600px' }">
            <div>
                <h3 class="text-lg font-bold mb-4">Order Summary</h3>
                <p><strong>Order ID:</strong> {{ orderDetails.id }}</p>
                <p><strong>Store:</strong> {{ orderDetails.storeName }}</p>
                <p><strong>Created By:</strong> {{ orderDetails.userName }}</p>
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

                <p class="mt-4"><strong>Total Price:</strong> Rp {{ orderDetails.totalPrice.toFixed(2) }}</p>
                <p><strong>Status:</strong> {{ orderDetails.status }}</p>
            </div>

            <template #footer>
                <Button
                    v-if="orderDetails.status === 'PENDING'"
                    label="Pay"
                    icon="pi pi-dollar"
                    class="p-button-success"
                    @click="payOrder(orderDetails)"
                />
                <Button label="Close" icon="pi pi-times" class="p-button-secondary" @click="orderDetailsDialogVisible = false" />
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
const orders = ref([]);
const stores = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const selectedStatus = ref(null);
const selectedStore = ref(null); // Store filter for owners
const orderDetailsDialogVisible = ref(false);
const orderDetails = ref({});

// Status options
const statuses = [
    { label: "All Statuses", value: null },
    { label: "Pending", value: "PENDING" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
    { label: "Processing", value: "PROCESSING" },
];

// Computed properties
const isOwner = computed(() => authStore.isOwner);

const filteredOrders = computed(() => {
    return orders.value.filter((order) => {
        let matchesSearch = true;
        let matchesStatus = true;
        let matchesStore = true;

        // Filter by search query
        if (searchQuery.value) {
            matchesSearch =
                order.id.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                order.storeName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                order.userName.toLowerCase().includes(searchQuery.value.toLowerCase());
        }

        // Filter by status
        if (selectedStatus.value === null || selectedStatus.value.value === null) {
            matchesStatus = true; // Show all statuses
        } else {
            matchesStatus = order.status === selectedStatus.value.value;
        }


        // Filter by store
        if (selectedStore.value && selectedStore.value.id) {
            matchesStore = order.storeId === selectedStore.value.id;
        }

        return matchesSearch && matchesStatus && matchesStore;
    });
});

// Load data on mount
onMounted(async () => {
    loading.value = true;

    try {
        let endpoint = `${config.public.apiBaseUrl}/api/orders`;

        // Owner: Fetch all orders for their stores
        if (authStore.isOwner) {
            endpoint = `${config.public.apiBaseUrl}/api/orders/owner/${authStore.user.id}`;
        }

        const response = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${authStore.token}` },
        });
        orders.value = response.data.data || [];

        // Load stores for owner filter
        if (isOwner.value) {
            const storeResponse = await axios.get(`${config.public.apiBaseUrl}/api/stores`, {
                headers: { Authorization: `Bearer ${authStore.token}` },
            });
            stores.value = [{ id: null, name: "All Stores" }, ...storeResponse.data.data.content] || [];
        }
    } catch (error) {
        console.error("Error loading orders:", error);
        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load orders",
            life: 3000,
        });
    } finally {
        loading.value = false;
    }
});

// View order details
const viewOrderDetails = (order) => {
    orderDetails.value = order;
    orderDetailsDialogVisible.value = true;
};

// Pay order
const payOrder = async (order) => {
    try {
        const paymentData = {
            order_id: order.id,
            gross_amount: order.totalPrice,
        };

        const response = await axios.post(`${config.public.apiBaseUrl}/api/payments`, paymentData, {
            headers: { Authorization: `Bearer ${authStore.token}` },
        });

        const paymentResponse = response.data.data;

        toast.add({
            severity: "success",
            summary: "Payment Created",
            detail: "Redirecting to payment gateway...",
            life: 3000,
        });

        // Open the redirect URL in a new tab
        if (paymentResponse.redirectUrl) {
            window.open(paymentResponse.redirectUrl, "_blank");
        } else {
            toast.add({
                severity: "error",
                summary: "Error",
                detail: "Invalid redirect URL",
                life: 3000,
            });
        }
    } catch (error) {
        console.error("Error creating payment:", error);
        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to create payment",
            life: 3000,
        });
    }
};

// Simulate payment
const simulatePayment = async (order) => {
    try {
        const webhookData = {
            order_id: order.id,
            transaction_status: "settlement",
        };

        await axios.post(`${config.public.apiBaseUrl}/api/webhook`, webhookData, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authStore.token}`,
            },
        });

        toast.add({
            severity: "success",
            summary: "Payment Simulated",
            detail: "Order status updated to COMPLETED",
            life: 3000,
        });

        // Update the order status locally
        order.status = "COMPLETED";
    } catch (error) {
        console.error("Error simulating payment:", error);
        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to simulate payment",
            life: 3000,
        });
    }
};
</script>

<style scoped>
/* Add any custom styles here */
</style>