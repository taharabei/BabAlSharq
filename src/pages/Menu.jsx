import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

function Menu({ cart, setCart }) {
  const [category, setCategory] = useState("الكل");
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const categories = ["الكل", "المعجنات", "الفطائر", "البيتزا"];

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "menuItems"),
      (snapshot) => {
        const liveItems = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        setItems(liveItems);
        setIsLoading(false);
      },
      (error) => {
        console.error("خطأ في جلب القائمة:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredItems =
    category === "الكل"
      ? items
      : items.filter((item) => item.category === category);

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  function addToCart(item) {
    const existingItem = cart.find(
      (cartItem) => cartItem.id === item.id
    );

    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id
            ? {
              ...cartItem,
              quantity: cartItem.quantity + 1,
            }
            : cartItem
        )
      );
    } else {
      setCart([
        ...cart,
        {
          ...item,
          quantity: 1,
        },
      ]);
    }
  }

  function increaseQuantity(id) {
    setCart(
      cart.map((item) =>
        item.id === id
          ? {
            ...item,
            quantity: item.quantity + 1,
          }
          : item
      )
    );
  }

  function decreaseQuantity(id) {
    setCart(
      cart
        .map((item) =>
          item.id === id
            ? {
              ...item,
              quantity: item.quantity - 1,
            }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  return (
    <main className="menu-page">
      <section className="menu-hero">
        <div>
          <span className="section-label">قائمة بابل للمعجنات</span>

          <h2>اختر ما يناسبك</h2>

          <p>
            اكتشف أصنافنا من المعجنات والفطائر والبيتزا.
          </p>
        </div>

        <div className="menu-count">
          <strong>{filteredItems.length}</strong>
          <span>صنف</span>
        </div>
      </section>

      <section className="cart-box">
        <div className="cart-header">
          <h3>🛒 السلة</h3>

          <span>{cartCount} صنف</span>
        </div>

        {cart.length === 0 ? (
          <p className="empty-cart">
            السلة فارغة، أضف الأصناف التي تريدها.
          </p>
        ) : (
          <div className="cart-items">
            {cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="cart-item-info">
                  <strong>{item.name}</strong>

                  <span>
                    {item.price} ريال × {item.quantity}
                  </span>
                </div>

                <div className="quantity-controls">
                  <button
                    onClick={() => decreaseQuantity(item.id)}
                  >
                    -
                  </button>

                  <strong>{item.quantity}</strong>

                  <button
                    onClick={() => increaseQuantity(item.id)}
                  >
                    +
                  </button>
                </div>

                <strong>
                  {item.price * item.quantity} ريال
                </strong>
              </div>
            ))}
          </div>
        )}

        <div className="cart-total">
          <span>الإجمالي</span>

          <strong>{cartTotal} ريال</strong>
        </div>{cart.length > 0 && (
          <Link to="/checkout" className="checkout-button">
            إتمام الطلب
          </Link>
        )}
      </section>

      <section className="menu-categories">
        {categories.map((item) => (
          <button
            key={item}
            className={
              category === item
                ? "category active"
                : "category"
            }
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </section>

      {isLoading ? (
        <p className="empty-cart">جارٍ تحميل القائمة...</p>
      ) : (
        <section className="menu-grid">
          {filteredItems.map((item) => (
            <article className="menu-card" key={item.id}>
              <div className="menu-image">
                <img
                  src={item.image}
                  alt={item.name}
                />
              </div>

              <div className="menu-card-content">
                <span className="menu-category">
                  {item.category}
                </span>

                <h3>{item.name}</h3>

                <p>{item.description}</p>

                <div className="menu-card-footer">
                  <strong>{item.price} ريال</strong>

                  <button
                    onClick={() => addToCart(item)}
                  >
                    إضافة
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default Menu;