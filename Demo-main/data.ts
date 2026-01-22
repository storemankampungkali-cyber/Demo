import { InventoryItem, TransactionRecord, CartItem, UnitDefinition, RejectRecord, RejectMasterItem, User, PlaylistItem } from './types';

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Quantum Processor X1', sku: 'QP-X1-001', category: 'Electronics', quantity: 150, price: 499.99, status: 'In Stock', lastUpdated: '2023-10-25' },
  { id: '2', name: 'Neural Link Interface', sku: 'NL-INT-05', category: 'Biotech', quantity: 12, price: 1250.00, status: 'Low Stock', lastUpdated: '2023-10-24' },
  { id: '3', name: 'Holographic Emitter', sku: 'HE-PRO-99', category: 'Optics', quantity: 85, price: 299.50, status: 'In Stock', lastUpdated: '2023-10-26' },
  { id: '4', name: 'Fusion Battery Cell', sku: 'FB-C-2000', category: 'Energy', quantity: 0, price: 89.99, status: 'Out of Stock', lastUpdated: '2023-10-20' },
  { id: '5', name: 'Cyberdeck Chassis', sku: 'CD-CH-V2', category: 'Hardware', quantity: 45, price: 159.00, status: 'In Stock', lastUpdated: '2023-10-22' },
  { id: '6', name: 'Optical Fiber Spool (500m)', sku: 'OF-S-500', category: 'Networking', quantity: 8, price: 450.00, status: 'Low Stock', lastUpdated: '2023-10-21' },
  { id: '7', name: 'Smart Actuator Mk4', sku: 'SA-MK4', category: 'Robotics', quantity: 200, price: 75.25, status: 'In Stock', lastUpdated: '2023-10-26' },
  { id: '8', name: 'Graphene Thermal Paste', sku: 'GT-P-10', category: 'Accessories', quantity: 500, price: 12.99, status: 'In Stock', lastUpdated: '2023-10-25' },
];

// Helper to generate sample history for the current month
const generateSampleHistory = (): TransactionRecord[] => {
  const history: TransactionRecord[] = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const unitPcs: UnitDefinition = { name: 'Pcs', ratio: 1 };
  const unitBox: UnitDefinition = { name: 'Box (24x)', ratio: 24 };

  const actions = [
      { day: 1, type: 'IN', note: 'Restock Awal Bulan', ref: 'PO-NOV-001', itemIdx: 0, qty: 50, unit: unitPcs },
      { day: 3, type: 'OUT', note: 'Project Alpha Deployment', ref: 'DO-2201', itemIdx: 2, qty: 5, unit: unitPcs },
      { day: 5, type: 'IN', note: 'Supplier Delivery - FastTech', ref: 'SJ-9982', itemIdx: 4, qty: 10, unit: unitPcs },
      { day: 8, type: 'OUT', note: 'Damaged Goods Removal', ref: '', itemIdx: 7, qty: 2, unit: unitPcs },
      { day: 12, type: 'IN', note: 'Bulk Order Arrived', ref: 'PO-NOV-015', itemIdx: 1, qty: 20, unit: unitPcs },
      { day: 15, type: 'OUT', note: '', ref: 'REQ-INTERNAL', itemIdx: 0, qty: 1, unit: unitBox }, // Testing empty note
      { day: 18, type: 'IN', note: 'Emergency Stock', ref: 'PO-URGENT', itemIdx: 3, qty: 100, unit: unitPcs },
      { day: 22, type: 'OUT', note: 'Client Shipment: CyberDyne', ref: 'DO-2245', itemIdx: 6, qty: 50, unit: unitPcs },
      { day: 25, type: 'OUT', note: 'R&D Usage', ref: '', itemIdx: 5, qty: 2, unit: unitPcs },
      { day: 28, type: 'IN', note: 'End of Month Adjustment', ref: 'ADJ-001', itemIdx: 7, qty: 100, unit: unitPcs },
  ];

  actions.forEach((act, idx) => {
      // Create ISO Date for current month
      const date = new Date(year, month, act.day, 10, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      const invItem = INITIAL_INVENTORY[act.itemIdx];

      // Mock Cart Item
      const cartItem: CartItem = {
          ...invItem,
          cartId: `mock-cart-${idx}`,
          selectedUnit: act.unit,
          orderQuantity: act.qty
      };

      history.push({
          id: `TRX-${year}${String(month+1).padStart(2,'0')}${String(act.day).padStart(2,'0')}-${idx}`,
          date: dateStr,
          type: act.type as 'IN' | 'OUT',
          items: [cartItem],
          totalUnits: act.qty * act.unit.ratio,
          referenceNumber: act.ref,
          notes: act.note,
          photos: []
      });
  });

  return history.reverse(); // Newest first
};

export const SAMPLE_HISTORY = generateSampleHistory();

// --- NEW ISOLATED DATA FOR REJECT MODULE ---
export const SAMPLE_REJECT_MASTER_DATA: RejectMasterItem[] = [
    { id: 'rm-1', name: 'Botol Bekas 600ml', sku: 'REJ-BTL-600', defaultUnit: 'Karung', category: 'Recycle' },
    { id: 'rm-2', name: 'Kardus Rusak Basah', sku: 'REJ-KRD-WET', defaultUnit: 'Ikat', category: 'Waste' },
    { id: 'rm-3', name: 'Minyak Jelantah', sku: 'REJ-OIL-01', defaultUnit: 'Jerrycan', category: 'Liquid' },
];

export const SAMPLE_REJECT_HISTORY: RejectRecord[] = [
    {
        id: 'REJ-LOG-001',
        date: new Date().toISOString().split('T')[0],
        outletName: 'Gudang Pusat',
        totalItems: 5,
        items: [
            { ...SAMPLE_REJECT_MASTER_DATA[0], cartId: 'r1', selectedUnit: {name: 'Karung', ratio: 1}, orderQuantity: 5 },
        ]
    }
];

// --- USER MANAGEMENT DATA ---
export const SAMPLE_USERS: User[] = [
  { id: 'usr-1', name: 'Super Admin', email: 'admin@neonflow.com', role: 'ADMIN', lastActive: 'Now', status: 'ACTIVE' },
  { id: 'usr-2', name: 'John Stockman', email: 'john@neonflow.com', role: 'STAFF', lastActive: '2 hours ago', status: 'ACTIVE' },
  { id: 'usr-3', name: 'Sarah Warehouse', email: 'sarah@neonflow.com', role: 'STAFF', lastActive: '1 day ago', status: 'INACTIVE' },
];

// --- MEDIA PLAYLIST DATA ---
export const SAMPLE_PLAYLIST: PlaylistItem[] = [
    { id: 'pl-1', title: 'Cyberpunk / Synthwave Mix', url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY', videoId: '4xDzrJKXOOY' },
    { id: 'pl-2', title: 'Lofi Hip Hop Radio', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', videoId: 'jfKfPfyJRdk' },
    { id: 'pl-3', title: 'Coding Mode: Dark Synth', url: 'https://www.youtube.com/watch?v=kUrK7Y9aQ68', videoId: 'kUrK7Y9aQ68' },
];