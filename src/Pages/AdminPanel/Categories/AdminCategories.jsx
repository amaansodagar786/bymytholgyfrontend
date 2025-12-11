// AdminCategories.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import "./AdminCategories.scss";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editImage, setEditImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate(); // Initialize navigate

  // ✅ TOKEN VALIDATION FUNCTION
  const validateToken = () => {
    const token = localStorage.getItem("adminToken");
    const role = localStorage.getItem("role");
    
    if (!token || !role || role !== "admin") {
      // Clear invalid tokens
      localStorage.removeItem("adminToken");
      localStorage.removeItem("role");
      localStorage.removeItem("adminId");
      
      // Redirect to login
      navigate("/admin/login");
      return false;
    }
    
    // Optional: You can also validate token format
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
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

  // FETCH ALL CATEGORIES
  const fetchCategories = async () => {
    try {
      // Check token before making request
      if (!validateToken()) return;
      
      setIsLoading(true);
      setError("");
      
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/categories/get`
      );
      
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      
      // Handle unauthorized access
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Session expired. Please login again.");
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

  // ADD CATEGORY
  const addCategory = async () => {
    try {
      // Check token
      if (!validateToken()) return;
      
      // Validate inputs
      if (!categoryName.trim()) {
        alert("Please enter category name");
        return;
      }
      
      setIsLoading(true);
      setError("");
      
      // Create FormData
      const formData = new FormData();
      formData.append("name", categoryName.trim());
      if (categoryImage) {
        formData.append("image", categoryImage);
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL}/categories/add`,
        formData,
        { 
          headers: getAuthHeaders()
        }
      );

      // Reset form
      setCategoryName("");
      setCategoryImage(null);
      setPreviewImage("");
      fetchCategories();
      
      alert("Category added successfully!");
    } catch (err) {
      console.error("Error adding category:", err);
      
      // Handle specific error cases
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/admin/login");
      } else if (err.response?.status === 400) {
        alert(err.response.data.message || "Invalid request");
      } else if (err.response?.status === 409) {
        alert("Category already exists!");
      } else {
        alert(err.response?.data?.message || "Failed to add category");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // UPDATE CATEGORY
  const updateCategory = async () => {
    try {
      // Check token
      if (!validateToken()) return;
      
      // Validate inputs
      if (!categoryName.trim()) {
        alert("Please enter category name");
        return;
      }
      
      setIsLoading(true);
      setError("");
      
      // Create FormData
      const formData = new FormData();
      formData.append("name", categoryName.trim());
      if (editImage) {
        formData.append("image", editImage);
      }

      await axios.put(
        `${import.meta.env.VITE_API_URL}/categories/update/${editId}`,
        formData,
        { 
          headers: getAuthHeaders()
        }
      );

      // Reset form
      setCategoryName("");
      setEditId(null);
      setEditImage(null);
      setPreviewImage("");
      fetchCategories();
      
      alert("Category updated successfully!");
    } catch (err) {
      console.error("Error updating category:", err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/admin/login");
      } else if (err.response?.status === 404) {
        alert("Category not found!");
      } else {
        alert(err.response?.data?.message || "Failed to update category");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // DELETE CATEGORY
  const deleteCategory = async (id) => {
    try {
      // Check token
      if (!validateToken()) return;
      
      if (!window.confirm(`Are you sure you want to delete this category?`)) {
        return;
      }
      
      setIsLoading(true);
      
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/categories/delete/${id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } }
      );

      fetchCategories();
      alert("Category deleted successfully!");
    } catch (err) {
      console.error("Error deleting category:", err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/admin/login");
      } else if (err.response?.status === 404) {
        alert("Category not found!");
      } else {
        alert(err.response?.data?.message || "Failed to delete category");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB = 5 * 1024 * 1024 bytes)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert("Only image files are allowed (JPEG, JPG, PNG, GIF, WEBP)");
        return;
      }
      
      if (editId) {
        setEditImage(file);
      } else {
        setCategoryImage(file);
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Set edit mode
  const handleEdit = (cat) => {
    setEditId(cat.categoryId);
    setCategoryName(cat.name);
    setPreviewImage(cat.image || "");
    setEditImage(null);
    setCategoryImage(null);
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setEditId(null);
    setCategoryName("");
    setPreviewImage("");
    setEditImage(null);
    setCategoryImage(null);
    setError("");
  };

  // Logout function
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
      <div className="access-denied">
        <h2>❌ Access Denied: Admin Only</h2>
        <p>Please login as admin to access this page.</p>
        <button onClick={() => navigate("/admin/login")}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="admin-cat">
      {/* Header with logout */}
      <div className="admin-header">
        <h1>Manage Categories</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Processing...</p>
        </div>
      )}

      <div className="cat-form">
        <input
          type="text"
          placeholder="Category Name"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          disabled={isLoading}
        />

        {/* Image Upload */}
        <div className="image-upload-section">
          <label className="image-upload-label" style={isLoading ? {opacity: 0.6, cursor: 'not-allowed'} : {}}>
            <span>{previewImage ? "Change Image" : "Select Image"}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: "none" }}
              disabled={isLoading}
            />
          </label>
          
          {previewImage && (
            <div className="image-preview">
              <img src={previewImage} alt="Preview" />
              <p>Image Preview (Max: 5MB)</p>
            </div>
          )}
        </div>

        <div className="form-buttons">
          {editId ? (
            <>
              <button 
                onClick={updateCategory} 
                className="update-btn"
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update Category"}
              </button>
              <button 
                onClick={cancelEdit} 
                className="cancel-btn"
                disabled={isLoading}
              >
                Cancel
              </button>
            </>
          ) : (
            <button 
              onClick={addCategory} 
              className="add-btn"
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Add Category"}
            </button>
          )}
        </div>
      </div>

      <div className="cat-list">
        <h2>All Categories ({categories.length})</h2>
        
        {categories.length === 0 ? (
          <p className="no-categories">No categories found. Add your first category!</p>
        ) : (
          categories.map((cat) => (
            <div key={cat.categoryId} className="cat-item">
              <div className="cat-info">
                <span className="cat-name">{cat.name}</span>
                {cat.image && (
                  <div className="cat-image-preview">
                    <img src={cat.image} alt={cat.name} />
                  </div>
                )}
                {!cat.image && (
                  <span className="no-image">No Image</span>
                )}
              </div>

              <div className="actions">
                <button
                  className="edit"
                  onClick={() => handleEdit(cat)}
                  disabled={isLoading}
                >
                  Edit
                </button>

                <button
                  className="delete"
                  onClick={() => deleteCategory(cat.categoryId)}
                  disabled={isLoading}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCategories;