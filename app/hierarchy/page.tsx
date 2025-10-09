'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import HierarchyTree from '@/components/HierarchyTree';
import AddAgentModal from '@/components/AddAgentModal';
import { HierarchyNode } from '@/lib/types/database';

export default function HierarchyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hierarchy, setHierarchy] = useState<HierarchyNode | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUpline, setSelectedUpline] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth/login');
      return;
    }

    setCurrentUserId(user.id);
    await loadHierarchy();
    await loadAvailableAgents();
  };

  const loadHierarchy = async () => {
    try {
      const response = await fetch('/api/hierarchy');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load hierarchy');
      }

      setHierarchy(data.hierarchy);
    } catch (err: any) {
      console.error('Load hierarchy error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableAgents = async () => {
    try {
      const response = await fetch('/api/writing-agents/available');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load available agents');
      }

      setAvailableAgents(data.writing_agents || []);
    } catch (err: any) {
      console.error('Load available agents error:', err);
    }
  };

  const handleAddAgent = (uplineId: string) => {
    // Find the upline name from hierarchy
    const findNodeName = (node: HierarchyNode): string | null => {
      if (node.id === uplineId) return node.name;
      for (const child of node.children || []) {
        const result = findNodeName(child);
        if (result) return result;
      }
      return null;
    };

    const uplineName = hierarchy ? findNodeName(hierarchy) : 'Unknown';
    setSelectedUpline({ id: uplineId, name: uplineName || 'Unknown' });
    setModalOpen(true);
  };

  const handleSubmitInvitation = async (email: string, writingAgentIds: string[]) => {
    try {
      const response = await fetch('/api/invitations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          upline_id: selectedUpline?.id,
          writing_agent_ids: writingAgentIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invitation');
      }

      // Show success message (you could add a toast notification here)
      alert(`Invitation sent to ${email}!\n\nInvitation URL: ${data.invitationUrl}`);

      // Reload data
      await loadHierarchy();
      await loadAvailableAgents();
    } catch (err: any) {
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hierarchy...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organization Hierarchy</h1>
              <p className="text-gray-600 mt-1">
                View and manage your team structure
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Tree */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hierarchy ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <HierarchyTree
              node={hierarchy}
              currentUserId={currentUserId}
              onAddAgent={handleAddAgent}
            />
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            No hierarchy data available
          </div>
        )}
      </div>

      {/* Add Agent Modal */}
      {selectedUpline && (
        <AddAgentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          uplineId={selectedUpline.id}
          uplineName={selectedUpline.name}
          onSubmit={handleSubmitInvitation}
          availableAgents={availableAgents}
        />
      )}
    </div>
  );
}

