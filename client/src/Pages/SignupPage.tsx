import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuthStore from "../useAuthStore";
import { signup } from "../api/authApi";

const SignupPage = () => {
  const login = useAuthStore((state) => state.login);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d+$/.test(phone)) {
      setErrorMsg("Phone number must contain only digits.");
      setTimeout(() => setErrorMsg(""), 5000);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      setTimeout(() => setErrorMsg(""), 5000);
      return;
    }

    setLoading(true);

    const avatar = `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(fullName)}`;

    try {
      const user = await signup({
        name: fullName,
        email,
        phone,
        password,
        avatar,
      });

      const success = login(user);
      if (!success) {
        setErrorMsg("Another user is already logged in. Logout first.");
        setTimeout(() => setErrorMsg(""), 5000);
        setLoading(false);
        return;
      }

      navigate("/");
    } catch (error: any) {
      setErrorMsg("Error: email already in use.");
      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = () => {
    window.location.href =
      "https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID&scope=user";
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute bottom-[-190px] left-[-190px] w-[360px] h-[360px] rounded-full bg-blue-600 opacity-60 blur-[140px]" />
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-6 md:p-10">
        <div className="flex flex-col w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-4">Create your account</h2>

          <form onSubmit={handleSignUp}>
            {errorMsg && (
              <div className="text-red-600 text-sm mb-2 text-center">{errorMsg}</div>
            )}
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="border p-2 mb-2 rounded w-full"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-2 mb-2 rounded w-full"
              required
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border p-2 mb-2 rounded w-full"
              required
              pattern="[0-9]+"
              inputMode="numeric"
            />
            <input
              type="password"
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-2 mb-2 rounded w-full"
              required
              minLength={6}
              autoComplete="new-password"
            />

            <button
              type="submit"
              className="bg-[#2563EB] text-white py-2 rounded hover:bg-[#1E4ED8] w-full"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>


            <div className="flex items-center my-4">
              <hr className="flex-grow border-t border-gray-300" />
              <span className="mx-2 text-gray-500 text-sm">or</span>
              <hr className="flex-grow border-t border-gray-300" />
            </div>

            <button
              type="button"
              onClick={handleGitHubLogin}
              className="bg-[#111827] text-white py-2 rounded hover:bg-gray-800 w-full"
            >
              Continue with GitHub
            </button>


            <p className="mt-4 text-center text-sm text-gray-700">
              Already have an account?{" "}
              <Link to="/signin" className="text-blue-600 hover:underline">
                Sign in here
              </Link>
            </p>
          </form>
        </div>
      </div>

      <div className="hidden md:block relative w-1/2">
        <img
          src="/sidecode.png"
          alt="Code UI"
          className="absolute top-0 right-0 bottom-0 w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default SignupPage;
