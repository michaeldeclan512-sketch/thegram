import React, { useState, useEffect } from 'react';
import { Instagram, Loader2, Mail, Phone, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { cn } from '../lib/utils';

export default function LoginView() {
  const { signIn, signInWithEmail, signUpWithEmail, setupRecaptcha, signInWithPhone } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'phone'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password, username, fullName);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!confirmationResult) {
        const verifier = setupRecaptcha('recaptcha-container');
        const res = await signInWithPhone(phoneNumber, verifier);
        setConfirmationResult(res);
      } else {
        await confirmationResult.confirm(otp);
      }
    } catch (err: any) {
      setError(err.message);
      if (err.code === 'auth/invalid-verification-code') {
        setOtp('');
      } else {
        setConfirmationResult(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-black flex flex-col items-center justify-center p-4">
      <div id="recaptcha-container"></div>
      
      <div className="w-full max-w-sm flex flex-col items-center gap-6 bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 shadow-2xl">
        <div className="flex items-center gap-3">
          <Instagram size={40} />
          <span className="font-bold text-2xl tracking-tighter">SocialStream</span>
        </div>

        <p className="text-zinc-400 text-center text-sm px-4">
          {mode === 'login' ? 'Login to your account' : mode === 'signup' ? 'Create a new account' : 'Sign in with phone'}
        </p>

        {error && <div className="w-full bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-3 rounded-lg text-center">{error}</div>}

        <form onSubmit={mode === 'phone' ? handlePhoneSubmit : handleSubmit} className="w-full flex flex-col gap-3">
          {mode === 'signup' && (
            <>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text" placeholder="Username" required
                  value={username} onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text" placeholder="Full Name" required
                  value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>
            </>
          )}

          {mode !== 'phone' ? (
            <>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="email" placeholder="Email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="password" placeholder="Password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="tel" placeholder="Phone Number (+1...)" required
                  value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={!!confirmationResult}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-1 focus:ring-blue-500 text-sm disabled:opacity-50"
                />
              </div>
              {confirmationResult && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input 
                    type="text" placeholder="Enter OTP" required
                    value={otp} onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
              )}
            </>
          )}

          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            {mode === 'phone' ? (confirmationResult ? 'Verify OTP' : 'Send SMS') : (mode === 'login' ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className="flex items-center gap-4 w-full">
          <div className="h-[1px] flex-1 bg-zinc-800" />
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">or</span>
          <div className="h-[1px] flex-1 bg-zinc-800" />
        </div>

        <div className="w-full flex flex-col gap-2">
          <button 
            onClick={signIn}
            className="w-full bg-white text-black font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-3 text-sm"
          >
            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="" className="w-4 h-4" />
            Continue with Google
          </button>
          
          <button 
            onClick={() => {
              setMode(mode === 'phone' ? 'login' : 'phone');
              setConfirmationResult(null);
            }}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {mode === 'phone' ? 'Back to Email' : 'Continue with Phone'}
          </button>
        </div>

        <p className="text-zinc-500 text-xs mt-2">
          {mode === 'signup' ? 'Already have an account?' : 'Don\'t have an account?'}
          <button 
            onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
            className="text-blue-500 font-bold ml-1 hover:underline"
          >
            {mode === 'signup' ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
