'use client';

import { useState } from 'react';
import { HierarchyNode } from '@/lib/types/database';
import { ChevronDown, ChevronRight, UserPlus, Users } from 'lucide-react';

interface HierarchyTreeProps {
  node: HierarchyNode;
  currentUserId: string;
  onAddAgent: (uplineId: string) => void;
  level?: number;
}

export default function HierarchyTree({
  node,
  currentUserId,
  onAddAgent,
  level = 0,
}: HierarchyTreeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels

  const hasChildren = node.children && node.children.length > 0;
  const isCurrentUser = node.id === currentUserId;

  return (
    <div className="relative">
      {/* Node Card */}
      <div
        className={`
          flex items-center justify-between p-4 rounded-lg border-2 transition-all
          ${isCurrentUser
            ? 'bg-blue-50 border-blue-500 shadow-md'
            : 'bg-white border-gray-200 hover:border-gray-300'
          }
          ${level > 0 ? 'ml-8' : ''}
        `}
        style={{ marginBottom: hasChildren && isExpanded ? '1rem' : '0.5rem' }}
      >
        <div className="flex items-center gap-3 flex-1">
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              )}
            </button>
          )}

          {/* Agent Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{node.name}</h3>
              {isCurrentUser && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  You
                </span>
              )}
              {node.role === 'agency_owner' && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  Owner
                </span>
              )}
              {node.status === 'pending' && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  Pending
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{node.email}</p>

            {/* Writing Agents */}
            {node.writing_agents && node.writing_agents.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {node.writing_agents.map((wa) => (
                  <span
                    key={wa.id}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                    title={`${wa.carrier_name}: ${wa.agent_name}`}
                  >
                    {wa.carrier_name} - {wa.agent_number}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {hasChildren && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{node.children?.length} downline(s)</span>
              </div>
            )}
          </div>

          {/* Add Agent Button */}
          <button
            onClick={() => onAddAgent(node.id)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Downline
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {/* Connecting Line */}
          {level > 0 && (
            <div
              className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"
              style={{ left: '1rem' }}
            />
          )}

          <div className="space-y-2">
            {node.children?.map((child) => (
              <HierarchyTree
                key={child.id}
                node={child}
                currentUserId={currentUserId}
                onAddAgent={onAddAgent}
                level={level + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

