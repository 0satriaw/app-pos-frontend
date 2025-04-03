<template>
    <div>
        <!-- Add your template code here -->
        <h1 class="text-2xl font-bold mb-6">Dashboard</h1>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Admin Dashboard -->
             <template v-if="isAdmin">
                <Card class="shadow-md">
                    <template #tittle>Total Users</template>
                    <template #content>
                        <div class="text-3xl font-bold text-blue-600">{{ stats.totalUsers || 0}}</div>
                    </template>
                </Card>

                <Card class="shadow-md">
                    <template #tittle>Total Stores</template>
                    <template #content>
                        <div class="text-3xl font-bold text-blue-600">{{ stats.totalStores || 0}}</div>
                    </template>
                </Card>

                <Card class="shadow-md">
                    <template #tittle>Total Products</template>
                    <template #content>
                        <div class="text-3xl font-bold text-blue-600">{{ stats.totalProducts || 0}}</div>
                    </template>
                </Card>

                <Card class="shadow-md">
                <template #tittle>Total Orders</template>
                    <template #content>
                        <div class="text-3xl font-bold text-blue-600">{{ stats.totalOrders || 0}}</div>
                    </template>
                </Card>

            </template>
             
            <!-- Owner Dashboard -->
            <template v-if="isOwner">
                <Card class="shadow-md">ß
                    <template #tittle>My Stores</template>
                    <template #content>
                        <div class="text-3xl font-bold text-blue-600">{{ stats.totalStores || 0}}</div>
                    </template>
                </Card>

                <Card class="shadow-md">
                    <template #tittle>Total Products</template>
                    <template #content>
                        <div class="text-3xl font-bold text-blue-600">{{ stats.storeProducts || 0}}</div>
                    </template>
                </Card>

                <Card class="shadow-md">
                    <template #tittle>Total Sales</template>
                    <template #content>
                        <div class="text-3xl font-bold text-blue-600">{{ stats.totalSales || 0}}</div>
                    </template>
                </Card>

                <Card class="shadow-md">
                    <template #tittle>Orders Today</template>
                    <template #content>
                        <div class="text-3xl font-bold text-blue-600">{{ stats.ordersToday || 0}}</div>
                    </template>
                </Card>

            </template> 
              <!-- Cashier Dashboard -->
            <template v-if="isCashier">
                
                <Card class="shadow-md">
                    <template #tittle>Orders Today</template>
                    <template #content>
                        <div class="text-3xl font-bold text-blue-600">{{ stats.ordersToday || 0}}</div>
                    </template>
                </Card>

                <Card class="shadow-md">
                    <template #tittle>Sales Today</template>
                    <template #content>
                        <div class="text-3xl font-bold text-blue-600">{{ stats.salesToday?.toFixed(2) || '0.00'}}</div>
                    </template>
                </Card>
            
            </template>
              <!-- Recent Orders -->
            
            <div class="mt-8">
                <h2 class="text-xl font-semibold-mb-4">Recent Orders</h2>
                
                <DataTable :value="recentOrders" :paginator="true" :rows="5" class="p-datatable-sm">
                    <Column field="id" header="Order ID" :sortable="true">
                        <template #body="slotProps">
                            <span class="font-medium">{{ slotProps.data.id.substring(0,8) }}</span>
                        </template>
                    </Column>
                    <Column field="store.name" header="Store" :sortable="true"/>
                    <Column field="totalPrice" header="Total" :sortable="true">
                        <template #body="slotProps">
                            Rp {{ slotProps.data.totalPrice.toFixed(2) }}
                        </template>
                    </Column>
                    <Column field="status" header="Status" :sortable="true">
                        <template #body="slotProps">
                            <span :class="{
                                'px-2 py-1 rounded text-xs font-medium': true,
                                'bg-yellow-100 text-yellow-800': slotProps.data.status === 'pending',
                                'bg-green-100 text-green-800': slotProps.data.status === 'completed',
                                'bg-red-100 text-red-800': slotProps.data.status === 'cancelled'
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
                        <Button icon="pi pi-eye" @click="viewOrder(slotProps.data)" class="p-button-rounded p-button-text p-button-sm" />
                    </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed} from 'vue';
import { useAuthStore } from '#imports';
import axios from 'axios';

const authStore = useAuthStore();
const config = useRuntimeConfig();

const isAdmin = computed(() => authStore.isAdmin);
const isOwner = computed(() => authStore.isOwner);
const isCashier = computed(() => authStore.isCashier);

const stats = ref({});
const recentOrders = ref([]);
const loading = ref(false);

onMounted(async () => {
    loading.value = true;
    try {
        const statsResponse = await axios.get(`${config.public.apiBaseUrl}/dashboard/stats`, {
            headers: {
                Authorization: `Bearer ${authStore.token}`
            }
        });
        stats.value = statsResponse.data;

        const ordersResponse = await axios.get(`${config.public.apiBaseUrl}/dashboard/recent`, {
            headers: {
                Authorization: `Bearer ${authStore.token}`
            }
        });
        
        recentOrders.value = ordersResponse.data;
        
    } catch (error) {
        console.error('Error loading dashboard data', error);
    } finally {
        loading.value = false;
    }
});

const viewOrder = (order) => {
    navigateTo(`/order/${order.id}`);
};

</script>

