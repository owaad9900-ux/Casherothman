/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Coffee, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Smartphone, 
  Bot, 
  HelpCircle, 
  Laptop, 
  Settings, 
  Globe, 
  Sun, 
  Moon, 
  Wifi, 
  WifiOff, 
  Lock, 
  Key, 
  AlertTriangle,
  FileCode,
  ShieldAlert,
  Utensils,
  Users
} from "lucide-react";

import { Product, Order, CafeSettings, TableOrder, OrderItem, Customer, Category, PrinterConfig } from "./types";
import { DEFAULT_PRODUCTS } from "./data/defaultProducts";
import { db, collection, doc, setDoc, deleteDoc, onSnapshot, auth } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

// Submodules
import CashierView from "./components/CashierView";
import InventoryView from "./components/InventoryView";
import AnalyticsView from "./components/AnalyticsView";
import MobileAppView from "./components/MobileAppView";
import SupportChatbot from "./components/SupportChatbot";
import DeveloperDocs from "./components/DeveloperDocs";
import SettingsView from "./components/SettingsView";
import TablesView from "./components/TablesView";
import CustomersView from "./components/CustomersView";
import LoginScreen from "./components/LoginScreen";
import AdminPanel from "./components/AdminPanel";
import { LogOut, ArrowRightLeft } from "lucide-react";

export default function App() {
  // --- Authentication and Tenant State ---
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [currentCafeId, setCurrentCafeId] = useState<string | null>(null);
  const [currentCafeNameAr, setCurrentCafeNameAr] = useState<string>("");
  const [currentCafeNameEn, setCurrentCafeNameEn] = useState<string>("");

  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<string>("cashier");
  
  // Simulated Internet / Cloud connectivity
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Core POS arrays
  const [inventory, setInventory] = useState<Product[]>(() => {
    const saved = localStorage.getItem("cafe_pos_inventory");
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem("cafe_pos_orders");
    return saved ? JSON.parse(saved) : [];
  });

  // Table Management Data State
  const [tables, setTables] = useState<TableOrder[]>(() => {
    const saved = localStorage.getItem("cafe_pos_tables");
    if (saved) return JSON.parse(saved);
    // Setup 10 Dine-In Tables
    const defaultTables = Array.from({ length: 10 }, (_, i) => ({
      tableId: `table_${i + 1}`,
      tableNameAr: `طاولة ${i + 1}`,
      tableNameEn: `Table ${i + 1}`,
      items: [] as OrderItem[],
      status: 'idle' as 'idle' | 'occupied',
      occupiedSince: null as string | null
    }));
    
    // Set Table 4 as occupied 50 minutes ago to showcase the brand-new turnover warning feature
    const p1 = DEFAULT_PRODUCTS[0] || {
      id: "prod_1",
      nameAr: "كورتادو",
      nameEn: "Cortado",
      price: 15.00,
      cost: 5.00,
      quantity: 50,
      minQuantity: 5,
      category: "espresso",
      barcode: "6281001020012",
      isAvailable: true
    };
    const fiftyMinutesAgo = new Date(Date.now() - 50 * 60 * 1000).toISOString();
    defaultTables[3] = {
      tableId: "table_4",
      tableNameAr: "طاولة 4",
      tableNameEn: "Table 4",
      items: [{ product: p1, quantity: 2 }],
      status: 'occupied',
      occupiedSince: fiftyMinutesAgo
    };

    return defaultTables;
  });

  // Dynamic Product Categories state
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem("cafe_pos_categories");
    if (saved) return JSON.parse(saved);
    return [
      { key: "drinks-hot", labelAr: "مشروبات ساخنة", labelEn: "Hot Espresso" },
      { key: "drinks-cold", labelAr: "مشروبات باردة", labelEn: "Cold Brew" },
      { key: "food", labelAr: "مأكولات ومخبوزات", labelEn: "Bakery & Food" },
      { key: "retail", labelAr: "بن تجزئة وأدوات", labelEn: "Bags & Retail" }
    ];
  });

const DEFAULT_PRINTER_CONFIGS: PrinterConfig[] = [
  {
    id: "prn-cashier",
    nameAr: "طابعة الكاشير والفواتير (الرئيسية)",
    nameEn: "Main Cashier Printer",
    connectionType: 'browser',
    connectionValue: "Default Browser Print",
    paperSize: "80mm",
    categories: ["retail"],
    isActive: true
  },
  {
    id: "prn-kitchen",
    nameAr: "طابعة المطبخ (الوجبات والأطعمة)",
    nameEn: "Kitchen Food Printer",
    connectionType: 'network',
    connectionValue: "192.168.1.100",
    paperSize: "80mm",
    categories: ["food"],
    isActive: true
  },
  {
    id: "prn-bar",
    nameAr: "طابعة البار (المشروبات الساخنة والباردة)",
    nameEn: "Bar Drinks Printer",
    connectionType: 'network',
    connectionValue: "192.168.1.105",
    paperSize: "58mm",
    categories: ["drinks-hot", "drinks-cold"],
    isActive: true
  }
];

  // Cafe Corporate Settings
  const [settings, setSettings] = useState<CafeSettings>(() => {
    const saved = localStorage.getItem("cafe_pos_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Automatically migrate currency to Iraqi Dinar if it was SAR
      if (parsed.currencyAr === "ر.س" || parsed.currencyEn === "SAR") {
        parsed.currencyAr = "د.ع";
        parsed.currencyEn = "IQD";
      }
      // Set defaults for newly introduced invoice design fields
      if (!parsed.hasOwnProperty('receiptFontSize')) {
        parsed.receiptFontSize = 12;
        parsed.showReceiptLogo = true;
        parsed.showReceiptTax = true;
        parsed.showReceiptQr = true;
        parsed.showReceiptHeader = true;
        parsed.showReceiptFooter = true;
        parsed.showReceiptCustomer = true;
        parsed.showReceiptEmployee = true;
        parsed.receiptBlockOrder = ['logo', 'header', 'info', 'items', 'totals', 'qr', 'footer'];
      }
      if (!parsed.hasOwnProperty('printerPaperSize')) {
        parsed.printerPaperSize = "80mm";
        parsed.printerModel = "Xprint";
        parsed.printerDensity = "medium";
      }
      if (!parsed.hasOwnProperty('printerConfigs')) {
        parsed.printerConfigs = DEFAULT_PRINTER_CONFIGS;
      }
      return parsed;
    }
    return {
      nameAr: "مقهى باريستا هب المختص",
      nameEn: "Specialty Barista Hub",
      taxRate: 15,
      currencyAr: "د.ع",
      currencyEn: "IQD",
      receiptHeaderAr: "الرقم الضريبي: 300092810000003 - س.ت: 1010928103",
      receiptHeaderEn: "TRN: 300092810000003 - CR: 1010928103",
      receiptFooterAr: "شكراً لزيارتكم، نسعد بخدمتكم دوماً ☕",
      receiptFooterEn: "Thank you for visiting! Have a wonderful day ☕",
      primaryColor: "#059669",
      accentColor: "#10b981",
      enableVat: true,
      enable2FA: false,
      twoFactorPin: "1928",
      receiptFontSize: 12,
      showReceiptLogo: true,
      showReceiptTax: true,
      showReceiptQr: true,
      showReceiptHeader: true,
      showReceiptFooter: true,
      showReceiptCustomer: true,
      showReceiptEmployee: true,
      receiptBlockOrder: ['logo', 'header', 'info', 'items', 'totals', 'qr', 'footer'],
      printerPaperSize: "80mm",
      printerModel: "Xprint",
      printerDensity: "medium",
      printerConfigs: DEFAULT_PRINTER_CONFIGS
    };
  });

  // 2FA Security states
  const [is2FAVerified, setIs2FAVerified] = useState<boolean>(false);
  const [show2FAPrompt, setShow2FAPrompt] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<boolean>(false);
  const [intendedTab, setIntendedTab] = useState<string | null>(null);

  // Customers State (departement-level Database)
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem("cafe_pos_customers");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "cust_1",
        name: "ليلى العامري",
        phone: "07701234567",
        totalSpent: 45000,
        ordersCount: 3,
        lastVisit: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      },
      {
        id: "cust_2",
        name: "محمد البغدادي",
        phone: "07809876543",
        totalSpent: 12000,
        ordersCount: 1,
        lastVisit: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "cust_3",
        name: "رنا الجبوري",
        phone: "07901112233",
        totalSpent: 75000,
        ordersCount: 5,
        lastVisit: new Date().toISOString()
      }
    ];
  });

  // --- Authentication Observer ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoadingAuth(false);

      if (firebaseUser) {
        if (firebaseUser.email === "othmanwaadibrahim@gmail.com" || firebaseUser.email === "owaad9900@gmail.com") {
          // System master admin starts with returning to AdminPanel list
          setCurrentCafeId(null);
          setCurrentCafeNameAr("");
          setCurrentCafeNameEn("");
        } else {
          // Standard cafes are fixed to their own user UID
          setCurrentCafeId(firebaseUser.uid);
        }
      } else {
        setCurrentCafeId(null);
        setCurrentCafeNameAr("");
        setCurrentCafeNameEn("");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  // --- Firebase Firestore Real-time Synchronization Listeners ---

  // 1. Settings Real-time Sync
  useEffect(() => {
    if (!currentCafeId) return;
    const unsub = onSnapshot(doc(db, "cafes", currentCafeId, "settings", "default"), (docSnap) => {
      if (docSnap.exists()) {
        const remoteData = docSnap.data() as CafeSettings;
        setSettings((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(remoteData)) {
            return prev;
          }
          return remoteData;
        });
      } else {
        // Document does not exist yet; seed current settings to Firestore
        setDoc(doc(db, "cafes", currentCafeId, "settings", "default"), settings).catch((err) => {
          console.error("Failed to seed initial settings:", err);
        });
      }
    });
    return () => unsub();
  }, [currentCafeId]);

  // 2. Dynamic Categories Real-time Sync
  useEffect(() => {
    if (!currentCafeId) return;
    const unsub = onSnapshot(collection(db, "cafes", currentCafeId, "categories"), (snap) => {
      const list: Category[] = [];
      snap.forEach((d) => {
        list.push(d.data() as Category);
      });
      if (list.length > 0) {
        setCategories((prev) => {
          const sortedPrev = [...prev].sort((a, b) => a.key.localeCompare(b.key));
          const sortedList = [...list].sort((a, b) => a.key.localeCompare(b.key));
          if (JSON.stringify(sortedPrev) === JSON.stringify(sortedList)) {
            return prev;
          }
          return list;
        });
      } else {
        // Seed default categories
        const defaultCats = [
          { key: "drinks-hot", labelAr: "مشروبات ساخنة", labelEn: "Hot Espresso" },
          { key: "drinks-cold", labelAr: "مشروبات باردة", labelEn: "Cold Brew" },
          { key: "food", labelAr: "مأكولات ومخبوزات", labelEn: "Bakery & Food" },
          { key: "retail", labelAr: "بن تجزئة وأدوات", labelEn: "Bags & Retail" }
        ];
        defaultCats.forEach((c) => {
          setDoc(doc(db, "cafes", currentCafeId, "categories", c.key), c).catch(err => {
            console.error("Failed to seed categories:", err);
          });
        });
      }
    });
    return () => unsub();
  }, [currentCafeId]);

  // 3. Inventory (Products) Real-time Sync
  useEffect(() => {
    if (!currentCafeId) return;
    const unsub = onSnapshot(collection(db, "cafes", currentCafeId, "inventory"), (snap) => {
      const list: Product[] = [];
      snap.forEach((d) => {
        list.push(d.data() as Product);
      });
      if (list.length > 0) {
        setInventory((prev) => {
          const sortedPrev = [...prev].sort((a, b) => a.id.localeCompare(b.id));
          const sortedList = [...list].sort((a, b) => a.id.localeCompare(b.id));
          if (JSON.stringify(sortedPrev) === JSON.stringify(sortedList)) {
            return prev;
          }
          return list;
        });
      } else {
        // Seed initial default products to Firestore
        DEFAULT_PRODUCTS.forEach((p) => {
          setDoc(doc(db, "cafes", currentCafeId, "inventory", p.id), p).catch(err => {
            console.error("Failed to seed product:", err);
          });
        });
      }
    });
    return () => unsub();
  }, [currentCafeId]);

  // 4. Customers Real-time Sync
  useEffect(() => {
    if (!currentCafeId) return;
    const unsub = onSnapshot(collection(db, "cafes", currentCafeId, "customers"), (snap) => {
      const list: Customer[] = [];
      snap.forEach((d) => {
        list.push(d.data() as Customer);
      });
      if (list.length > 0) {
        setCustomers((prev) => {
          const sortedPrev = [...prev].sort((a, b) => a.id.localeCompare(b.id));
          const sortedList = [...list].sort((a, b) => a.id.localeCompare(b.id));
          if (JSON.stringify(sortedPrev) === JSON.stringify(sortedList)) {
            return prev;
          }
          return list;
        });
      } else {
        // Seed default customers
        const defaultCustomers: Customer[] = [
          {
            id: "cust_1",
            name: "ليلى العامري",
            phone: "07701234567",
            totalSpent: 45000,
            ordersCount: 3,
            lastVisit: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
          },
          {
            id: "cust_2",
            name: "محمد البغدادي",
            phone: "07809876543",
            totalSpent: 12000,
            ordersCount: 1,
            lastVisit: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
          },
          {
            id: "cust_3",
            name: "رنا الجبوري",
            phone: "07901112233",
            totalSpent: 75000,
            ordersCount: 5,
            lastVisit: new Date().toISOString()
          }
        ];
        defaultCustomers.forEach((c) => {
          setDoc(doc(db, "cafes", currentCafeId, "customers", c.id), c).catch(err => {
            console.error("Failed to seed customer:", err);
          });
        });
      }
    });
    return () => unsub();
  }, [currentCafeId]);

  // 5. Dining / Coffee Tables Session Real-time Sync
  useEffect(() => {
    if (!currentCafeId) return;
    const unsub = onSnapshot(collection(db, "cafes", currentCafeId, "tables"), (snap) => {
      const list: TableOrder[] = [];
      snap.forEach((d) => {
        list.push(d.data() as TableOrder);
      });
      if (list.length > 0) {
        list.sort((a, b) => {
          const numA = parseInt(a.tableId.replace("table_", "")) || 0;
          const numB = parseInt(b.tableId.replace("table_", "")) || 0;
          return numA - numB;
        });
        setTables((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(list)) {
            return prev;
          }
          return list;
        });
      } else {
        // Setup default tables
        const defaultTables = Array.from({ length: 10 }, (_, i) => ({
          tableId: `table_${i + 1}`,
          tableNameAr: `طاولة ${i + 1}`,
          tableNameEn: `Table ${i + 1}`,
          items: [] as OrderItem[],
          status: 'idle' as 'idle' | 'occupied',
          occupiedSince: null as string | null
        }));
        const p1 = DEFAULT_PRODUCTS[0];
        const fiftyMinutesAgo = new Date(Date.now() - 50 * 60 * 1000).toISOString();
        if (p1 && defaultTables[3]) {
          defaultTables[3].items = [{ product: p1, quantity: 2 }];
          defaultTables[3].status = 'occupied';
          defaultTables[3].occupiedSince = fiftyMinutesAgo;
        }
        defaultTables.forEach((t) => {
          setDoc(doc(db, "cafes", currentCafeId, "tables", t.tableId), t).catch(err => {
            console.error("Failed to seed table:", err);
          });
        });
      }
    });
    return () => unsub();
  }, [currentCafeId]);

  // 6. Orders Ledger Real-time Sync
  useEffect(() => {
    if (!currentCafeId) return;
    const unsub = onSnapshot(collection(db, "cafes", currentCafeId, "orders"), (snap) => {
      const list: Order[] = [];
      snap.forEach((d) => {
        list.push(d.data() as Order);
      });
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(list)) {
          return prev;
        }
        return list;
      });
    });
    return () => unsub();
  }, [currentCafeId]);

  // Synchronise localStorage on update as fallback / cache
  useEffect(() => {
    localStorage.setItem("cafe_pos_inventory", JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem("cafe_pos_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("cafe_pos_tables", JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem("cafe_pos_customers", JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem("cafe_pos_categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("cafe_pos_settings", JSON.stringify(settings));
    document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    document.documentElement.style.setProperty('--print-width', settings.printerPaperSize || '80mm');
    document.documentElement.style.setProperty('--print-font-size', `${settings.receiptFontSize || 12}px`);
    
    // Propagate custom settings modification directly to Firestore
    if (currentCafeId) {
      setDoc(doc(db, "cafes", currentCafeId, "settings", "default"), settings).catch((err) => {
        console.error("Failed to propagate settings update to firestore:", err);
      });
    }
  }, [settings, currentCafeId]);

  // Dark/Light view toggle handler
  useEffect(() => {
    if (themeMode === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [themeMode]);

  // --- Real-time CRUD Handlers integrating Firestore ---

  const handleAddProduct = async (newProduct: Product) => {
    if (!currentCafeId) return;
    try {
      await setDoc(doc(db, "cafes", currentCafeId, "inventory", newProduct.id), newProduct);
    } catch (err) {
      console.error("Failed to add product to Firestore:", err);
    }
  };

  const handleUpdateInventoryQuantity = async (productId: string, delta: number) => {
    if (!currentCafeId) return;
    try {
      const p = inventory.find(prod => prod.id === productId);
      if (p) {
        const nextQty = Math.max(0, p.quantity + delta);
        await setDoc(doc(db, "cafes", currentCafeId, "inventory", productId), { ...p, quantity: nextQty });
      }
    } catch (err) {
      console.error("Failed to update stock quantity on Firestore:", err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!currentCafeId) return;
    try {
      await deleteDoc(doc(db, "cafes", currentCafeId, "inventory", productId));
    } catch (err) {
      console.error("Failed to delete product from Firestore:", err);
    }
  };

  const handleAddCategory = async (newCat: Category) => {
    if (!currentCafeId) return;
    try {
      await setDoc(doc(db, "cafes", currentCafeId, "categories", newCat.key), newCat);
    } catch (err) {
      console.error("Failed to add category to Firestore:", err);
    }
  };

  const handleDeleteCategory = async (catKey: string) => {
    if (!currentCafeId) return;
    try {
      await deleteDoc(doc(db, "cafes", currentCafeId, "categories", catKey));
    } catch (err) {
      console.error("Failed to delete category from Firestore:", err);
    }
  };

  const handleCreateOrder = async (newOrder: Order) => {
    if (!currentCafeId) return;
    try {
      // Create order document
      await setDoc(doc(db, "cafes", currentCafeId, "orders", newOrder.id), newOrder);

      // Handle loyal customers profile update / create
      if (newOrder.customerName || newOrder.customerPhone) {
        const name = newOrder.customerName ? newOrder.customerName.trim() : "";
        const phone = newOrder.customerPhone ? newOrder.customerPhone.trim() : "";
        if (name || phone) {
          const matchIndex = customers.findIndex(c => {
            if (phone && phone !== "-" && c.phone === phone) return true;
            if (name && c.name.toLowerCase() === name.toLowerCase()) return true;
            return false;
          });

          if (matchIndex > -1) {
            const existing = customers[matchIndex];
            const updatedCust = {
              ...existing,
              name: name || existing.name,
              phone: phone && phone !== "-" ? phone : existing.phone,
              totalSpent: existing.totalSpent + newOrder.total,
              ordersCount: existing.ordersCount + 1,
              lastVisit: new Date().toISOString()
            };
            await setDoc(doc(db, "cafes", currentCafeId, "customers", updatedCust.id), updatedCust);
          } else {
            const newCustomer: Customer = {
              id: `cust_${Date.now()}`,
              name: name || phone || "عميل غير معروف",
              phone: phone || "-",
              totalSpent: newOrder.total,
              ordersCount: 1,
              lastVisit: new Date().toISOString()
            };
            await setDoc(doc(db, "cafes", currentCafeId, "customers", newCustomer.id), newCustomer);
          }
        }
      }
    } catch (err) {
      console.error("Failed to register order and update profiles on Firestore:", err);
    }
  };

  const handleUpdateTable = async (tableId: string, items: OrderItem[], customOccupiedSince?: string) => {
    if (!currentCafeId) return;
    try {
      const t = tables.find(tbl => tbl.tableId === tableId);
      if (t) {
        const isNowOccupied = items.length > 0;
        const wasOccupied = t.status === 'occupied';
        
        let newOccupiedSince = t.occupiedSince || null;
        if (isNowOccupied) {
          if (customOccupiedSince) {
            newOccupiedSince = customOccupiedSince;
          } else if (!wasOccupied) {
            newOccupiedSince = new Date().toISOString();
          } else if (!newOccupiedSince) {
            newOccupiedSince = t.updatedAt || new Date().toISOString();
          }
        } else {
          newOccupiedSince = null;
        }

        const updatedTable: TableOrder = {
          ...t,
          items,
          status: isNowOccupied ? 'occupied' : 'idle',
          updatedAt: new Date().toISOString(),
          occupiedSince: newOccupiedSince
        };

        await setDoc(doc(db, "cafes", currentCafeId, "tables", tableId), updatedTable);
      }
    } catch (err) {
      console.error("Failed to update Table Order on Firestore:", err);
    }
  };

  const handleClearTableSession = async (tableId: string) => {
    if (!currentCafeId) return;
    try {
      const t = tables.find(tbl => tbl.tableId === tableId);
      if (t) {
        const clearedTable: TableOrder = {
          ...t,
          items: [],
          status: 'idle',
          occupiedSince: null,
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, "cafes", currentCafeId, "tables", tableId), clearedTable);
      }
    } catch (err) {
      console.error("Failed to clear table session on Firestore:", err);
    }
  };

  const handleAddTable = async (tableNameAr: string, tableNameEn: string) => {
    if (!currentCafeId) return;
    try {
      const nextNum = tables.length + 1;
      const newTable: TableOrder = {
        tableId: `table_${Date.now()}`,
        tableNameAr: tableNameAr.trim() || `طاولة ${nextNum}`,
        tableNameEn: tableNameEn.trim() || `Table ${nextNum}`,
        items: [],
        status: 'idle'
      };
      await setDoc(doc(db, "cafes", currentCafeId, "tables", newTable.tableId), newTable);
    } catch (err) {
      console.error("Failed to add new table on Firestore:", err);
    }
  };

  // Secure Cloud / Cipher Backup overrides
  const handleRestoreBackup = (recoveredData: { products: any[]; orders: any[] }) => {
    if (recoveredData.products) setInventory(recoveredData.products);
    if (recoveredData.orders) setOrders(recoveredData.orders);
  };

  const getBackupPayload = () => {
    return { products: inventory, orders };
  };

  // Intercept Admin view tabs if 2FA is active
  const handleTabChangeAttempt = (tabKey: string) => {
    const isRestricted = (tabKey === "analytics" || tabKey === "settings") && settings.enable2FA;
    
    if (isRestricted && !is2FAVerified) {
      setIntendedTab(tabKey);
      setShow2FAPrompt(true);
      setPinInput("");
      setPinError(false);
    } else {
      setActiveTab(tabKey);
    }
  };

  const verifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === settings.twoFactorPin) {
      setIs2FAVerified(true);
      setShow2FAPrompt(false);
      setPinError(false);
      if (intendedTab) {
        setActiveTab(intendedTab);
        setIntendedTab(null);
      }
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  const lowStockItemsCount = inventory.filter(p => p.quantity <= p.minQuantity).length;

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F19] flex items-center justify-center font-sans" dir="rtl">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">جارٍ التحميل والمزامنة السحابية...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if ((user.email === "othmanwaadibrahim@gmail.com" || user.email === "owaad9900@gmail.com") && !currentCafeId) {
    return (
      <AdminPanel 
        onSelectCafe={(cafeId, nameAr, nameEn) => {
          setCurrentCafeId(cafeId);
          setCurrentCafeNameAr(nameAr);
          setCurrentCafeNameEn(nameEn);
          setActiveTab("cashier");
        }}
        onLogout={handleLogout}
        adminEmail={user.email}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0B0F19] flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Platform Owner Impersonation Banner */}
      {user && (user.email === "othmanwaadibrahim@gmail.com" || user.email === "owaad9900@gmail.com") && currentCafeId && (
        <div className="bg-slate-900 border-b border-indigo-500/50 text-indigo-200 px-6 py-3 flex flex-col sm:flex-row items-center justify-between text-xs gap-3 relative z-50">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping shrink-0" />
            <span>
              <strong>تنبيه الإدارة:</strong> أنت تتصفح حالياً مقهى <strong>{currentCafeNameAr} ({currentCafeNameEn})</strong> كمسؤول نظام.
            </span>
          </div>
          <button
            onClick={() => {
              setCurrentCafeId(null);
              setCurrentCafeNameAr("");
              setCurrentCafeNameEn("");
            }}
            className="bg-indigo-650 hover:bg-indigo-550 text-white font-medium px-4 py-1.5 rounded-lg border border-indigo-500/30 flex items-center gap-1.5 transition-colors cursor-pointer text-[11px]"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>الرجوع للوحة المنصة الرئيسية / Control Room</span>
          </button>
        </div>
      )}

      <div 
        className="flex-1 flex flex-col md:flex-row text-[#111827] dark:text-slate-100 transition-colors duration-300 font-sans" 
      >
        
        {/* SIDEBAR NAVIGATION CONTROL */}
      <aside className="w-full md:w-64 bg-white dark:bg-[#111827] text-gray-850 dark:text-gray-105 shrink-0 flex flex-col justify-between border-l border-gray-150 dark:border-slate-800/80 p-5 space-y-6 shadow-sm">
        
        <div className="space-y-6">
          {/* Cafe Mini Banner */}
          <div className="flex items-center gap-3 px-2 py-1 select-none">
            <div className="p-2.5 rounded-xl text-white flex items-center justify-center shadow-md shadow-emerald-50 dark:shadow-none transition-shadow" style={{ backgroundColor: settings.primaryColor }}>
              <Coffee className="w-5.5 h-5.5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white truncate max-w-[150px]">
                {lang === 'ar' ? settings.nameAr : settings.nameEn}
              </h1>
              <span className="text-[10px] text-gray-400 dark:text-slate-400 font-mono tracking-widest block uppercase">Smart Cashier</span>
            </div>
          </div>

          {/* Navigation Blocks */}
          <nav className="space-y-1">
            
            {/* Cashier View Tab */}
            <button
              onClick={() => handleTabChangeAttempt("cashier")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === "cashier"
                  ? ""
                  : "text-gray-500 hover:bg-gray-55 hover:text-gray-900 dark:text-slate-405 dark:hover:bg-slate-800/50 dark:hover:text-white"
              }`}
              style={activeTab === "cashier" ? { backgroundColor: `${settings.primaryColor}13`, color: settings.primaryColor } : {}}
            >
              <ShoppingCart className="w-4.5 h-4.5" />
              <span>{lang === "ar" ? "نظام كاشير المبيعات" : "Billing POS Desk"}</span>
            </button>

            {/* Waiter Tables / Dine-in Services Tab */}
            <button
              onClick={() => handleTabChangeAttempt("tables")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === "tables"
                  ? ""
                  : "text-gray-500 hover:bg-gray-55 hover:text-gray-900 dark:text-slate-405 dark:hover:bg-slate-800/50 dark:hover:text-white"
              }`}
              style={activeTab === "tables" ? { backgroundColor: `${settings.primaryColor}13`, color: settings.primaryColor } : {}}
            >
              <Utensils className="w-4.5 h-4.5" />
              <span>{lang === "ar" ? "خدمة وطاولات الصالة" : "Dine-In Tables POS"}</span>
            </button>

            {/* Inventory Warehouse View Tab */}
            <button
              onClick={() => handleTabChangeAttempt("inventory")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === "inventory"
                  ? ""
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-405 dark:hover:bg-slate-800/50 dark:hover:text-white"
              }`}
              style={activeTab === "inventory" ? { backgroundColor: `${settings.primaryColor}13`, color: settings.primaryColor } : {}}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4.5 h-4.5" />
                <span>{lang === "ar" ? "إدارة المخزون والمستودع" : "Warehouse Inventory"}</span>
              </div>
              {lowStockItemsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-mono font-bold">
                  {lowStockItemsCount}
                </span>
              )}
            </button>

            {/* Reports and Analytics Tab */}
            <button
              onClick={() => handleTabChangeAttempt("analytics")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === "analytics"
                  ? ""
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-405 dark:hover:bg-slate-800/50 dark:hover:text-white"
              }`}
              style={activeTab === "analytics" ? { backgroundColor: `${settings.primaryColor}13`, color: settings.primaryColor } : {}}
            >
              <BarChart3 className="w-4.5 h-4.5" />
              <span>{lang === "ar" ? "تحليلات الأرباح السحابية" : "Profit Audit & AI"}</span>
            </button>

            {/* Customers Section Tab */}
            <button
              onClick={() => handleTabChangeAttempt("customers")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === "customers"
                  ? ""
                  : "text-gray-500 hover:bg-gray-55 hover:text-gray-900 dark:text-slate-405 dark:hover:bg-slate-800/50 dark:hover:text-white"
              }`}
              style={activeTab === "customers" ? { backgroundColor: `${settings.primaryColor}13`, color: settings.primaryColor } : {}}
            >
              <Users className="w-4.5 h-4.5" />
              <span>{lang === "ar" ? "قسم إدارة العملاء" : "Loyal Customers"}</span>
            </button>

            {/* Remote Owner Phone view Tab */}
            <button
              onClick={() => handleTabChangeAttempt("mobile")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === "mobile"
                  ? ""
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-405 dark:hover:bg-slate-800/50 dark:hover:text-white"
              }`}
              style={activeTab === "mobile" ? { backgroundColor: `${settings.primaryColor}13`, color: settings.primaryColor } : {}}
            >
              <Smartphone className="w-4.5 h-4.5" />
              <span>{lang === "ar" ? "تطبيق الهاتف للمالك" : "Owner Mobile Panel"}</span>
            </button>

            {/* Technical Help BaristaBot Chat */}
            <button
              onClick={() => handleTabChangeAttempt("chatbot")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === "chatbot"
                  ? ""
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-405 dark:hover:bg-slate-800/50 dark:hover:text-white"
              }`}
              style={activeTab === "chatbot" ? { backgroundColor: `${settings.primaryColor}13`, color: settings.primaryColor } : {}}
            >
              <Bot className="w-4.5 h-4.5" />
              <span>{lang === "ar" ? "المساعد الذكي باريستابوت" : "BaristaBot Desk (24/7)"}</span>
            </button>

            {/* Developer Toolkit API Documentation */}
            <button
              onClick={() => handleTabChangeAttempt("developer")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === "developer"
                  ? ""
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-405 dark:hover:bg-slate-800/50 dark:hover:text-white"
              }`}
              style={activeTab === "developer" ? { backgroundColor: `${settings.primaryColor}13`, color: settings.primaryColor } : {}}
            >
              <FileCode className="w-4.5 h-4.5" />
              <span>{lang === "ar" ? "أدوات الربط البرمجي (APIs)" : "Developer Toolkit"}</span>
            </button>

            {/* Cafe branding Settings Tab */}
            <button
              onClick={() => handleTabChangeAttempt("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition ${
                activeTab === "settings"
                  ? ""
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-405 dark:hover:bg-slate-800/50 dark:hover:text-white"
              }`}
              style={activeTab === "settings" ? { backgroundColor: `${settings.primaryColor}13`, color: settings.primaryColor } : {}}
            >
              <Settings className="w-4.5 h-4.5" />
              <span>{lang === "ar" ? "إعدادات الهوية والنسخ" : "Cafe Branding Setup"}</span>
            </button>

          </nav>
        </div>

        {/* Global toggles and credit links */}
        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800 text-[11px] text-gray-500">
          
          {/* Shift Cashier switch details */}
          <div className="p-3 bg-[#F9FAFB] dark:bg-slate-900/45 rounded-xl space-y-1.5 font-mono border border-gray-100 dark:border-slate-800/60">
            <span className="text-gray-600 dark:text-slate-400 block font-bold">{lang === "ar" ? "بيانات العمل النشط:" : "POS Active Status:"}</span>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400">● 100% Secure Cryptography</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400">● ZATCA E-Invoicing v2</div>
          </div>

          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-medium text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              <span>{lang === "ar" ? "اللغة" : "Lang"}</span>
            </span>
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-705 text-[10px] text-gray-700 dark:text-white uppercase font-bold tracking-wide transition"
            >
              {lang === "ar" ? "English" : "عربي"}
            </button>
          </div>

          {/* Theme customiser switch */}
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-medium text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
              {themeMode === 'light' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{lang === 'ar' ? "المظهر" : "UI View"}</span>
            </span>
            <button
              onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
              className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-705 text-[10px] text-gray-700 dark:text-white uppercase font-bold tracking-wide transition"
            >
              {themeMode === 'light' ? "Dark" : "Light"}
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-rose-500/35 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold cursor-pointer transition mt-3"
          >
            <LogOut className="w-4 h-4" />
            <span>{lang === "ar" ? "تسجيل الخروج" : "Logout Portal"}</span>
          </button>

        </div>

      </aside>

      {/* PRIMARY CONTROLLER SURFACE */}
      <main className="flex-1 p-6 flex flex-col space-y-6 overflow-x-hidden">
        
        {/* TOP COMPONENT HEADER */}
        <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
          
          <div>
            <h1 className="text-xl font-extrabold tracking-wide text-slate-900 dark:text-slate-50">
              {lang === 'ar' ? "إشهار لوحة ذكاء كاشير المقاهي" : "POS Cashier Orchestration Hub"}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              📅 {new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Connection status buttons */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-mono tracking-wide transition ${
                isOnline 
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 text-emerald-700 dark:text-emerald-400" 
                  : "bg-amber-50 dark:bg-amber-950/20 border-amber-200/50 text-amber-700 dark:text-amber-400"
              }`}
            >
              {isOnline ? <Wifi className="w-4 h-4 shrink-0" /> : <WifiOff className="w-4 h-4 shrink-0" />}
              <span>
                {isOnline 
                  ? (lang === 'ar' ? "مزامنة لحظية نشطة" : "Cloud Sync Live") 
                  : (lang === 'ar' ? "وضع دون اتصال بالإنترنت" : "Offline Work Mode")}
              </span>
            </button>

            {settings.enable2FA && (
              <button
                onClick={() => {
                  setIs2FAVerified(false);
                  alert(lang === "ar" ? "تم قفل الصلاحيات الإدارية مجدداً لتأمين البيانات." : "Secondary security lock applied again.");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition ${
                  is2FAVerified 
                    ? "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300" 
                    : "bg-slate-200 text-slate-500"
                }`}
                title="Secure Lock / 2FA status indicator"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{is2FAVerified ? (lang === 'ar' ? "مسار إداري مفتوح" : "Admin verified") : (lang === 'ar' ? "إداري مقفل" : "Admin Locked")}</span>
              </button>
            )}
          </div>

        </header>

        {/* PRIMARY SWITCH VIEWPORTS */}
        <div className="flex-1 animate-fade-in">
          {activeTab === "cashier" && (
            <CashierView
              lang={lang}
              inventory={inventory}
              onCreateOrder={handleCreateOrder}
              onUpdateInventoryQuantity={handleUpdateInventoryQuantity}
              settings={settings}
              isOnline={isOnline}
              tables={tables}
              onClearTableSession={handleClearTableSession}
              customers={customers}
              categories={categories}
            />
          )}

          {activeTab === "tables" && (
            <TablesView
              lang={lang}
              inventory={inventory}
              tables={tables}
              onUpdateTable={handleUpdateTable}
              onAddTable={handleAddTable}
              settings={settings}
              categories={categories}
            />
          )}

          {activeTab === "inventory" && (
            <InventoryView
              lang={lang}
              inventory={inventory}
              onAddProduct={handleAddProduct}
              onUpdateInventoryQuantity={handleUpdateInventoryQuantity}
              onDeleteProduct={handleDeleteProduct}
              settings={settings}
              categories={categories}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsView
              lang={lang}
              orders={orders}
              inventory={inventory}
              settings={settings}
              isOnline={isOnline}
            />
          )}

          {activeTab === "mobile" && (
            <MobileAppView
              lang={lang}
              orders={orders}
              inventory={inventory}
              settings={settings}
            />
          )}

          {activeTab === "chatbot" && (
            <SupportChatbot
              lang={lang}
            />
          )}

          {activeTab === "developer" && (
            <DeveloperDocs
              lang={lang}
            />
          )}

          {activeTab === "customers" && (
            <CustomersView
              lang={lang}
              customers={customers}
              setCustomers={setCustomers}
              settings={settings}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView
              lang={lang}
              settings={settings}
              onUpdateSettings={setSettings}
              onRestoreBackup={handleRestoreBackup}
              getBackupPayload={getBackupPayload}
              isOnline={isOnline}
            />
          )}
        </div>

      </main>

      {/* 2FA MANAGER PIN OVERLAY GATE */}
      {show2FAPrompt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={verifyPin}
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 text-center space-y-6 shadow-2xl relative text-xs font-semibold text-slate-800 dark:text-slate-100"
          >
            <div className="mx-auto w-12 h-12 bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-full flex items-center justify-center animate-bounce">
              <Key className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {lang === 'ar' ? "تأكيد المصادقة الثنائية للمشرف" : "Owner 2FA Secure Check"}
              </h3>
              <p className="text-[11px] text-slate-400 font-sans leading-normal">
                {lang === 'ar' 
                  ? "الفرع مفعل بمستويات أمان متقدمة لحماية بيانات الأرباح والتحليلات. الرجاء إدخال الرمز السري للإدارة للإطلاع." 
                  : "Private financial margins are locked. Please input the default 4-digit PIN override to review audits."}
              </p>
            </div>

            {/* PIN Entry keyboard */}
            <div className="space-y-3.5">
              <input
                type="password"
                maxLength={4}
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="w-28 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-xl font-bold font-mono tracking-widest text-slate-800 dark:text-slate-100 focus:outline-none"
              />

              {pinError && (
                <span className="text-[10px] text-rose-500 font-bold block animate-shake">
                  ❌ {lang === 'ar' ? "الرمز المدخل خاطئ! حاول مجدداً" : "Incorrect override code. Verify & retry."}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShow2FAPrompt(false);
                  setIntendedTab(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition"
              >
                {lang === 'ar' ? "إلغاء الرجوع" : "Get Back"}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-950 rounded-xl font-bold hover:opacity-90 transition"
              >
                {lang === 'ar' ? "تأكيد وفتح" : "Unlock Tab"}
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
              💡 {lang === "ar" ? "مفتاح الدخول الإفتراضي للمحاكاة:" : "Default test override PIN:"} <span className="font-mono font-bold text-slate-600 dark:text-slate-300">1928</span>
            </div>

          </form>
        </div>
      )}

      </div>
    </div>
  );
}
