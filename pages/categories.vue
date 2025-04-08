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
                label="Add Category"
                icon="pi pi-plus"
                class="p-button-success"
                @click="openCategoryDialog()"
            />
        </div>

        <!-- Categories Table -->
        <DataTable
            :value="filteredCategories"
            :paginator="true"
            :rows="10"
            :loading="loading"
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
                        @click="openCategoryDialog(slotProps.data)"
                    />
                    <Button
                        icon="pi pi-trash"
                        class="p-button-rounded p-button-danger p-button-text p-button-sm"
                        @click="confirmDeleteCategory(slotProps.data)"
                    />
                </template>
            </Column>
        </DataTable>

        <!-- Category Dialog -->
        <Dialog v-model:visible="categoryDialog" :header="editMode ? 'Edit Category' : 'Add Category'" :modal="true" class="w-full md:w-2/3 lg:w-1/2">
            <div class="flex flex-col gap-4 p-4">
                <div class="flex flex-col">
                    <label for="name" class="mb-1 text-gray-600">Category Name *</label>
                    <InputText id="name" v-model="category.name" :class="{'p-invalid': submitted && !category.name}" />
                    <small class="text-red-500" v-if="submitted && !category.name">Name is required</small>
                </div>
            </div>
            
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="categoryDialog = false" />
                <Button label="Save" icon="pi pi-check" @click="saveCategory" />
            </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog v-model:visible="deleteDialog" header="Confirm" :modal="true" :style="{width: '450px'}">
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span>Are you sure you want to delete <b>{{ category.name }}</b>?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteDialog = false" />
                <Button label="Yes" icon="pi pi-check" class="p-button-danger" @click="deleteCategory" />
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
const categories = ref([]);
const loading = ref(false);
const categoryDialog = ref(false);
const deleteDialog = ref(false);
const submitted = ref(false);
const editMode = ref(false);
const searchQuery = ref("");

// Initial category object
const category = ref({
    name: ''
});

// Computed properties
const filteredCategories = computed(() => {
    if (!categories.value.length) return [];
    return categories.value.filter(c => {
        if (!searchQuery.value) return true;
        return c.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    });
});

// Load categories on mount
onMounted(async () => {
    loading.value = true;
    try {
        const response = await axios.get(`${config.public.apiBaseUrl}/api/categories`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        categories.value = response.data.data || [];
    } catch (error) {
        console.error("Error loading categories:", error);
        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load categories",
            life: 3000
        });
    } finally {
        loading.value = false;
    }
});

// Open category dialog for add/edit
const openCategoryDialog = (categoryData = null) => {
    category.value = categoryData 
        ? { ...categoryData } 
        : { name: '' };
    
    submitted.value = false;
    editMode.value = !!categoryData;
    categoryDialog.value = true;
};

// Confirm delete category
const confirmDeleteCategory = (categoryData) => {
    category.value = { ...categoryData };
    deleteDialog.value = true;
};

// Save category
const saveCategory = async () => {
    submitted.value = true;

    // Validation
    if (!category.value.name) {
        return;
    }

    loading.value = true;

    try {
        let response;

        if (editMode.value) {
            // Update category
            response = await axios.put(
                `${config.public.apiBaseUrl}/api/categories/${category.value.id}`,
                category.value,
                { headers: { Authorization: `Bearer ${authStore.token}` } }
            );

            // Update category in the list
            const index = categories.value.findIndex(c => c.id === category.value.id);
            if (index !== -1) {
                categories.value[index] = response.data.data;
            }

            toast.add({
                severity: "success",
                summary: "Success",
                detail: "Category updated",
                life: 3000
            });
        } else {
            // Create new category
            response = await axios.post(
                `${config.public.apiBaseUrl}/api/categories`,
                category.value,
                { headers: { Authorization: `Bearer ${authStore.token}` } }
            );

            // Add new category to the list
            categories.value.push(response.data.data);

            toast.add({
                severity: "success",
                summary: "Success",
                detail: "Category created",
                life: 3000
            });
        }

        categoryDialog.value = false;
    } catch (error) {
        console.error("Error saving category:", error);
        toast.add({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.message || "Failed to save category",
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

// Delete category
const deleteCategory = async () => {
    try {
        await axios.delete(
            `${config.public.apiBaseUrl}/api/categories/${category.value.id}`,
            { headers: { Authorization: `Bearer ${authStore.token}` } }
        );

        // Remove category from the list
        categories.value = categories.value.filter(c => c.id !== category.value.id);

        toast.add({
            severity: "success",
            summary: "Success",
            detail: "Category deleted",
            life: 3000
        });

        deleteDialog.value = false;
    } catch (error) {
        console.error("Error deleting category:", error);
        toast.add({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.message || "Failed to delete category",
            life: 3000
        });
    }
};
</script>

<style scoped>
/* Add any additional styles if needed */
</style>
