import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function useReportAccess() {
  const [revision, setRevision] = useState(0);
  const [access, setAccess] = useState({ loading: true, scope: "none", userId: null, error: "" });
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // Invalidate immediately. No Supabase async calls inside this callback.
      setAccess({ loading: true, scope: "none", userId: null, error: "" });
      setRevision((value) => value + 1);
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    let active = true;
    supabase.rpc("teramatch_report_access").then(({ data, error }) => {
      if (!active) return;
      setAccess({ loading: false, scope: error ? "none" : data?.scope || "none",
        userId: data?.user_id || null,
        error: error ? "กรุณาเข้าสู่ระบบ หรือให้ผู้ดูแลตรวจสอบการติดตั้ง Report" : "" });
    }).catch(() => {
      if (active) setAccess({ loading: false, scope: "none", userId: null, error: "เชื่อมต่อไม่สำเร็จ" });
    });
    return () => { active = false; };
  }, [revision]);
  return access;
}
