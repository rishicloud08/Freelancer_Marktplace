import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-6 text-white text-center">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
              ⚠️
            </div>
            <h2 className="text-xl font-bold">Notice during Profile Rendering</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              An unexpected data format was encountered while rendering your profile.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-red-300 font-mono text-left overflow-x-auto">
              {this.state.error?.message || 'Component render exception'}
            </div>
            <div className="pt-2 flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition cursor-pointer"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/dashboard';
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2.5 px-5 rounded-xl border border-slate-700 transition cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
