<template>
    <div>
        <h1 class="text-2xl font-bold mb-6">Dashboard</h1>

        <!-- Dashboard Stats -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Admin Dashboard -->
            <template v-if="isAdmin">
                <Card class="shadow-md">
                    <template #title>Total Users</template>
                    <template #content>
                        <div class="text-3xl font-bold text-blue-600">{{ stats.totalUsers || 0 }}</div>
                    </template>
                </Card>

                <Card class="shadow-md">
                    <template #title>Total Stores</template>
                    <template #content>
                        <div class="text-3xl font-bold text-blue-600">{{ stats.totalStores || 0 }}</div>
                    </template>
                </Card>

                <Card class="shadow-md">
                    <template #title>Total Products</template>
                    <template #content>
                        <div class="text-3xl font-bold text-blue-600">{{ stats.totalProducts || 0 }}</div>
                    </template>
                </Card>

                <Card class="shadow-md">
                    <template #title>Total Orders</template>
                    <template #content>
                        <div class="text-3xl font-bold text-blue-600">{{ stats.totalOrders || 0 }}</div>
                    </template>
                </Card>
            </template>

            <!-- Owner Dashboard -->
            <template v-if="isOwner">
                <Card class="shadow-md">
                    <template #title>My Stores</template>
                    <template #content>
                        <div class="text-3xl font-bold text-blue-600">{{ stats.totalStores || 0 }}</div>
                    </template>
                </Card>

                <Card class="shadow-md">
                    <template #title>Total Sales Today</template>
                    <template #content>
                        <div class="text-3xl font-bold text-blue-600">Rp {{ stats.totalSalesToday?.toFixed(2) || '0.00' }}</div>
                    </template>
                </Card>

                <Card class="shadow-md">
                    <template #title>Orders Today</template>
                    <template #content>
                        <div class="text-3xl font-bold text-blue-600">{{ stats.totalOrdersToday || 0 }}</div>
                    </template>
                </Card>
            </template>

            <!-- Cashier Dashboard -->
            <template v-if="isCashier">
                <Card class="shadow-md">
                    <template #title>Orders Today</template>
                    <template #content>
                        <div class="text-3xl font-bold text-blue-600">{{ stats.totalOrdersToday || 0 }}</div>
                    </template>
                </Card>

                <Card class="shadow-md">
                    <template #title>Sales Today</template>
                    <template #content>
                        <div class="text-3xl font-bold text-blue-600">Rp {{ stats.totalSalesToday?.toFixed(2) || '0.00' }}</div>
                    </template>
                </Card>
            </template>
        </div>

        <!-- Recent Orders Section -->
        <div class="mt-8">
            <h2 class="text-2xl font-bold mb-4">Recent Orders</h2>

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
                </div>
            </div>

            <!-- Orders Table -->
            <DataTable
                :value="filteredOrders"
                :paginator="true"
                :rows="5"
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
                            label="Go to Order"
                            icon="pi pi-dollar"
                            class="p-button-rounded p-button-text p-button-sm p-button-success"
                            @click="redirectToOrder(slotProps.data)"
                        />
                    </template>
                </Column>
            </DataTable>
        </div>

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
                <Button label="Close" icon="pi pi-times" class="p-button-secondary" @click="orderDetailsDialogVisible = false" />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "#imports";
import axios from "axios";

const authStore = useAuthStore();
const config = useRuntimeConfig();
const router = useRouter();

const isAdmin = computed(() => authStore.isAdmin);
const isOwner = computed(() => authStore.isOwner);
const isCashier = computed(() => authStore.isCashier);

const stats = ref({});
const orders = ref([]);
const searchQuery = ref("");
const selectedStatus = ref(null);
const loading = ref(false);
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

        return matchesSearch && matchesStatus && matchesStore;
    });
});

// Load data on mount
onMounted(async () => {
    loading.value = true;
    try {
        var endpoint;
        if (isAdmin.value) {
            endpoint = `${config.public.apiBaseUrl}/api/dashboard/admin`;
        } else if (isOwner.value) {
            endpoint = `${config.public.apiBaseUrl}/api/dashboard/owner/${authStore.user.id}`;
        } else {
            endpoint = `${config.public.apiBaseUrl}/api/dashboard/cashier/${authStore.user.id}`;
        }

        const statsResponse = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${authStore.token}` },
        });
        stats.value = statsResponse.data.data;

        var endpointRecentOrders;
        if (isAdmin.value) {
            endpointRecentOrders = `${config.public.apiBaseUrl}/api/orders/recent`;
        } else if (isOwner.value) {
            endpointRecentOrders = `${config.public.apiBaseUrl}/api/orders/recent/owner/${authStore.user.id}`;
        } else {
            endpointRecentOrders = `${config.public.apiBaseUrl}/api/orders/recent/cashier/${authStore.user.id}`;
        }

        const ordersResponse = await axios.get(endpointRecentOrders, {
            headers: { Authorization: `Bearer ${authStore.token}` },
        });
        orders.value = ordersResponse.data.data;
    } catch (error) {
        console.error("Error loading dashboard data:", error);
    } finally {
        loading.value = false;
    }
});

// View order details
const viewOrderDetails = (order) => {
    orderDetails.value = order;
    orderDetailsDialogVisible.value = true;
};

// Redirect to order page for payment
const redirectToOrder = (order) => {
    router.push(`/orders?orderId=${order.id}`);
};
</script>

