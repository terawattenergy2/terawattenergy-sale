import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../supabase";

// UI gate only. Database permissions MUST also be enforced with RLS.
export default function RequireAuth({ children }) {
  const location = useLocation();
  const [candidate, setCandidate] = useState({ ready: false, session: null, error: "" });
  const [verified, setVerified] = useState(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    let events = 0;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Do not await Supabase calls inside this callback.
      events += 1;
      if (active) setCandidate({ ready: true, session, error: "" });
    });
    const snapshot = events;
    supabase.auth.getSession().then(({ data, error }) => {
      if (active && snapshot === events) setCandidate({ ready: true, session: data?.session ?? null,
        error: error ? "ตรวจสอบเซสชันไม่สำเร็จ" : "" });
    }).catch(() => {
      if (active && snapshot === events) setCandidate({ ready: true, session: null, error: "เชื่อมต่อระบบไม่ได้" });
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [retry]);

  const token = candidate.session?.access_token;
  useEffect(() => {
    let active = true;
    setVerified(null);
    if (!token) return () => { active = false; };
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user || data.user.id !== candidate.session.user.id) {
          throw new Error("ยืนยันบัญชีไม่สำเร็จ กรุณาเข้าสู่ระบบอีกครั้ง");
        }
        const { data: profile, error: profileError } = await supabase.rpc("teramatch_my_profile");
        if (profileError) throw new Error("ตรวจสอบสิทธิ์บริษัทไม่สำเร็จ กรุณาลองใหม่หรือติดต่อผู้ดูแล");
        if (!profile || Array.isArray(profile) || !String(profile.business || "").trim()) {
          throw new Error("ไม่พบข้อมูลบริษัทของบัญชีนี้ กรุณาติดต่อผู้ดูแล");
        }
        if (active) setVerified({ token, userId: data.user.id, error: "" });
      } catch (error) {
        if (active) setVerified({ token, error: error.message || "ตรวจสอบสิทธิ์ไม่สำเร็จ" });
      }
    })();
    return () => { active = false; };
  }, [token, candidate.session?.user?.id, retry]);

  const failure = candidate.error || (verified?.token === token ? verified?.error : "");
  if (failure) return <div className="p-5" role="alert">
    <p>{failure}</p>
    <button type="button" className="btn btn-primary me-2" onClick={() => {
      setVerified(null); setCandidate({ ready: false, session: null, error: "" }); setRetry(v => v + 1);
    }}>ลองใหม่</button>
    <a href="/">กลับหน้า Login</a>
  </div>;
  if (!candidate.ready) return <div className="p-5" role="status">กำลังตรวจสอบเซสชัน...</div>;
  if (!candidate.session) return <Navigate to="/" replace state={{ from: location.pathname }} />;
  if (!verified || verified.token !== token) return <div className="p-5" role="status">กำลังตรวจสอบสิทธิ์...</div>;
  return <React.Fragment key={verified.userId}>{children}</React.Fragment>;
}
