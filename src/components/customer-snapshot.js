import { supabase } from '../supabase';

const KEY = 'personal_data';
export function searchSnapshot(search) {
  return {
    snapshot_version: 1,
    recommended_products: (search?.products || []).map(p => ({
      id: p.id ?? null, model: p.product || p.ans_product || '',
    })),
    selected_products: [],
    system_snapshot: {
      solar_kwp: search?.result?.point ?? null,
      requested_battery_kwh: search?.selectedBatteryKWh ?? null,
      phase: search?.result?.phase || '',
    },
  };
}
export async function currentCustomer(expected) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error('กรุณาเข้าสู่ระบบใหม่');
  let customer;
  try { customer = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* Require form. */ }
  if (!customer?._leadId || customer._owner !== data.user.id)
    throw new Error('กรุณากลับไปกรอกข้อมูลลูกค้าใหม่ก่อน Export');
  if (expected && ['_leadId', 'firstName', 'lastName', 'email', 'phone'].some(key => expected[key] !== customer[key]))
    throw new Error('ข้อมูลลูกค้าเปลี่ยนในหน้าต่างอื่น กรุณาเปิดหน้าผลลัพธ์ใหม่');
  return customer;
}
// Keep the same UUID on retry after an uncertain network response. A different
// selection gets a new UUID. Duplicate confirmation is subject to existing RLS.
export async function insertQuote(payload, retryRef) {
  const signature = JSON.stringify(payload);
  if (retryRef.current?.signature !== signature)
    retryRef.current = { signature, id: crypto.randomUUID() };
  const id = retryRef.current.id;
  const { error } = await supabase.from('customer_quotes').insert({ ...payload, id });
  if (!error) return;
  if (error.code === '23505') {
    const { data, error: readError } = await supabase.from('customer_quotes')
      .select('id').eq('id', id).maybeSingle();
    if (!readError && data?.id === id) return;
  }
  throw error;
}
export function quoteSnapshot(customer, products, system) {
  return {
    snapshot_version: 1,
    customer_lead_id: customer._leadId,
    recommended_products: customer._snapshot?.recommended_products || [],
    selected_products: products,
    system_snapshot: { ...customer._snapshot?.system_snapshot, ...system },
    first_name: customer.firstName, last_name: customer.lastName,
    email: customer.email, phone: customer.phone,
  };
}
