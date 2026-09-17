import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPrinter, FiX, FiCheckCircle, FiShield, FiDownload } from 'react-icons/fi'

export default function ReceiptModal({ isOpen, onClose, orderData }) {
  if (!isOpen || !orderData) return null

  const handlePrint = () => {
    window.print()
  }

  const {
    orderId = 'N/A',
    txnRef = 'TXN-DEMO-000',
    date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    buyerName = 'Corporate Buyer',
    companyName = 'Acme Global Supplies LLC',
    taxId = 'US-98745210',
    address = '100 Industrial Parkway, Suite 400, Chicago, IL',
    country = 'United States',
    shippingMethod = 'Standard Wholesale Freight',
    items = [],
    subtotal = 0,
    shippingFee = 0,
    total = 0,
    cardLast4 = '4242',
    paymentMethod = 'Demo Credit Card (Visa)',
  } = orderData

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm print:hidden"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 260 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 z-10 my-8 print:m-0 print:border-none print:shadow-none"
        >
          {/* Top Bar Actions (hidden on print) */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <FiCheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Simulated Payment Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <FiPrinter className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Invoice Body */}
          <div className="p-6 sm:p-8 space-y-6 text-slate-800 text-sm">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-4">
              <div>
                <span className="font-space text-2xl font-bold tracking-tight text-slate-900">
                  TradeNest<span className="text-emerald-600">.</span>
                </span>
                <p className="text-xs text-slate-500 mt-1">B2B Wholesale Marketplace & Escrow</p>
                <p className="text-[11px] text-slate-400">Tax ID: TN-GLOBAL-77890</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="inline-block px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-mono text-xs font-bold uppercase tracking-wider mb-1">
                  PAID (DEMO SETTLEMENT)
                </span>
                <h2 className="text-base font-bold text-slate-900">Commercial Invoice</h2>
                <p className="text-xs text-slate-500 font-mono">Invoice #: INV-TN-{orderId}</p>
                <p className="text-xs text-slate-500">Date: {date}</p>
              </div>
            </div>

            {/* Bill To & Ship To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-400">
                  Bill To / Buyer
                </p>
                <p className="font-semibold text-slate-800">{buyerName}</p>
                <p className="text-slate-600 font-medium">{companyName}</p>
                <p className="text-slate-500 font-mono text-[11px]">Tax/VAT ID: {taxId}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-slate-400">
                  Shipping Destination
                </p>
                <p className="text-slate-700">{address}</p>
                <p className="text-slate-700">{country}</p>
                <p className="text-indigo-600 font-medium">{shippingMethod}</p>
              </div>
            </div>

            {/* Transaction Reference Box */}
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-800 block">
                  Simulated Transaction Reference
                </span>
                <span className="font-mono font-bold text-emerald-900 text-sm">{txnRef}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
                  Payment Method
                </span>
                <span className="font-medium text-slate-800">
                  {paymentMethod} •••• {cardLast4}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-3">Wholesale Item</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const product = item.product || {}
                    const price = item.price_snapshot || product.price || 0
                    const lineTotal = price * item.quantity
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="p-3 font-medium text-slate-800">
                          {product.name || product.title || 'B2B Wholesale Product'}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            SKU: TN-PRD-{item.product_id}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono">{item.quantity}</td>
                        <td className="p-3 text-right font-mono">${Number(price).toFixed(2)}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          ${Number(lineTotal).toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-end text-xs">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium">${Number(subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Freight Delivery</span>
                  <span className="font-mono font-medium">${Number(shippingFee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Wholesale Tax (0% Export)</span>
                  <span className="font-mono font-medium">$0.00</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                  <span>Total Amount Paid</span>
                  <span className="font-mono text-emerald-600 font-extrabold text-base">
                    ${Number(total).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Disclaimer */}
            <div className="border-t border-slate-200 pt-4 text-center text-[11px] text-slate-400 space-y-1">
              <p className="flex items-center justify-center gap-1 font-medium text-slate-500">
                <FiShield className="text-emerald-500 w-3.5 h-3.5" />
                TradeNest 100% Escrow Guarantee — Funds held in trust until buyer inspection.
              </p>
              <p className="italic">
                Demo Notice: This is an academic course project demonstration receipt. No financial charges were levied.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
