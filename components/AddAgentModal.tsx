'use client';

import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';

interface WritingAgentOption {
  id: string;
  carrier_name: string;
  agent_number: string;
  agent_name: string;
  is_assigned: boolean;
  assigned_to: { full_name: string; email: string } | null;
}

interface AddAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  uplineId: string;
  uplineName: string;
  onSubmit: (email: string, writingAgentIds: string[]) => Promise<void>;
  availableAgents: WritingAgentOption[];
}

export default function AddAgentModal({
  isOpen,
  onClose,
  uplineId,
  uplineName,
  onSubmit,
  availableAgents,
}: AddAgentModalProps) {
  const [email, setEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setEmail('');
      setSearchTerm('');
      setSelectedAgents([]);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredAgents = availableAgents
    .filter(agent => !agent.is_assigned)
    .filter(agent => {
      const search = searchTerm.toLowerCase();
      return (
        agent.agent_name.toLowerCase().includes(search) ||
        agent.agent_number.toLowerCase().includes(search) ||
        agent.carrier_name.toLowerCase().includes(search)
      );
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedAgents.length === 0) {
      setError('Please select at least one writing agent');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(email, selectedAgents);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Downline Agent</h2>
            <p className="text-sm text-gray-600 mt-1">
              Adding downline under: <strong>{uplineName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Email Input */}
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="agent@example.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              An invitation will be sent to this email address
            </p>
          </div>

          {/* Writing Agents Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Writing Agent(s)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Choose one or more writing agents to assign to this downline
            </p>

            {/* Search Box */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, number, or carrier..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Agents List */}
            <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              {filteredAgents.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm
                    ? 'No writing agents match your search'
                    : 'No available writing agents'}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredAgents.map((agent) => (
                    <label
                      key={agent.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAgents.includes(agent.id)}
                        onChange={() => toggleAgent(agent.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {agent.agent_name}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {agent.carrier_name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Agent #: {agent.agent_number}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Count */}
            {selectedAgents.length > 0 && (
              <p className="text-sm text-blue-600 mt-2">
                {selectedAgents.length} writing agent(s) selected
              </p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || selectedAgents.length === 0}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending Invitation...' : 'Send Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
}

