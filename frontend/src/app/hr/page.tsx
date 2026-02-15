'use client';

import { useState, useEffect } from 'react';
import { usePayStream, useSenderStreams } from '../../hooks/usePayStream';
import { useToken } from '../../hooks/useToken';
import { useAccount } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { Header } from '../../components/Header';
import { BottomNav } from '../../components/BottomNav';

export default function HRDashboard() {
    const [streamId, setStreamId] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [monthSalary, setMonthSalary] = useState('');
    const [duration, setDuration] = useState('');
    const [startTime, setStartTime] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const { address: connectedAddress, isConnected } = useAccount();
    const payStreamAddress = process.env.NEXT_PUBLIC_PAYSTREAM_CONTRACT_ADDRESS || '';
    const tokenAddress = process.env.NEXT_PUBLIC_MOCK_TOKEN_ADDRESS || '';

    const { createStream, pauseStream, resumeStream, cancelStream, isPending: isStreamPending, isConfirmed: isStreamConfirmed } = usePayStream(payStreamAddress as `0x${string}`);
    const senderStreamsResult = useSenderStreams(payStreamAddress as `0x${string}`, connectedAddress);
    const { approve, mint, isPending: isApprovePending, isConfirmed: isApproveConfirmed, balance, allowance, refetchBalance } = useToken(tokenAddress as `0x${string}`, payStreamAddress as `0x${string}`);

    useEffect(() => {
        if (isStreamConfirmed) {
            showToast('Stream created successfully!', 'success');
            setStreamId('');
            setRecipientAddress('');
            setMonthSalary('');
            setDuration('');
            setStartTime('');
            senderStreamsResult.refetch();
        }
    }, [isStreamConfirmed, senderStreamsResult]);

    useEffect(() => {
        if (isApproveConfirmed) {
            refetchBalance();
        }
    }, [isApproveConfirmed, refetchBalance]);

    const handleCreateStream = () => {
        if (!streamId || !recipientAddress || !monthSalary || !duration) {
            showToast('Please fill all required fields', 'error');
            return;
        }
        try {
            const salaryBigInt = parseEther(monthSalary);
            const durationSeconds = BigInt(parseInt(duration) * 24 * 60 * 60);
            const ratePerSec = salaryBigInt / durationSeconds;

            // Handle start time with 60-second buffer to avoid "start time in past" errors
            let startTimestamp: bigint;
            if (startTime) {
                const selectedTime = Math.floor(new Date(startTime).getTime() / 1000);
                const currentTime = Math.floor(Date.now() / 1000);

                // If selected time is within next 60 seconds, add buffer
                if (selectedTime < currentTime + 60) {
                    startTimestamp = BigInt(currentTime + 60);
                    showToast('Start time adjusted to +60 seconds from now to avoid timing issues', 'warning');
                } else {
                    startTimestamp = BigInt(selectedTime);
                }
            } else {
                // Default to current time + 60 seconds for safety
                startTimestamp = BigInt(Math.floor(Date.now() / 1000) + 60);
            }

            createStream(BigInt(streamId), recipientAddress, ratePerSec, salaryBigInt, startTimestamp);
            showToast('Creating stream...', 'success');
        } catch (e) {
            showToast('Failed to create stream', 'error');
        }
    };

    const handleApprove = (amount: string) => {
        try {
            const approvalAmount = parseEther(amount);
            approve(approvalAmount);
            showToast('Approving tokens...', 'success');
        } catch (e: any) {
            console.error('Approval error:', e);
            showToast(e?.message || 'Failed to approve tokens', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
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

                {!isConnected && (
                    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-gray-900 font-medium">Please connect your wallet to continue</p>
                    </div>
                )}

                {/* Dashboard Section */}
                <section id="dashboard" className="mb-8">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl p-8 lg:p-12 shadow-lg">
                        <h1 className="text-3xl lg:text-4xl font-bold mb-3">Employer Dashboard</h1>
                        <p className="text-gray-300 text-lg">Manage salary streams for your employees</p>
                    </div>
                </section>

                {/* Treasury Section */}
                <section id="treasury" className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Treasury Balance</h2>
                    <div className="bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-xl shadow-lg p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-gray-400 text-sm font-medium mb-2">Balance</p>
                                <h2 className="text-4xl font-bold">{parseFloat(balance).toFixed(2)} HLUSD</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400 text-sm font-medium mb-1">Allowance</p>
                                <p className="text-2xl font-bold">{parseFloat(allowance).toFixed(2)}</p>
                                <p className="text-gray-500 text-xs">Authorized</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => mint('1000')}
                                disabled={isApprovePending}
                                className="px-4 py-3 bg-white text-gray-900 hover:bg-gray-100 disabled:bg-gray-500 disabled:text-gray-300 rounded-lg font-semibold transition-all shadow-sm"
                            >
                                Mint 1,000 HLUSD
                            </button>
                            <button
                                onClick={() => {
                                    if (!monthSalary || parseFloat(monthSalary) <= 0) {
                                        showToast('Please enter a valid Monthly Salary amount first', 'error');
                                        return;
                                    }
                                    handleApprove(monthSalary);
                                }}
                                disabled={isApprovePending}
                                className="px-4 py-3 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white rounded-lg font-semibold transition-all shadow-sm"
                            >
                                {monthSalary && parseFloat(monthSalary) > 0
                                    ? `Approve ${parseFloat(monthSalary).toFixed(0)} HLUSD`
                                    : 'Approve Tokens'}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Create Stream Section */}
                <section id="create" className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Start Salary Stream</h2>
                    <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
                        <div className="grid lg:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Stream ID</label>
                                <input
                                    type="number"
                                    value={streamId}
                                    onChange={(e) => setStreamId(e.target.value)}
                                    placeholder="e.g., 1001"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none text-gray-900 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Employee Address</label>
                                <input
                                    type="text"
                                    value={recipientAddress}
                                    onChange={(e) => setRecipientAddress(e.target.value)}
                                    placeholder="0x..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none text-gray-900 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Monthly Salary (HLUSD)</label>
                                <input
                                    type="number"
                                    value={monthSalary}
                                    onChange={(e) => setMonthSalary(e.target.value)}
                                    placeholder="e.g., 60000"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none text-gray-900 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">Duration (days)</label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    placeholder="e.g., 30"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none text-gray-900 transition-all"
                                />
                            </div>
                            <div className="lg:col-span-2">
                                <label className="block text-sm font-medium text-gray-900 mb-2">Start Time (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none text-gray-900 transition-all"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleCreateStream}
                            disabled={isStreamPending || !isConnected}
                            className="mt-6 w-full px-6 py-4 bg-gray-700 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg shadow-md hover:shadow-lg transition-all"
                        >
                            {isStreamPending ? 'Creating...' : 'Create Stream'}
                        </button>
                    </div>
                </section>

                {/* Active Streams Section */}
                <section id="streams" className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Streams</h2>
                    <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
                        {senderStreamsResult.data && senderStreamsResult.data.length > 0 ? (
                            <div className="space-y-4">
                                {(senderStreamsResult.data as readonly bigint[]).map((id) => (
                                    <StreamCard
                                        key={id.toString()}
                                        streamId={id}
                                        contractAddress={payStreamAddress as `0x${string}`}
                                        pauseStream={pauseStream}
                                        resumeStream={resumeStream}
                                        cancelStream={cancelStream}
                                        showToast={showToast}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <p className="text-lg font-medium">No active streams yet</p>
                                <p className="text-sm mt-2">Create your first salary stream above</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Footer */}
                <div className="text-center text-gray-500 text-sm pb-16">
                    <p>Powered by Smart Contracts on HeLa Testnet</p>
                </div>
            </main>

            <BottomNav type="employer" />
        </div>
    );
}

// Stream Card Component
function StreamCard({
    streamId,
    contractAddress,
    pauseStream,
    resumeStream,
    cancelStream,
    showToast
}: {
    streamId: bigint;
    contractAddress: `0x${string}`;
    pauseStream: (id: bigint) => void;
    resumeStream: (id: bigint) => void;
    cancelStream: (id: bigint) => void;
    showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}) {
    const { streamResult, vestedResult } = usePayStream(contractAddress, streamId);

    if (!streamResult.data) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
        );
    }

    const stream = streamResult.data as any;
    const vested = vestedResult.data as bigint | undefined;
    const active = stream.active as boolean;
    const paused = stream.paused as boolean;

    const formatAmount = (value: bigint) => {
        return parseFloat(formatEther(value)).toFixed(2);
    };

    return (
        <div className="border border-gray-300 rounded-lg p-6 hover:border-gray-500 hover:shadow-sm transition-all bg-white">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <span className="text-sm text-gray-500">Stream</span>
                    <h3 className="text-xl font-bold text-gray-900">#{streamId.toString()}</h3>
                </div>
                <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${!active ? 'bg-red-100 text-red-700 border border-red-200' :
                        paused ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                            'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                        {!active ? 'Cancelled' : paused ? 'Paused' : 'Active'}
                    </span>
                </div>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Employee</span>
                    <span className="font-mono text-gray-900">{stream.recipient.substring(0, 10)}...{stream.recipient.substring(38)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total</span>
                    <span className="font-semibold text-gray-900">{formatAmount(stream.deposit)} HLUSD</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Vested</span>
                    <span className="font-semibold text-gray-900">{vested ? formatAmount(vested) : '0.00'} HLUSD</span>
                </div>
            </div>

            {active && (
                <div className="flex gap-2">
                    {paused ? (
                        <>
                            <button
                                onClick={() => { resumeStream(streamId); showToast('Resuming...', 'success'); }}
                                className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-all"
                            >
                                Resume
                            </button>
                            <button
                                onClick={() => { cancelStream(streamId); showToast('Cancelling...', 'success'); }}
                                className="flex-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-all"
                            >
                                Stop
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => { pauseStream(streamId); showToast('Pausing...', 'success'); }}
                                className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-all"
                            >
                                Pause
                            </button>
                            <button
                                onClick={() => { cancelStream(streamId); showToast('Cancelling...', 'success'); }}
                                className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-all"
                            >
                                Stop
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
