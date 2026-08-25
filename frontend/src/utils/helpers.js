export const fmt = (n) => `Rs ${Number(n).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const fmtShort = (n) => `Rs ${Number(n).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' })
export const fmtTime = (d) => new Date(d).toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' })
export const fmtDateTime = (d) => `${fmtDate(d)} ${fmtTime(d)}`

export const stockStatus = (stock, min) => {
  if (stock === 0) return { label: 'Out of stock', cls: 'badge-red' }
  if (stock <= min) return { label: 'Low stock', cls: 'badge-yellow' }
  return { label: 'In stock', cls: 'badge-green' }
}

export const paymentLabel = { cash: 'Cash', card: 'Card', jazzcash: 'JazzCash', easypaisa: 'Easypaisa', credit: 'Credit' }
