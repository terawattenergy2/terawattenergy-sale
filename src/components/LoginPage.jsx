import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        setError("เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน");
        return;
      }

      navigate("/mainpage", { replace: true });
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่");
    } finally {
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
          <h1 className="h3 fw-bold mb-2">Login</h1>
          <p className="text-secondary mb-4">
            หากไม่มี account ติดต่อ admin ของบริษัทท่าน
          </p>

          <form onSubmit={handleLogin}>
 <div className="mb-3">
              <label htmlFor="login-email" className="form-label">
                Business
              </label>
              <select
                id="bu-list"
                // type="email"
                className="select"
             
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="login-email" className="form-label">
                E-mail
              </label>
              <input
                id="login-email"
                type="email"
                className="form-control"
                autoComplete="username"
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
                type="password"
                className="form-control"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                required
              />
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-100 py-2"
              disabled={loading}
            >
              {loading ? "Login..." : "Login"}
            </button>

            {/* <div className="text-center mt-3">
              <Link to="/" className="text-decoration-none">
                กลับหน้าหลัก
              </Link>
            </div> */}
          </form>
        </div>
      </div>
    </main>
  );
}