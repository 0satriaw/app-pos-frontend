<template>
    <div>
        <h1 class="text-3xl font-bold mb-6">Categories</h1>

        <!-- Search and Add Button -->
        <div class="flex justify-between items-center mb-6 space-x-4">
            <!-- Search Bar -->
            <InputText
                v-model="searchQuery"
                placeholder="Search categories..."
                class="p-inputtext w-full md:w-1/2"
            />

            <!-- Add Button -->
            <Button
                label="Add"
                icon="pi pi-plus"
                class="p-button-success"
                @click="addCategory"
            />
        </div>

        <!-- Categories Table -->
        <DataTable
            :value="filteredCategories"
            :paginator="true"
            :rows="5"
            class="p-datatable-sm"
        >
            <Column field="id" header="Category ID" :sortable="true">
                <template #body="slotProps">
                    <span class="font-medium">
                        {{ slotProps.data.id}}
                    </span>
                </template>
            </Column>
            <Column field="name" header="Category Name" :sortable="true" />
            <Column field="createdAt" header="Created At" :sortable="true">
                <template #body="slotProps">
                    {{ new Date(slotProps.data.createdAt).toLocaleDateString() }}
                </template>
            </Column>
            <Column header="Actions">
                <template #body="slotProps">
                    <Button
                        icon="pi pi-pencil"
                        class="p-button-rounded p-button-text p-button-sm"
                        @click="editCategory(slotProps.data)"
                    />
                    <Button
                        icon="pi pi-trash"
                        class="p-button-rounded p-button-danger p-button-text p-button-sm"
                        @click="deleteCategory(slotProps.data)"
                    />
                </template>
            </Column>
        </DataTable>
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

const categories = ref([]);
const searchQuery = ref("");
const loading = ref(false);

// Computed property for filtered categories
const filteredCategories = computed(() => {
    if (!searchQuery.value) return categories.value;
    return categories.value.filter((category) =>
        category.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

// Fetch categories on mount
onMounted(async () => {
    authStore.initAuth();
    loading.value = true;
    try {
        const response = await axios.get(
            `${config.public.apiBaseUrl}/api/categories`,
            {
                headers: {
                    Authorization: `Bearer ${authStore.token}`,
                },
            }
        );
        console.log("Categories response:", response.data);
        categories.value = response.data.data;
    } catch (error) {
        console.error("Error fetching categories:", error);
        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load categories",
            life: 3000,
        });
    } finally {
        loading.value = false;
    }
});

// Add category handler
const addCategory = () => {
    toast.add({
        severity: "info",
        summary: "Add Category",
        detail: "Add category functionality not implemented yet.",
        life: 3000,
    });
};

// Edit category handler
const editCategory = (category) => {
    toast.add({
        severity: "info",
        summary: "Edit Category",
        detail: `Edit category: ${category.name}`,
        life: 3000,
    });
};

// Delete category handler
const deleteCategory = (category) => {
    toast.add({
        severity: "warn",
        summary: "Delete Category",
        detail: `Delete category: ${category.name}`,
        life: 3000,
    });
};
</script>

<style scoped>
/* Add any additional styles if needed */
</style>
