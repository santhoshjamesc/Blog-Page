import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuthStore from "../useAuthStore";
import { signin } from "../api/authApi";

const SigninPage: React.FC = () => {
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSignIn = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const user = await signin({ email, password });
      const success = login(user);

      if (!success) {
        setErrorMessage("Another user is already logged in. Logout first.");
        setTimeout(() => setErrorMessage(""), 5000);
        setLoading(false);
        return;
      }

      navigate("/");
    } catch (error: any) {
      setErrorMessage("Incorrect email or password.");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute bottom-[-190px] left-[-190px] w-[360px] h-[360px] rounded-full bg-blue-600 opacity-60 blur-[140px]" />
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-6 md:p-10">
        <div className="flex flex-col w-full max-w-sm space-y-4">
          <h2 className="text-2xl font-bold">Sign in to your account</h2>

          {errorMessage && (
            <div className="text-red-600 text-sm font-medium">
              {errorMessage}
            </div>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded"
          />
          <button
            onClick={handleSignIn}
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <p className="mt-4">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600">
              Sign up here
            </Link>
          </p>
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

export default SigninPage;
