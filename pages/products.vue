<template>
    <div>
        <h1 class="text-3xl font-bold mb-6">Products</h1>

        <!-- Search, Filter and Add Button -->
        <div class="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div class="flex flex-wrap items-center gap-4 flex-1">
                <InputText
                    v-model="searchQuery"
                    placeholder="Search products..."
                    class="p-inputtext w-full md:w-auto flex-1"
                />
                
                <Select 
                    v-model="selectedCategory" 
                    :options="categories"
                    optionLabel="name"
                    placeholder="All Categories"
                    class="w-80"
                />
                
                <Select 
                    v-model="selectedStore" 
                    :options="stores"
                    optionLabel="name"
                    placeholder="All Stores"
                    class="w-80"
                />
            </div>

            <Button
                label="Add Product"
                icon="pi pi-plus"
                class="p-button-success"
                @click="openProductDialog()"
            />
        </div>

        <!-- Products Table -->
        <DataTable
            :value="filteredProducts"
            :paginator="true"
            :rows="10"
            :loading="loading"
            class="p-datatable-sm"
            v-model:filters="filters"
            filterDisplay="menu"
            :globalFilterFields="['name', 'store.name', 'description', 'price']"
        >
            <!-- Product Image Column -->
            <Column header="Image">
                <template #body="slotProps">
                    <div class="flex items-center">
                        <img
                            v-if="slotProps.data.imageUrl"
                            :src="config.public.apiBaseUrl + slotProps.data.imageUrl"
                            alt="Product Image"
                            class="object-cover rounded"
                            style="height: 100px; width: 100px; object-fit: cover; border-radius: 4px;"
                        />
                        <span v-else class="text-gray-500 text-sm">No Image</span>
                    </div>
                </template>
            </Column>

            <Column field="name" header="Product Name" :sortable="true" />
            <Column field="storeName" header="Store" :sortable="true" />
            <Column field="description" header="Description">
                <template #body="slotProps">
                    <span>{{ slotProps.data.description?.substring(0, 50) }}{{ slotProps.data.description?.length > 50 ? '...' : '' }}</span>
                </template>
            </Column>
            <Column field="price" header="Price" :sortable="true">
                <template #body="slotProps">
                    Rp {{ slotProps.data.price.toFixed(2) }}
                </template>
            </Column>
            <Column field="stock" header="Stock" :sortable="true" />
            <Column field="categoryName" header="Category" :sortable="true" />
            <Column header="Actions">
                <template #body="slotProps">
                    <Button
                        icon="pi pi-pencil"
                        class="p-button-rounded p-button-text p-button-sm"
                        @click="openProductDialog(slotProps.data)"
                    />
                    <Button
                        icon="pi pi-trash"
                        class="p-button-rounded p-button-danger p-button-text p-button-sm"
                        @click="confirmDeleteProduct(slotProps.data)"
                    />
                </template>
            </Column>
        </DataTable>

        <!-- Product Dialog -->
        <Dialog v-model:visible="productDialog" :header="editMode ? 'Edit Product' : 'Add Product'" :modal="true" class="w-full md:w-2/3 lg:w-1/2">
            <div class="flex flex-col gap-4 p-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col">
                        <label for="name" class="mb-1 text-gray-600">Product Name *</label>
                        <InputText id="name" v-model="product.name" :class="{'p-invalid': submitted && !product.name}" />
                        <small class="text-red-500" v-if="submitted && !product.name">Name is required</small>
                    </div>
                    
                    <div class="flex flex-col">
                        <label for="price" class="mb-1 text-gray-600">Price *</label>
                        <InputNumber id="price" v-model="product.price" mode="currency" currency="IDR" locale="id-ID" :class="{'p-invalid': submitted && !product.price}" />
                        <small class="text-red-500" v-if="submitted && !product.price">Price is required</small>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col">
                        <label for="stock" class="mb-1 text-gray-600">Stock *</label>
                        <InputNumber id="stock" v-model="product.stock" :class="{'p-invalid': submitted && product.stock === undefined}" />
                        <small class="text-red-500" v-if="submitted && product.stock === undefined">Stock is required</small>
                    </div>
                    
                    <div class="flex flex-col">
                        <label for="category" class="mb-1 text-gray-600">Category *</label>
                        <Select id="category" v-model="product.category" :options="categories" optionLabel="name" placeholder="Select a Category" :class="{'p-invalid': submitted && !product.category}" />
                        <small class="text-red-500" v-if="submitted && !product.category">Category is required</small>
                    </div>
                </div>
                
                
                <div class="flex flex-col" v-if="stores.length">
                    <label for="store" class="mb-1 text-gray-600">Store *</label>
                    <Select id="store" v-model="product.store" :options="stores" optionLabel="name" placeholder="Select a Store" :class="{'p-invalid': submitted && !product.store}" />
                    <small class="text-red-500" v-if="submitted && !product.store">Store is required</small>
                </div>


                <!-- Image Upload -->
                <div class="flex flex-col">
                    <label for="image" class="mb-1 text-gray-600">Product Image</label>
                    <FileUpload
                        mode="basic"
                        name="file"
                        accept="image/*"
                        :maxFileSize="1000000"
                        @select="onFileSelect"
                        chooseLabel="Browse"
                    />
                    <small class="text-gray-500">Supported formats: JPG, PNG</small>
                </div>
                
                <div class="flex flex-col">
                    <label for="description" class="mb-1 text-gray-600">Description</label>
                    <Textarea id="description" v-model="product.description" rows="3" />
                </div>
            </div>
            
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="productDialog = false" />
                <Button label="Save" icon="pi pi-check" @click="saveProduct" />
            </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog v-model:visible="deleteDialog" header="Confirm" :modal="true" :style="{width: '450px'}">
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span>Are you sure you want to delete <b>{{ product.name }}</b>?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteDialog = false" />
                <Button label="Yes" icon="pi pi-check" class="p-button-danger" @click="deleteProduct" />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import axios from "axios";
import { useAuthStore } from "#imports";

const authStore = useAuthStore();
const config = useRuntimeConfig();
const toast = useToast();
const confirm = useConfirm();

// Define FilterMatchMode manually
const FilterMatchMode = {
    STARTS_WITH: 'startsWith',
    CONTAINS: 'contains',
    ENDS_WITH: 'endsWith',
    EQUALS: 'equals',
    NOT_EQUALS: 'notEquals',
    IN: 'in',
    LESS_THAN: 'lt',
    LESS_THAN_OR_EQUAL_TO: 'lte',
    GREATER_THAN: 'gt',
    GREATER_THAN_OR_EQUAL_TO: 'gte',
    BETWEEN: 'between',
    NOT_IN: 'notIn',
    IS: 'is',
    IS_NOT: 'isNot',
    BEFORE: 'before',
    AFTER: 'after',
};

// State
const products = ref([]);
const categories = ref([]);
const stores = ref([]);
const loading = ref(false);
const productDialog = ref(false);
const deleteDialog = ref(false);
const submitted = ref(false);
const editMode = ref(false);
const searchQuery = ref("");
const selectedCategory = ref(null);
const selectedStore = ref(null);
const selectedImage = ref(null);


const onFileSelect = (event) => {
    const file = event.files[0];
    if (file) {
        selectedImage.value = file;
        console.log('Selected image:', file);
    }
};

// Initial product object
const product = ref({
    name: '',
    description: '',
    price: null,
    stock: 0,
    category: null,
    store: null
});

// Computed properties
const isAdmin = computed(() => authStore.isAdmin);
const isOwner = computed(() => authStore.isOwner);

const filteredProducts = computed(() => {
    if (!products.value.length) return [];
    
    return products.value.filter(prod => {
        let matchesSearch = true;
        let matchesCategory = true;
        let matchesStore = true;
        
        // Filter by search query
        if (searchQuery.value) {
            matchesSearch = prod.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                            (prod.description && prod.description.toLowerCase().includes(searchQuery.value.toLowerCase()));
        }
        
        // Filter by category
        if (selectedCategory.value && selectedCategory.value.id) {
            matchesCategory = prod.categoryId === selectedCategory.value.id;
        }
        
        // Filter by store (admin only)
        if (selectedStore.value && selectedStore.value.id) {
            matchesStore = prod.storeId === selectedStore.value.id;
        }
        
        return matchesSearch && matchesCategory && matchesStore;
    });
});

// Initialize filters
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Load data on mount
onMounted(async () => {
    loading.value = true;
    const route = useRoute(); // Access the route object
    const storeIdFromQuery = route.query.storeId; // Get storeId from query parameters

    try {
        // Load products
        if(isAdmin.value){
            const productResponse = await axios.get(`${config.public.apiBaseUrl}/api/products`, {
                headers: { Authorization: `Bearer ${authStore.token}` }
            });
            products.value = productResponse.data.data.content || [];
        } else {
            const productResponse = await axios.get(`${config.public.apiBaseUrl}/api/products/${authStore.user.id}`, {
                headers: { Authorization: `Bearer ${authStore.token}` }
            });
            products.value = productResponse.data.data || [];
        }
       
        // Load categories
        const categoryResponse = await axios.get(`${config.public.apiBaseUrl}/api/categories`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        categories.value = [{ id: null, name: "All Categories" }, ...categoryResponse.data.data] || [];

        
        // Load stores if admin
        if (isAdmin.value) {
            const storeResponse = await axios.get(`${config.public.apiBaseUrl}/api/stores`, {
                headers: { Authorization: `Bearer ${authStore.token}` }
            });
            stores.value = [{ id: null, name: "All Stores" }, ...storeResponse.data.data.content] || [];

        } else if (isOwner.value) {
            // Load owner's stores
            const storeResponse = await axios.get(`${config.public.apiBaseUrl}/api/stores`, {
                headers: { Authorization: `Bearer ${authStore.token}` }
            });
            stores.value = [{ id: null, name: "All Stores" }, ...storeResponse.data.data.content] || [];

        }

        if (storeIdFromQuery) {
            selectedStore.value = stores.value.find(store => store.id === storeIdFromQuery) || null;
        }
    } catch (error) {
        console.error("Error loading data:", error);
        toast.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load data",
            life: 3000
        });
    } finally {
        loading.value = false;
    }
});

// Open product dialog for add/edit
const openProductDialog = (productData = null) => {
    product.value = productData 
        ? {...productData,
            store: stores.value.find(store => store.id === productData.storeId) || null,
            category: categories.value.find(category => category.id === productData.categoryId) || null,
        } 
        : {
            name: '',
            description: '',
            price: null,
            stock: 0,
            category: null,
            store: stores.value.length === 1 ? stores.value[0] : null
        };
    
    submitted.value = false;
    editMode.value = !!productData;
    productDialog.value = true;
};

// Confirm delete product
const confirmDeleteProduct = (productData) => {
    product.value = {...productData};
    deleteDialog.value = true;
};

// Save product
const saveProduct = async () => {
    submitted.value = true;
    
    // Validation
    if (!product.value.name || !product.value.price || product.value.stock === undefined || !product.value.category) {
        return;
    }
    
    // If admin, ensure store is selected
    if (isAdmin.value && !product.value.store) {
        return;
    }
    
    loading.value = true;
    
    try {
    let imageUrl = product.value.imageUrl || null; // Use existing image URL if editing

      // Upload the image if selected
      if (selectedImage.value) {
            const formData = new FormData();
            formData.append('file', selectedImage.value);

            const uploadResponse = await axios.post(
                `${config.public.apiBaseUrl}/api/uploads/products`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${authStore.token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            imageUrl = uploadResponse.data.imageUrl; // Use the imageUrl returned by the backend
        }
        
        const productData = {
            name: product.value.name,
            description: product.value.description || '',
            price: product.value.price,
            stock: product.value.stock,
            categoryId: product.value.category.id,
            storeId: product.value.store?.id || stores.value[0]?.id,
            imageUrl, 
        };
        
        let response;
        const existingStoreId = product.value.storeId;
        if (editMode.value) {
            
            console.log('Product Data:', productData);
            console.log('Existing Store ID:', existingStoreId);
            response = await axios.put(
                `${config.public.apiBaseUrl}/api/stores/${existingStoreId}/products/${product.value.id}`, 
                productData,
                { headers: { Authorization: `Bearer ${authStore.token}` } }
            );
            
            // Update product in the list
            const index = products.value.findIndex(p => p.id === product.value.id);
            if (index !== -1) {
                products.value[index] = response.data.data;
            }
            
            toast.add({
                severity: "success",
                summary: "Success",
                detail: "Product updated",
                life: 3000
            });
        } else {
            response = await axios.post(
                `${config.public.apiBaseUrl}/api/stores/${productData.storeId}/products`, 
                productData,
                { headers: { Authorization: `Bearer ${authStore.token}` } }
            );
            
            // Add new product to the list
            products.value.push(response.data.data);
            
            toast.add({
                severity: "success",
                summary: "Success",
                detail: "Product created",
                life: 3000
            });
        }
        
        productDialog.value = false;
    } catch (error) {
        console.error("Error saving product:", error);
        toast.add({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.message || "Failed to save product",
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

// Delete product
const deleteProduct = async () => {
    try {
        await axios.delete(
           `${config.public.apiBaseUrl}/api/stores/${product.value.storeId}/products/${product.value.id}`, 
            { headers: { Authorization: `Bearer ${authStore.token}` } }
        );
        
        // Remove product from the list
        products.value = products.value.filter(p => p.id !== product.value.id);
        
        toast.add({
            severity: "success",
            summary: "Success",
            detail: "Product deleted",
            life: 3000
        });
        
        deleteDialog.value = false;
    } catch (error) {
        console.error("Error deleting product:", error);
        toast.add({
            severity: "error",
            summary: "Error",
            detail: error.response?.data?.message || "Failed to delete product",
            life: 3000
        });
    }
};
</script>