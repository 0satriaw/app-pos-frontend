<template>
    <div>
        <h1 class="text-3xl font-bold mb-6">{{ isAdmin ? 'All Stores' : 'My Stores' }}</h1>

        <!-- Search and Add Button -->
        <div class="flex justify-between items-center mb-6 space-x-4">
            <InputText
                v-model="searchQuery"
                placeholder="Search stores..."
                class="p-inputtext w-full md:w-1/2"
            />

            <Button
                v-if="isAdmin || isOwner"
                label="Add Store"
                icon="pi pi-plus"
                class="p-button-success"
                @click="openStoreDialog()"
            />
        </div>

        <!-- Stores Table -->
        <DataTable
            :value="filteredStores"
            :paginator="true"
            :rows="10"
            :loading="loading"
            class="p-datatable-sm"
        >
            <Column field="name" header="Store Name" :sortable="true" />
            <Column field="address" header="Address">
                <template #body="slotProps">
                    <span>{{ slotProps.data.address || 'No address provided' }}</span>
                </template>
            </Column>
            <Column field="ownerName" header="Owner" :sortable="true" v-if="isAdmin" />
            <Column field="createdAt" header="Created At" :sortable="true">
                <template #body="slotProps">
                    {{ new Date(slotProps.data.createdAt).toLocaleDateString() }}
                </template>
            </Column>
            <Column header="Actions">
                <template #body="slotProps">
                    <Button
                        icon="pi pi-list"
                        class="p-button-rounded p-button-info p-button-text p-button-sm"
                        @click="viewProducts(slotProps.data)"
                        v-tooltip.top="'View Products'"
                    />
                    <Button
                        icon="pi pi-pencil"
                        class="p-button-rounded p-button-text p-button-sm"
                        @click="openStoreDialog(slotProps.data)"
                        v-if="isAdmin || (isOwner && slotProps.data.ownerId === user.id)"
                    />
                    <Button
                        icon="pi pi-trash"
                        class="p-button-rounded p-button-danger p-button-text p-button-sm"
                        @click="confirmDeleteStore(slotProps.data)"
                        v-if="isAdmin || (isOwner && slotProps.data.ownerId === user.id)"
                    />
                </template>
            </Column>
        </DataTable>

        <!-- Store Dialog -->
        <Dialog v-model:visible="storeDialog" :header="editMode ? 'Edit Store' : 'Add Store'" :modal="true" class="w-full md:w-2/3 lg:w-1/2">
            <div class="flex flex-col gap-4 p-4">
                <div class="flex flex-col">
                    <label for="name" class="mb-1 text-gray-600">Store Name *</label>
                    <InputText id="name" v-model="store.name" :class="{'p-invalid': submitted && !store.name}" />
                    <small class="text-red-500" v-if="submitted && !store.name">Name is required</small>
                </div>
                
                <div class="flex flex-col">
                    <label for="address" class="mb-1 text-gray-600">Address</label>
                    <Textarea id="address" v-model="store.address" rows="3" />
                </div>
                
                <!-- Owner Dropdown (Admin Only) -->
                <div class="flex flex-col" v-if="isAdmin">
                    <label for="owner" class="mb-1 text-gray-600">Owner *</label>
                    <Select
                        id="owner"
                        v-model="store.owner"
                        :options="users"
                        optionLabel="name"
                        placeholder="Select an Owner"
                        :class="{'p-invalid': submitted && !store.owner}"
                    />
                    <small class="text-red-500" v-if="submitted && !store.owner">Owner is required</small>
                </div>

                <!-- Owner Display (Owner Role) -->
                <div class="flex flex-col" v-if="isOwner">
                    <label for="owner" class="mb-1 text-gray-600">Owner</label>
                    <InputText id="owner" v-model="store.ownerName" disabled />
                </div>
            </div>
            
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="storeDialog = false" />
                <Button label="Save" icon="pi pi-check" @click="saveStore" />
            </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog v-model:visible="deleteDialog" header="Confirm" :modal="true" :style="{width: '450px'}">
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span>Are you sure you want to delete <b>{{ store.name }}</b>?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteDialog = false" />
                <Button label="Yes" icon="pi pi-check" class="p-button-danger" @click="deleteStore" />
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
const stores = ref([]);
const users = ref([]);
const loading = ref(false);
const storeDialog = ref(false);
const deleteDialog = ref(false);
const submitted = ref(false);
const editMode = ref(false);
const searchQuery = ref("");

// Initial store object
const store = ref({
    name: '',
    address: '',
    owner: null
});

// Computed properties
const isAdmin = computed(() => authStore.isAdmin);
const isOwner = computed(() => authStore.isOwner);
const user = computed(() => authStore.user);

const filteredStores = computed(() => {
    if (!stores.value.length) return [];
    
    return stores.value.filter(s => {
        if (!searchQuery.value) return true;
        return s.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
               (s.address && s.address.toLowerCase().includes(searchQuery.value.toLowerCase()));
    });
});

// Load data on mount
onMounted(async () => {
    authStore.initAuth();
    loading.value = true;
    try {
        // Different endpoint for admin vs owner
        const endpoint = isAdmin.value 
            ? `${config.public.apiBaseUrl}/api/stores` 
            : `${config.public.apiBaseUrl}/api/stores`;
            
        const storeResponse = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        stores.value = storeResponse.data.data.content || [];

        console.log("Stores loaded:", stores.value);
        // Load users with OWNER role if admin
        if (isAdmin.value) {
            const userResponse = await axios.get(
                `${config.public.apiBaseUrl}/api/users/roles/OWNER`, 
                { headers: { Authorization: `Bearer ${authStore.token}` } }
            );
            users.value = userResponse.data.data || [];
        }

    } catch (error) {
        console.error("Error loading stores:", error);
        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load stores",
            life: 3000
        });
    } finally {
        loading.value = false;
    }
});

// Open store dialog for add/edit
const openStoreDialog = (storeData = null) => {
    store.value = storeData 
        ? {
            ...storeData,
            owner: users.value.find(user => user.id === storeData.ownerId) || null // Match owner by ID
        }
        : {
            name: '',
            address: '',
            owner: isOwner.value ? user.value : null, // Default owner for owners
        };
    
    submitted.value = false;
    editMode.value = !!storeData;
    storeDialog.value = true;
};

// Confirm delete store
const confirmDeleteStore = (storeData) => {
    store.value = {...storeData};
    deleteDialog.value = true;
};

// Navigate to store products
const viewProducts = (storeData) => {
    navigateTo(`/products?storeId=${storeData.id}`);
};

// Save store
const saveStore = async () => {
    submitted.value = true;
    
    // Validation
    if (!store.value.name) {
        return;
    }
    
    // If admin, ensure owner is selected
    if (isAdmin.value && !store.value.owner) {
        return;
    }
    
    loading.value = true;
    
    try {
        const storeData = {
            name: store.value.name,
            address: store.value.address || '',
            ownerId: store.value.owner?.id
        };
        
        let response;
        
        if (editMode.value) {
            if(isOwner.value){
                storeData.ownerId = user.value.id // Ensure owner ID is set
            }

            response = await axios.put(
                `${config.public.apiBaseUrl}/api/stores/${store.value.id}`, 
                storeData,
                { headers: { Authorization: `Bearer ${authStore.token}` } }
            );
            
            // Update store in the list
            const index = stores.value.findIndex(s => s.id === store.value.id);
            if (index !== -1) {
                stores.value[index] = response.data.data;
            }
            
            toast.add({
                severity: "success",
                summary: "Success",
                detail: "Store updated",
                life: 3000
            });
        } else {
            response = await axios.post(
                `${config.public.apiBaseUrl}/api/stores`, 
                storeData,
                { headers: { Authorization: `Bearer ${authStore.token}` } }
            );
            
            // Add new store to the list
            stores.value.push(response.data.data);
            
            toast.add({
                severity: "success",
                summary: "Success",
                detail: "Store created",
                life: 3000
            });
        }
        
        storeDialog.value = false;
    } catch (error) {
        console.error("Error saving store:", error);
        toast.add({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.message || "Failed to save store",
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

// Delete store
const deleteStore = async () => {
    try {
        await axios.delete(
            `${config.public.apiBaseUrl}/api/stores/${store.value.id}`,
            { headers: { Authorization: `Bearer ${authStore.token}` } }
        );
        
        // Remove store from the list
        stores.value = stores.value.filter(s => s.id !== store.value.id);
        
        toast.add({
            severity: "success",
            summary: "Success",
            detail: "Store deleted",
            life: 3000
        });
        
        deleteDialog.value = false;
    } catch (error) {
        console.error("Error deleting store:", error);
        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to delete store",
            life: 3000
        });
    }
};
</script>