
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, User, ArrowRight, Lock } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialRole = searchParams.get('role') === 'hr' ? 'hr' : 'employee';

    const [role, setRole] = useState<'hr' | 'employee'>(initialRole);
    const [identifier, setIdentifier] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'identifier' | 'otp'>('identifier');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Sync state if URL param changes
        const r = searchParams.get('role');
        if (r === 'hr' || r === 'employee') {
            setRole(r);
        }
    }, [searchParams]);

    const handleSendOtp = (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier) {
            setError('Please enter your email or phone.');
            return;
        }
        setError('');
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setStep('otp');
        }, 1000);
    };

    const handleVerifyOtp = (e: React.FormEvent) => {
        e.preventDefault();
        if (otp !== '1234') {
            setError('Invalid OTP. Use 1234.');
            return;
        }

        setError('');
        setIsLoading(true);

        // Simulate verification
        setTimeout(() => {
            // Basic "Change page" auth
            if (role === 'hr') {
                router.push('/hr');
            } else {
                router.push('/employee');
            }
        }, 1000);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black -z-20" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />

            <div className="w-full max-w-md bg-gray-900/60 border border-gray-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-4 p-3 bg-gray-800 rounded-full">
                        <Shield className="w-8 h-8 text-blue-400" />
                    </Link>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Welcome Back
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Secure login for PayStream
                    </p>
                </div>

                {/* Role Toggle */}
                <div className="bg-gray-800/50 p-1 rounded-lg flex mb-8">
                    <button
                        onClick={() => { setRole('hr'); setStep('identifier'); setError(''); setIdentifier(''); setOtp(''); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${role === 'hr'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }`}
                    >
                        <Shield className="w-4 h-4" />
                        Employer
                    </button>
                    <button
                        onClick={() => { setRole('employee'); setStep('identifier'); setError(''); setIdentifier(''); setOtp(''); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${role === 'employee'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }`}
                    >
                        <User className="w-4 h-4" />
                        Employee
                    </button>
                </div>

                {step === 'identifier' ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                {role === 'hr' ? 'Work Email' : 'Email or Phone'}
                            </label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder={role === 'hr' ? 'hr@company.com' : '+1 (555) 000-0000'}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-600"
                                autoFocus
                            />
                        </div>
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gray-100 hover:bg-white text-black font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Sending...' : <>Continue <ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in slide-in-from-right-8 fade-in duration-300">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">
                                Enter Verification Code
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="1234"
                                    maxLength={4}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none transition-all tracking-widest text-center text-lg placeholder:text-gray-700"
                                    autoFocus
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Sent to {identifier}. <button type="button" onClick={() => setStep('identifier')} className="text-blue-400 hover:underline">Change?</button>
                            </p>
                        </div>
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-purple-900/20"
                        >
                            {isLoading ? 'Verifying...' : 'Verify & Login'}
                        </button>
                        <div className="text-center">
                            <button type="button" onClick={() => { setOtp(''); setError(''); }} className="text-xs text-gray-500 hover:text-gray-300">
                                Resend Code
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
