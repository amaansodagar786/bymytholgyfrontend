import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FiGrid,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiLogOut,
  FiX,
  FiCheck,
  FiAlertCircle
} from "react-icons/fi";
import "./AdminCategories.scss";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [editId, setEditId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalCategories: 0,
    activeCategories: 0
  });
  
  const navigate = useNavigate();

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
      "Content-Type": "application/json"
    };
  };

  // 📋 FETCH ALL CATEGORIES
  const fetchCategories = async () => {
    try {
      if (!validateToken()) return;
      
      setIsLoading(true);
      setError("");
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/categories/get`,
        { headers: getAuthHeaders() }
      );

      console.log("✅ Categories fetched:", response.data);
      
      if (Array.isArray(response.data)) {
        setCategories(response.data);
        setStats({
          totalCategories: response.data.length,
          activeCategories: response.data.length // All are considered active
        });
      } else {
        console.error("❌ Unexpected response format:", response.data);
        setCategories([]);
      }
    } catch (err) {
      console.error("❌ Error fetching categories:", err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("role");
        localStorage.removeItem("adminId");
        setTimeout(() => navigate("/admin/login"), 2000);
      } else {
        setError(err.response?.data?.message || "Failed to fetch categories");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ➕ ADD CATEGORY (TEXT ONLY)
  const addCategory = async () => {
    try {
      if (!validateToken()) return;
      
      // Validate inputs
      if (!categoryName.trim()) {
        toast.warning("Please enter category name");
        return;
      }
      
      setIsLoading(true);
      setError("");

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/categories/add`,
        { name: categoryName.trim() },
        { 
          headers: getAuthHeaders()
        }
      );

      if (response.data) {
        toast.success("✅ Category added successfully!");
        
        // Reset form
        setCategoryName("");
        fetchCategories();
      }
    } catch (err) {
      console.error("❌ Error adding category:", err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Session expired. Please login again.");
        localStorage.clear();
        navigate("/admin/login");
      } else if (err.response?.status === 409) {
        toast.error("Category already exists!");
      } else {
        toast.error(err.response?.data?.message || "Failed to add category");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✏️ UPDATE CATEGORY (TEXT ONLY)
  const updateCategory = async () => {
    try {
      if (!validateToken()) return;
      
      // Validate inputs
      if (!categoryName.trim()) {
        toast.warning("Please enter category name");
        return;
      }
      
      setIsLoading(true);
      setError("");

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/categories/update/${editId}`,
        { name: categoryName.trim() },
        { 
          headers: getAuthHeaders()
        }
      );

      if (response.data) {
        toast.success("✅ Category updated successfully!");
        
        // Reset form
        setCategoryName("");
        setEditId(null);
        fetchCategories();
      }
    } catch (err) {
      console.error("❌ Error updating category:", err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Session expired. Please login again.");
        localStorage.clear();
        navigate("/admin/login");
      } else if (err.response?.status === 404) {
        toast.error("Category not found!");
      } else {
        toast.error(err.response?.data?.message || "Failed to update category");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 🗑️ DELETE CATEGORY
  const deleteCategory = async (id) => {
    try {
      if (!validateToken()) return;
      
      if (!window.confirm(`Are you sure you want to delete this category? This action cannot be undone.`)) {
        return;
      }
      
      setIsLoading(true);

      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/categories/delete/${id}`,
        { headers: getAuthHeaders() }
      );

      if (response.data) {
        toast.success("✅ Category deleted successfully!");
        fetchCategories();
      }
    } catch (err) {
      console.error("❌ Error deleting category:", err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Session expired. Please login again.");
        localStorage.clear();
        navigate("/admin/login");
      } else if (err.response?.status === 404) {
        toast.error("Category not found!");
      } else {
        toast.error(err.response?.data?.message || "Failed to delete category");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✏️ SET EDIT MODE
  const handleEdit = (cat) => {
    setEditId(cat.categoryId);
    setCategoryName(cat.name);
  };

  // ❌ CANCEL EDIT MODE
  const cancelEdit = () => {
    setEditId(null);
    setCategoryName("");
    setError("");
  };

  // 🚪 LOGOUT FUNCTION
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("role");
    localStorage.removeItem("adminId");
    navigate("/admin/login");
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
      <div className="admin-categories access-denied">
        <div className="access-denied-content">
          <FiGrid className="denied-icon" />
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
    <div className="admin-categories-container">
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

      {/* Header */}
      <header className="admin-categories-header">
        <div className="header-content">
          <div className="header-title">
            <FiGrid className="header-icon" />
            <h1>Category Management</h1>
            <span className="categories-badge">{stats.totalCategories || 0}</span>
          </div>

          <div className="header-actions">
            <button
              className="refresh-categories-btn"
              onClick={fetchCategories}
              disabled={isLoading}
            >
              <FiRefreshCw className={isLoading ? "spinning" : ""} />
              Refresh
            </button>
            <button className="logout-categories-btn" onClick={handleLogout}>
              <FiLogOut />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="categories-stats-grid">
        <div className="categories-stat-card">
          <div className="stat-icon-card total-categories">
            <FiGrid />
          </div>
          <div className="stat-card-content">
            <h3>{stats.totalCategories || 0}</h3>
            <p>Total Categories</p>
          </div>
        </div>

        <div className="categories-stat-card">
          <div className="stat-icon-card active-categories">
            <FiCheck />
          </div>
          <div className="stat-card-content">
            <h3>{stats.activeCategories || 0}</h3>
            <p>Active Categories</p>
          </div>
        </div>
      </div>

      {/* Category Form */}
      <div className="categories-form-section">
        <h2 className="form-section-title">
          {editId ? "✏️ Edit Category" : "➕ Add New Category"}
        </h2>
        
        <div className="form-input-group">
          <input
            type="text"
            placeholder="Enter category name (e.g., Electronics, Clothing, Home Decor)"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            disabled={isLoading}
            className="category-name-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                editId ? updateCategory() : addCategory();
              }
            }}
          />
          
          <div className="form-buttons-group">
            {editId ? (
              <>
                <button 
                  onClick={updateCategory} 
                  className="btn-primary-form"
                  disabled={isLoading || !categoryName.trim()}
                >
                  <FiCheck />
                  {isLoading ? "Updating..." : "Update Category"}
                </button>
                <button 
                  onClick={cancelEdit} 
                  className="btn-secondary-form"
                  disabled={isLoading}
                >
                  <FiX />
                  Cancel
                </button>
              </>
            ) : (
              <button 
                onClick={addCategory} 
                className="btn-primary-form"
                disabled={isLoading || !categoryName.trim()}
              >
                <FiPlus />
                {isLoading ? "Adding..." : "Add Category"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="categories-error-alert">
          <FiAlertCircle className="categories-error-icon" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="categories-close-error">
            <FiX />
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="categories-loading-overlay">
          <div className="categories-loading-spinner"></div>
          <p>Processing request...</p>
        </div>
      )}

      {/* Categories List */}
      <div className="categories-list-section">
        <div className="list-header">
          <h2>All Categories ({categories.length})</h2>
          <div className="list-stats">
            <span className="stat-badge">Total: {categories.length}</span>
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="categories-empty-state">
            <FiGrid className="empty-icon" />
            <p>No categories found</p>
            <p className="empty-subtext">Add your first category using the form above</p>
          </div>
        ) : (
          <div className="categories-grid">
            {categories.map((category) => (
              <div key={category._id || category.categoryId} className="category-card">
                <div className="category-card-header">
                  <div className="category-icon">
                    <FiGrid />
                  </div>
                  <div className="category-info">
                    <h3 className="category-name">{category.name}</h3>
                    <div className="category-meta">
                      <span className="category-id">ID: {category.categoryId}</span>
                      {category.createdAt && (
                        <span className="category-date">
                          Created: {new Date(category.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="category-actions">
                  <button
                    className="category-edit-btn"
                    onClick={() => handleEdit(category)}
                    disabled={isLoading}
                    title="Edit Category"
                  >
                    <FiEdit />
                    <span>Edit</span>
                  </button>
                  
                  <button
                    className="category-delete-btn"
                    onClick={() => deleteCategory(category.categoryId)}
                    disabled={isLoading}
                    title="Delete Category"
                  >
                    <FiTrash2 />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;