'use client';

import { useState, useEffect } from 'react';
import { usePayStream } from '../../hooks/usePayStream';
import { useAccount } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { Header } from '../../components/Header';

export default function EmployeeDashboard() {
    const [streamId, setStreamId] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };
    const payStreamAddress = process.env.NEXT_PUBLIC_PAYSTREAM_CONTRACT_ADDRESS || '';

    const { address: connectedAddress, isConnected } = useAccount();
    const { vestedResult, streamResult, withdraw, isPending, hash, error, isConfirmed } = usePayStream(payStreamAddress as `0x${string}`, streamId ? BigInt(streamId) : undefined);

    useEffect(() => {
        if (isConfirmed) {
            vestedResult.refetch();
            streamResult.refetch();
        }
    }, [isConfirmed, vestedResult, streamResult]);

    const vestedVal = vestedResult.data ? formatEther(vestedResult.data as bigint) : '0';
    const availableVal = vestedVal;
    const streamData = streamResult.data as any;
    const totalSalary = streamData?.deposit ? formatEther(streamData.deposit as bigint) : '0';
    const withdrawn = streamData?.withdrawn ? formatEther(streamData.withdrawn as bigint) : '0';
    const ratePerSecond = streamData?.ratePerSecond ? formatEther(streamData.ratePerSecond as bigint) : '0';

    const handleWithdraw = () => {
        if (!streamId) {
            showToast('Please enter a Stream ID.', 'error');
            return;
        }
        if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
            showToast('Please enter a valid withdrawal amount.', 'error');
            return;
        }
        const amountNum = parseFloat(withdrawAmount);
        if (isNaN(amountNum) || amountNum <= 0) {
            showToast('Please enter a valid positive amount.', 'error');
            return;
        }
        if (amountNum > parseFloat(availableVal)) {
            showToast(`Amount exceeds available balance (${availableVal} HLUSD)`, 'error');
            return;
        }
        try {
            const amountToWithdraw = parseEther(withdrawAmount);
            withdraw(BigInt(streamId), amountToWithdraw);
            showToast('Withdrawal transaction initiated...', 'success');
        } catch (e) {
            showToast('Failed to initiate withdrawal', 'error');
        }
    };

    const handleRefresh = async () => {
        const result = await vestedResult.refetch();
        const stream = await streamResult.refetch();

        // Check if stream exists and if user is authorized
        if (stream.data) {
            const streamData = stream.data as any;
            const sender = streamData.sender?.toLowerCase();
            const recipient = streamData.recipient?.toLowerCase();
            const currentUser = connectedAddress?.toLowerCase();

            if (currentUser && sender !== currentUser && recipient !== currentUser) {
                const senderShort = `${sender?.substring(0, 5)}...${sender?.substring(38)}`;
                const recipientShort = `${recipient?.substring(0, 5)}...${recipient?.substring(38)}`;
                showToast(`Unauthorized stream. Sender: ${senderShort}, Recipient: ${recipientShort}`, 'error');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-6xl mx-auto p-6 lg:p-8">
                {/* Toast */}
                {toast && (
                    <div className={`fixed top-20 right-6 px-6 py-4 rounded-lg shadow-lg z-50 backdrop-blur-sm ${toast.type === 'error' ? 'bg-red-50/90 border border-red-200 text-red-800' :
                        toast.type === 'warning' ? 'bg-yellow-50/90 border border-yellow-200 text-yellow-800' :
                            'bg-green-50/90 border border-green-200 text-green-800'
                        }`}>
                        {toast.message}
                    </div>
                )}

                {/* Hero Section */}
                <div className="mb-8">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl p-8 lg:p-12 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-bold mb-3">Employee Dashboard</h1>
                                <p className="text-gray-300 text-lg">Real-time payroll. Withdraw anytime.</p>
                                {!isConnected && (
                                    <p className="text-gray-400 font-medium mt-3">Connect your wallet to continue</p>
                                )}
                            </div>
                            {streamData && (
                                <div className="hidden lg:block">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-right">
                                        <p className="text-gray-400 text-sm mb-2">Available Balance</p>
                                        <p className="text-3xl font-bold">{parseFloat(vestedVal).toFixed(2)}</p>
                                        <p className="text-gray-400 text-sm mt-1">HLUSD</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stream Lookup & Details */}
                <div className="grid gap-6 lg:grid-cols-2 mb-8">
                    {/* Stream ID Input */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">My PayStream</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Stream ID</label>
                                <input
                                    type="number"
                                    value={streamId}
                                    onChange={(e) => setStreamId(e.target.value)}
                                    placeholder="Enter your Stream ID"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none text-gray-900 transition-all"
                                />
                            </div>
                            <button
                                onClick={handleRefresh}
                                disabled={!streamId}
                                className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-all shadow-sm hover:shadow"
                            >
                                Load Stream
                            </button>
                        </div>
                    </div>

                    {/* Stream Details */}
                    {streamData && (
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Stream Details</h2>

                            {/* Authorization Check */}
                            {connectedAddress && streamData.sender && streamData.recipient &&
                                streamData.sender.toLowerCase() !== connectedAddress.toLowerCase() &&
                                streamData.recipient.toLowerCase() !== connectedAddress.toLowerCase() && (
                                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-red-800 font-medium text-sm">
                                            Unauthorized Stream
                                        </p>
                                        <p className="text-red-600 text-xs mt-1">
                                            Sender: {streamData.sender.substring(0, 5)}...{streamData.sender.substring(38)} |
                                            Recipient: {streamData.recipient.substring(0, 5)}...{streamData.recipient.substring(38)}
                                        </p>
                                    </div>
                                )}

                            <div className="space-y-3">
                                <div className="flex justify-between py-3 border-b border-gray-100">
                                    <span className="text-gray-600">Total Salary</span>
                                    <span className="font-semibold text-gray-900">{parseFloat(totalSalary).toFixed(2)} HLUSD</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-100">
                                    <span className="text-gray-600">Vested Amount</span>
                                    <span className="font-bold text-gray-900">{parseFloat(vestedVal).toFixed(2)} HLUSD</span>
                                </div>
                                <div className="flex justify-between py-3 border-b border-gray-100">
                                    <span className="text-gray-600">Withdrawn</span>
                                    <span className="font-semibold text-gray-900">{parseFloat(withdrawn).toFixed(2)} HLUSD</span>
                                </div>
                                <div className="flex justify-between py-3">
                                    <span className="text-gray-600">Rate/Second</span>
                                    <span className="font-mono text-sm text-gray-900">{parseFloat(ratePerSecond).toFixed(6)} HLUSD</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Withdrawal Section */}
                {streamData && (
                    <>
                        {/* Check if user is authorized (must be recipient to withdraw) */}
                        {connectedAddress && streamData.recipient &&
                            streamData.recipient.toLowerCase() === connectedAddress.toLowerCase() ? (
                            <div className="mb-8">
                                <div className="bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-xl shadow-lg p-8">
                                    <h2 className="text-2xl font-bold mb-6">Withdraw Salary</h2>
                                    <div className="grid lg:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Amount (HLUSD)</label>
                                            <input
                                                type="number"
                                                value={withdrawAmount}
                                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                                placeholder="0.00"
                                                max={availableVal}
                                                className="w-full px-4 py-3 border border-gray-600 rounded-lg bg-gray-800/50 text-white placeholder-gray-500 focus:ring-2 focus:ring-gray-500 outline-none transition-all"
                                            />
                                            <p className="text-gray-400 text-sm mt-2">Available: {parseFloat(availableVal).toFixed(4)} HLUSD</p>
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                onClick={handleWithdraw}
                                                disabled={isPending || !withdrawAmount}
                                                className="w-full px-6 py-3 bg-white text-gray-900 hover:bg-gray-100 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed rounded-lg font-bold text-lg shadow-md hover:shadow-lg transition-all"
                                            >
                                                {isPending ? 'Processing...' : 'Withdraw Salary'}
                                            </button>
                                        </div>
                                    </div>
                                    {hash && (
                                        <p className="text-gray-400 text-sm mt-4 font-mono">Transaction: {hash.substring(0, 10)}...{hash.substring(hash.length - 8)}</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="mb-8">
                                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-8 text-center">
                                    <div className="text-red-600 mb-4">
                                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-red-800 mb-2">Withdrawal Not Authorized</h3>
                                    <p className="text-red-700 mb-4">
                                        Only the stream recipient can withdraw funds.
                                    </p>
                                    <div className="bg-white rounded-lg p-4 text-sm text-left">
                                        <p className="text-gray-700 mb-1">
                                            <span className="font-semibold">Recipient:</span> {streamData.recipient?.substring(0, 8)}...{streamData.recipient?.substring(38)}
                                        </p>
                                        <p className="text-gray-700">
                                            <span className="font-semibold">Your Address:</span> {connectedAddress?.substring(0, 8)}...{connectedAddress?.substring(38)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Footer */}
                <div className="text-center text-gray-500 text-sm">
                    <p>Powered by Smart Contracts on HeLa Testnet</p>
                </div>
            </main>
        </div>
    );
}
