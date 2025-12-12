import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ListProducts.scss";

const ListProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    categoryId: "",
    categoryName: "",
    hsnCode: "",
    type: "simple",
    // Simple product fields
    modelName: "",
    SKU: "",
    specifications: [],
    colors: [],
    // Variable product fields
    models: []
  });

  // File states
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [existingThumbnail, setExistingThumbnail] = useState("");

  // Fetch products and categories
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/products/all`);
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/categories/get`);
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      alert("Failed to load categories");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "categoryId") {
      const selectedCat = categories.find(cat => cat.categoryId === value);
      setFormData({
        ...formData,
        categoryId: value,
        categoryName: selectedCat ? selectedCat.name : ""
      });
    } else if (name === "type") {
      if (value === "simple") {
        setFormData({
          ...formData,
          type: value,
          models: [],
          colors: formData.colors.length > 0 ? formData.colors : [{
            colorId: `temp_${Date.now()}_1`,
            colorName: "",
            sizes: [],
            images: [],
            originalPrice: "",
            currentPrice: "",
            colorSpecifications: []
          }]
        });
      } else {
        setFormData({
          ...formData,
          type: value,
          SKU: "",
          specifications: [],
          colors: [],
          models: formData.models.length > 0 ? formData.models : [{
            modelName: "",
            description: "",
            SKU: "",
            modelSpecifications: [],
            colors: [{
              colorId: `temp_${Date.now()}_1`,
              colorName: "",
              sizes: [],
              images: [],
              originalPrice: "",
              currentPrice: "",
              colorSpecifications: []
            }]
          }]
        });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // ========== SIMPLE PRODUCT HANDLERS ==========

  // GLOBAL SPECIFICATIONS
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
    const updatedSpecs = formData.specifications.filter((_, i) => i !== index);
    setFormData({ ...formData, specifications: updatedSpecs });
  };

  // COLORS for simple products
  const addColor = () => {
    setFormData({
      ...formData,
      colors: [
        ...formData.colors,
        {
          colorId: `temp_${Date.now()}_${formData.colors.length + 1}`,
          colorName: "",
          sizes: [],
          images: [],
          originalPrice: "",
          currentPrice: "",
          colorSpecifications: []
        }
      ]
    });
  };

  const removeColor = (colorIndex) => {
    const updatedColors = formData.colors.filter((_, i) => i !== colorIndex);
    setFormData({ ...formData, colors: updatedColors });
  };

  const handleColorChange = (colorIndex, field, value) => {
    const updatedColors = [...formData.colors];
    updatedColors[colorIndex][field] = value;
    setFormData({ ...formData, colors: updatedColors });
  };

  // SIZES for colors
  const addSizeToColor = (colorIndex) => {
    const updatedColors = [...formData.colors];
    const currentSizes = updatedColors[colorIndex].sizes || [];
    updatedColors[colorIndex].sizes = [...currentSizes, ""];
    setFormData({ ...formData, colors: updatedColors });
  };

  const removeSizeFromColor = (colorIndex, sizeIndex) => {
    const updatedColors = [...formData.colors];
    updatedColors[colorIndex].sizes = updatedColors[colorIndex].sizes.filter((_, i) => i !== sizeIndex);
    setFormData({ ...formData, colors: updatedColors });
  };

  const handleSizeChange = (colorIndex, sizeIndex, value) => {
    const updatedColors = [...formData.colors];
    updatedColors[colorIndex].sizes[sizeIndex] = value;
    setFormData({ ...formData, colors: updatedColors });
  };

  // COLOR SPECIFICATIONS
  const addColorSpecField = (colorIndex) => {
    const updatedColors = [...formData.colors];
    updatedColors[colorIndex].colorSpecifications = [
      ...(updatedColors[colorIndex].colorSpecifications || []),
      { key: "", value: "" }
    ];
    setFormData({ ...formData, colors: updatedColors });
  };

  const removeColorSpecField = (colorIndex, specIndex) => {
    const updatedColors = [...formData.colors];
    updatedColors[colorIndex].colorSpecifications =
      updatedColors[colorIndex].colorSpecifications.filter((_, i) => i !== specIndex);
    setFormData({ ...formData, colors: updatedColors });
  };

  const handleColorSpecChange = (colorIndex, specIndex, field, value) => {
    const updatedColors = [...formData.colors];
    updatedColors[colorIndex].colorSpecifications[specIndex][field] = value;
    setFormData({ ...formData, colors: updatedColors });
  };

  // COLOR IMAGES
  const handleColorImagesChange = (colorIndex, e) => {
    if (e.target.files.length > 0) {
      const updatedColors = [...formData.colors];
      const newFiles = Array.from(e.target.files);

      // Store file objects with color reference
      const newImages = newFiles.map(file => file);

      updatedColors[colorIndex].images = [...(updatedColors[colorIndex].images || []), ...newImages];
      setFormData({ ...formData, colors: updatedColors });
    }
  };

  const removeColorImage = (colorIndex, imageIndex) => {
    const updatedColors = [...formData.colors];
    updatedColors[colorIndex].images =
      updatedColors[colorIndex].images.filter((_, i) => i !== imageIndex);
    setFormData({ ...formData, colors: updatedColors });
  };

  // ========== VARIABLE PRODUCT HANDLERS ==========

  // MODELS for variable products
  const addModel = () => {
    setFormData({
      ...formData,
      models: [
        ...formData.models,
        {
          modelName: "",
          description: "",
          SKU: "",
          modelSpecifications: [],
          colors: [{
            colorId: `temp_${Date.now()}_${formData.models.length + 1}_1`,
            colorName: "",
            sizes: [],
            images: [],
            originalPrice: "",
            currentPrice: "",
            colorSpecifications: []
          }]
        }
      ]
    });
  };

  const removeModel = (modelIndex) => {
    const updatedModels = formData.models.filter((_, i) => i !== modelIndex);
    setFormData({ ...formData, models: updatedModels });
  };

  const handleModelChange = (modelIndex, field, value) => {
    const updatedModels = [...formData.models];
    updatedModels[modelIndex][field] = value;
    setFormData({ ...formData, models: updatedModels });
  };

  // MODEL SPECIFICATIONS
  const handleModelSpecChange = (modelIndex, specIndex, field, value) => {
    const updatedModels = [...formData.models];
    if (!updatedModels[modelIndex].modelSpecifications) {
      updatedModels[modelIndex].modelSpecifications = [];
    }
    updatedModels[modelIndex].modelSpecifications[specIndex][field] = value;
    setFormData({ ...formData, models: updatedModels });
  };

  const addModelSpecField = (modelIndex) => {
    const updatedModels = [...formData.models];
    if (!updatedModels[modelIndex].modelSpecifications) {
      updatedModels[modelIndex].modelSpecifications = [];
    }
    updatedModels[modelIndex].modelSpecifications = [
      ...updatedModels[modelIndex].modelSpecifications,
      { key: "", value: "" }
    ];
    setFormData({ ...formData, models: updatedModels });
  };

  const removeModelSpecField = (modelIndex, specIndex) => {
    const updatedModels = [...formData.models];
    updatedModels[modelIndex].modelSpecifications =
      updatedModels[modelIndex].modelSpecifications.filter((_, i) => i !== specIndex);
    setFormData({ ...formData, models: updatedModels });
  };

  // COLORS for models
  const addColorToModel = (modelIndex) => {
    const updatedModels = [...formData.models];
    updatedModels[modelIndex].colors = [
      ...(updatedModels[modelIndex].colors || []),
      {
        colorId: `temp_${Date.now()}_${modelIndex}_${updatedModels[modelIndex].colors.length + 1}`,
        colorName: "",
        sizes: [],
        images: [],
        originalPrice: "",
        currentPrice: "",
        colorSpecifications: []
      }
    ];
    setFormData({ ...formData, models: updatedModels });
  };

  const removeColorFromModel = (modelIndex, colorIndex) => {
    const updatedModels = [...formData.models];
    updatedModels[modelIndex].colors = updatedModels[modelIndex].colors.filter((_, i) => i !== colorIndex);
    setFormData({ ...formData, models: updatedModels });
  };

  const handleModelColorChange = (modelIndex, colorIndex, field, value) => {
    const updatedModels = [...formData.models];
    updatedModels[modelIndex].colors[colorIndex][field] = value;
    setFormData({ ...formData, models: updatedModels });
  };

  // SIZES for colors in models
  const addSizeToModelColor = (modelIndex, colorIndex) => {
    const updatedModels = [...formData.models];
    const currentSizes = updatedModels[modelIndex].colors[colorIndex].sizes || [];
    updatedModels[modelIndex].colors[colorIndex].sizes = [...currentSizes, ""];
    setFormData({ ...formData, models: updatedModels });
  };

  const removeSizeFromModelColor = (modelIndex, colorIndex, sizeIndex) => {
    const updatedModels = [...formData.models];
    updatedModels[modelIndex].colors[colorIndex].sizes =
      updatedModels[modelIndex].colors[colorIndex].sizes.filter((_, i) => i !== sizeIndex);
    setFormData({ ...formData, models: updatedModels });
  };

  const handleModelSizeChange = (modelIndex, colorIndex, sizeIndex, value) => {
    const updatedModels = [...formData.models];
    updatedModels[modelIndex].colors[colorIndex].sizes[sizeIndex] = value;
    setFormData({ ...formData, models: updatedModels });
  };

  // COLOR SPECIFICATIONS for colors in models
  const addModelColorSpecField = (modelIndex, colorIndex) => {
    const updatedModels = [...formData.models];
    if (!updatedModels[modelIndex].colors[colorIndex].colorSpecifications) {
      updatedModels[modelIndex].colors[colorIndex].colorSpecifications = [];
    }
    updatedModels[modelIndex].colors[colorIndex].colorSpecifications = [
      ...updatedModels[modelIndex].colors[colorIndex].colorSpecifications,
      { key: "", value: "" }
    ];
    setFormData({ ...formData, models: updatedModels });
  };

  const removeModelColorSpecField = (modelIndex, colorIndex, specIndex) => {
    const updatedModels = [...formData.models];
    updatedModels[modelIndex].colors[colorIndex].colorSpecifications =
      updatedModels[modelIndex].colors[colorIndex].colorSpecifications.filter((_, i) => i !== specIndex);
    setFormData({ ...formData, models: updatedModels });
  };

  const handleModelColorSpecChange = (modelIndex, colorIndex, specIndex, field, value) => {
    const updatedModels = [...formData.models];
    updatedModels[modelIndex].colors[colorIndex].colorSpecifications[specIndex][field] = value;
    setFormData({ ...formData, models: updatedModels });
  };

  // COLOR IMAGES for colors in models
  const handleModelColorImagesChange = (modelIndex, colorIndex, e) => {
    if (e.target.files.length > 0) {
      const updatedModels = [...formData.models];
      const newFiles = Array.from(e.target.files);

      const newImages = newFiles.map(file => file);

      updatedModels[modelIndex].colors[colorIndex].images = [
        ...(updatedModels[modelIndex].colors[colorIndex].images || []),
        ...newImages
      ];
      setFormData({ ...formData, models: updatedModels });
    }
  };

  const removeModelColorImage = (modelIndex, colorIndex, imageIndex) => {
    const updatedModels = [...formData.models];
    updatedModels[modelIndex].colors[colorIndex].images =
      updatedModels[modelIndex].colors[colorIndex].images.filter((_, i) => i !== imageIndex);
    setFormData({ ...formData, models: updatedModels });
  };

  // ========== IMAGE HANDLING ==========

  const handleThumbnailChange = (e) => {
    if (e.target.files[0]) {
      setThumbnailFile(e.target.files[0]);
    }
  };

  // ========== PRODUCT OPERATIONS ==========

  // ADD PRODUCT
  const addProduct = async () => {
    try {
      // Validation
      if (!formData.productName.trim()) {
        alert("Product name is required");
        return;
      }
      if (!formData.categoryId) {
        alert("Please select a category");
        return;
      }

      // Validation based on product type
      if (formData.type === "simple") {
        if (!formData.SKU?.trim()) {
          alert("SKU is required for simple products");
          return;
        }
        if (!formData.colors || formData.colors.length === 0) {
          alert("At least one color variant is required for simple products");
          return;
        }
        const invalidColors = formData.colors.filter(
          color => !color.colorName?.trim() || !color.currentPrice || color.currentPrice <= 0
        );
        if (invalidColors.length > 0) {
          alert("All colors must have a name and valid current price");
          return;
        }
      } else {
        if (!formData.models || formData.models.length === 0) {
          alert("At least one model is required for variable products");
          return;
        }
        const invalidModels = formData.models.filter(
          model => !model.modelName?.trim() || !model.SKU?.trim()
        );
        if (invalidModels.length > 0) {
          alert("All models must have both Model Name and SKU");
          return;
        }
        for (const model of formData.models) {
          if (!model.colors || model.colors.length === 0) {
            alert(`Model "${model.modelName}" must have at least one color variant`);
            return;
          }
          const invalidColors = model.colors.filter(
            color => !color.colorName?.trim() || !color.currentPrice || color.currentPrice <= 0
          );
          if (invalidColors.length > 0) {
            alert(`All colors in model "${model.modelName}" must have a name and valid current price`);
            return;
          }
        }
      }

      if (!thumbnailFile && formMode === "add") {
        alert("Thumbnail image is required");
        return;
      }

      const token = localStorage.getItem("adminToken");
      if (!token) {
        alert("Please login first");
        return;
      }

      const formDataToSend = new FormData();

      // Append basic data
      Object.keys(formData).forEach(key => {
        if (key === 'specifications' && formData.type === "simple") {
          const nonEmptySpecs = formData.specifications.filter(
            spec => spec.key?.trim() !== "" && spec.value?.trim() !== ""
          );
          if (nonEmptySpecs.length > 0) {
            formDataToSend.append(key, JSON.stringify(nonEmptySpecs));
          }
        } else if (key === 'colors' && formData.type === "simple") {
          // Process colors WITHOUT images (images will be sent as files)
          const colorsWithoutImages = formData.colors
            .filter(color => color.colorName?.trim() !== "")
            .map(color => ({
              colorId: color.colorId,
              colorName: color.colorName,
              sizes: color.sizes || [],
              images: [], // Empty array - images will be added by backend
              originalPrice: color.originalPrice || 0,
              currentPrice: color.currentPrice || 0,
              colorSpecifications: color.colorSpecifications?.filter(
                spec => spec.key?.trim() !== "" && spec.value?.trim() !== ""
              ) || []
            }));

          if (colorsWithoutImages.length > 0) {
            formDataToSend.append(key, JSON.stringify(colorsWithoutImages));
          }
        } else if (key === 'models' && formData.type === "variable") {
          // Process models WITHOUT images
          const modelsWithoutImages = formData.models
            .filter(model => model.modelName?.trim() !== "" && model.SKU?.trim() !== "")
            .map(model => ({
              modelName: model.modelName,
              description: model.description || "",
              SKU: model.SKU,
              modelSpecifications: model.modelSpecifications?.filter(
                spec => spec.key?.trim() !== "" && spec.value?.trim() !== ""
              ) || [],
              colors: (model.colors || [])
                .filter(color => color.colorName?.trim() !== "")
                .map(color => ({
                  colorId: color.colorId,
                  colorName: color.colorName,
                  sizes: color.sizes || [],
                  images: [], // Empty array
                  originalPrice: color.originalPrice || 0,
                  currentPrice: color.currentPrice || 0,
                  colorSpecifications: color.colorSpecifications?.filter(
                    spec => spec.key?.trim() !== "" && spec.value?.trim() !== ""
                  ) || []
                }))
                .filter(color => color.colorName?.trim() !== "")
            }))
            .filter(model => model.colors.length > 0);

          if (modelsWithoutImages.length > 0) {
            formDataToSend.append(key, JSON.stringify(modelsWithoutImages));
          }
        } else if (formData[key] !== null && formData[key] !== '' && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append thumbnail file
      if (thumbnailFile) {
        formDataToSend.append("thumbnail", thumbnailFile);
      }

      // Append color images for simple products WITH COLOR INDEX
      if (formData.type === "simple" && formData.colors && formData.colors.length > 0) {
        formData.colors.forEach((color, colorIndex) => {
          if (color.images && color.images.length > 0) {
            color.images.forEach((imgFile, imgIndex) => {
              if (imgFile instanceof File) {
                // Send color index and colorId with each image
                formDataToSend.append(`colorImages[${colorIndex}]`, imgFile);
                formDataToSend.append(`colorIds[${colorIndex}]`, color.colorId);
              }
            });
          }
        });
      }

      // Append color images for variable products WITH INDEXES
      if (formData.type === "variable" && formData.models) {
        formData.models.forEach((model, modelIndex) => {
          if (model.colors) {
            model.colors.forEach((color, colorIndex) => {
              if (color.images && color.images.length > 0) {
                color.images.forEach((imgFile, imgIndex) => {
                  if (imgFile instanceof File) {
                    // Send model index, color index, and colorId
                    formDataToSend.append(`modelImages[${modelIndex}][${colorIndex}]`, imgFile);
                    formDataToSend.append(`modelColorIds[${modelIndex}][${colorIndex}]`, color.colorId);
                  }
                });
              }
            });
          }
        });
      }

      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/products/add`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      alert("Product added successfully!");
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error("Error adding product:", err);
      alert(err.response?.data?.error || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  // UPDATE PRODUCT
  const updateProduct = async () => {
    try {
      if (!formData.productId) {
        alert("Product ID is missing");
        return;
      }

      const token = localStorage.getItem("adminToken");
      if (!token) {
        alert("Please login first");
        return;
      }

      const formDataToSend = new FormData();

      // Append basic data
      Object.keys(formData).forEach(key => {
        if (key === 'specifications') {
          if (formData.type === "simple") {
            const nonEmptySpecs = formData.specifications.filter(
              spec => spec.key?.trim() !== "" && spec.value?.trim() !== ""
            );
            formDataToSend.append(key, JSON.stringify(nonEmptySpecs));
          } else {
            formDataToSend.append(key, JSON.stringify([]));
          }
        } else if (key === 'colors') {
          if (formData.type === "simple") {
            const validColors = formData.colors
              .filter(color => color.colorName?.trim() !== "")
              .map(color => ({
                colorId: color.colorId || "",
                colorName: color.colorName,
                sizes: color.sizes || [],
                images: color.images ? color.images.filter(img => typeof img === 'string') : [],
                originalPrice: color.originalPrice || 0,
                currentPrice: color.currentPrice || 0,
                colorSpecifications: color.colorSpecifications?.filter(
                  spec => spec.key?.trim() !== "" && spec.value?.trim() !== ""
                ) || []
              }));

            if (validColors.length > 0) {
              formDataToSend.append(key, JSON.stringify(validColors));
            }
          }
        } else if (key === 'models') {
          if (formData.type === "variable") {
            const validModels = formData.models
              .filter(model => model.modelName?.trim() !== "" && model.SKU?.trim() !== "")
              .map(model => ({
                ...model,
                modelSpecifications: model.modelSpecifications?.filter(
                  spec => spec.key?.trim() !== "" && spec.value?.trim() !== ""
                ) || [],
                colors: (model.colors || [])
                  .filter(color => color.colorName?.trim() !== "")
                  .map(color => ({
                    colorId: color.colorId || "",
                    colorName: color.colorName,
                    sizes: color.sizes || [],
                    images: color.images ? color.images.filter(img => typeof img === 'string') : [],
                    originalPrice: color.originalPrice || 0,
                    currentPrice: color.currentPrice || 0,
                    colorSpecifications: color.colorSpecifications?.filter(
                      spec => spec.key?.trim() !== "" && spec.value?.trim() !== ""
                    ) || []
                  }))
              }))
              .filter(model => model.colors.length > 0);

            if (validModels.length > 0) {
              formDataToSend.append(key, JSON.stringify(validModels));
            }
          } else {
            formDataToSend.append(key, JSON.stringify([]));
          }
        } else if (key !== 'productId' && formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append thumbnail file
      if (thumbnailFile) {
        formDataToSend.append("thumbnail", thumbnailFile);
      }

      // Append new images for simple products
      if (formData.type === "simple" && formData.colors) {
        formData.colors.forEach((color, colorIndex) => {
          if (color.images && color.images.length > 0) {
            color.images.forEach((img, imgIndex) => {
              if (img instanceof File) {
                formDataToSend.append(`colorImages[${colorIndex}]`, img);
                formDataToSend.append(`colorIds[${colorIndex}]`, color.colorId || "");
              }
            });
          }
        });
      }

      // Append new images for variable products
      if (formData.type === "variable" && formData.models) {
        formData.models.forEach((model, modelIndex) => {
          if (model.colors) {
            model.colors.forEach((color, colorIndex) => {
              if (color.images && color.images.length > 0) {
                color.images.forEach((img, imgIndex) => {
                  if (img instanceof File) {
                    formDataToSend.append(`modelImages[${modelIndex}][${colorIndex}]`, img);
                    formDataToSend.append(`modelColorIds[${modelIndex}][${colorIndex}]`, color.colorId || "");
                  }
                });
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

      alert("Product updated successfully!");
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error("Error updating product:", err);
      alert(err.response?.data?.error || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  // DELETE PRODUCT
  const deleteProduct = async () => {
    try {
      if (!deleteId) return;

      const token = localStorage.getItem("adminToken");
      if (!token) {
        alert("Please login first");
        return;
      }

      setLoading(true);
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/products/delete/${deleteId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`  // ✅ FIXED: Added "Bearer " prefix
          }
        }
      );

      alert("Product deactivated successfully!");
      setDeleteId(null);
      fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      alert(err.response?.data?.error || "Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  // OPEN UPDATE FORM
  const openUpdateForm = (product) => {
    setFormMode("update");

    const preparedData = {
      ...product,
      specifications: product.specifications || [],
      colors: product.type === "simple" ? (product.colors || []) : [],
      models: product.type === "variable" ? (product.models || []).map(model => ({
        ...model,
        modelSpecifications: model.modelSpecifications || [],
        colors: model.colors || []
      })) : [],
      hsnCode: product.hsnCode || ""
    };

    setFormData(preparedData);
    setExistingThumbnail(product.thumbnailImage || "");
    setThumbnailFile(null);
    setShowForm(true);
  };

  // RESET FORM
  const resetForm = () => {
    setFormData({
      productName: "",
      description: "",
      categoryId: "",
      categoryName: "",
      hsnCode: "",
      type: "simple",
      modelName: "",
      SKU: "",
      specifications: [],
      colors: [{
        colorId: `temp_${Date.now()}_1`,
        colorName: "",
        sizes: [],
        images: [],
        originalPrice: "",
        currentPrice: "",
        colorSpecifications: []
      }],
      models: []
    });
    setThumbnailFile(null);
    setExistingThumbnail("");
    setShowForm(false);
  };

  // Format price
  const formatPrice = (price) => {
    return price ? parseFloat(price).toFixed(2) : "0.00";
  };

  // Get display price
  const getDisplayPrice = (product) => {
    if (product.type === "simple") {
      if (product.colors && product.colors.length > 0) {
        const prices = product.colors.map(c => c.currentPrice).filter(p => p);
        if (prices.length > 0) {
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          return minPrice === maxPrice ?
            `₹${formatPrice(minPrice)}` :
            `₹${formatPrice(minPrice)} - ₹${formatPrice(maxPrice)}`;
        }
      }
      return "₹0.00";
    } else {
      return "Variable Pricing";
    }
  };

  // Get color count
  const getColorCount = (product) => {
    if (product.type === "simple") {
      return product.colors?.length || 0;
    } else {
      let total = 0;
      if (product.models) {
        product.models.forEach(model => {
          total += model.colors?.length || 0;
        });
      }
      return total;
    }
  };

  // Helper to check if image is a URL
  const isImageUrl = (img) => {
    return typeof img === 'string' && (img.startsWith('http') || img.startsWith('/'));
  };

  // Helper to get image source
  const getImageSrc = (img) => {
    if (isImageUrl(img)) {
      return img;
    } else if (img instanceof File) {
      return URL.createObjectURL(img);
    }
    return "";
  };

  // Helper to get image name
  const getImageName = (img) => {
    if (isImageUrl(img)) {
      return img.split('/').pop();
    } else if (img instanceof File) {
      return img.name;
    }
    return "Image";
  };

  // RENDER SIMPLE PRODUCT FORM
  const renderSimpleProductForm = () => (
    <>
      <div className="form-section">
        <h4>Product Details</h4>
        <div className="row">
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
            <label>Model Name (Optional)</label>
            <input
              name="modelName"
              placeholder="Enter model name"
              value={formData.modelName}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="section-header">
          <h4>Product Specifications</h4>
          <button type="button" onClick={addSpecField} className="add-btn small">
            + Add
          </button>
        </div>

        {formData.specifications.length === 0 ? (
          <p className="no-items">No specifications added yet.</p>
        ) : (
          formData.specifications.map((spec, index) => (
            <div key={index} className="spec-row">
              <input
                placeholder="Key"
                value={spec.key}
                onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                className="spec-input"
              />
              <input
                placeholder="Value"
                value={spec.value}
                onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                className="spec-input"
              />
              <button
                type="button"
                className="remove-btn small"
                onClick={() => removeSpecField(index)}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <div className="form-section">
        <div className="section-header">
          <h4>Color Variants</h4>
          <button type="button" onClick={addColor} className="add-btn small">
            + Add Color
          </button>
        </div>

        {formData.colors.length === 0 ? (
          <p className="no-items">No color variants added yet.</p>
        ) : (
          formData.colors.map((color, colorIndex) => (
            <div key={color.colorId || colorIndex} className="color-section">
              <div className="color-header">
                <h5>Color Variant {colorIndex + 1}</h5>
                <button
                  type="button"
                  className="remove-btn small"
                  onClick={() => removeColor(colorIndex)}
                >
                  ×
                </button>
              </div>

              <div className="row">
                <div className="form-group">
                  <label>Color Name *</label>
                  <input
                    placeholder="Enter color name"
                    value={color.colorName}
                    onChange={(e) => handleColorChange(colorIndex, 'colorName', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Original Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={color.originalPrice}
                    onChange={(e) => handleColorChange(colorIndex, 'originalPrice', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Current Price *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={color.currentPrice}
                    onChange={(e) => handleColorChange(colorIndex, 'currentPrice', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Color Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleColorImagesChange(colorIndex, e)}
                />
                {color.images && color.images.length > 0 && (
                  <div className="color-images">
                    <p>Selected images: {color.images.length}</p>
                    <div className="color-thumbs">
                      {color.images.map((img, imgIndex) => (
                        <div key={imgIndex} className="image-item">
                          {isImageUrl(img) ? (
                            <img
                              src={img}
                              alt={`Color ${colorIndex + 1}`}
                              className="gallery-thumb"
                            />
                          ) : (
                            <div className="file-info">
                              <span className="image-name">{getImageName(img)}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeColorImage(colorIndex, imgIndex)}
                            className="remove-image-btn"
                            title="Remove this image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );

  // RENDER VARIABLE PRODUCT FORM
  const renderVariableProductForm = () => (
    <div className="form-section">
      <div className="section-header">
        <h4>Variable Options</h4>
        <button type="button" onClick={addModel} className="add-btn small">
          + Add Model
        </button>
      </div>

      {formData.models.length === 0 ? (
        <p className="no-items">No models added yet.</p>
      ) : (
        formData.models.map((model, modelIndex) => (
          <div key={modelIndex} className="model-section">
            <div className="model-header">
              <h5>Model {modelIndex + 1}</h5>
              <button
                type="button"
                className="remove-btn small"
                onClick={() => removeModel(modelIndex)}
              >
                ×
              </button>
            </div>

            <div className="row">
              <div className="form-group">
                <label>Model Name *</label>
                <input
                  placeholder="Enter model name"
                  value={model.modelName}
                  onChange={(e) => handleModelChange(modelIndex, 'modelName', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Model SKU *</label>
                <input
                  placeholder="Enter SKU for this model"
                  value={model.SKU}
                  onChange={(e) => handleModelChange(modelIndex, 'SKU', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* ===== HIDDEN: MODEL DESCRIPTION - COMMENTED OUT AS REQUESTED ===== */}
            
          <div className="form-group">
            <label>Model Description</label>
            <textarea
              placeholder="Enter description for this model"
              value={model.description || ''}
              onChange={(e) => handleModelChange(modelIndex, 'description', e.target.value)}
              rows={2}
            />
          </div>
         

            <div className="form-group">
              <div className="section-header">
                <label>Model Specifications</label>
                <button
                  type="button"
                  onClick={() => addModelSpecField(modelIndex)}
                  className="add-btn xsmall"
                >
                  + Add
                </button>
              </div>
              {model.modelSpecifications && model.modelSpecifications.length > 0 ? (
                <div className="specs-list">
                  {model.modelSpecifications.map((spec, specIndex) => (
                    <div key={specIndex} className="spec-row">
                      <input
                        placeholder="Key"
                        value={spec.key}
                        onChange={(e) => handleModelSpecChange(modelIndex, specIndex, 'key', e.target.value)}
                        className="spec-input"
                      />
                      <input
                        placeholder="Value"
                        value={spec.value}
                        onChange={(e) => handleModelSpecChange(modelIndex, specIndex, 'value', e.target.value)}
                        className="spec-input"
                      />
                      <button
                        type="button"
                        className="remove-btn xsmall"
                        onClick={() => removeModelSpecField(modelIndex, specIndex)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-items">No model specifications added yet.</p>
              )}
            </div>

            <div className="colors-section">
              <div className="section-header">
                <h6>Color Variants</h6>
                <button
                  type="button"
                  onClick={() => addColorToModel(modelIndex)}
                  className="add-btn small"
                >
                  + Add Color
                </button>
              </div>

              {model.colors && model.colors.length > 0 ? (
                model.colors.map((color, colorIndex) => (
                  <div key={color.colorId || colorIndex} className="color-section">
                    <div className="color-header">
                      <h6>Color {colorIndex + 1}</h6>
                      <button
                        type="button"
                        className="remove-btn small"
                        onClick={() => removeColorFromModel(modelIndex, colorIndex)}
                      >
                        ×
                      </button>
                    </div>

                    <div className="row">
                      <div className="form-group">
                        <label>Color Name *</label>
                        <input
                          placeholder="Enter color name"
                          value={color.colorName}
                          onChange={(e) => handleModelColorChange(modelIndex, colorIndex, 'colorName', e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Original Price</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={color.originalPrice}
                          onChange={(e) => handleModelColorChange(modelIndex, colorIndex, 'originalPrice', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Current Price *</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={color.currentPrice}
                          onChange={(e) => handleModelColorChange(modelIndex, colorIndex, 'currentPrice', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Color Images</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleModelColorImagesChange(modelIndex, colorIndex, e)}
                      />
                      {color.images && color.images.length > 0 && (
                        <div className="color-images">
                          <p>Selected images: {color.images.length}</p>
                          <div className="color-thumbs">
                            {color.images.map((img, imgIndex) => (
                              <div key={imgIndex} className="image-item">
                                {isImageUrl(img) ? (
                                  <img
                                    src={img}
                                    alt={`Color ${colorIndex + 1}`}
                                    className="gallery-thumb"
                                  />
                                ) : (
                                  <div className="file-info">
                                    <span className="image-name">{getImageName(img)}</span>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeModelColorImage(modelIndex, colorIndex, imgIndex)}
                                  className="remove-image-btn"
                                  title="Remove this image"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-items">No color variants added yet.</p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="list-products">
      <div className="header">
        <h2>Products ({products.length})</h2>
        <button
          onClick={() => {
            setFormMode("add");
            resetForm();
            setShowForm(true);
          }}
          disabled={loading}
        >
          + Add Product
        </button>
      </div>

      {loading && products.length === 0 ? (
        <div className="loading">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="no-products">
          <p>No products found. Add your first product!</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Type</th>
              <th>SKU</th>
              <th>Variants</th>
              <th>HSN</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.productId}>
                <td>
                  {p.thumbnailImage && (
                    <img
                      src={p.thumbnailImage}
                      alt={p.productName}
                      className="thumbnail"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/50x50?text=No+Image";
                      }}
                    />
                  )}
                </td>
                <td>{p.productName}</td>
                <td>{p.categoryName}</td>
                <td>
                  <span className={`type-badge ${p.type}`}>
                    {p.type}
                  </span>
                </td>
                <td>
                  {p.type === "simple" ? (
                    p.SKU || "-"
                  ) : (
                    <span className="variable-sku">
                      {p.models?.length || 0} model(s)
                    </span>
                  )}
                </td>
                <td>
                  <span className="variant-count">
                    {getColorCount(p)} color(s)
                  </span>
                </td>
                <td>{p.hsnCode || "-"}</td>
                <td>
                  {getDisplayPrice(p)}
                </td>
                <td>
                  <span className={`status ${p.isActive ? 'active' : 'inactive'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="actions">
                  <button
                    className="edit"
                    onClick={() => openUpdateForm(p)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    className="delete"
                    onClick={() => setDeleteId(p.productId)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="popup">
          <div className="popup-box xlarge">
            <div className="popup-header">
              <h3>{formMode === "add" ? "Add Product" : "Update Product"}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>

            <div className="form">
              <div className="form-section">
                <h4>Basic Information</h4>
                <div className="row">
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

                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.categoryId} value={cat.categoryId}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row">
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
                    <label>Product Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                    >
                      <option value="simple">Simple Product</option>
                      <option value="variable">Variable Product</option>
                    </select>
                  </div>
                </div>

                {formData.type === "simple" && (
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
                )}
              </div>

              <div className="form-section">
                <h4>Thumbnail Image {formMode === "add" && "*"}</h4>
                <div className="form-group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                  />
                  {thumbnailFile && (
                    <div className="file-preview">
                      Selected: {thumbnailFile.name}
                    </div>
                  )}
                  {!thumbnailFile && existingThumbnail && (
                    <div className="existing-image">
                      <p>Current thumbnail:</p>
                      <img
                        src={existingThumbnail}
                        alt="Current thumbnail"
                        className="thumb-preview"
                      />
                    </div>
                  )}
                </div>
              </div>

              {formData.type === "simple" ? renderSimpleProductForm() : renderVariableProductForm()}
            </div>

            <div className="btns">
              <button className="cancel" onClick={resetForm} disabled={loading}>
                Cancel
              </button>

              {formMode === "add" ? (
                <button className="save" onClick={addProduct} disabled={loading}>
                  {loading ? "Adding..." : "Add Product"}
                </button>
              ) : (
                <button className="save" onClick={updateProduct} disabled={loading}>
                  {loading ? "Updating..." : "Update Product"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="popup">
          <div className="popup-box">
            <h3>Confirm Delete</h3>
            <p>This will deactivate the product. Are you sure?</p>
            <div className="btns">
              <button className="cancel" onClick={() => setDeleteId(null)} disabled={loading}>
                Cancel
              </button>
              <button className="delete" onClick={deleteProduct} disabled={loading}>
                {loading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListProducts;