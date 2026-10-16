import { useEffect, useState } from "react";

import "./AdminDashboard.css";



const ADMIN_ORDERS_API = "http://127.0.0.1:8000/admin/orders";

const UPDATE_STATUS_API = "http://127.0.0.1:8000/admin/orders";

const ADMIN_PRODUCTS_API = "http://127.0.0.1:8000/admin/products";



const statuses = [

  "Pending",

  "Confirmed",

  "Preparing",

  "Out for Delivery",

  "Delivered",

  "Cancelled",

];



function AdminDashboard() {

  // =================================================

  // ORDERS

  // =================================================



  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");



  // Selected order for details modal

  const [selectedOrder, setSelectedOrder] = useState(null);



  // =================================================

  // PRODUCTS

  // =================================================



  const [products, setProducts] = useState([]);

  const [productLoading, setProductLoading] = useState(false);

  const [productError, setProductError] = useState("");



  const [showProductForm, setShowProductForm] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);



  const [productForm, setProductForm] = useState({

    name: "",

    category: "",

    description: "",

    price: "",

    image: "",

    stock: "",

  });



  // =================================================

  // FETCH ORDERS

  // =================================================



  const fetchOrders = async () => {

    try {

      setLoading(true);

      setError("");



      const response = await fetch(ADMIN_ORDERS_API);

      const data = await response.json();



      if (!response.ok || !data.success) {

        throw new Error("Unable to load orders");

      }



      setOrders(data.orders || []);

    } catch (err) {

      console.error(err);

      setError("Unable to connect to Beervana server.");

    } finally {

      setLoading(false);

    }

  };



  // =================================================

  // FETCH PRODUCTS

  // =================================================



  const fetchProducts = async () => {

    try {

      setProductLoading(true);

      setProductError("");



      const response = await fetch(ADMIN_PRODUCTS_API);

      const data = await response.json();



      if (!response.ok || !data.success) {

        throw new Error("Unable to load products");

      }



      setProducts(data.products || []);

    } catch (err) {

      console.error(err);

      setProductError("Unable to load products.");

    } finally {

      setProductLoading(false);

    }

  };



  // =================================================

  // INITIAL LOAD

  // =================================================



  useEffect(() => {

    fetchOrders();

    fetchProducts();

  }, []);



  // =================================================

  // UPDATE ORDER STATUS

  // =================================================



  const updateStatus = async (orderId, newStatus) => {

    try {

      const response = await fetch(

        `${UPDATE_STATUS_API}/${orderId}/status`,

        {

          method: "PATCH",

          headers: {

            "Content-Type": "application/json",

          },

          body: JSON.stringify({

            status: newStatus,

          }),

        }

      );



      const data = await response.json();



      if (!response.ok || !data.success) {

        alert(data.detail || "Status update failed.");

        return;

      }



      setOrders((prevOrders) =>

        prevOrders.map((order) =>

          order.order_id === orderId

            ? { ...order, status: newStatus }

            : order

        )

      );



      setSelectedOrder((prev) =>

        prev && prev.order_id === orderId

          ? { ...prev, status: newStatus }

          : prev

      );

    } catch (err) {

      console.error(err);

      alert("Unable to update order status.");

    }

  };



  // =================================================

  // ADD / UPDATE PRODUCT

  // =================================================



  const saveProduct = async (e) => {

    e.preventDefault();



    if (!productForm.name.trim()) {

      alert("Product name is required.");

      return;

    }



    if (!productForm.category.trim()) {

      alert("Product category is required.");

      return;

    }



    if (productForm.price === "" || Number(productForm.price) < 0) {

      alert("Please enter a valid price.");

      return;

    }



    if (productForm.stock === "" || Number(productForm.stock) < 0) {

      alert("Please enter a valid stock.");

      return;

    }



    const payload = {

      name: productForm.name.trim(),

      category: productForm.category.trim(),

      description: productForm.description.trim(),

      price: Number(productForm.price),

      image: productForm.image.trim(),

      stock: Number(productForm.stock),

    };



    try {

      const url = editingProduct

        ? `${ADMIN_PRODUCTS_API}/${editingProduct.id}`

        : ADMIN_PRODUCTS_API;



      const method = editingProduct ? "PATCH" : "POST";



      const response = await fetch(url, {

        method,

        headers: {

          "Content-Type": "application/json",

        },

        body: JSON.stringify(payload),

      });



      const data = await response.json();



      if (!response.ok || !data.success) {

        alert(data.detail || "Product save failed.");

        return;

      }



      alert(

        editingProduct

          ? "Product updated successfully."

          : "Product added successfully."

      );



      setShowProductForm(false);

      setEditingProduct(null);



      setProductForm({

        name: "",

        category: "",

        description: "",

        price: "",

        image: "",

        stock: "",

      });



      fetchProducts();

    } catch (err) {

      console.error(err);

      alert("Unable to connect to Beervana server.");

    }

  };



  // =================================================

  // DELETE PRODUCT

  // =================================================



  const deleteProduct = async (product) => {

    const confirmDelete = window.confirm(

      `Are you sure you want to delete "${product.name}"?`

    );



    if (!confirmDelete) {

      return;

    }



    try {

      const response = await fetch(

        `${ADMIN_PRODUCTS_API}/${product.id}`,

        {

          method: "DELETE",

        }

      );



      const data = await response.json();



      if (!response.ok || !data.success) {

        alert(data.detail || "Unable to delete product.");

        return;

      }



      alert("Product deleted successfully.");



      setProducts((prevProducts) =>

        prevProducts.filter(

          (item) => item.id !== product.id

        )

      );

    } catch (err) {

      console.error(err);

      alert("Unable to connect to Beervana server.");

    }

  };



  // =================================================
  // TOGGLE PRODUCT ACTIVE STATUS
  // =================================================

  const toggleProductStatus = async (product) => {
    try {
      const response = await fetch(
        `${ADMIN_PRODUCTS_API}/${product.id}/toggle`,
        { method: "PATCH" }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        alert(data.detail || data.message || "Unable to update product status.");
        return;
      }

      setProducts((previousProducts) =>
        previousProducts.map((item) =>
          item.id === product.id
            ? { ...item, active: data.product?.active ?? !item.active }
            : item
        )
      );
    } catch (err) {
      console.error(err);
      alert("Unable to connect to Beervana server.");
    }
  };


  // =================================================

  // EDIT PRODUCT

  // =================================================



  const openEditProduct = (product) => {

    setEditingProduct(product);



    setProductForm({

      name: product.name || "",

      category: product.category || "",

      description: product.description || "",

      price: product.price ?? "",

      image: product.image || "",

      stock: product.stock ?? "",

    });



    setShowProductForm(true);

  };



  // =================================================

  // OPEN ADD PRODUCT

  // =================================================



  const openAddProduct = () => {

    setEditingProduct(null);



    setProductForm({

      name: "",

      category: "",

      description: "",

      price: "",

      image: "",

      stock: "",

    });



    setShowProductForm(true);

  };



  // =================================================

  // CLOSE PRODUCT FORM

  // =================================================



  const closeProductForm = () => {

    setShowProductForm(false);

    setEditingProduct(null);



    setProductForm({

      name: "",

      category: "",

      description: "",

      price: "",

      image: "",

      stock: "",

    });

  };



  // =================================================

  // STATISTICS

  // =================================================



  const totalOrders = orders.length;



  const totalRevenue = orders.reduce(

    (total, order) =>

      total + Number(order.total_amount || 0),

    0

  );



  const pendingOrders = orders.filter(

    (order) => order.status === "Pending"

  ).length;



  const deliveredOrders = orders.filter(

    (order) => order.status === "Delivered"

  ).length;



  const totalProducts = products.length;



  // =================================================

  // CLOSE ORDER MODAL

  // =================================================



  const closeDetails = () => {

    setSelectedOrder(null);

  };



  // =================================================

  // RETURN

  // =================================================



  return (

    <div className="admin-page">



      {/* =================================================

          HEADER

      ================================================= */}



      <header className="admin-header">



        <div>

          <h1>🍺 Beervana Admin</h1>

          <p>Order & Product Management Dashboard</p>

        </div>



        <button

          className="admin-refresh-btn"

          onClick={() => {

            fetchOrders();

            fetchProducts();

          }}

        >

          🔄 Refresh

        </button>



      </header>





      {/* =================================================

          STATS

      ================================================= */}



      <section className="admin-stats">



        <div className="admin-stat-card">

          <span>📦</span>



          <div>

            <p>Total Orders</p>

            <h2>{totalOrders}</h2>

          </div>

        </div>





        <div className="admin-stat-card">

          <span>💰</span>



          <div>

            <p>Total Revenue</p>



            <h2>

              ₹{totalRevenue.toFixed(0)}

            </h2>

          </div>

        </div>





        <div className="admin-stat-card">

          <span>⏳</span>



          <div>

            <p>Pending Orders</p>

            <h2>{pendingOrders}</h2>

          </div>

        </div>





        <div className="admin-stat-card">

          <span>🍺</span>



          <div>

            <p>Total Products</p>

            <h2>{totalProducts}</h2>

          </div>

        </div>



      </section>





      {/* =================================================

          ORDERS

      ================================================= */}



      <section className="admin-orders-section">



        <div className="admin-section-title">



          <div>

            <h2>📦 Orders</h2>

            <p>Manage customer orders</p>

          </div>



        </div>





        {loading && (

          <div className="admin-message">

            Loading orders...

          </div>

        )}





        {error && (

          <div className="admin-error">

            {error}

          </div>

        )}





        {!loading &&

          !error &&

          orders.length === 0 && (

            <div className="admin-message">

              No orders found.

            </div>

          )}





        {!loading &&

          !error &&

          orders.length > 0 && (



            <div className="orders-table-wrapper">



              <table className="orders-table">



                <thead>



                  <tr>

                    <th>Order ID</th>

                    <th>Customer</th>

                    <th>Phone</th>

                    <th>Total</th>

                    <th>Payment</th>

                    <th>Status</th>

                    <th>Action</th>

                  </tr>



                </thead>





                <tbody>



                  {orders.map((order) => (



                    <tr key={order.order_id}>



                      <td>

                        <strong>

                          {order.order_id}

                        </strong>

                      </td>





                      <td>

                        {order.customer_name}

                      </td>





                      <td>

                        {order.phone}

                      </td>





                      <td>

                        ₹

                        {Number(

                          order.total_amount

                        ).toFixed(0)}

                      </td>





                      <td>

                        {order.payment_method?.toUpperCase()}

                      </td>





                      <td>



                        <span

                          className={`status-badge ${

                            order.status

                              ?.toLowerCase()

                              .replaceAll(" ", "-")

                          }`}

                        >

                          {order.status}

                        </span>



                      </td>





                      <td>



                        <div className="order-actions">



                          <button

                            className="view-order-btn"

                            onClick={() =>

                              setSelectedOrder(order)

                            }

                          >

                            👁 View

                          </button>





                          <select

                            value={order.status}

                            onChange={(e) =>

                              updateStatus(

                                order.order_id,

                                e.target.value

                              )

                            }

                          >



                            {statuses.map(

                              (status) => (

                                <option

                                  key={status}

                                  value={status}

                                >

                                  {status}

                                </option>

                              )

                            )}



                          </select>



                        </div>



                      </td>



                    </tr>



                  ))}



                </tbody>



              </table>



            </div>



          )}



      </section>





      {/* =================================================

          PRODUCT MANAGEMENT

      ================================================= */}



      <section className="admin-products-section">



        <div className="admin-section-title">



          <div>

            <h2>🍺 Product Management</h2>

            <p>

              Manage products, prices and stock

            </p>

          </div>





          <button

            className="add-product-btn"

            onClick={openAddProduct}

          >

            ➕ Add Product

          </button>



        </div>





        {productError && (

          <div className="admin-error">

            {productError}

          </div>

        )}





        {productLoading && (

          <div className="admin-message">

            Loading products...

          </div>

        )}





        {!productLoading &&

          !productError &&

          products.length === 0 && (

            <div className="admin-message">

              No products found.

            </div>

          )}





        {!productLoading &&

          !productError &&

          products.length > 0 && (



            <div className="products-table-wrapper">



              <table className="products-table">



                <thead>



                  <tr>

                    <th>Product</th>

                    <th>Category</th>

                    <th>Price</th>

                    <th>Stock</th>

                    <th>Status</th>

                    <th>Action</th>

                  </tr>



                </thead>





                <tbody>



                  {products.map((product) => (



                    <tr key={product.id}>



                      <td>



                        <div className="admin-product-info">



                          {product.image ? (



                            <img

                              src={product.image}

                              alt={product.name}

                              className="admin-product-image"

                            />



                          ) : (



                            <div className="admin-product-placeholder">

                              🍺

                            </div>



                          )}



                          <strong>

                            {product.name}

                          </strong>



                        </div>



                      </td>





                      <td>

                        {product.category}

                      </td>





                      <td>

                        ₹

                        {Number(

                          product.price

                        ).toFixed(0)}

                      </td>





                      <td>



                        <span

                          className={

                            Number(product.stock) <= 5

                              ? "stock-low"

                              : "stock-good"

                          }

                        >

                          {product.stock}

                        </span>



                      </td>





                      <td>
                        <span className={`product-status ${(product.active ?? true) ? "active" : "inactive"}`}>
                          {(product.active ?? true) ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>



                        <div className="product-actions">



                          <button

                            className="edit-product-btn"

                            onClick={() =>

                              openEditProduct(product)

                            }

                          >

                            ✏️ Edit

                          </button>





                          <button
                            className={(product.active ?? true) ? "deactivate-product-btn" : "activate-product-btn"}
                            onClick={() => toggleProductStatus(product)}
                          >
                            {(product.active ?? true) ? "Deactivate" : "Activate"}
                          </button>


                          <button

                            className="delete-product-btn"

                            onClick={() =>

                              deleteProduct(product)

                            }

                          >

                            🗑️ Delete

                          </button>



                        </div>



                      </td>



                    </tr>



                  ))}



                </tbody>



              </table>



            </div>



          )}



      </section>





      {/* =================================================

          PRODUCT ADD / EDIT MODAL

      ================================================= */}



      {showProductForm && (



        <div

          className="product-modal-overlay"

          onClick={closeProductForm}

        >



          <div

            className="product-form-modal"

            onClick={(e) =>

              e.stopPropagation()

            }

          >



            <div className="product-modal-header">



              <div>

                <span>

                  {editingProduct

                    ? "Edit Product"

                    : "Add New Product"}

                </span>



                <h2>

                  🍺 Product Details

                </h2>

              </div>





              <button

                className="close-modal-btn"

                onClick={closeProductForm}

              >

                ×

              </button>



            </div>





            <form

              className="product-form"

              onSubmit={saveProduct}

            >



              {/* PRODUCT NAME */}



              <div className="form-group">



                <label>

                  Product Name *

                </label>



                <input

                  type="text"

                  placeholder="e.g. Corona Extra"

                  value={productForm.name}

                  onChange={(e) =>

                    setProductForm({

                      ...productForm,

                      name: e.target.value,

                    })

                  }

                />



              </div>





              {/* CATEGORY */}



              <div className="form-group">



                <label>

                  Category *

                </label>



                <input

                  type="text"

                  placeholder="e.g. Lager"

                  value={productForm.category}

                  onChange={(e) =>

                    setProductForm({

                      ...productForm,

                      category: e.target.value,

                    })

                  }

                />



              </div>





              {/* DESCRIPTION */}



              <div className="form-group">



                <label>

                  Description

                </label>



                <textarea

                  placeholder="Product description"

                  rows="3"

                  value={productForm.description}

                  onChange={(e) =>

                    setProductForm({

                      ...productForm,

                      description: e.target.value,

                    })

                  }

                />



              </div>





              <div className="form-row">



                {/* PRICE */}



                <div className="form-group">



                  <label>

                    Price *

                  </label>



                  <input

                    type="number"

                    min="0"

                    placeholder="199"

                    value={productForm.price}

                    onChange={(e) =>

                      setProductForm({

                        ...productForm,

                        price: e.target.value,

                      })

                    }

                  />



                </div>





                {/* STOCK */}



                <div className="form-group">



                  <label>

                    Stock *

                  </label>



                  <input

                    type="number"

                    min="0"

                    placeholder="20"

                    value={productForm.stock}

                    onChange={(e) =>

                      setProductForm({

                        ...productForm,

                        stock: e.target.value,

                      })

                    }

                  />



                </div>



              </div>





              {/* IMAGE */}



              <div className="form-group">



                <label>

                  Image URL

                </label>



                <input

                  type="text"

                  placeholder="/images/corona.png"

                  value={productForm.image}

                  onChange={(e) =>

                    setProductForm({

                      ...productForm,

                      image: e.target.value,

                    })

                  }

                />



              </div>





              {/* IMAGE PREVIEW */}



              {productForm.image && (



                <div className="product-image-preview">



                  <img

                    src={productForm.image}

                    alt="Preview"

                    onError={(e) => {

                      e.currentTarget.style.display =

                        "none";

                    }}

                  />



                </div>



              )}





              {/* BUTTONS */}



              <div className="product-form-actions">



                <button

                  type="button"

                  className="cancel-product-btn"

                  onClick={closeProductForm}

                >

                  Cancel

                </button>





                <button

                  type="submit"

                  className="save-product-btn"

                >

                  {editingProduct

                    ? "💾 Update Product"

                    : "➕ Add Product"}

                </button>



              </div>



            </form>



          </div>



        </div>



      )}





      {/* =================================================

          ORDER DETAILS MODAL

      ================================================= */}



      {selectedOrder && (



        <div

          className="order-modal-overlay"

          onClick={closeDetails}

        >



          <div

            className="order-details-modal"

            onClick={(e) =>

              e.stopPropagation()

            }

          >



            {/* MODAL HEADER */}



            <div className="order-modal-header">



              <div>



                <span>

                  Order Details

                </span>



                <h2>

                  {selectedOrder.order_id}

                </h2>



              </div>





              <button

                className="close-modal-btn"

                onClick={closeDetails}

              >

                ×

              </button>



            </div>





            {/* CUSTOMER INFORMATION */}



            <div className="details-section">



              <h3>

                👤 Customer Information

              </h3>





              <div className="details-grid">



                <div>

                  <span>Name</span>



                  <strong>

                    {selectedOrder.customer_name}

                  </strong>

                </div>





                <div>

                  <span>Phone</span>



                  <strong>

                    {selectedOrder.phone}

                  </strong>

                </div>





                <div>

                  <span>City</span>



                  <strong>

                    {selectedOrder.city}

                  </strong>

                </div>





                <div>

                  <span>Pincode</span>



                  <strong>

                    {selectedOrder.pincode}

                  </strong>

                </div>





                <div className="full-detail">



                  <span>

                    Delivery Address

                  </span>



                  <strong>

                    {selectedOrder.address}

                  </strong>



                </div>



              </div>



            </div>





            {/* ORDER INFORMATION */}



            <div className="details-section">



              <h3>

                📦 Order Information

              </h3>





              <div className="details-grid">



                <div>



                  <span>

                    Payment Method

                  </span>



                  <strong>

                    {selectedOrder.payment_method?.toUpperCase()}

                  </strong>



                </div>





                <div>



                  <span>

                    Delivery

                  </span>



                  <strong>

                    {selectedOrder.delivery_option}

                  </strong>



                </div>





                <div>



                  <span>

                    Order Date

                  </span>



                  <strong>



                    {selectedOrder.created_at

                      ? new Date(

                          selectedOrder.created_at

                        ).toLocaleString("en-IN")

                      : "N/A"}



                  </strong>



                </div>





                <div>



                  <span>

                    Status

                  </span>



                  <strong className="modal-status">

                    {selectedOrder.status}

                  </strong>



                </div>



              </div>



            </div>





            {/* ORDERED PRODUCTS */}



            <div className="details-section">



              <h3>

                🛒 Ordered Products

              </h3>





              <div className="modal-products">



                {selectedOrder.items?.map(

                  (item, index) => (



                    <div

                      className="modal-product"

                      key={`${item.product_id}-${index}`}

                    >



                      <div>



                        <strong>

                          {item.product_name}

                        </strong>



                        <span>

                          ₹

                          {Number(

                            item.price

                          ).toFixed(0)}



                          {" × "}



                          {item.quantity}

                        </span>



                      </div>





                      <strong>

                        ₹

                        {Number(

                          item.subtotal

                        ).toFixed(0)}

                      </strong>



                    </div>



                  )

                )}



              </div>



            </div>





            {/* PRICE SUMMARY */}



            <div className="price-summary">



              <div>



                <span>

                  Subtotal

                </span>



                <strong>

                  ₹

                  {Number(

                    selectedOrder.subtotal

                  ).toFixed(0)}

                </strong>



              </div>





              <div>



                <span>

                  Delivery Fee

                </span>



                <strong>



                  {Number(

                    selectedOrder.delivery_fee

                  ) === 0

                    ? "FREE"

                    : `₹${Number(

                        selectedOrder.delivery_fee

                      ).toFixed(0)}`}



                </strong>



              </div>





              <div className="grand-total">



                <span>

                  Total Amount

                </span>



                <strong>

                  ₹

                  {Number(

                    selectedOrder.total_amount

                  ).toFixed(0)}

                </strong>



              </div>



            </div>





            {/* STATUS UPDATE */}



            <div className="modal-status-update">



              <span>

                Update Order Status

              </span>





              <select

                value={selectedOrder.status}

                onChange={(e) =>

                  updateStatus(

                    selectedOrder.order_id,

                    e.target.value

                  )

                }

              >



                {statuses.map(

                  (status) => (



                    <option

                      key={status}

                      value={status}

                    >

                      {status}

                    </option>



                  )

                )}



              </select>



            </div>



          </div>



        </div>



      )}



    </div>

  );

}

export default AdminDashboard;