import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

const BUSINESS_LIST = [
  { id: 0, title: "Terawatt Energy" },
  { id: 1, title: "Marvel Solar Energy" },
  { id: 2, title: "Friend Stone" },
  { id: 3, title: "SIWA Solar" },
];

function getLoginErrorMessage(error) {
  switch (error?.code) {
    case "invalid_credentials":
      return (
        "อีเมลหรือรหัสผ่านไม่ถูกต้อง " +
        "หากยังไม่มีบัญชี กรุณาติดต่อผู้ดูแลบริษัท"
      );

    case "email_not_confirmed":
      return "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ";

    case "user_banned":
      return "บัญชีนี้ถูกระงับ กรุณาติดต่อผู้ดูแลระบบ";

    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "มีการทำรายการบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่";

    default:
      return "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ";
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const submittingRef = useRef(false);

  const [businessId, setBusinessId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // This component expects a browser Supabase client with detectSessionInUrl enabled.
  // The recovery query flag chooses the UI only; Supabase validates the session.
  const [callbackInfo] = useState(() => {
    const url = new URL(window.location.href);
    const hash = new URLSearchParams(url.hash.slice(1));
    return {
      recovery: url.searchParams.get("recovery") === "1" ||
        hash.get("type") === "recovery",
      invalid: hash.has("error") || url.searchParams.has("error"),
    };
  });
  const [mode, setMode] = useState(
    callbackInfo.recovery || callbackInfo.invalid ? "reset" : "login"
  );
  const [sessionEmail, setSessionEmail] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [signupConfirmation, setSignupConfirmation] = useState("");

  useEffect(() => {
    let active = true;
    const expiredMessage = "ลิงก์ไม่ถูกต้องหรือหมดอายุ กรุณาขอลิงก์ใหม่";
    const applySession = (session) => {
      setSessionReady(Boolean(session) && !callbackInfo.invalid);
      setSessionEmail(session?.user?.email || "");
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!active) return;
        applySession(session);
        if (event === "PASSWORD_RECOVERY") {
          setMode("reset");
          setPassword("");
          setNotice("");
          setError(callbackInfo.invalid ? expiredMessage : "");
          // Preserve recovery UI on refresh, even after the SDK removes tokens.
          const url = new URL(window.location.href);
          url.searchParams.set("recovery", "1");
          window.history.replaceState(window.history.state, "", url);
        }
      }
    );

    // getSession waits for the browser SDK to process the callback URL.
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      applySession(data?.session);
      if (callbackInfo.invalid ||
          (callbackInfo.recovery && (sessionError || !data?.session))) {
        setError(expiredMessage);
      }
    }).catch(() => {
      if (active) setError("ตรวจสอบลิงก์ไม่สำเร็จ กรุณาลองเปิดลิงก์อีกครั้ง");
    }).finally(() => {
      if (active) setChecking(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [callbackInfo]);

  const handleSendRecovery = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;
    if (!email.trim()) {
      setError("กรุณากรอกอีเมล");
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const redirect = new URL(window.location.pathname, window.location.origin);
      redirect.searchParams.set("recovery", "1");
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(
        email.trim(), { redirectTo: redirect.toString() }
      );
      if (recoveryError) {
        setError(recoveryError.status === 429
          ? "ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่"
          : "ส่งคำขอไม่สำเร็จ กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ");
        return;
      }
      setNotice("หากมีบัญชีอีเมลนี้ ระบบจะส่งลิงก์ตั้งรหัสผ่านให้ กรุณาตรวจกล่องจดหมายและ Spam แล้วเปิดลิงก์ล่าสุดในเบราว์เซอร์นี้");
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (submittingRef.current || checking) return;
    setError("");
    setNotice("");
    if (!sessionReady) {
      setError("ไม่พบสิทธิ์ตั้งรหัสผ่าน กรุณาขอลิงก์ใหม่");
      return;
    }
    if (newPassword.length < 8) {
      setError("กรุณาตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        const messages = {
          same_password: "กรุณาใช้รหัสผ่านใหม่ที่ต่างจากรหัสเดิม",
          weak_password: "รหัสผ่านไม่ผ่านเงื่อนไขความปลอดภัยของระบบ กรุณาใช้รหัสที่ยาวและคาดเดายากขึ้น",
        };
        setError(messages[updateError.code] ||
          "ตั้งรหัสผ่านไม่สำเร็จ กรุณาขอลิงก์ใหม่หรือติดต่อผู้ดูแลระบบ");
        return;
      }
      setNewPassword("");
      setConfirmPassword("");
      setPassword("");
      setEmail(sessionEmail);
      setMode("done");
      setNotice("บันทึกรหัสผ่านใหม่เรียบร้อยแล้ว");
      const url = new URL(window.location.href);
      url.searchParams.delete("recovery");
      url.searchParams.delete("code");
      url.hash = "";
      window.history.replaceState(window.history.state, "", url);
    } catch {
      setError("การเชื่อมต่อขัดข้อง หากบันทึกไปแล้วให้ลองเข้าสู่ระบบด้วยรหัสใหม่");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    if (submittingRef.current || checking) return;
    setError("");
    setNotice("");

    const selectedBusiness = BUSINESS_LIST.find(
      (business) => String(business.id) === businessId
    );
    const cleanFirst = firstName.trim().replace(/\s+/g, " ");
    const cleanLast = lastName.trim().replace(/\s+/g, " ");
    const englishName = /^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$/;
    const cleanPhone = phone.trim().replace(/[\s()-]/g, "");

    if (!selectedBusiness) {
      setError("กรุณาเลือกบริษัท");
      return;
    }
    if (!englishName.test(cleanFirst) || !englishName.test(cleanLast) ||
        cleanFirst.length > 100 || cleanLast.length > 100) {
      setError("กรุณากรอกชื่อและนามสกุลภาษาอังกฤษ ช่องละไม่เกิน 100 ตัวอักษร");
      return;
    }
    if (!/^\+?[0-9]{8,15}$/.test(cleanPhone)) {
      setError("กรุณากรอกเบอร์โทรศัพท์ 8–15 หลัก สามารถใส่ + นำหน้ารหัสประเทศได้");
      return;
    }
    if (!email.trim()) {
      setError("กรุณากรอกอีเมล");
      return;
    }
    if (password.length < 8) {
      setError("กรุณาตั้งรหัสผ่านอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (password !== signupConfirmation) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      const redirect = new URL(window.location.pathname, window.location.origin);
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirect.toString(),
          data: {
            teramatch_signup: true,
            first_name: cleanFirst,
            last_name: cleanLast,
            full_name: `${cleanFirst} ${cleanLast}`,
            phone: cleanPhone,
            business: selectedBusiness.title,
          },
        },
      });
      if (signupError) {
        const messages = {
          user_already_exists: "อีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบหรือใช้ลืมรหัสผ่าน",
          email_exists: "อีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบหรือใช้ลืมรหัสผ่าน",
          signup_disabled: "ระบบยังไม่เปิดรับสมัครสมาชิก กรุณาติดต่อผู้ดูแล",
          weak_password: "รหัสผ่านไม่ผ่านเงื่อนไข กรุณาใช้รหัสที่ยาวและคาดเดายากขึ้น",
          email_address_invalid: "รูปแบบอีเมลไม่ถูกต้อง",
          over_email_send_rate_limit: "ส่งอีเมลบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่",
          over_request_rate_limit: "ทำรายการบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่",
        };
        console.error("Supabase signup failed:", {
          code: signupError.code, message: signupError.message,
        });
        setError(messages[signupError.code] ||
          "สมัครสมาชิกไม่สำเร็จ กรุณาให้ผู้ดูแลตรวจสอบการตั้งค่าสมัครสมาชิกและ SQL");
        return;
      }
      // With email confirmation enabled, no authenticated session exists yet.
      // A database trigger creates user_teramatch in the Auth signup transaction.
      setPassword("");
      setSignupConfirmation("");
      setMode("login");
      if (data?.session) {
        const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
        setNotice(signOutError
          ? "สร้างบัญชีแล้ว กรุณาเข้าสู่ระบบเพื่อให้ระบบตรวจสอบบริษัท"
          : "สมัครสมาชิกเรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่ตั้งไว้");
      } else {
        // Avoid claiming that an existing/obfuscated account was newly created.
        setNotice("ส่งคำขอสมัครแล้ว หากเป็นอีเมลใหม่ กรุณาตรวจอีเมลและ Spam เพื่อยืนยันบัญชีก่อน Login หากเคยสมัครแล้วให้เข้าสู่ระบบหรือใช้ลืมรหัสผ่าน");
      }
    } catch {
      setError("การเชื่อมต่อขัดข้อง กรุณาตรวจอีเมลยืนยันก่อนลองสมัครอีกครั้ง");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (submittingRef.current || checking) return;

    setNotice("");
    setError("");

    const selectedBusiness = BUSINESS_LIST.find(
      (business) => String(business.id) === businessId
    );

    if (!selectedBusiness) {
      setError("กรุณาเลือกบริษัท");
      return;
    }

    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (loginError) {
        // Log only error details, never passwords or session tokens.
        console.error("Supabase login failed:", {
          code: loginError.code,
          message: loginError.message,
          status: loginError.status,
        });

        setError(getLoginErrorMessage(loginError));
        return;
      }

      if (!data?.session || !data?.user) {
        setError("ไม่พบเซสชันการเข้าสู่ระบบ กรุณาลองใหม่");
        return;
      }

      // The RPC only returns the profile belonging to auth.uid().
      const { data: profile, error: profileError } = await supabase.rpc(
        "teramatch_my_profile"
      );
      const normalizeBusiness = (value) =>
        String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
      let rejection = "";
      if (profileError) {
        rejection = "ตรวจสอบข้อมูลบริษัทไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ";
      } else if (!profile) {
        rejection = "ไม่พบข้อมูลบัญชีใน user_teramatch กรุณาให้ผู้ดูแลตรวจสอบ ID ให้ตรงกับ Authentication";
      } else if (!profile.business ||
        normalizeBusiness(profile.business) !== normalizeBusiness(selectedBusiness.title)) {
        rejection = "บัญชีนี้ไม่ได้อยู่ในบริษัทที่เลือก";
      }
      if (rejection) {
        const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
        setError(rejection + (signOutError ? " — ออกจากเซสชันไม่สำเร็จ กรุณาลองใหม่" : ""));
        return;
      }

      navigate("/mainpage", {
        replace: true,
        state: {
          selectedBusinessId: selectedBusiness.id,
          selectedBusinessName: profile.business,
        },
      });
    } catch (connectionError) {
      console.error("Login connection failed:", {
        message:
          connectionError instanceof Error
            ? connectionError.message
            : "Unknown connection error",
      });

      setError(
        "เชื่อมต่อระบบไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่"
      );
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <main
      className="container d-flex align-items-center justify-content-center py-5"
      style={{ minHeight: "75vh" }}
    >
      <div
        className="card border-0 shadow-sm rounded-4 w-100"
        style={{ maxWidth: 440 }}
      >
        <div className="card-body p-4 p-md-5">
          <h1 className="h3 fw-bold mb-2">
            {mode === "signup" ? "สมัครสมาชิก" :
              mode === "reset" ? "ตั้งรหัสผ่านใหม่" :
              mode === "forgot" ? "ลืมรหัสผ่าน" :
              mode === "done" ? "เปลี่ยนรหัสผ่านสำเร็จ" : "Login"}
          </h1>

          {mode === "login" && <p className="text-secondary mb-4">
            เข้าสู่ระบบ หรือกดสมัครสมาชิกเพื่อสร้างบัญชีใหม่
          </p>}
          {notice && <div className="alert alert-success" role="status">{notice}</div>}
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          {checking && <p role="status">กำลังตรวจสอบเซสชัน...</p>}

          {mode === "signup" ? (
            <form onSubmit={handleSignUp} aria-busy={loading || checking}>
              <fieldset disabled={loading || checking}>
                <div className="mb-3">
                  <label htmlFor="signup-business" className="form-label">บริษัท</label>
                  <select id="signup-business" className="form-select" value={businessId}
                    onChange={(e) => setBusinessId(e.target.value)} required>
                    <option value="" disabled>เลือกบริษัท</option>
                    {BUSINESS_LIST.map((business) => (
                      <option key={business.id} value={business.id}>{business.title}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="signup-first-name" className="form-label">ชื่อภาษาอังกฤษ</label>
                  <input id="signup-first-name" className="form-control" type="text"
                    autoComplete="given-name" placeholder="First name" maxLength={100}
                    value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="signup-last-name" className="form-label">นามสกุลภาษาอังกฤษ</label>
                  <input id="signup-last-name" className="form-control" type="text"
                    autoComplete="family-name" placeholder="Last name" maxLength={100}
                    value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="signup-phone" className="form-label">เบอร์โทรศัพท์</label>
                  <input id="signup-phone" className="form-control" type="tel" autoComplete="tel"
                    placeholder="08xxxxxxxx" maxLength={30}
                    value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="signup-email" className="form-label">อีเมล</label>
                  <input id="signup-email" className="form-control" type="email"
                    autoComplete="email" autoCapitalize="none" spellCheck={false}
                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="signup-password" className="form-label">รหัสผ่าน</label>
                  <input id="signup-password" className="form-control" type="password"
                    autoComplete="new-password" minLength={8} placeholder="อย่างน้อย 8 ตัวอักษร"
                    value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="mb-4">
                  <label htmlFor="signup-confirm" className="form-label">ยืนยันรหัสผ่าน</label>
                  <input id="signup-confirm" className="form-control" type="password"
                    autoComplete="new-password" minLength={8}
                    value={signupConfirmation} onChange={(e) => setSignupConfirmation(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary w-100 py-2">
                  {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
                </button>
                <button type="button" className="btn btn-link w-100 mt-2"
                  onClick={() => { setMode("login"); setError(""); setNotice(""); setPassword(""); setSignupConfirmation(""); }}>
                  มีบัญชีแล้ว เข้าสู่ระบบ
                </button>
              </fieldset>
            </form>
          ) : mode === "done" ? (
            <button className="btn btn-primary w-100" type="button"
              onClick={() => { setMode("login"); setError(""); }}>
              กลับไปเข้าสู่ระบบ
            </button>
          ) : mode === "reset" ? (
            <form onSubmit={handleResetPassword} aria-busy={loading || checking}>
              {sessionEmail && <p className="text-secondary">บัญชี: {sessionEmail}</p>}
              <div className="mb-3">
                <label className="form-label" htmlFor="new-password">รหัสผ่านใหม่</label>
                <input id="new-password" className="form-control" type="password"
                  autoComplete="new-password" minLength={8} required
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading || checking || !sessionReady} />
              </div>
              <div className="mb-4">
                <label className="form-label" htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</label>
                <input id="confirm-password" className="form-control" type="password"
                  autoComplete="new-password" minLength={8} required
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || checking || !sessionReady} />
              </div>
              <button className="btn btn-primary w-100" type="submit"
                disabled={loading || checking || !sessionReady}>
                {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
              </button>
              <button className="btn btn-link w-100 mt-2" type="button" disabled={loading}
                onClick={() => { setMode("forgot"); setError(""); setNotice(""); }}>
                ขอลิงก์ตั้งรหัสผ่านใหม่
              </button>
            </form>
          ) : mode === "forgot" ? (
            <form onSubmit={handleSendRecovery} aria-busy={loading}>
              <div className="mb-4">
                <label className="form-label" htmlFor="recovery-email">อีเมลของบัญชี</label>
                <input id="recovery-email" className="form-control" type="email"
                  autoComplete="email" autoCapitalize="none" spellCheck={false}
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  disabled={loading} required />
              </div>
              <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                {loading ? "กำลังส่ง..." : "ส่งลิงก์ตั้งรหัสผ่าน"}
              </button>
              <button className="btn btn-link w-100 mt-2" type="button" disabled={loading}
                onClick={() => { setMode("login"); setError(""); setNotice(""); }}>
                กลับไปเข้าสู่ระบบ
              </button>
            </form>
          ) : (
          <form onSubmit={handleLogin} aria-busy={loading || checking}>
            <div className="mb-3">
              <label htmlFor="login-business" className="form-label">
                Business
              </label>

              <select
                id="login-business"
                name="business"
                className="form-select"
                value={businessId}
                onChange={(event) => setBusinessId(event.target.value)}
                disabled={loading}
                required
              >
                <option value="" disabled>
                  เลือกบริษัท
                </option>

                {BUSINESS_LIST.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="login-email" className="form-label">
                E-mail
              </label>

              <input
                id="login-email"
                name="email"
                type="email"
                className="form-control"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="login-password" className="form-label">
                Password
              </label>

              <input
                id="login-password"
                name="password"
                type="password"
                className="form-control"
                autoComplete="current-password"
                placeholder="กรอกรหัสผ่าน"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2"
              disabled={loading || checking}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                "Login"
              )}
            </button>
            <button type="button" className="btn btn-outline-primary w-100 mt-3"
              disabled={loading || checking}
              onClick={() => { setMode("signup"); setError(""); setNotice(""); setPassword(""); setSignupConfirmation(""); }}>
              สมัครสมาชิก
            </button>
            <button type="button" className="btn btn-link w-100 mt-2"
              disabled={loading || checking}
              onClick={() => { setMode("forgot"); setError(""); setNotice(""); setPassword(""); }}>
              ลืมรหัสผ่าน / ตั้งรหัสผ่านใหม่
            </button>
          </form>
          )}
        </div>
      </div>
    </main>
  );
}