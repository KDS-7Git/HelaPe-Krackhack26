
'use client';

import { useState, useEffect } from 'react';
import { usePayStream, useSenderStreams } from '../../hooks/usePayStream';
import { useToken } from '../../hooks/useToken';
import { useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Header } from '../../components/Header';

export default function HRDashboard() {
    const [recipient, setRecipient] = useState('');
    const [salary, setSalary] = useState('');
    const [duration, setDuration] = useState('30');
    const [customStreamId, setCustomStreamId] = useState('');
    const [startDateTime, setStartDateTime] = useState('');
    const [mintAmount, setMintAmount] = useState('1000');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const { address: connectedAddress, isConnected } = useAccount();
    const payStreamAddress = process.env.NEXT_PUBLIC_PAYSTREAM_CONTRACT_ADDRESS || '';
    const tokenAddress = process.env.NEXT_PUBLIC_MOCK_TOKEN_ADDRESS || '';

    const { createStream, pauseStream, resumeStream, isPending: isStreamPending, isConfirmed: isStreamConfirmed, hash: streamHash } = usePayStream(payStreamAddress as `0x${string}`);
    const senderStreamsResult = useSenderStreams(payStreamAddress as `0x${string}`, connectedAddress);
    const { approve, mint, isPending: isApprovePending, isConfirmed: isApproveConfirmed, balance, allowance, refetchBalance } = useToken(tokenAddress as `0x${string}`, payStreamAddress as `0x${string}`);

    useEffect(() => {
        if (isApproveConfirmed || isStreamConfirmed) {
            refetchBalance();
        }
    }, [isApproveConfirmed, isStreamConfirmed, refetchBalance]);

    const handleApprove = () => {
        if (!payStreamAddress || !tokenAddress) return;
        approve(payStreamAddress as `0x${string}`, salary);
    };

    const handleCreate = () => {
        if (!recipient || recipient.trim() === '') {
            showToast('Please enter employee address', 'warning');
            return;
        }
        if (!salary || salary.trim() === '' || parseFloat(salary) <= 0) {
            showToast('Please enter a valid salary amount', 'warning');
            return;
        }
        if (!duration || duration.trim() === '' || parseFloat(duration) <= 0) {
            showToast('Please enter a valid duration in days', 'warning');
            return;
        }
        if (!customStreamId || customStreamId.trim() === '') {
            showToast('Please enter a stream ID', 'warning');
            return;
        }

        try {
            const streamId = BigInt(customStreamId);
            const totalSeconds = BigInt(Math.floor(parseFloat(duration))) * 24n * 60n * 60n;
            const amount = parseEther(salary);
            const rate = amount / totalSeconds;

            let startTime: bigint;
            if (startDateTime) {
                const selectedDate = new Date(startDateTime);
                startTime = BigInt(Math.floor(selectedDate.getTime() / 1000));
                if (startTime < BigInt(Math.floor(Date.now() / 1000))) {
                    showToast('Start time must be in the future', 'warning');
                    return;
                }
            } else {
                startTime = BigInt(Math.floor(Date.now() / 1000));
            }

            createStream(streamId, recipient, rate, amount, startTime);
            showToast('Creating stream...', 'success');
            setRecipient('');
            setSalary('');
            setDuration('30');
            setCustomStreamId('');
            setStartDateTime('');
        } catch (error) {
            console.error('Stream creation error:', error);
            showToast('Failed to create stream. Please check your inputs.', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
            <Header />

            <div className="max-w-7xl mx-auto p-6 space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                        HR Dashboard
                    </h1>
                </div>

                {toast && (
                    <div className={`fixed top-24 right-6 z-50 p-4 rounded-xl border backdrop-blur-lg shadow-2xl flex items-center gap-3 min-w-[300px] ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-200' :
                        toast.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-200' :
                            'bg-green-500/10 border-green-500/50 text-green-200'}`}>
                        <span className="text-2xl">{toast.type === 'error' ? '🚫' : toast.type === 'warning' ? '⚠️' : '✅'}</span>
                        <div>
                            <p className="font-bold text-sm uppercase tracking-wider opacity-75">{toast.type}</p>
                            <p className="font-medium">{toast.message}</p>
                        </div>
                    </div>
                )}

                {!isConnected && (
                    <div className="bg-yellow-900/20 border border-yellow-900/50 rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <h3 className="font-semibold text-yellow-500">Wallet Not Connected</h3>
                                <p className="text-sm text-gray-400">Please connect your wallet to manage streams.</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Create Stream Form */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4">Create Salary Stream</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Employee Address</label>
                                <input
                                    type="text"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    placeholder="0x..."
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Total Salary (HLUSD)</label>
                                <input
                                    type="number"
                                    value={salary}
                                    onChange={(e) => setSalary(e.target.value)}
                                    placeholder="1000"
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Duration (Days)</label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    placeholder="30"
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Stream ID <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={customStreamId}
                                    onChange={(e) => setCustomStreamId(e.target.value)}
                                    placeholder="e.g., 100"
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">Choose a unique ID for this stream</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">
                                    Start Date & Time <span className="text-gray-500">(Optional)</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={startDateTime}
                                    onChange={(e) => setStartDateTime(e.target.value)}
                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave empty to start immediately</p>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    onClick={handleApprove}
                                    disabled={isApprovePending || !salary}
                                    className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                                >
                                    {isApprovePending ? 'Approving...' : 'Approve Tokens'}
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={isStreamPending}
                                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                                >
                                    {isStreamPending ? 'Creating...' : 'Create Stream'}
                                </button>
                            </div>

                            {streamHash && (
                                <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="flex-1">
                                            <div className="font-semibold text-green-400 text-lg">Stream Created Successfully!</div>
                                            <p className="text-sm text-green-300 mt-1">Your salary stream has been started.</p>
                                            <a
                                                href={`https://testnet.helascan.io/tx/${streamHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 mt-3 text-sm text-green-300 hover:text-green-200 underline transition-colors"
                                            >
                                                View transaction →
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Treasury Panel */}
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4">Treasury Status</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-950 rounded-lg">
                                    <div className="text-xs text-gray-500 uppercase mb-1">Your Balance</div>
                                    <div className="font-mono text-xl text-white">{parseFloat(balance).toFixed(2)}</div>
                                    <div className="text-xs text-gray-600">HLUSD</div>
                                </div>
                                <div className="p-4 bg-gray-950 rounded-lg">
                                    <div className="text-xs text-gray-500 uppercase mb-1">Allowance</div>
                                    <div className="font-mono text-xl text-white">{parseFloat(allowance).toFixed(2)}</div>
                                    <div className="text-xs text-gray-600">Authorized</div>
                                </div>
                            </div>

                            <div className="border-t border-gray-800 pt-4">
                                <h3 className="text-sm font-semibold text-gray-400 mb-3">Quick Actions</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => mint('100')}
                                        disabled={isApprovePending}
                                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
                                    >
                                        Mint 100 HLUSD
                                    </button>
                                    <button
                                        onClick={() => mint('1000')}
                                        disabled={isApprovePending}
                                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
                                    >
                                        Mint 1000 HLUSD
                                    </button>
                                </div>

                                <div className="flex gap-2 mt-3">
                                    <input
                                        type="number"
                                        value={mintAmount}
                                        onChange={(e) => setMintAmount(e.target.value)}
                                        placeholder="Custom amount"
                                        className="flex-1 bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <button
                                        onClick={() => {
                                            if (mintAmount && parseFloat(mintAmount) > 0) {
                                                mint(mintAmount);
                                            }
                                        }}
                                        disabled={isApprovePending || !mintAmount || parseFloat(mintAmount) <= 0}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
                                    >
                                        Mint
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* My Streams Dashboard */}
                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span className="text-blue-400">💼</span>
                        My Streams
                    </h2>

                    {senderStreamsResult.data && senderStreamsResult.data.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {(senderStreamsResult.data as readonly bigint[]).map((streamId) => (
                                <StreamCard
                                    key={streamId.toString()}
                                    streamId={streamId}
                                    contractAddress={payStreamAddress as `0x${string}`}
                                    pauseStream={pauseStream}
                                    resumeStream={resumeStream}
                                    showToast={showToast}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
                            <div className="text-6xl mb-4">📊</div>
                            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Streams Yet</h3>
                            <p className="text-gray-500">Create your first salary stream above to get started</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Stream Card Component
function StreamCard({
    streamId,
    contractAddress,
    pauseStream,
    resumeStream,
    showToast
}: {
    streamId: bigint;
    contractAddress: `0x${string}`;
    pauseStream: (id: bigint) => void;
    resumeStream: (id: bigint) => void;
    showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}) {
    const { streamResult, vestedResult } = usePayStream(contractAddress, streamId);

    if (!streamResult.data) {
        return (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-800 rounded w-1/2"></div>
            </div>
        );
    }

    const stream = streamResult.data as any;
    const vested = vestedResult.data as bigint | undefined;
    const deposit = stream.deposit as bigint;
    const active = stream.active as boolean;
    const paused = stream.paused as boolean;
    const startTime = Number(stream.startTime);
    const stopTime = Number(stream.stopTime);
    const now = Math.floor(Date.now() / 1000);

    const totalDuration = stopTime - startTime;
    const elapsed = Math.min(now - startTime, totalDuration);
    const progress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    const handlePause = () => {
        if (now < startTime) {
            showToast('Cannot pause stream that hasn\'t started yet', 'warning');
            return;
        }
        pauseStream(streamId);
        showToast('Pausing stream...', 'success');
    };

    const handleResume = () => {
        resumeStream(streamId);
        showToast('Resuming stream...', 'success');
    };

    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="text-sm text-gray-500">Stream ID</div>
                    <div className="text-2xl font-bold text-blue-400">#{streamId.toString()}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${!active ? 'bg-red-500/20 text-red-400' :
                    paused ? 'bg-yellow-500/20 text-yellow-400' :
                        now < startTime ? 'bg-purple-500/20 text-purple-400' :
                            'bg-green-500/20 text-green-400'
                    }`}>
                    {!active ? '❌ Cancelled' : paused ? '⏸️ Paused' : now < startTime ? '🕒 Scheduled' : '✅ Active'}
                </div>
            </div>

            <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Recipient</div>
                <div className="font-mono text-sm text-gray-300 truncate">{stream.recipient}</div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{progress.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${paused ? 'bg-yellow-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-950 rounded-lg p-3">
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="text-lg font-bold text-white">{formatEther(deposit)}</div>
                    <div className="text-xs text-gray-600">HLUSD</div>
                </div>
                <div className="bg-gray-950 rounded-lg p-3">
                    <div className="text-xs text-gray-500">Vested</div>
                    <div className="text-lg font-bold text-green-400">{vested ? formatEther(vested) : '0.0'}</div>
                    <div className="text-xs text-gray-600">HLUSD</div>
                </div>
            </div>

            <div className="text-xs text-gray-500 space-y-1 mb-4">
                <div className="flex justify-between">
                    <span>Start:</span>
                    <span className="text-gray-400">{formatDate(startTime)}</span>
                </div>
                <div className="flex justify-between">
                    <span>End:</span>
                    <span className="text-gray-400">{formatDate(stopTime)}</span>
                </div>
            </div>

            {active && (
                <div className="flex gap-2">
                    {paused ? (
                        <button
                            onClick={handleResume}
                            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 rounded text-sm font-medium transition-colors"
                        >
                            ▶️ Resume
                        </button>
                    ) : (
                        <button
                            onClick={handlePause}
                            disabled={now < startTime}
                            className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
                        >
                            ⏸️ Pause
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
