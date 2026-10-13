// The price_list column is named saleScpirt; keep saleScript as the PDF field.
export function getSaleScript(row) {
  return row?.saleScpirt ?? row?.saleScript ?? null;
}
