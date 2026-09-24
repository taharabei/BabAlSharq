import { useState } from "react";
import { db } from "../../firebase";
import * as XLSX from "xlsx";
import { useLanguage } from "../../i18n/LanguageContext";
import { collection, getDocs } from "firebase/firestore";

function AdminExportSection() {
  const [isExporting, setIsExporting] = useState(false);
  const { t } = useLanguage();

  async function exportCustomersToExcel() {
    setIsExporting(true);

    try {
      const customersSnap = await getDocs(collection(db, "customers"));
      const ordersSnap = await getDocs(collection(db, "orders"));

      const customersList = customersSnap.docs.map((d) => d.data());
      const ordersList = ordersSnap.docs.map((d) => d.data());

      const rows = customersList.map((customer) => {
        const customerOrders = ordersList.filter(
          (order) => order.phone === customer.phone
        );

        return {
          الاسم: customer.name || "",
          "رقم الجوال": customer.phone || "",
          "تاريخ التسجيل": customer.date || "",
          "عدد الطلبات": customerOrders.length,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "العملاء");
      XLSX.writeFile(workbook, "عملاء بابل للمعجنات.xlsx");
    } catch (error) {
      console.error(error);
      alert(t("exportError"));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="checkout-cart" style={{ maxWidth: "500px" }}>
      <p style={{ marginBottom: "15px" }}>{t("exportCustomersDescription")}</p>

      <button
        className="checkout-submit"
        onClick={exportCustomersToExcel}
        disabled={isExporting}
      >
        {isExporting ? t("exportingLabel") : t("exportCustomersButton")}
      </button>
    </div>
  );
}

export default AdminExportSection;