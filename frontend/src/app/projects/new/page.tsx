'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { projects } from '@/lib/api';

export default function NewProjectPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const project = await projects.create(name, description);
            router.push(`/projects/${project.id}`);
        } catch (err: any) {
            setError(err.message || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <main className="min-h-screen" style={{ background: '#111113' }}>
            {/* Header */}
            <header className="nav sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-white/40 hover:text-white transition text-sm">
                            Back
                        </Link>
                        <h1 className="text-lg font-medium text-white">New Project</h1>
                    </div>
                </div>
            </header>

            <div className="max-w-lg mx-auto px-6 py-12">
                <div className="card p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="name" className="block text-white/50 text-sm mb-2">Project Name</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/20 text-sm"
                                placeholder="My API Project"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-white/50 text-sm mb-2">Description (optional)</label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/20 text-sm min-h-[100px] resize-none"
                                placeholder="Describe your project..."
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary flex-1 disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Project'}
                            </button>
                            <Link href="/dashboard" className="btn-secondary">
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
