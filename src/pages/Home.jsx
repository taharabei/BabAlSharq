function Home() {
  return (
    <main className="home-page">

      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-label">مطعم بابل للمعجنات</span>

          <h2>
            أهلاً بك في
            <br />
            بابل للمعجنات
          </h2>

          <p>
            اكتشف قائمة الطعام، العروض المميزة،
            واطلب وجبتك المفضلة بسهولة.
          </p>

          <a href="/menu" className="hero-button">
            اطلب الآن
          </a>
        </div>

        <div className="hero-placeholder">
          <span>صورة المطعم أو أحد الأطباق</span>
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <span>اكتشف</span>
          <h3>أقسام القائمة</h3>
        </div>

        <div className="categories">
          <div className="category-card">
            <span>🍽️</span>
            <h4>الوجبات</h4>
          </div>

          <div className="category-card">
            <span>🥩</span>
            <h4>المشاوي</h4>
          </div>

          <div className="category-card">
            <span>🍚</span>
            <h4>الأرز</h4>
          </div>

          <div className="category-card">
            <span>🥗</span>
            <h4>المقبلات</h4>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <span>الأكثر طلبًا</span>
          <h3>وجبات مميزة</h3>
        </div>

        <div className="products-preview">
          <div className="product-card">
            <div className="product-image">
              صورة المنتج
            </div>

            <div className="product-info">
              <h4>وجبة بابل للمعجنات</h4>
              <p>وصف مختصر للوجبة</p>
              <strong>السعر لاحقًا</strong>
            </div>
          </div>

          <div className="product-card">
            <div className="product-image">
              صورة المنتج
            </div>

            <div className="product-info">
              <h4>وجبة المشاوي</h4>
              <p>وصف مختصر للوجبة</p>
              <strong>السعر لاحقًا</strong>
            </div>
          </div>

          <div className="product-card">
            <div className="product-image">
              صورة المنتج
            </div>

            <div className="product-info">
              <h4>وجبة مميزة</h4>
              <p>وصف مختصر للوجبة</p>
              <strong>السعر لاحقًا</strong>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}

export default Home;