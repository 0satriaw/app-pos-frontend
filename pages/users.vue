<template>
    <div>
        <h1 class="text-3xl font-bold mb-6">Users</h1>

        <!-- Search and Add Button -->
        <div class="flex justify-between items-center mb-6 space-x-4">
            <InputText
                v-model="searchQuery"
                placeholder="Search users..."
                class="p-inputtext w-full md:w-1/2"
            />

            <Select
                v-model="selectedRole"
                :options="roleOptions"
                optionLabel="name"
                placeholder="Filter by Role"
                class="w-100"
            />
            <Button
                label="Add User"
                icon="pi pi-plus"
                class="p-button-success"
                @click="openUserDialog()"
            />
        </div>

        <!-- Users Table -->
        <DataTable
            :value="filteredUsers"
            :paginator="true"
            :rows="10"
            :loading="loading"
            class="p-datatable-sm"
        >
            <Column field="name" header="Name" :sortable="true" />
            <Column field="email" header="Email" :sortable="true" />
            <Column field="roleName" header="Role" :sortable="true" />
            <Column header="Actions">
                <template #body="slotProps">
                    <Button
                        icon="pi pi-pencil"
                        class="p-button-rounded p-button-text p-button-sm"
                        @click="openUserDialog(slotProps.data)"
                    />
                    <Button
                        icon="pi pi-trash"
                        class="p-button-rounded p-button-danger p-button-text p-button-sm"
                        @click="confirmDeleteUser(slotProps.data)"
                    />
                </template>
            </Column>
        </DataTable>

        <!-- User Dialog -->
        <Dialog v-model:visible="userDialog" :header="editMode ? 'Edit User' : 'Add User'" :modal="true" class="w-full md:w-2/3 lg:w-1/2">
            <div class="flex flex-col gap-4 p-4">
                <div class="flex flex-col">
                    <label for="name" class="mb-1 text-gray-600">Name *</label>
                    <InputText id="name" v-model="user.name" :class="{'p-invalid': submitted && !user.name}" />
                    <small class="text-red-500" v-if="submitted && !user.name">Name is required</small>
                </div>

                <div class="flex flex-col">
                    <label for="email" class="mb-1 text-gray-600">Email *</label>
                    <InputText id="email" v-model="user.email" :class="{'p-invalid': submitted && !user.email}" />
                    <small class="text-red-500" v-if="submitted && !user.email">Email is required</small>
                </div>

                <div class="flex flex-col" v-if="!editMode">
                    <label for="password" class="mb-1 text-gray-600">Password *</label>
                    <Password id="password" v-model="user.password" :class="{'p-invalid': submitted && !user.password}" toggleMask />
                    <small class="text-red-500" v-if="submitted && !user.password">Password is required</small>
                </div>

                <div class="flex flex-col">
                    <label for="role" class="mb-1 text-gray-600">Role *</label>
                    <Select
                        id="role"
                        v-model="user.role"
                        :options="roles"
                        optionLabel="name"
                        placeholder="Select a Role"
                        :class="{'p-invalid': submitted && !user.role}"
                    />
                    <small class="text-red-500" v-if="submitted && !user.role">Role is required</small>
                </div>

                <!-- Store selection for CASHIER role -->
                <div class="flex flex-col" v-if="user.role && user.role.name === 'CASHIER'">
                    <label for="store" class="mb-1 text-gray-600">Store *</label>
                    <Select
                        id="store"
                        v-model="user.store"
                        :options="stores"
                        optionLabel="name"
                        placeholder="Select a Store"
                        :class="{'p-invalid': submitted && !user.store}"
                    />
                    <small class="text-red-500" v-if="submitted && !user.store">Store is required for cashiers</small>
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="userDialog = false" />
                <Button label="Save" icon="pi pi-check" @click="saveUser" />
            </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog v-model:visible="deleteDialog" header="Confirm" :modal="true" :style="{width: '450px'}">
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span>Are you sure you want to delete <b>{{ user.name }}</b>?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteDialog = false" />
                <Button label="Yes" icon="pi pi-check" class="p-button-danger" @click="deleteUser" />
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
const users = ref([]);
const roles = ref([]);
const stores = ref([]); // Added stores state
const loading = ref(false);
const userDialog = ref(false);
const deleteDialog = ref(false);
const submitted = ref(false);
const editMode = ref(false);
const searchQuery = ref("");
const selectedStores = ref(); // Selected stores for filtering

const selectedRole = ref(null); // Selected role for filtering
const roleOptions = computed(() => [
    { id: null, name: "All Roles" }, // Default option
    ...roles.value.map(role => ({ id: role.name, name: role.name })) // Map roles to dropdown options
]);

// Initial user object
const user = ref({
    name: '',
    email: '',
    password: '',
    role: null,
    store: null // Added store property
});

// Computed properties
const filteredUsers = computed(() => {
    if (!users.value.length) return [];
    return users.value.filter(u => {
        let matchesSearch = true;
        let matchesRole = true;

        // Filter by search query
        if (searchQuery.value) {
            matchesSearch =
                u.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.value.toLowerCase());
        }

        // Filter by selected role
        if (selectedRole.value && selectedRole.value.id) {
            matchesRole = u.roleName === selectedRole.value.id;
        }

        return matchesSearch && matchesRole;
    });
});

// Load users, roles, and stores on mount
onMounted(async () => {
    loading.value = true;
    try {
        // Load users
        const userResponse = await axios.get(`${config.public.apiBaseUrl}/api/users`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        users.value = userResponse.data.data || [];

        // Load roles
        const roleResponse = await axios.get(`${config.public.apiBaseUrl}/api/roles`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        roles.value = roleResponse.data.data || [];

        // Load stores
        const storeResponse = await axios.get(`${config.public.apiBaseUrl}/api/stores`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        stores.value = storeResponse.data.data.content || [];
    } catch (error) {
        console.error("Error loading users, roles, or stores:", error);
        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load users, roles, or stores",
            life: 3000
        });
    } finally {
        loading.value = false;
    }
});

// Open user dialog for add/edit
const openUserDialog = (userData = null) => {
    user.value = userData 
        ? { ...userData, role: roles.value.find(role => role.id === userData.roleId) || null }
        : { name: '', email: '', role: null, store: null };
    
    submitted.value = false;
    editMode.value = !!userData;
    userDialog.value = true;
};

// Confirm delete user
const confirmDeleteUser = (userData) => {
    user.value = { ...userData };
    deleteDialog.value = true;
};

// Save user
const saveUser = async () => {
    submitted.value = true;

    // Validation
    if (!user.value.name || !user.value.email || !user.value.role || (user.value.role.name === 'CASHIER' && !user.value.store)) {
        return;
    }

    loading.value = true;
    try {
        let response;
        if (editMode.value) {
            console.log("Payload being sent:", {
    name: user.value.name,
    email: user.value.email,
    password: user.value.password,
    role: user.value.role.name,
    storeId: user.value.role.name === 'CASHIER' ? user.value.store?.id : null
});
            // Update user
            response = await axios.put(
                `${config.public.apiBaseUrl}/api/users/${user.value.id}`,
                {
                    name: user.value.name,
                    email: user.value.email,
                    role: user.value.role.name,
                    storeId: user.value.role.name === 'CASHIER' ? user.value.store.id : null // Use user.store.id
                },
                { headers: { Authorization: `Bearer ${authStore.token}` } }
            );
        } else {
            console.log("Payload being sent:", {
    name: user.value.name,
    email: user.value.email,
    password: user.value.password,
    role: user.value.role.name,
    storeId: user.value.role.name === 'CASHIER' ? user.value.store?.id : null
});
            response = await axios.post(
                `${config.public.apiBaseUrl}/api/users`,
                {
                    name: user.value.name,
                    email: user.value.email,
                    password: user.value.password,
                    role: user.value.role.name,
                    storeId: user.value.role.name === 'CASHIER' ? user.value.store.id : null // Use user.store.id
                },
                { headers: { Authorization: `Bearer ${authStore.token}` } }
            );
        }

        // Update the users list
        if (editMode.value) {
            const index = users.value.findIndex(u => u.id === user.value.id);
            if (index !== -1) {
                users.value[index] = response.data.data;
            }
        } else {
            users.value.push(response.data.data);
        }

        toast.add({
            severity: "success",
            summary: "Success",
            detail: editMode.value ? "User updated" : "User created",
            life: 3000
        });

        userDialog.value = false;
    } catch (error) {
        console.error("Error saving user:", error);
        toast.add({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.message || "Failed to save user",
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

// Delete user
const deleteUser = async () => {
    try {
        await axios.delete(
            `${config.public.apiBaseUrl}/api/users/${user.value.id}`,
            { headers: { Authorization: `Bearer ${authStore.token}` } }
        );

        // Remove user from the list
        users.value = users.value.filter(u => u.id !== user.value.id);

        toast.add({
            severity: "success",
            summary: "Success",
            detail: "User deleted",
            life: 3000
        });

        deleteDialog.value = false;
    } catch (error) {
        console.error("Error deleting user:", error);
        toast.add({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.message || "Failed to delete user",
            life: 3000
        });
    }
};
</script>