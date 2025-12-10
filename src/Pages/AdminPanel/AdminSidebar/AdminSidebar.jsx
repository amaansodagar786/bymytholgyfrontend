import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  MdDashboard,
  MdInventory,
  MdCategory,
  MdProductionQuantityLimits,
  MdMenu,
} from "react-icons/md";
import "./AdminSidebar.scss";

function AdminSidebar() {
  const [open, setOpen] = useState(true);

  return (
    <div className={open ? "sidebar open" : "sidebar"}>
      <div className="top">
        <button className="toggle-btn" onClick={() => setOpen(!open)}>
          <MdMenu />
        </button>
      </div>

      <ul className="menu">
        <li>
          <Link to="/admin/dashboard">
            <MdDashboard className="icon" />
            {open && <span>Dashboard</span>}
          </Link>
        </li>

        <li>
          <Link to="/admin/products">
            <MdProductionQuantityLimits className="icon" />
            {open && <span>List Products</span>}
          </Link>
        </li>

        <li>
          <Link to="/admin/categories">
            <MdCategory className="icon" />
            {open && <span>Categories</span>}
          </Link>
        </li>

        <li>
          <Link to="/admin/inventories">
            <MdInventory className="icon" />
            {open && <span>Inventories</span>}
          </Link>
        </li>
        <li>
          <Link to="/admin/productoffers">
            <MdInventory className="icon" />
            {open && <span>Product Offers</span>}
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default AdminSidebar;
