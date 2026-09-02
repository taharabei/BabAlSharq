import { useState } from "react";

function Menu() {
  const [category, setCategory] = useState("الكل");

  const categories = ["الكل", "المعجنات", "الفطائر", "البيتزا"];

  const items = [
    {
      id: 1,
      name: "ميني معجنات",
      category: "المعجنات",
      description: "تشكيلة مميزة من الميني معجنات",
      price: 18,
      image: "/assets/images/ميني معجنات.png",
    },
    {
      id: 2,
      name: "مكس جبن زعتر",
      category: "المعجنات",
      description: "مزيج لذيذ من الجبن والزعتر",
      price: 12,
      image: "/assets/images/مكس جبن زعتر.png",
    },
    {
      id: 3,
      name: "لبنة",
      category: "المعجنات",
      description: "لبنة طازجة بطعم مميز",
      price: 10,
      image: "/assets/images/لبنة.png",
    },
    {
      id: 4,
      name: "فطيرة الجبن",
      category: "الفطائر",
      description: "فطيرة محشوة بالجبن",
      price: 10,
      image: "/assets/images/فطيرة الجبن.png",
    },
    {
      id: 5,
      name: "سبانخ",
      category: "الفطائر",
      description: "فطيرة سبانخ طازجة",
      price: 10,
      image: "/assets/images/سبانخ.png",
    },
    {
      id: 6,
      name: "زعتر",
      category: "الفطائر",
      description: "فطيرة زعتر مميزة",
      price: 10,
      image: "/assets/images/زعتر.png",
    },
    {
      id: 7,
      name: "زعتر بابل",
      category: "الفطائر",
      description: "فطيرة زعتر بطريقة باب الشرق",
      price: 12,
      image: "/assets/images/زعتر بابل.png",
    },
    {
      id: 8,
      name: "زعتر بابل المميز",
      category: "الفطائر",
      description: "نسخة مميزة من زعتر بابل",
      price: 14,
      image: "/assets/images/زعتر بابل (2).png",
    },
    {
      id: 9,
      name: "جبن بالبيض",
      category: "الفطائر",
      description: "جبن مع البيض بطريقة مميزة",
      price: 14,
      image: "/assets/images/جبن بالبيض.png",
    },
    {
      id: 10,
      name: "بيتزا خضار",
      category: "البيتزا",
      description: "بيتزا بالخضار والجبن",
      price: 22,
      image: "/assets/images/بيتزا خضار .png",
    },
  ];

  const filteredItems =
    category === "الكل"
      ? items
      : items.filter((item) => item.category === category);

  return (
    <main className="menu-page">
      <section className="menu-hero">
        <div>
          <span className="section-label">قائمة باب الشرق</span>
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

      <section className="menu-categories">
        {categories.map((item) => (
          <button
            key={item}
            className={category === item ? "category active" : "category"}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </section>

      <section className="menu-grid">
        {filteredItems.map((item) => (
          <article className="menu-card" key={item.id}>
            <div className="menu-image">
              <img src={item.image} alt={item.name} />
            </div>

            <div className="menu-card-content">
              <span className="menu-category">{item.category}</span>

              <h3>{item.name}</h3>

              <p>{item.description}</p>

              <div className="menu-card-footer">
                <strong>{item.price} ريال</strong>
                <button>إضافة</button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Menu;