import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminCategories.scss";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [editId, setEditId] = useState(null);

  // FETCH ALL CATEGORIES
  const fetchCategories = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/categories/get`);
    setCategories(res.data);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ADD CATEGORY
  const addCategory = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      await axios.post(
        `${import.meta.env.VITE_API_URL}/categories/add`,
        { name: categoryName },
        { headers: { Authorization: token } }
      );

      setCategoryName("");
      fetchCategories();
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  // UPDATE CATEGORY
  const updateCategory = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      await axios.put(
        `${import.meta.env.VITE_API_URL}/categories/update/${editId}`,
        { name: categoryName },
        { headers: { Authorization: token } }
      );

      setCategoryName("");
      setEditId(null);

      fetchCategories();
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  // DELETE CATEGORY
  const deleteCategory = async (id) => {
    const token = localStorage.getItem("adminToken");

    await axios.delete(
      `${import.meta.env.VITE_API_URL}/categories/delete/${id}`,
      { headers: { Authorization: token } }
    );

    fetchCategories();
  };

  // ACCESS CONTROL
  const role = localStorage.getItem("role");
  if (role !== "admin") {
    return <h2 style={{ padding: "20px" }}>❌ Access Denied: Admin Only</h2>;
  }

  return (
    <div className="admin-cat">
      <h1>Manage Categories</h1>

      <div className="cat-form">
        <input
          type="text"
          placeholder="Category Name"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
        />

        {editId ? (
          <button onClick={updateCategory}>Update</button>
        ) : (
          <button onClick={addCategory}>Add</button>
        )}
      </div>

      <div className="cat-list">
        {categories.map((cat) => (
          <div key={cat.categoryId} className="cat-item">
            <span>{cat.name}</span>

            <div className="actions">
              <button
                className="edit"
                onClick={() => {
                  setEditId(cat.categoryId);
                  setCategoryName(cat.name);
                }}
              >
                Edit
              </button>

              <button
                className="delete"
                onClick={() => deleteCategory(cat.categoryId)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCategories;
