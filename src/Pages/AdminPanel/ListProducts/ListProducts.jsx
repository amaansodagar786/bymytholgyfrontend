import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FiPackage,
  FiSearch,
  FiRefreshCw,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiFileText,
  FiX,
  FiDollarSign,
  FiImage,
  FiTag,
  FiGrid,
  FiInfo,
  FiAlertCircle,
  FiChevronDown
} from "react-icons/fi";
import {
  MdOutlineCancel
} from "react-icons/md";
import {
  HiOutlineCurrencyRupee
} from "react-icons/hi";
import AdminLayout from "../AdminLayout/AdminLayout";
import "./ListProducts.scss";

const ListProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [deleteProductId, setDeleteProductId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    categoryId: "",
    categoryName: "",
    hsnCode: "",
    type: "simple",
    modelName: "",
    SKU: "",
    specifications: [{ key: "", value: "" }, { key: "", value: "" }],
    colors: [],
    models: []
  });

  // File states
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [existingThumbnail, setExistingThumbnail] = useState("");

  const searchTimeoutRef = useRef(null);

  // ✅ TOKEN VALIDATION FUNCTION
  const validateToken = () => {
    const token = localStorage.getItem("adminToken");
    const role = localStorage.getItem("role");

    if (!token || !role || role !== "admin") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("role");
      localStorage.removeItem("adminId");
      navigate("/admin/login");
      return false;
    }

    return true;
  };

  // ✅ GET AUTH HEADERS
  const getAuthHeaders = () => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      throw new Error("No authentication token found");
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data"
    };
  };

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (!debouncedSearch) return products;
    return products.filter((p) =>
      p.productName?.toLowerCase().includes(debouncedSearch) ||
      p.SKU?.toLowerCase().includes(debouncedSearch) ||
      p.categoryName?.toLowerCase().includes(debouncedSearch) ||
      p.hsnCode?.toLowerCase().includes(debouncedSearch)
    );
  }, [debouncedSearch, products]);

  // 📋 FETCH ALL PRODUCTS
  const fetchProducts = async () => {
    try {
      if (!validateToken()) return;
      
      setIsLoading(true);
      setError("");

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/products/all`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } }
      );

      console.log("✅ Products fetched:", response.data.length);
      
      if (Array.isArray(response.data)) {
        setProducts(response.data);
      } else {
        console.error("❌ Unexpected response format:", response.data);
        setProducts([]);
      }
    } catch (err) {
      console.error("❌ Error fetching products:", err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("role");
        localStorage.removeItem("adminId");
        setTimeout(() => navigate("/admin/login"), 2000);
      } else {
        setError(err.response?.data?.message || "Failed to fetch products");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 📋 FETCH CATEGORIES
  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/categories/get`
      );
      
      setCategories(response.data);
      // Set default category if none selected
      if (response.data?.length > 0 && !formData.categoryId) {
        const firstCategory = response.data[0];
        setFormData(prev => ({
          ...prev,
          categoryId: firstCategory.categoryId,
          categoryName: firstCategory.name
        }));
      }
    } catch (err) {
      console.error("❌ Error fetching categories:", err);
      toast.error("Failed to load categories");
    }
  };

  useEffect(() => {
    console.log("🚀 Component mounted, fetching products and categories");
    fetchProducts();
    fetchCategories();
  }, []);

  // 🔍 SEARCH PRODUCTS WITH DEBOUNCE
  const handleSearch = (e) => {
    const value = e.target.value;

    setSearchTerm(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      console.log("🔍 Executing search with value:", value);
    }, 500);
  };

  // 🚪 LOGOUT FUNCTION
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("role");
    localStorage.removeItem("adminId");
    navigate("/admin/login");
  };

  // ✏️ FORM HANDLERS
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle category change
  const handleCategoryChange = (e) => {
    const selectedCategory = categories.find(cat => cat.categoryId === e.target.value);
    if (selectedCategory) {
      setFormData({
        ...formData,
        categoryId: selectedCategory.categoryId,
        categoryName: selectedCategory.name
      });
    }
  };

  const handleSpecChange = (index, field, value) => {
    const updatedSpecs = [...formData.specifications];
    updatedSpecs[index][field] = value;
    setFormData({ ...formData, specifications: updatedSpecs });
  };

  const addSpecField = () => {
    setFormData({
      ...formData,
      specifications: [...formData.specifications, { key: "", value: "" }]
    });
  };

  const removeSpecField = (index) => {
    if (formData.specifications.length <= 2) {
      toast.warning("Minimum 2 specification fields are required");
      return;
    }
    const updatedSpecs = formData.specifications.filter((_, i) => i !== index);
    setFormData({ ...formData, specifications: updatedSpecs });
  };

  const addFragrance = () => {
    const updatedColors = [...formData.colors];
    if (updatedColors.length === 0) {
      updatedColors.push({
        colorId: `temp_${Date.now()}_1`,
        colorName: "Default",
        fragrances: [""],
        images: [],
        originalPrice: "",
        currentPrice: "",
        colorSpecifications: []
      });
    } else {
      updatedColors[0].fragrances = [...(updatedColors[0].fragrances || []), ""];
    }
    setFormData({ ...formData, colors: updatedColors });
  };

  const removeFragrance = (fragranceIndex) => {
    const updatedColors = [...formData.colors];
    if (updatedColors.length > 0) {
      const currentFragrances = updatedColors[0].fragrances || [];
      const nonEmptyFragrances = currentFragrances.filter(f => f?.trim() !== "");
      if (nonEmptyFragrances.length <= 1 && currentFragrances[fragranceIndex]?.trim() !== "") {
        toast.warning("Cannot remove the last fragrance. Product must have at least 1 fragrance.");
        return;
      }
      updatedColors[0].fragrances = currentFragrances.filter((_, i) => i !== fragranceIndex);
      setFormData({ ...formData, colors: updatedColors });
    }
  };

  const handleFragranceChange = (fragranceIndex, value) => {
    const updatedColors = [...formData.colors];
    if (updatedColors.length > 0) {
      updatedColors[0].fragrances[fragranceIndex] = value;
      setFormData({ ...formData, colors: updatedColors });
    }
  };

  const handlePriceChange = (field, value) => {
    const updatedColors = [...formData.colors];
    if (updatedColors.length === 0) {
      updatedColors.push({
        colorId: `temp_${Date.now()}_1`,
        colorName: "Default",
        fragrances: [],
        images: [],
        originalPrice: field === "originalPrice" ? value : "",
        currentPrice: field === "currentPrice" ? value : "",
        colorSpecifications: []
      });
    } else {
      updatedColors[0][field] = value;
    }
    setFormData({ ...formData, colors: updatedColors });
  };

  const handleProductImagesChange = (e) => {
    if (e.target.files.length > 0) {
      const updatedColors = [...formData.colors];
      const newFiles = Array.from(e.target.files);
      if (updatedColors.length === 0) {
        updatedColors.push({
          colorId: `temp_${Date.now()}_1`,
          colorName: "Default",
          fragrances: [],
          images: newFiles,
          originalPrice: "",
          currentPrice: "",
          colorSpecifications: []
        });
      } else {
        updatedColors[0].images = [...(updatedColors[0].images || []), ...newFiles];
      }
      setFormData({ ...formData, colors: updatedColors });
    }
  };

  const removeProductImage = (imageIndex) => {
    const updatedColors = [...formData.colors];
    if (updatedColors.length > 0) {
      updatedColors[0].images = updatedColors[0].images.filter((_, i) => i !== imageIndex);
      setFormData({ ...formData, colors: updatedColors });
    }
  };

  const handleThumbnailChange = (e) => {
    if (e.target.files[0]) {
      setThumbnailFile(e.target.files[0]);
    }
  };

  // ➕ ADD PRODUCT
  const addProduct = async () => {
    try {
      if (!validateToken()) return;
      
      if (!formData.productName.trim()) {
        toast.error("Product name is required");
        return;
      }
      if (!formData.SKU?.trim()) {
        toast.error("SKU is required");
        return;
      }
      if (!formData.categoryId) {
        toast.error("Please select a category");
        return;
      }

      const colors = [...formData.colors];
      if (colors.length === 0) {
        colors.push({
          colorId: `temp_${Date.now()}_1`,
          colorName: "Default",
          fragrances: [],
          images: [],
          originalPrice: "",
          currentPrice: "",
          colorSpecifications: []
        });
      }

      const fragrances = colors[0]?.fragrances || [];
      const validFragrances = fragrances.filter(f => f?.trim() !== "");
      if (validFragrances.length === 0) {
        toast.warning("At least 1 fragrance is required");
        return;
      }

      if (!colors[0].currentPrice || colors[0].currentPrice <= 0) {
        toast.error("Current price is required and must be greater than 0");
        return;
      }

      if (!thumbnailFile && formMode === "add") {
        toast.error("Thumbnail image is required");
        return;
      }

      setIsLoading(true);
      setError("");

      const formDataToSend = new FormData();

      Object.keys(formData).forEach(key => {
        if (key === 'specifications') {
          const nonEmptySpecs = formData.specifications.filter(
            spec => spec.key?.trim() !== "" && spec.value?.trim() !== ""
          );
          if (nonEmptySpecs.length > 0) {
            formDataToSend.append(key, JSON.stringify(nonEmptySpecs));
          }
        } else if (key === 'colors') {
          const colorsData = colors.map(color => ({
            colorId: color.colorId,
            colorName: "Default",
            fragrances: (color.fragrances || [])
              .filter(f => f?.trim() !== "")
              .map(f => f.toLowerCase()),
            images: [],
            originalPrice: color.originalPrice || 0,
            currentPrice: color.currentPrice || 0,
            colorSpecifications: []
          }));
          if (colorsData.length > 0) {
            formDataToSend.append(key, JSON.stringify(colorsData));
          }
        } else if (key === 'models') {
          formDataToSend.append(key, JSON.stringify([]));
        } else if (formData[key] !== null && formData[key] !== '' && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      });

      formDataToSend.append("type", "simple");
      if (thumbnailFile) formDataToSend.append("thumbnail", thumbnailFile);

      if (colors.length > 0 && colors[0].images && colors[0].images.length > 0) {
        colors[0].images.forEach((imgFile) => {
          if (imgFile instanceof File) {
            formDataToSend.append(`colorImages[0]`, imgFile);
            formDataToSend.append(`colorIds[0]`, colors[0].colorId);
          }
        });
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/products/add`,
        formDataToSend,
        { headers: getAuthHeaders() }
      );

      if (response.data) {
        toast.success("✅ Product added successfully!");
        resetForm();
        fetchProducts();
      }
    } catch (err) {
      console.error("❌ Error adding product:", err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Session expired. Please login again.");
        localStorage.clear();
        navigate("/admin/login");
      } else if (err.response?.status === 409) {
        toast.error("Product already exists!");
      } else {
        toast.error(err.response?.data?.message || "Failed to add product");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✏️ UPDATE PRODUCT
  const updateProduct = async () => {
    try {
      if (!validateToken()) return;
      
      if (!formData.productId) {
        toast.error("Product ID is missing");
        return;
      }

      if (!formData.categoryId) {
        toast.error("Please select a category");
        return;
      }

      const productColors = formData.colors || [];
      const fragrances = productColors.length > 0 ? (productColors[0]?.fragrances || []) : [];
      const validFragrances = fragrances.filter(f => f?.trim() !== "");

      if (validFragrances.length === 0) {
        toast.warning("At least 1 fragrance is required");
        return;
      }

      setIsLoading(true);
      setError("");

      const formDataToSend = new FormData();

      Object.keys(formData).forEach(key => {
        if (key === 'specifications') {
          const nonEmptySpecs = formData.specifications.filter(
            spec => spec.key?.trim() !== "" && spec.value?.trim() !== ""
          );
          formDataToSend.append(key, JSON.stringify(nonEmptySpecs));
        } else if (key === 'colors') {
          const colorsData = productColors
            .filter(color => color.colorName?.trim() !== "")
            .map(color => ({
              colorId: color.colorId || "",
              colorName: "Default",
              fragrances: (color.fragrances || [])
                .filter(f => f?.trim() !== "")
                .map(f => f.toLowerCase()),
              images: color.images ? color.images.filter(img => typeof img === 'string') : [],
              originalPrice: color.originalPrice || 0,
              currentPrice: color.currentPrice || 0,
              colorSpecifications: []
            }));
          if (colorsData.length > 0) {
            formDataToSend.append(key, JSON.stringify(colorsData));
          }
        } else if (key === 'models') {
          formDataToSend.append(key, JSON.stringify([]));
        } else if (key !== 'productId' && formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      });

      formDataToSend.append("type", "simple");
      if (thumbnailFile) formDataToSend.append("thumbnail", thumbnailFile);

      if (productColors.length > 0) {
        productColors.forEach((color, colorIndex) => {
          if (color.images && color.images.length > 0) {
            color.images.forEach((img) => {
              if (img instanceof File) {
                formDataToSend.append(`colorImages[${colorIndex}]`, img);
                formDataToSend.append(`colorIds[${colorIndex}]`, color.colorId || "");
              }
            });
          }
        });
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/products/update/${formData.productId}`,
        formDataToSend,
        { headers: getAuthHeaders() }
      );

      if (response.data) {
        toast.success("✅ Product updated successfully!");
        resetForm();
        fetchProducts();
      }
    } catch (err) {
      console.error("❌ Error updating product:", err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Session expired. Please login again.");
        localStorage.clear();
        navigate("/admin/login");
      } else if (err.response?.status === 404) {
        toast.error("Product not found!");
      } else {
        toast.error(err.response?.data?.message || "Failed to update product");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 🗑️ DELETE PRODUCT
  const deleteProduct = async () => {
    try {
      if (!validateToken()) return;
      
      if (!deleteProductId) return;

      const shouldDelete = window.confirm("Are you sure you want to delete this product? This action cannot be undone.");
      if (!shouldDelete) {
        setDeleteProductId(null);
        return;
      }

      setIsLoading(true);

      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/products/delete/${deleteProductId}`,
        { headers: getAuthHeaders() }
      );

      if (response.data) {
        toast.success("✅ Product deactivated successfully!");
        setDeleteProductId(null);
        fetchProducts();
      }
    } catch (err) {
      console.error("❌ Error deleting product:", err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Session expired. Please login again.");
        localStorage.clear();
        navigate("/admin/login");
      } else if (err.response?.status === 404) {
        toast.error("Product not found!");
      } else {
        toast.error(err.response?.data?.message || "Failed to delete product");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✏️ OPEN UPDATE FORM
  const openUpdateForm = (product) => {
    setFormMode("update");
    const preparedData = {
      ...product,
      specifications: product.specifications?.length > 0 ? product.specifications : [{ key: "", value: "" }, { key: "", value: "" }],
      colors: product.colors || [],
      models: [],
      hsnCode: product.hsnCode || ""
    };
    setFormData(preparedData);
    setExistingThumbnail(product.thumbnailImage || "");
    setThumbnailFile(null);
    setShowProductForm(true);
  };

  // 🔄 RESET FORM
  const resetForm = () => {
    setFormData({
      productName: "",
      description: "",
      categoryId: categories.length > 0 ? categories[0].categoryId : "",
      categoryName: categories.length > 0 ? categories[0].name : "",
      hsnCode: "",
      type: "simple",
      modelName: "",
      SKU: "",
      specifications: [{ key: "", value: "" }, { key: "", value: "" }],
      colors: [],
      models: []
    });
    setThumbnailFile(null);
    setExistingThumbnail("");
    setShowProductForm(false);
    setFormMode("add");
    setError("");
  };

  // 🔧 HELPER FUNCTIONS
  const formatPrice = (price) => {
    return price ? parseFloat(price).toFixed(2) : "0.00";
  };

  const getDisplayPrice = (product) => {
    if (product.colors && product.colors.length > 0) {
      const color = product.colors[0];
      return `₹${formatPrice(color.currentPrice)}`;
    }
    return "₹0.00";
  };

  const getFragranceCount = (product) => {
    if (product.colors && product.colors.length > 0) {
      return product.colors[0].fragrances?.length || 0;
    }
    return 0;
  };

  const getImageSrc = (img) => {
    if (typeof img === 'string' && (img.startsWith('http') || img.startsWith('/'))) {
      return img;
    } else if (img instanceof File) {
      return URL.createObjectURL(img);
    }
    return "";
  };

  // 📤 EXPORT TO EXCEL
  const exportAllAsExcel = () => {
    if (filteredProducts.length === 0) {
      toast.warning("No products to export");
      return;
    }

    try {
      const data = filteredProducts.map(p => ({
        "Product Name": p.productName,
        "Category": p.categoryName,
        "SKU": p.SKU || "-",
        "Fragrances": getFragranceCount(p),
        "HSN Code": p.hsnCode || "-",
        "Price": getDisplayPrice(p),
        "Status": p.isActive ? 'Active' : 'Inactive'
      }));

      const XLSX = window.XLSX;
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
      XLSX.writeFile(workbook, "products_list.xlsx");
      
      toast.success("✅ Excel file downloaded successfully!");
    } catch (err) {
      console.error("❌ Error exporting to Excel:", err);
      toast.error("Failed to export to Excel");
    }
  };

  // Check if user is admin on component mount
  useEffect(() => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("adminToken");

    if (!token || role !== "admin") {
      navigate("/admin/login");
    }
  }, [navigate]);

  // If not admin, show access denied
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("adminToken");

  if (!token || role !== "admin") {
    return (
      <div className="list-products access-denied">
        <div className="access-denied-content">
          <FiPackage className="denied-icon" />
          <h2>Access Restricted</h2>
          <p>Administrator privileges required to view this page.</p>
          <button
            className="auth-btn"
            onClick={() => navigate("/admin/login")}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="list-products-container">
        {/* Header */}
        <header className="list-products-header">
          <div className="header-content">
            <div className="header-title">
              <FiPackage className="header-icon" />
              <h1>Product Management</h1>
              <span className="products-badge">{filteredProducts.length || 0}</span>
            </div>

            <div className="header-actions">
              <button
                className="refresh-products-btn"
                onClick={() => {
                  console.log("🔄 Manual refresh clicked");
                  fetchProducts();
                }}
                disabled={isLoading}
              >
                <FiRefreshCw className={isLoading ? "spinning" : ""} />
                Refresh
              </button>
              <button className="logout-products-btn" onClick={handleLogout}>
                <FiX />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Filters Section */}
        <div className="products-filters-section">
          <div className="products-search-container">
            <div className="products-search-box">
              <FiSearch className="products-search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearch}
                disabled={isLoading}
                className="products-search-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    console.log("🔍 Enter pressed for search:", searchTerm);
                  }
                }}
              />
            </div>
            
            <div className="products-action-buttons">
              <button
                className="export-products-btn"
                onClick={exportAllAsExcel}
                disabled={isLoading || filteredProducts.length === 0}
              >
                <FiFileText />
                Export Excel
              </button>
              
              <button
                className="add-product-btn"
                onClick={() => {
                  setFormMode("add");
                  resetForm();
                  setShowProductForm(true);
                }}
                disabled={isLoading}
              >
                <FiPlus />
                Add Product
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="products-error-alert">
            <FiAlertCircle className="products-error-icon" />
            <span>{error}</span>
            <button onClick={() => setError("")} className="products-close-error">
              <FiX />
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="products-loading-overlay">
            <div className="products-loading-spinner"></div>
            <p>Loading products...</p>
          </div>
        )}

        {/* Products Table */}
        <div className="products-table-wrapper">
          <div className="products-table-responsive">
            <table className="admin-products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Fragrances</th>
                  <th>HSN Code</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="products-no-data">
                      <div className="products-empty-state">
                        <FiPackage />
                        <p>No products found</p>
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                          {searchTerm ? `No results for "${searchTerm}"` : "Add your first product"}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product._id || product.productId}>
                      <td className="product-info-cell">
                        <div className="product-image-name">
                          {product.thumbnailImage ? (
                            <img
                              src={product.thumbnailImage}
                              alt={product.productName}
                              className="product-thumbnail"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/50x50?text=No+Image";
                              }}
                            />
                          ) : (
                            <div className="product-no-thumbnail">
                              <FiImage />
                            </div>
                          )}
                          <div className="product-name-details">
                            <div className="product-name-display">
                              <strong>{product.productName}</strong>
                            </div>
                            <div className="product-description-preview">
                              {product.description?.substring(0, 50)}{product.description?.length > 50 ? '...' : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="sku-display">
                          <FiTag className="sku-icon" />
                          <span className="sku-value">{product.SKU || "N/A"}</span>
                        </div>
                      </td>

                      <td>
                        <div className="category-display-badge">
                          <FiGrid className="category-icon" />
                          <span>{product.categoryName || "Uncategorized"}</span>
                        </div>
                      </td>

                      <td>
                        <div className="fragrances-count-display">
                          <span className="count-badge">{getFragranceCount(product)}</span>
                          <span className="count-label">fragrances</span>
                        </div>
                      </td>

                      <td>
                        <div className="hsn-code-display">
                          <code>{product.hsnCode || "N/A"}</code>
                        </div>
                      </td>

                      <td className="price-display-cell">
                        <div className="price-display">
                          <HiOutlineCurrencyRupee className="currency-icon-display" />
                          <span className="price-value-display">
                            {getDisplayPrice(product)}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div
                          className={`product-status-badge ${product.isActive ? 'active' : 'inactive'}`}
                        >
                          <span>{product.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </td>

                      <td>
                        <div className="product-action-buttons">
                          <button
                            className="edit-product-btn"
                            onClick={() => openUpdateForm(product)}
                            disabled={isLoading}
                            title="Edit Product"
                          >
                            <FiEdit className="action-icon-display" />
                            <span className="action-text-display">Edit</span>
                          </button>
                          
                          <button
                            className="delete-product-btn"
                            onClick={() => setDeleteProductId(product.productId)}
                            disabled={isLoading}
                            title="Delete Product"
                          >
                            <FiTrash2 className="action-icon-display" />
                            <span className="action-text-display">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Form Modal */}
        {showProductForm && (
          <div className="product-details-modal-overlay">
            <div className="modal-backdrop" onClick={resetForm}></div>
            <div className="product-details-modal-content">
              <div className="modal-header-section">
                <div className="modal-title-section">
                  <FiPackage />
                  <h2>{formMode === "add" ? "Add New Product" : "Edit Product"}</h2>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={resetForm}
                >
                  <FiX />
                </button>
              </div>

              <div className="modal-body-section">
                <div className="modal-section-item">
                  <h3 className="section-title-item">
                    <FiInfo />
                    Basic Information
                  </h3>
                  <div className="product-form-grid">
                    <div className="form-group-section">
                      <label>Product Name *</label>
                      <input
                        name="productName"
                        placeholder="Enter product name"
                        value={formData.productName}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="form-input-section"
                        required
                      />
                    </div>

                    <div className="form-group-section">
                      <label>Category *</label>
                      <div className="category-select-section">
                        <FiChevronDown className="select-arrow" />
                        <select
                          value={formData.categoryId}
                          onChange={handleCategoryChange}
                          disabled={isLoading}
                          className="form-select-section"
                        >
                          <option value="">Select Category</option>
                          {categories.map(category => (
                            <option key={category.categoryId} value={category.categoryId}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group-section">
                      <label>SKU *</label>
                      <input
                        name="SKU"
                        placeholder="Enter SKU (Stock Keeping Unit)"
                        value={formData.SKU}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="form-input-section"
                        required
                      />
                    </div>

                    <div className="form-group-section">
                      <label>HSN Code</label>
                      <input
                        name="hsnCode"
                        placeholder="Enter HSN Code"
                        value={formData.hsnCode}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="form-input-section"
                      />
                    </div>

                    <div className="form-group-section full-width-section">
                      <label>Product Description</label>
                      <textarea
                        name="description"
                        placeholder="Enter detailed product description..."
                        value={formData.description}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="form-textarea-section"
                        rows="4"
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-section-item">
                  <h3 className="section-title-item">
                    <FiImage />
                    Thumbnail Image {formMode === "add" && "*"}
                  </h3>
                  <div className="thumbnail-upload-section">
                    <div className="file-upload-area-section">
                      <label className="file-upload-label-section">
                        <span>Choose Thumbnail Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailChange}
                          disabled={isLoading}
                          className="file-input-section"
                        />
                      </label>
                      
                      {thumbnailFile && (
                        <div className="image-preview-section">
                          <img src={URL.createObjectURL(thumbnailFile)} alt="Thumbnail preview" />
                          <div className="image-info-section">
                            <span className="file-name-section">{thumbnailFile.name}</span>
                            <span className="file-size-section">
                              {(thumbnailFile.size / 1024).toFixed(2)} KB
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {!thumbnailFile && existingThumbnail && (
                        <div className="image-preview-section">
                          <p className="current-label-section">Current thumbnail:</p>
                          <img src={existingThumbnail} alt="Current thumbnail" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-section-item">
                  <h3 className="section-title-item">
                    <FiImage />
                    Product Images
                  </h3>
                  <div className="product-images-upload-section">
                    <div className="file-upload-area-section">
                      <label className="file-upload-label-section">
                        <span>Upload Product Images</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleProductImagesChange}
                          disabled={isLoading}
                          className="file-input-section"
                        />
                      </label>
                      
                      {formData.colors[0]?.images?.length > 0 && (
                        <div className="images-preview-section">
                          <div className="images-count-section">
                            Selected images: <strong>{formData.colors[0]?.images?.length}</strong>
                          </div>
                          <div className="images-grid-section">
                            {formData.colors[0]?.images?.map((img, imgIndex) => (
                              <div key={imgIndex} className="image-preview-item-section">
                                <img
                                  src={getImageSrc(img)}
                                  alt={`Product ${imgIndex + 1}`}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://via.placeholder.com/100x100?text=Error";
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeProductImage(imgIndex)}
                                  className="remove-image-btn-section"
                                  disabled={isLoading}
                                  title="Remove this image"
                                >
                                  <FiX />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-section-item">
                  <h3 className="section-title-item">
                    <FiDollarSign />
                    Pricing Information
                  </h3>
                  <div className="pricing-form-grid">
                    <div className="form-group-section">
                      <label>Original Price (MRP)</label>
                      <div className="price-input-section">
                        <span className="currency-section">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.colors[0]?.originalPrice || ""}
                          onChange={(e) => handlePriceChange('originalPrice', e.target.value)}
                          disabled={isLoading}
                          className="price-input-field"
                        />
                      </div>
                    </div>

                    <div className="form-group-section">
                      <label>Current Price (Selling Price) *</label>
                      <div className="price-input-section">
                        <span className="currency-section">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.colors[0]?.currentPrice || ""}
                          onChange={(e) => handlePriceChange('currentPrice', e.target.value)}
                          disabled={isLoading}
                          className="price-input-field"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-section-item">
                  <div className="section-header-section">
                    <h3 className="section-title-item">
                      <FiTag />
                      Product Specifications
                    </h3>
                    <button
                      type="button"
                      onClick={addSpecField}
                      className="add-field-btn-section"
                      disabled={isLoading}
                    >
                      <FiPlus />
                      Add Field
                    </button>
                  </div>
                  
                  <div className="specifications-container-section">
                    {formData.specifications.map((spec, index) => (
                      <div key={index} className="spec-row-section">
                        <input
                          placeholder="Key (e.g., Material, Weight)"
                          value={spec.key}
                          onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                          disabled={isLoading}
                          className="spec-input-section key-input"
                        />
                        <input
                          placeholder="Value (e.g., Cotton, 500g)"
                          value={spec.value}
                          onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                          disabled={isLoading}
                          className="spec-input-section value-input"
                        />
                        <button
                          type="button"
                          className="remove-spec-btn-section"
                          onClick={() => removeSpecField(index)}
                          disabled={formData.specifications.length <= 2 || isLoading}
                          title="Remove this specification"
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-section-item">
                  <div className="section-header-section">
                    <h3 className="section-title-item">
                      <FiPackage />
                      Fragrances *
                    </h3>
                    <button
                      type="button"
                      onClick={addFragrance}
                      className="add-field-btn-section"
                      disabled={isLoading}
                    >
                      <FiPlus />
                      Add Fragrance
                    </button>
                  </div>
                  
                  <p className="section-hint-section">
                    Add different fragrance options (e.g., Rose, Lavender, Sandalwood)
                  </p>
                  
                  <div className="fragrances-container-section">
                    {formData.colors[0]?.fragrances?.length === 0 ? (
                      <div className="no-items-section">
                        No fragrances added yet. Add at least one fragrance.
                      </div>
                    ) : (
                      formData.colors[0]?.fragrances?.map((fragrance, index) => (
                        <div key={index} className="fragrance-row-section">
                          <input
                            placeholder="Enter fragrance name"
                            value={fragrance}
                            onChange={(e) => handleFragranceChange(index, e.target.value)}
                            disabled={isLoading}
                            className="fragrance-input-section"
                          />
                          <button
                            type="button"
                            className="remove-fragrance-btn-section"
                            onClick={() => removeFragrance(index)}
                            disabled={isLoading}
                            title="Remove this fragrance"
                          >
                            <FiX />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer-section">
                <button
                  className="btn-secondary-section"
                  onClick={resetForm}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                
                {formMode === "add" ? (
                  <button
                    className="btn-primary-section"
                    onClick={addProduct}
                    disabled={isLoading}
                  >
                    {isLoading ? "Adding Product..." : "Add Product"}
                  </button>
                ) : (
                  <button
                    className="btn-primary-section"
                    onClick={updateProduct}
                    disabled={isLoading}
                  >
                    {isLoading ? "Updating Product..." : "Update Product"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteProductId && (
          <div className="product-details-modal-overlay">
            <div className="modal-backdrop" onClick={() => setDeleteProductId(null)}></div>
            <div className="product-details-modal-content confirm-modal">
              <div className="modal-header-section">
                <div className="modal-title-section">
                  <MdOutlineCancel />
                  <h2>Confirm Delete</h2>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setDeleteProductId(null)}
                >
                  <FiX />
                </button>
              </div>

              <div className="modal-body-section">
                <div className="confirmation-message-section">
                  <FiAlertCircle className="warning-icon" />
                  <p>This will deactivate the product. Are you sure you want to delete this product?</p>
                  <p className="warning-note">This action cannot be undone.</p>
                </div>
              </div>

              <div className="modal-footer-section">
                <button
                  className="btn-secondary-section"
                  onClick={() => setDeleteProductId(null)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                
                <button
                  className="btn-danger-section"
                  onClick={deleteProduct}
                  disabled={isLoading}
                >
                  {isLoading ? "Deleting..." : "Yes, Delete Product"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ListProducts;