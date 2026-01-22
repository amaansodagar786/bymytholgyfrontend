import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./ListProducts.scss";
import AdminLayout from "../AdminLayout/AdminLayout";
import { FaSearch, FaPlus, FaFileExcel, FaEdit, FaTrash, FaUpload, FaTimes } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ListProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
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

  // Fetch data
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/products/all`);
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/categories/get`);
      setCategories(res.data);
      if (res.data?.length === 1) {
        const singleCategory = res.data[0];
        setFormData(prev => ({
          ...prev,
          categoryId: singleCategory.categoryId,
          categoryName: singleCategory.name
        }));
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("Failed to load categories");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

  // Product operations
  const addProduct = async () => {
    try {
      if (!formData.productName.trim()) {
        toast.error("Product name is required");
        return;
      }
      if (!formData.SKU?.trim()) {
        toast.error("SKU is required");
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

      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Please login first");
        return;
      }

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

      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL}/products/add`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      toast.success("Product added successfully!");
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error("Error adding product:", err);
      toast.error(err.response?.data?.error || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async () => {
    try {
      if (!formData.productId) {
        toast.error("Product ID is missing");
        return;
      }

      const productColors = formData.colors || [];
      const fragrances = productColors.length > 0 ? (productColors[0]?.fragrances || []) : [];
      const validFragrances = fragrances.filter(f => f?.trim() !== "");

      if (validFragrances.length === 0) {
        toast.warning("At least 1 fragrance is required");
        return;
      }

      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Please login first");
        return;
      }

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

      setLoading(true);
      await axios.put(
        `${import.meta.env.VITE_API_URL}/products/update/${formData.productId}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      toast.success("Product updated successfully!");
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error("Error updating product:", err);
      toast.error(err.response?.data?.error || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async () => {
    try {
      if (!deleteId) return;

      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Please login first");
        return;
      }

      const shouldDelete = window.confirm("Are you sure you want to delete this product?");
      if (!shouldDelete) {
        setDeleteId(null);
        return;
      }

      setLoading(true);
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/products/delete/${deleteId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      toast.success("Product deactivated successfully!");
      setDeleteId(null);
      fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error(err.response?.data?.error || "Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

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
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      productName: "",
      description: "",
      categoryId: formData.categoryId,
      categoryName: formData.categoryName,
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
    setShowForm(false);
  };

  // Helper functions
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

  const isImageUrl = (img) => {
    return typeof img === 'string' && (img.startsWith('http') || img.startsWith('/'));
  };

  const getImageSrc = (img) => {
    if (isImageUrl(img)) {
      return img;
    } else if (img instanceof File) {
      return URL.createObjectURL(img);
    }
    return "";
  };

  const exportAllAsExcel = () => {
    if (filteredProducts.length === 0) {
      toast.warning("No products to export");
      return;
    }

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
    
    toast.success("Excel file downloaded successfully!");
  };

  return (
    <AdminLayout>
      <ToastContainer 
        position="top-center"
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
      <div className="list-products">
        {/* HEADER */}
        <div className="page-header">
          <h2>Products ({filteredProducts.length})</h2>
          <div className="right-section">
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="action-buttons-group">
              <button className="export-all-btn" onClick={exportAllAsExcel}>
                <FaFileExcel /> Export
              </button>
              <button className="add-btn" 
                onClick={() => {
                  setFormMode("add");
                  resetForm();
                  setShowForm(true);
                }}
                disabled={loading}
              >
                <FaPlus /> Add
              </button>
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="data-table">
          {loading && filteredProducts.length === 0 ? (
            <div className="loading-container">
              <div className="loading-spinner large"></div>
              <p>Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-products">
              <p>No products found. Add your first product!</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Fragrances</th>
                  <th>HSN</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.productId}>
                    <td>
                      {p.thumbnailImage ? (
                        <img
                          src={p.thumbnailImage}
                          alt={p.productName}
                          className="thumbnail"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/50x50?text=No+Image";
                          }}
                        />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </td>
                    <td>{p.productName}</td>
                    <td>{p.SKU || "-"}</td>
                    <td>
                      <span className="variant-count">
                        {getFragranceCount(p)} fragrance(s)
                      </span>
                    </td>
                    <td>{p.hsnCode || "-"}</td>
                    <td>{getDisplayPrice(p)}</td>
                    <td>
                      <span className={`status ${p.isActive ? 'active' : 'inactive'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="actions">
                      <button
                        className="edit-btn"
                        onClick={() => openUpdateForm(p)}
                        disabled={loading}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => setDeleteId(p.productId)}
                        disabled={loading}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PRODUCT FORM MODAL - SIMPLE STACK LAYOUT */}
        {showForm && (
          <div className="modal-overlay" onClick={resetForm}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{formMode === "add" ? "Add New Product" : "Update Product"}</h3>
                <button className="modal-close" onClick={resetForm}>
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                <div className="product-form">
                  {/* BASIC INFORMATION - STACKED */}
                  <div className="form-section">
                    <h4>Basic Information</h4>
                    
                    <div className="form-group">
                      <label>Product Name *</label>
                      <input
                        name="productName"
                        placeholder="Enter product name"
                        value={formData.productName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group category-name">
                      <label className="category-display">Category</label>
                      <div className="category-display">
                        {formData.categoryName || "Select a category"}
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>SKU *</label>
                      <input
                        name="SKU"
                        placeholder="Enter SKU"
                        value={formData.SKU}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>HSN Code</label>
                      <input
                        name="hsnCode"
                        placeholder="Enter HSN Code"
                        value={formData.hsnCode}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Product Description</label>
                      <textarea
                        name="description"
                        placeholder="Enter product description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* THUMBNAIL IMAGE */}
                  <div className="form-section">
                    <h4>Thumbnail Image {formMode === "add" && "*"}</h4>
                    <div className="form-group">
                      <div className="file-upload-area">
                        <label className="file-upload-label">
                          <span>Choose Thumbnail Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                            className="file-input"
                          />
                        </label>
                        
                        {thumbnailFile && (
                          <div className="image-preview">
                            <img src={URL.createObjectURL(thumbnailFile)} alt="Thumbnail preview" />
                            <span className="file-name">{thumbnailFile.name}</span>
                          </div>
                        )}
                        
                        {!thumbnailFile && existingThumbnail && (
                          <div className="image-preview">
                            <p>Current thumbnail:</p>
                            <img src={existingThumbnail} alt="Current thumbnail" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PRICING - STACKED */}
                  <div className="form-section">
                    <h4>Pricing</h4>
                    
                    <div className="form-group">
                      <label>Original Price</label>
                      <div className="price-input-wrapper">
                        <span className="currency">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.colors[0]?.originalPrice || ""}
                          onChange={(e) => handlePriceChange('originalPrice', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Current Price *</label>
                      <div className="price-input-wrapper">
                        <span className="currency">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.colors[0]?.currentPrice || ""}
                          onChange={(e) => handlePriceChange('currentPrice', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* SPECIFICATIONS */}
                  <div className="form-section">
                    <div className="section-header">
                      <h4>Product Specifications</h4>
                      <button type="button" onClick={addSpecField} className="add-spec-btn">
                        <FaPlus /> Add Field
                      </button>
                    </div>
                    
                    <div className="specifications-container">
                      {formData.specifications.map((spec, index) => (
                        <div key={index} className="spec-row">
                          <input
                            placeholder="Key (e.g., Material, Weight)"
                            value={spec.key}
                            onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                            className="spec-input"
                          />
                          <input
                            placeholder="Value (e.g., Cotton, 500g)"
                            value={spec.value}
                            onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                            className="spec-input"
                          />
                          <button
                            type="button"
                            className="remove-spec-btn"
                            onClick={() => removeSpecField(index)}
                            disabled={formData.specifications.length <= 2}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FRAGRANCES */}
                  <div className="form-section">
                    <div className="section-header">
                      <h4>Fragrances *</h4>
                      <button type="button" onClick={addFragrance} className="add-spec-btn">
                        <FaPlus /> Add Fragrance
                      </button>
                    </div>
                    
                    <p className="section-hint">Add different fragrance options (e.g., rose, lavender, sandalwood)</p>
                    
                    <div className="fragrances-container">
                      {formData.colors[0]?.fragrances?.length === 0 ? (
                        <div className="no-items">No fragrances added yet</div>
                      ) : (
                        formData.colors[0]?.fragrances?.map((fragrance, index) => (
                          <div key={index} className="fragrance-row">
                            <input
                              placeholder="Enter fragrance name"
                              value={fragrance}
                              onChange={(e) => handleFragranceChange(index, e.target.value)}
                              className="fragrance-input"
                            />
                            <button
                              type="button"
                              className="remove-fragrance-btn"
                              onClick={() => removeFragrance(index)}
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* PRODUCT IMAGES */}
                  <div className="form-section">
                    <h4>Product Images</h4>
                    <div className="form-group">
                      <div className="file-upload-area">
                        <label className="file-upload-label">
                          <span>Upload Product Images</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleProductImagesChange}
                            className="file-input"
                          />
                        </label>
                        
                        {formData.colors[0]?.images?.length > 0 && (
                          <div className="images-preview">
                            <p>Selected images: {formData.colors[0]?.images?.length}</p>
                            <div className="images-grid">
                              {formData.colors[0]?.images?.map((img, imgIndex) => (
                                <div key={imgIndex} className="image-preview-item">
                                  <img
                                    src={getImageSrc(img)}
                                    alt={`Product ${imgIndex + 1}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeProductImage(imgIndex)}
                                    className="remove-image-btn"
                                  >
                                    <FaTimes />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="cancel-btn" onClick={resetForm} disabled={loading}>
                  Cancel
                </button>
                {formMode === "add" ? (
                  <button className="save-btn" onClick={addProduct} disabled={loading}>
                    {loading ? "Adding..." : "Add Product"}
                  </button>
                ) : (
                  <button className="save-btn" onClick={updateProduct} disabled={loading}>
                    {loading ? "Updating..." : "Update Product"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION */}
        {deleteId && (
          <div className="modal-overlay">
            <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Confirm Delete</h3>
              </div>
              <div className="modal-body">
                <p>This will deactivate the product. Are you sure?</p>
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setDeleteId(null)} disabled={loading}>
                  Cancel
                </button>
                <button className="delete-btn" onClick={deleteProduct} disabled={loading}>
                  {loading ? "Deleting..." : "Yes, Delete"}
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