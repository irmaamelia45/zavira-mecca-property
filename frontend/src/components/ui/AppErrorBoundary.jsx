import React from 'react';

export default class AppErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, errorInfo) {
        // Keep app from rendering a blank white screen and surface the error in dev console.
        console.error('App runtime error:', error, errorInfo);
    }

    render() {
        if (this.state.error) {
            return (
                <div className="min-h-screen bg-[#fdfbf6] text-[#10214b] flex items-center justify-center px-6">
                    <div className="w-full max-w-3xl rounded-2xl border border-red-200 bg-white p-6 shadow-lg">
                        <h1 className="text-2xl font-semibold text-red-700 mb-3">Terjadi Error di Halaman</h1>
                        <p className="text-sm text-gray-700 mb-3">
                            Aplikasi menangkap error runtime. Silakan refresh halaman. Jika masih muncul,
                            kirim pesan error ini agar bisa diperbaiki.
                        </p>
                        <pre className="overflow-auto rounded-lg bg-red-50 p-3 text-xs text-red-700">
                            {this.state.error?.message || 'Unknown error'}
                        </pre>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
